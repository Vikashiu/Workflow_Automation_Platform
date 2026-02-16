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
const email_1 = require("./utils/email");
const google_sheet_1 = require("./utils/google_sheet");
const google_calender_1 = require("./utils/google_calender");
const notion_1 = require("./utils/notion");
const gemini_1 = require("./utils/gemini");
const slack_1 = require("./utils/slack");
const discord_1 = require("./utils/discord");
require('dotenv').config();
const TOPIC_NAME = "zap-events";
const prismaClient = new client_1.PrismaClient();
const kafka = new kafkajs_1.Kafka({
    clientId: 'outbox-processor',
    brokers: ['localhost:9092']
});
/**
 * Resolves template strings and values using actual payload data
 * Replaces {{dot.path}} placeholders with actual values from payload
 * Safe: returns empty string if field doesn't exist, never throws
 *
 * @example
 * resolveTemplate("Hello {{user.name}}", { user: { name: "John" } })
 * // Returns: "Hello John"
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
 * Recursively resolves all template strings in an object
 * Processes nested objects and arrays
 *
 * @param obj - Object with potential template strings
 * @param payload - Data to resolve templates against
 * @returns Object with all templates resolved
 */
function resolveTemplatesInObject(obj, payload) {
    if (typeof obj === "string") {
        return resolveTemplate(obj, payload);
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => resolveTemplatesInObject(item, payload));
    }
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
 * Merges actual webhook payload with previous action results
 * Used as context for template resolution
 *
 * @param zapRunPayload - Original webhook payload
 * @param zapRunMetadata - Accumulated results from previous actions
 * @returns Combined context object
 */
function buildExecutionContext(zapRunPayload, zapRunMetadata) {
    return Object.assign(Object.assign({}, zapRunPayload), (zapRunMetadata || {}));
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const producer = kafka.producer();
        yield producer.connect();
        const consumer = kafka.consumer({ groupId: 'main-worker' });
        yield consumer.connect();
        console.log("✅ Worker started - listening for zap events");
        yield consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });
        yield consumer.run({
            autoCommit: false,
            eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ topic, partition, message }) {
                var _b, _c, _d, _e;
                try {
                    console.log({
                        partition,
                        offset: message.offset,
                        value: (_b = message.value) === null || _b === void 0 ? void 0 : _b.toString(),
                    });
                    if (!((_c = message.value) === null || _c === void 0 ? void 0 : _c.toString())) {
                        return;
                    }
                    const parsedValue = JSON.parse((_d = message.value) === null || _d === void 0 ? void 0 : _d.toString());
                    const zapRunId = parsedValue.zapRunId;
                    const stage = parsedValue.stage;
                    const zapRunDetails = yield prismaClient.zapRun.findFirst({
                        where: {
                            id: zapRunId
                        },
                        include: {
                            zap: {
                                include: {
                                    actions: {
                                        include: {
                                            type: true
                                        }
                                    }
                                }
                            }
                        }
                    });
                    if (!zapRunDetails) {
                        console.error("Zap run not found:", zapRunId);
                        return;
                    }
                    const currentAction = zapRunDetails.zap.actions.find((x) => x.sortingOrder === stage);
                    if (!currentAction) {
                        console.log("🛑 Current action not found for stage:", stage);
                        return;
                    }
                    // Get actual webhook payload (or fallback to metadata for compatibility)
                    const webhookPayload = typeof zapRunDetails.payload === "string"
                        ? JSON.parse(zapRunDetails.payload)
                        : (zapRunDetails.payload || {});
                    const zapRunMetadata = typeof zapRunDetails.metadata === "string"
                        ? JSON.parse(zapRunDetails.metadata)
                        : (zapRunDetails.metadata || {});
                    // Build execution context: combine webhook payload + previous action results
                    const executionContext = buildExecutionContext(webhookPayload, zapRunMetadata);
                    // Deep resolve all templates in action metadata using actual payload
                    const resolvedMetadata = resolveTemplatesInObject(currentAction.metadata, executionContext);
                    console.log(`📋 Action ${stage}: ${currentAction.type.name}`, {
                        original: currentAction.metadata,
                        resolved: resolvedMetadata
                    });
                    // Execute based on action type
                    if (currentAction.type.id === "Slack") {
                        const { webhookUrl, message } = resolvedMetadata;
                        console.log("💬 Sending Slack message");
                        yield (0, slack_1.sendSlackMessage)(webhookUrl, message);
                    }
                    if (currentAction.type.id === "Discord") {
                        const { webhookUrl, content } = resolvedMetadata;
                        console.log("🎮 Sending Discord message");
                        yield (0, discord_1.sendDiscordMessage)(webhookUrl, content);
                    }
                    if (currentAction.type.id === "email") {
                        console.log("📧 Sending email");
                        const { email, subject, body } = resolvedMetadata;
                        yield (0, email_1.sendEmail)({
                            email: email,
                            body: body,
                            subject: subject
                        });
                    }
                    if (currentAction.type.id === "Google Sheet") {
                        console.log("📊 Appending to Google Sheet");
                        yield (0, google_sheet_1.appendRow)(zapRunDetails.zap.userId.toString() || "", resolvedMetadata);
                    }
                    if (currentAction.type.id === "Google_Calendar") {
                        console.log("📅 Creating Google Calendar event");
                        yield (0, google_calender_1.createCalendarEvent)(zapRunDetails.zap.userId.toString() || "", resolvedMetadata);
                    }
                    if (currentAction.type.id === "Notion") {
                        console.log("📝 Creating Notion Page");
                        yield (0, notion_1.appendNotionRow)(zapRunDetails.zap.userId.toString() || "", resolvedMetadata);
                    }
                    if (currentAction.type.id === "Gemini") {
                        console.log("🤖 Asking Gemini...");
                        const prompt = resolvedMetadata.prompt;
                        const result = yield (0, gemini_1.generateGeminiContent)(prompt);
                        console.log("✨ Gemini Output:", result);
                        const output = result || "";
                        const stageKey = `action_${currentAction.sortingOrder}`;
                        const newMetadata = Object.assign(Object.assign({}, zapRunMetadata), { [stageKey]: { output } });
                        yield prismaClient.zapRun.update({
                            where: { id: zapRunId },
                            data: { metadata: newMetadata }
                        });
                    }
                    // Small delay to prevent thundering herd
                    yield new Promise(r => setTimeout(r, 100));
                    const lastStage = (((_e = zapRunDetails.zap.actions) === null || _e === void 0 ? void 0 : _e.length) || 1) - 1;
                    // Queue next action if not the last one
                    if (lastStage !== stage) {
                        console.log(`⏭️  Queueing next stage: ${stage + 1}`);
                        yield producer.send({
                            topic: TOPIC_NAME,
                            messages: [{
                                    value: JSON.stringify({
                                        stage: stage + 1,
                                        zapRunId
                                    })
                                }]
                        });
                    }
                    else {
                        console.log(`✅ Zap execution completed for zapRunId: ${zapRunId}`);
                    }
                    // Commit offset
                    yield consumer.commitOffsets([{
                            topic: TOPIC_NAME,
                            partition: partition,
                            offset: (parseInt(message.offset) + 1).toString()
                        }]);
                }
                catch (error) {
                    console.error("❌ Error processing message:", error);
                    // Commit offset even on error to avoid stuck messages
                    yield consumer.commitOffsets([{
                            topic: TOPIC_NAME,
                            partition: partition,
                            offset: (parseInt(message.offset) + 1).toString()
                        }]);
                }
            })
        });
    });
}
main();
