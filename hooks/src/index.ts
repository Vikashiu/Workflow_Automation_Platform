import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(express.json()); // Middleware to parse JSON body

const client = new PrismaClient();

console.log("hi there")
app.post("/hooks/catch/:userId/:zapId", async (req, res) => {
    const userId = req.params.userId;
    const zapId = req.params.zapId;
    const body = req.body;

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

    // Store in db a new run
    await client.$transaction(async (tx) => {
        const run = await tx.zapRun.create({
            data: {
                zapId: zapId,
                metadata: {
                    trigger: body
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