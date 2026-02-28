import { Kafka } from "kafkajs";
import { PrismaClient } from "@prisma/client";
import { ActionRegistry } from "./registry";
require('dotenv').config();

const TOPIC_NAME = "zap-events";
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");

// ─── Retry configuration ───────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000; // 1s, 2s, 4s (exponential backoff)

const prismaClient = new PrismaClient();
const kafka = new Kafka({
    clientId: 'outbox-processor',
    brokers: KAFKA_BROKERS
});

/**
 * Resolves template strings using actual payload data.
 * Replaces {{dot.path}} placeholders with values from payload.
 */
function resolveTemplate(str: string, payload: any): string {
    if (!str || typeof str !== "string") return str;
    return str.replace(/{{\s*([\w.[\]]+)\s*}}/g, (match, key) => {
        try {
            const keys = key.split('.');
            let value = payload;
            for (const k of keys) {
                value = value?.[k];
            }
            return value !== undefined ? String(value) : "";
        } catch {
            return "";
        }
    });
}

/**
 * Recursively resolves all template strings in an object.
 */
function resolveTemplatesInObject(obj: any, payload: any): any {
    if (typeof obj === "string") return resolveTemplate(obj, payload);
    if (Array.isArray(obj)) return obj.map(item => resolveTemplatesInObject(item, payload));
    if (obj !== null && typeof obj === "object") {
        const resolved: any = {};
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
function buildExecutionContext(zapRunPayload: any, zapRunMetadata: any): any {
    return {
        ...zapRunPayload,
        ...(zapRunMetadata || {})
    };
}

/**
 * Sleeps for ms milliseconds.
 */
function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}

/**
 * Executes a single action with exponential-backoff retry.
 * Throws after MAX_RETRIES if all attempts fail.
 */
async function executeActionWithRetry(
    actionTypeName: string,
    actionTypeId: string,
    resolvedMetadata: any,
    zapRunId: string,
    stage: number,
    userId: string
): Promise<any> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const plugin = ActionRegistry.get(actionTypeId);
            if (!plugin) {
                console.log(`⚠️  Unknown action type: "${actionTypeId}" — skipping`);
                return null;
            }

            // Execute the loosely-coupled plugin logic
            const result = await plugin.execute(resolvedMetadata, userId);

            // Track retry count on success if this wasn't the first attempt
            if (attempt > 1) {
                await prismaClient.zapRun.update({
                    where: { id: zapRunId },
                    data: { retryCount: attempt - 1 }
                });
                console.log(`✅ Action "${actionTypeId}" succeeded on attempt ${attempt}`);
            }
            return result; // Success — exit retry loop
        } catch (err) {
            lastError = err;
            const backoff = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
            console.warn(
                `⚠️  Action "${actionTypeId}" failed on attempt ${attempt}/${MAX_RETRIES}. ` +
                `Retrying in ${backoff}ms...`,
                err
            );
            if (attempt < MAX_RETRIES) {
                await sleep(backoff);
            }
        }
    }

    // All retries exhausted
    throw lastError;
}

// Deleted giant executeAction switch block as it's now handled smoothly via ActionRegistry

async function main() {
    const producer = kafka.producer();
    await producer.connect();
    const consumer = kafka.consumer({ groupId: 'main-worker' });
    await consumer.connect();
    console.log("✅ Worker started — listening for zap events");

    await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });
    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            try {
                if (!message.value?.toString()) return;

                const parsedValue = JSON.parse(message.value.toString());
                const zapRunId = parsedValue.zapRunId;
                const stage = parsedValue.stage;

                console.log(`📨 Processing zapRunId=${zapRunId} stage=${stage}`);

                const zapRunDetails = await prismaClient.zapRun.findFirst({
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
                    await prismaClient.zapRun.update({
                        where: { id: zapRunId },
                        data: { status: 'failed' }
                    });
                    await consumer.commitOffsets([{
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
                    await prismaClient.zapRun.update({
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
                const output = await executeActionWithRetry(
                    currentAction.type.name,
                    currentAction.type.id,
                    resolvedMetadata,
                    zapRunId,
                    stage,
                    userId
                );

                // If plugin returned data (like Gemini text output), implicitly store it in metadata
                if (output) {
                    const stageKey = `action_${currentAction.sortingOrder}`;
                    await prismaClient.zapRun.update({
                        where: { id: zapRunId },
                        data: { metadata: { ...zapRunMetadata, [stageKey]: { output } } }
                    });
                }

                // Small delay to prevent thundering herd
                await sleep(100);

                const lastStage = (zapRunDetails.zap.actions?.length || 1) - 1;

                if (stage < lastStage) {
                    console.log(`⏭️  Queueing next stage: ${stage + 1}`);
                    await producer.send({
                        topic: TOPIC_NAME,
                        messages: [{ value: JSON.stringify({ stage: stage + 1, zapRunId }) }]
                    });
                } else {
                    console.log(`✅ Zap run completed: ${zapRunId}`);
                    await prismaClient.zapRun.update({
                        where: { id: zapRunId },
                        data: { status: 'completed' }
                    });
                }

                await consumer.commitOffsets([{
                    topic: TOPIC_NAME,
                    partition,
                    offset: (parseInt(message.offset) + 1).toString()
                }]);

            } catch (error) {
                console.error("❌ Fatal error processing message:", error);
                try {
                    const parsedValue = message.value ? JSON.parse(message.value.toString()) : null;
                    if (parsedValue?.zapRunId) {
                        const currentRetry = await prismaClient.zapRun.findFirst({
                            where: { id: parsedValue.zapRunId },
                            select: { retryCount: true }
                        });
                        await prismaClient.zapRun.update({
                            where: { id: parsedValue.zapRunId },
                            data: {
                                status: 'failed',
                                retryCount: (currentRetry?.retryCount ?? 0) + MAX_RETRIES
                            }
                        });
                    }
                } catch { /* ignore secondary error */ }
                // Commit to avoid infinite re-processing of poison pill messages
                await consumer.commitOffsets([{
                    topic: TOPIC_NAME,
                    partition,
                    offset: (parseInt(message.offset) + 1).toString()
                }]);
            }
        }
    });
}

main();
