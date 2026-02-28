"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const kafkajs_1 = require("kafkajs");
const client_1 = require("@prisma/client");
const registry_1 = require("./registry");
require('dotenv').config();
const TOPIC_NAME = "zap-events";
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
// ─── Retry configuration ───────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000; // 1s, 2s, 4s (exponential backoff)
const prismaClient = new client_1.PrismaClient();
const kafka = new kafkajs_1.Kafka({
    clientId: 'outbox-processor',
    brokers: KAFKA_BROKERS
});
/**
 * Resolves template strings using actual payload data.
 * Replaces {{dot.path}} placeholders with values from payload.
 */
function resolveTemplate(str, payload) {
    if (!str || typeof str !== "string")
        return str;
    return str.replace(/{{\s*([\w.[\]]+)\s*}}/g, (match, key) => {
        try {
            const keys = key.split('.');
            let value = payload;
            for (const k of keys) {
                value = value === null || value === void 0 ? void 0 : value[k];
            }
            return value !== undefined ? String(value) : "";
        }
        catch (_a) {
            return "";
        }
    });
}
/**
 * Recursively resolves all template strings in an object.
 */
function resolveTemplatesInObject(obj, payload) {
    if (typeof obj === "string")
        return resolveTemplate(obj, payload);
    if (Array.isArray(obj))
        return obj.map(item => resolveTemplatesInObject(item, payload));
    if (obj !== null && typeof obj === "object") {
        const resolved = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                resolved[key] = resolveTemplatesInObject(obj[key], payload);
            }
        }
        return resolved;
    }
    return obj;
}
/**
 * Merges webhook payload with previous action results for template resolution.
 */
function buildExecutionContext(zapRunPayload, zapRunMetadata) {
    return Object.assign(Object.assign({}, zapRunPayload), (zapRunMetadata || {}));
}
/**
 * Sleeps for ms milliseconds.
 */
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}
/**
 * Executes a single action with exponential-backoff retry.
 * Throws after MAX_RETRIES if all attempts fail.
 */
function executeActionWithRetry(actionTypeName, actionTypeId, resolvedMetadata, zapRunId, stage, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        let lastError;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const plugin = registry_1.ActionRegistry.get(actionTypeId);
                if (!plugin) {
                    console.log(`⚠️  Unknown action type: "${actionTypeId}" — skipping`);
                    return null;
                }
                // Execute the loosely-coupled plugin logic
                const result = yield plugin.execute(resolvedMetadata, userId);
                // Track retry count on success if this wasn't the first attempt
                if (attempt > 1) {
                    yield prismaClient.zapRun.update({
                        where: { id: zapRunId },
                        data: { retryCount: attempt - 1 }
                    });
                    console.log(`✅ Action "${actionTypeId}" succeeded on attempt ${attempt}`);
                }
                return result; // Success — exit retry loop
            }
            catch (err) {
                lastError = err;
                const backoff = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
                console.warn(`⚠️  Action "${actionTypeId}" failed on attempt ${attempt}/${MAX_RETRIES}. ` +
                    `Retrying in ${backoff}ms...`, err);
                if (attempt < MAX_RETRIES) {
                    yield sleep(backoff);
                }
            }
        }
        // All retries exhausted
        throw lastError;
    });
}
// Deleted giant executeAction switch block as it's now handled smoothly via ActionRegistry
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const producer = kafka.producer();
        yield producer.connect();
        const consumer = kafka.consumer({ groupId: 'main-worker' });
        yield consumer.connect();
        console.log("✅ Worker started — listening for zap events");
        yield consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });
        yield consumer.run({
            autoCommit: false,
            eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ topic, partition, message }) {
                var _b, _c, _d;
                try {
                    if (!((_b = message.value) === null || _b === void 0 ? void 0 : _b.toString()))
                        return;
                    const parsedValue = JSON.parse(message.value.toString());
                    const zapRunId = parsedValue.zapRunId;
                    const stage = parsedValue.stage;
                    console.log(`📨 Processing zapRunId=${zapRunId} stage=${stage}`);
                    const zapRunDetails = yield prismaClient.zapRun.findFirst({
                        where: { id: zapRunId },
                        include: {
                            zap: {
                                include: {
                                    actions: { include: { type: true } }
                                }
                            }
                        }
                    });
                    if (!zapRunDetails) {
                        console.error("❌ Zap run not found:", zapRunId);
                        return;
                    }
                    // ── Skip disabled zaps ────────────────────────────────────
                    if (!zapRunDetails.zap.isEnabled) {
                        console.log(`⏭️  Zap is disabled — skipping zapRunId: ${zapRunId}`);
                        yield prismaClient.zapRun.update({
                            where: { id: zapRunId },
                            data: { status: 'failed' }
                        });
                        yield consumer.commitOffsets([{
                                topic: TOPIC_NAME,
                                partition,
                                offset: (parseInt(message.offset) + 1).toString()
                            }]);
                        return;
                    }
                    const currentAction = zapRunDetails.zap.actions.find(x => x.sortingOrder === stage);
                    if (!currentAction) {
                        console.log("🛑 No action found for stage:", stage);
                        return;
                    }
                    // Mark as running on first stage
                    if (stage === 0) {
                        yield prismaClient.zapRun.update({
                            where: { id: zapRunId },
                            data: { status: 'running' }
                        });
                    }
                    const webhookPayload = typeof zapRunDetails.payload === "string"
                        ? JSON.parse(zapRunDetails.payload)
                        : (zapRunDetails.payload || {});
                    const zapRunMetadata = typeof zapRunDetails.metadata === "string"
                        ? JSON.parse(zapRunDetails.metadata)
                        : (zapRunDetails.metadata || {});
                    const executionContext = buildExecutionContext(webhookPayload, zapRunMetadata);
                    const resolvedMetadata = resolveTemplatesInObject(currentAction.metadata, executionContext);
                    const userId = zapRunDetails.zap.userId.toString();
                    console.log(`📋 Stage ${stage}: ${currentAction.type.name}`, {
                        resolved: resolvedMetadata
                    });
                    // ── Execute with retry through standard Plugin interface ──
                    const output = yield executeActionWithRetry(currentAction.type.name, currentAction.type.id, resolvedMetadata, zapRunId, stage, userId);
                    // If plugin returned data (like Gemini text output), implicitly store it in metadata
                    if (output) {
                        const stageKey = `action_${currentAction.sortingOrder}`;
                        yield prismaClient.zapRun.update({
                            where: { id: zapRunId },
                            data: { metadata: Object.assign(Object.assign({}, zapRunMetadata), { [stageKey]: { output } }) }
                        });
                    }
                    // Small delay to prevent thundering herd
                    yield sleep(100);
                    const lastStage = (((_c = zapRunDetails.zap.actions) === null || _c === void 0 ? void 0 : _c.length) || 1) - 1;
                    if (stage < lastStage) {
                        console.log(`⏭️  Queueing next stage: ${stage + 1}`);
                        yield producer.send({
                            topic: TOPIC_NAME,
                            messages: [{ value: JSON.stringify({ stage: stage + 1, zapRunId }) }]
                        });
                    }
                    else {
                        console.log(`✅ Zap run completed: ${zapRunId}`);
                        yield prismaClient.zapRun.update({
                            where: { id: zapRunId },
                            data: { status: 'completed' }
                        });
                    }
                    yield consumer.commitOffsets([{
                            topic: TOPIC_NAME,
                            partition,
                            offset: (parseInt(message.offset) + 1).toString()
                        }]);
                }
                catch (error) {
                    console.error("❌ Fatal error processing message:", error);
                    try {
                        const parsedValue = message.value ? JSON.parse(message.value.toString()) : null;
                        if (parsedValue === null || parsedValue === void 0 ? void 0 : parsedValue.zapRunId) {
                            const currentRetry = yield prismaClient.zapRun.findFirst({
                                where: { id: parsedValue.zapRunId },
                                select: { retryCount: true }
                            });
                            yield prismaClient.zapRun.update({
                                where: { id: parsedValue.zapRunId },
                                data: {
                                    status: 'failed',
                                    retryCount: ((_d = currentRetry === null || currentRetry === void 0 ? void 0 : currentRetry.retryCount) !== null && _d !== void 0 ? _d : 0) + MAX_RETRIES
                                }
                            });
                        }
                    }
                    catch ( /* ignore secondary error */_e) { /* ignore secondary error */ }
                    // Commit to avoid infinite re-processing of poison pill messages
                    yield consumer.commitOffsets([{
                            topic: TOPIC_NAME,
                            partition,
                            offset: (parseInt(message.offset) + 1).toString()
                        }]);
                }
            })
        });
    });
}
main();
