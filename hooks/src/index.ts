import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const app = express();
app.use(cors()); // Allow webhooks to be pinged via browser/fetch universally
app.use(express.json()); // Middleware to parse JSON body
app.use(express.urlencoded({ extended: true }));

const client = new PrismaClient();

console.log("Listening for webhooks...");
// Accept GET, POST, or any method
app.all("/hooks/catch/:userId/:zapId", async (req, res) => {
    const userId = req.params.userId;
    const zapId = req.params.zapId;

    // Fallback order: try body first, then fallback to URL query parameters
    let body = req.body;
    if (Object.keys(body).length === 0 && Object.keys(req.query).length > 0) {
        body = req.query;
    }

    // Validate Zap exists and belongs to user
    const zap = await client.zap.findFirst({
        where: {
            id: zapId,
            userId: parseInt(userId)
        }
    });

    if (!zap) {
        res.status(404).json({ message: "Zap not found or unauthorized" });
        return;
    }

    // Save the very latest payload onto the Trigger table as a sample so the Editor can map fields real-time
    await client.trigger.update({
        where: { zapId: zapId },
        data: {
            samplePayload: body
        }
    });

    // Store in db a new run
    await client.$transaction(async (tx) => {
        const run = await tx.zapRun.create({
            data: {
                zapId: zapId,
                payload: body, // Store webhook payload in payload field
                metadata: {
                    trigger: body // Also keep in metadata for backward compatibility
                }
            }
        });

        await tx.zapRunOutbox.create({
            data: {
                zapRunId: run.id
            }
        });
    });

    res.json({
        message: "Webhook received"
    });
});

app.listen(3002, () => {
    console.log("listening on 3002")
})