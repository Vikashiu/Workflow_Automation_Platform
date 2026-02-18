import { Kafka } from "kafkajs";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "./utils/email";
import { setDefaultHighWaterMark } from "nodemailer/lib/xoauth2";
import { appendRow } from "./utils/google_sheet";
import { createCalendarEvent } from "./utils/google_calender";
import { appendNotionRow } from "./utils/notion";
import { generateGeminiContent } from "./utils/gemini";
import { sendSlackMessage } from "./utils/slack";
import { sendDiscordMessage } from "./utils/discord";
require('dotenv').config();
const TOPIC_NAME = "zap-events"
const prismaClient = new PrismaClient();
const kafka = new Kafka({
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
 * Recursively resolves all template strings in an object
 * Processes nested objects and arrays
 * 
 * @param obj - Object with potential template strings
 * @param payload - Data to resolve templates against
 * @returns Object with all templates resolved
 */
function resolveTemplatesInObject(obj: any, payload: any): any {
    if (typeof obj === "string") {
        return resolveTemplate(obj, payload);
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => resolveTemplatesInObject(item, payload));
    }

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
 * Merges actual webhook payload with previous action results
 * Used as context for template resolution
 * 
 * @param zapRunPayload - Original webhook payload
 * @param zapRunMetadata - Accumulated results from previous actions
 * @returns Combined context object
 */
function buildExecutionContext(zapRunPayload: any, zapRunMetadata: any): any {
    return {
        // Original trigger payload at root level for easy access
        ...zapRunPayload,
        // Previous action results under "action_N" keys
        ...(zapRunMetadata || {})
    };
}

async function main() {
    const producer = kafka.producer();
    await producer.connect();
    const consumer = kafka.consumer({ groupId: 'main-worker' });
    await consumer.connect();
    console.log("✅ Worker started - listening for zap events");

    await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });
    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            try {
                console.log({
                    partition,
                    offset: message.offset,
                    value: message.value?.toString(),
                });

                if (!message.value?.toString()) {
                    return;
                }

                const parsedValue = JSON.parse(message.value?.toString());
                const zapRunId = parsedValue.zapRunId;
                const stage = parsedValue.stage;

                const zapRunDetails = await prismaClient.zapRun.findFirst({
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

                const currentAction = zapRunDetails.zap.actions.find((x: any) => x.sortingOrder === stage);

                if (!currentAction) {
                    console.log("🛑 Current action not found for stage:", stage);
                    return;
                }

                // Mark as running on first stage
                if (stage === 0) {
                    await prismaClient.zapRun.update({
                        where: { id: zapRunId },
                        data: { status: 'running' }
                    });
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
                    await sendSlackMessage(webhookUrl as string, message as string);
                }

                if (currentAction.type.id === "Discord") {
                    const { webhookUrl, content } = resolvedMetadata;
                    console.log("🎮 Sending Discord message");
                    await sendDiscordMessage(webhookUrl as string, content as string);
                }

                if (currentAction.type.id === "email") {
                    console.log("📧 Sending email");
                    const { email, subject, body } = resolvedMetadata;
                    await sendEmail({
                        email: email as string,
                        body: body as string,
                        subject: subject as string
                    } as any);
                }

                if (currentAction.type.id === "Google Sheet") {
                    console.log("📊 Appending to Google Sheet");
                    await appendRow(zapRunDetails.zap.userId.toString() || "", resolvedMetadata);
                }

                if (currentAction.type.id === "Google_Calendar") {
                    console.log("📅 Creating Google Calendar event");
                    await createCalendarEvent(
                        zapRunDetails.zap.userId.toString() || "",
                        resolvedMetadata as {
                            title: string;
                            location: string;
                            description: string;
                            start: string;
                            end: string;
                        }
                    );
                }

                if (currentAction.type.id === "Notion") {
                    console.log("📝 Creating Notion Page");
                    await appendNotionRow(
                        zapRunDetails.zap.userId.toString() || "",
                        resolvedMetadata
                    );
                }

                if (currentAction.type.id === "Gemini") {
                    console.log("🤖 Asking Gemini...");
                    const prompt = resolvedMetadata.prompt;
                    const result = await generateGeminiContent(prompt);
                    console.log("✨ Gemini Output:", result);

                    const output = result || "";
                    const stageKey = `action_${currentAction.sortingOrder}`;
                    const newMetadata = {
                        ...zapRunMetadata,
                        [stageKey]: { output }
                    };

                    await prismaClient.zapRun.update({
                        where: { id: zapRunId },
                        data: { metadata: newMetadata }
                    });
                }

                // Small delay to prevent thundering herd
                await new Promise(r => setTimeout(r, 100));

                const lastStage = (zapRunDetails.zap.actions?.length || 1) - 1;

                // Queue next action if not the last one
                if (lastStage !== stage) {
                    console.log(`⏭️  Queueing next stage: ${stage + 1}`);
                    await producer.send({
                        topic: TOPIC_NAME,
                        messages: [{
                            value: JSON.stringify({
                                stage: stage + 1,
                                zapRunId
                            })
                        }]
                    });
                } else {
                    console.log(`✅ Zap execution completed for zapRunId: ${zapRunId}`);
                    await prismaClient.zapRun.update({
                        where: { id: zapRunId },
                        data: { status: 'completed' }
                    });
                }

                // Commit offset
                await consumer.commitOffsets([{
                    topic: TOPIC_NAME,
                    partition: partition,
                    offset: (parseInt(message.offset) + 1).toString()
                }]);

            } catch (error) {
                console.error("❌ Error processing message:", error);
                // Mark run as failed
                try {
                    const parsedValue = message.value ? JSON.parse(message.value.toString()) : null;
                    if (parsedValue?.zapRunId) {
                        await prismaClient.zapRun.update({
                            where: { id: parsedValue.zapRunId },
                            data: { status: 'failed' }
                        });
                    }
                } catch { /* ignore secondary error */ }
                // Commit offset even on error to avoid stuck messages
                await consumer.commitOffsets([{
                    topic: TOPIC_NAME,
                    partition: partition,
                    offset: (parseInt(message.offset) + 1).toString()
                }]);
            }
        }
    });
}
main()
