import { Router } from "express";
import { ZapCreateSchema } from "../types";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../authMiddleware";
import { z } from "zod";

const zapRouter = Router();
const prismaClient = new PrismaClient();

const ZapUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    isEnabled: z.boolean().optional(),
});

// ─── GET /api/v1/zap/runs/all ──────────────────────────────────────────────
zapRouter.get('/runs/all', authMiddleware, async (req, res) => {
    try {
        //@ts-ignore
        const userId = req.id;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;

        const userZaps = await prismaClient.zap.findMany({
            where: { userId: parseInt(userId) },
            select: { id: true }
        });
        const zapIds = userZaps.map(z => z.id);

        if (zapIds.length === 0) {
            res.json({ runs: [], total: 0, page, limit });
            return;
        }

        const [runs, total] = await Promise.all([
            prismaClient.zapRun.findMany({
                where: { zapId: { in: zapIds } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    zapRunOutbox: true,
                    zap: {
                        select: {
                            name: true,
                            trigger: { select: { type: { select: { name: true, image: true } } } },
                            actions: {
                                select: { sortingOrder: true, type: { select: { name: true, image: true } } },
                                orderBy: { sortingOrder: 'asc' }
                            }
                        }
                    }
                }
            }),
            prismaClient.zapRun.count({ where: { zapId: { in: zapIds } } })
        ]);

        const enrichedRuns = runs.map(run => ({
            id: run.id,
            zapId: run.zapId,
            zapName: run.zap.name || 'Untitled Zap',
            status: run.status,
            retryCount: run.retryCount,
            payload: run.payload,
            createdAt: run.createdAt,
            trigger: run.zap.trigger?.type ?? null,
            actions: run.zap.actions.map(a => a.type)
        }));

        res.json({ runs: enrichedRuns, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        console.error('Error fetching all runs:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── POST /api/v1/zap/create ──────────────────────────────────────────────
zapRouter.post('/create', authMiddleware, async (req, res) => {
    const body = req.body;
    //@ts-ignore
    const id = req.id;
    const parsedData = ZapCreateSchema.safeParse(body);

    if (!parsedData.success) {
        res.status(411).json({ message: "Incorrect inputs" });
        return;
    }

    const zapId = await prismaClient.$transaction(async tx => {
        const zap = await tx.zap.create({
            data: {
                TriggerId: "",
                userId: parseInt(id),
                name: parsedData.data.name,
                actions: {
                    create: parsedData.data.actions.map((x, index) => ({
                        actionId: x.availableActionId,
                        sortingOrder: index,
                        metadata: x.actionMetadata
                    }))
                }
            }
        });

        const trigger = await tx.trigger.create({
            data: {
                TriggerId: parsedData.data.availableTriggerId,
                zapId: zap.id
            }
        });

        await tx.zap.update({
            where: { id: zap.id },
            data: { TriggerId: trigger.id }
        });

        return zap.id;
    });

    res.json({ zapId });
});

// ─── PUT /api/v1/zap/:zapId ───────────────────────────────────────────────
zapRouter.put('/:zapId', authMiddleware, async (req, res) => {
    //@ts-ignore
    const id = req.id;
    const zapId = req.params.zapId;
    const body = req.body;
    const parsedData = ZapCreateSchema.safeParse(body);

    if (!parsedData.success) {
        res.status(411).json({ message: "Incorrect inputs" });
        return;
    }

    // Verify ownership
    const existingZap = await prismaClient.zap.findFirst({
        where: { id: zapId, userId: parseInt(id) }
    });

    if (!existingZap) {
        res.status(404).json({ message: "Zap not found" });
        return;
    }

    await prismaClient.$transaction(async tx => {
        // Delete existing actions
        await tx.action.deleteMany({
            where: { zapId: zapId }
        });

        // Update trigger
        await tx.trigger.update({
            where: { zapId: zapId },
            data: { TriggerId: parsedData.data.availableTriggerId }
        });

        // Update zap and create new actions
        await tx.zap.update({
            where: { id: zapId },
            data: {
                name: parsedData.data.name,
                actions: {
                    create: parsedData.data.actions.map((x, index) => ({
                        actionId: x.availableActionId,
                        sortingOrder: index,
                        metadata: x.actionMetadata
                    }))
                }
            }
        });
    });

    res.json({ zapId });
});

// ─── GET /api/v1/zap/user ─────────────────────────────────────────────────
// Paginated list of zaps for the authenticated user
zapRouter.get('/user', authMiddleware, async (req, res) => {
    try {
        //@ts-ignore
        const id = req.id;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;

        const [zaps, total] = await Promise.all([
            prismaClient.zap.findMany({
                where: { userId: parseInt(id) },
                orderBy: { id: 'desc' },
                skip,
                take: limit,
                include: {
                    actions: { include: { type: true } },
                    trigger: { include: { type: true } }
                }
            }),
            prismaClient.zap.count({ where: { userId: parseInt(id) } })
        ]);

        res.json({ zaps, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        console.error('Error fetching user zaps:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── GET /api/v1/zap/:zapId ───────────────────────────────────────────────
zapRouter.get('/:zapId', authMiddleware, async (req, res) => {
    //@ts-ignore
    const id = req.id;
    const zapId = req.params.zapId;

    const zap = await prismaClient.zap.findFirst({
        where: { id: zapId, userId: parseInt(id) },
        include: {
            actions: { include: { type: true } },
            trigger: { include: { type: true } }
        }
    });

    if (!zap) {
        res.status(404).json({ message: "Zap not found" });
        return;
    }

    res.json({ zap });
});

// ─── GET /api/v1/zap/:zapId/runs/latest ──────────────────────────────────
zapRouter.get('/:zapId/runs/latest', authMiddleware, async (req, res) => {
    //@ts-ignore
    const id = req.id;
    const zapId = req.params.zapId;

    const zap = await prismaClient.zap.findFirst({
        where: { id: zapId, userId: parseInt(id) }
    });

    if (!zap) {
        res.status(404).json({ message: "Zap not found" });
        return;
    }

    const run = await prismaClient.zapRun.findFirst({
        where: { zapId },
        orderBy: { createdAt: 'desc' }
    });

    res.json({ run });
});

// ─── POST /api/v1/zap/:zapId/test-action ──────────────────────────────────
// Real action test: trigger a dry-run call to the action's utility
zapRouter.post('/:zapId/test-action', authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.id;
    const zapId = req.params.zapId;
    const { actionId, metadata } = req.body;

    if (!actionId) {
        res.status(400).json({ message: "actionId is required" });
        return;
    }

    // Verify ownership
    const zap = await prismaClient.zap.findFirst({
        where: { id: zapId, userId: parseInt(userId) }
    });

    if (!zap) {
        res.status(404).json({ message: "Zap not found or unauthorized" });
        return;
    }

    // Fetch the action type
    const actionType = await prismaClient.availableAction.findFirst({
        where: { id: actionId }
    });

    if (!actionType) {
        res.status(404).json({ message: "Action type not found" });
        return;
    }

    // Return dry-run result — actual execution dispatched to worker
    // We create a test ZapRun in the DB so the worker can process it
    try {
        const testRun = await prismaClient.zapRun.create({
            data: {
                zapId,
                payload: metadata || {},
                status: 'pending',
            }
        });

        await prismaClient.zapRunOutbox.create({
            data: { zapRunId: testRun.id }
        });

        res.json({
            success: true,
            message: `Test run queued for "${actionType.name}"`,
            testRunId: testRun.id,
            status: 'pending',
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Test action error:', err);
        res.status(500).json({ message: 'Failed to queue test run' });
    }
});

// ─── PATCH /api/v1/zap/:zapId ─────────────────────────────────────────────
// Update name and/or isEnabled
zapRouter.patch('/:zapId', authMiddleware, async (req, res) => {
    //@ts-ignore
    const id = req.id;
    const zapId = req.params.zapId;
    const parsedBody = ZapUpdateSchema.safeParse(req.body);

    if (!parsedBody.success) {
        res.status(411).json({ message: "Incorrect inputs" });
        return;
    }

    const zap = await prismaClient.zap.findFirst({
        where: { id: zapId, userId: parseInt(id) }
    });

    if (!zap) {
        res.status(404).json({ message: "Zap not found or unauthorized" });
        return;
    }

    const updateData: { name?: string; isEnabled?: boolean } = {};
    if (parsedBody.data.name !== undefined) updateData.name = parsedBody.data.name;
    if (parsedBody.data.isEnabled !== undefined) updateData.isEnabled = parsedBody.data.isEnabled;

    if (Object.keys(updateData).length > 0) {
        await prismaClient.zap.update({
            where: { id: zapId },
            data: updateData
        });
    }

    res.json({ message: "Updated", isEnabled: parsedBody.data.isEnabled ?? zap.isEnabled });
});

// ─── DELETE /api/v1/zap/:zapId ────────────────────────────────────────────
zapRouter.delete('/:zapId', authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.id;
    const zapId = req.params.zapId;

    const zap = await prismaClient.zap.findFirst({
        where: { id: zapId, userId: parseInt(userId) }
    });

    if (!zap) {
        res.status(404).json({ message: "Zap not found or unauthorized" });
        return;
    }

    try {
        await prismaClient.$transaction(async (tx) => {
            const runs = await tx.zapRun.findMany({ where: { zapId }, select: { id: true } });
            const runIds = runs.map(r => r.id);

            if (runIds.length > 0) {
                await tx.zapRunOutbox.deleteMany({ where: { zapRunId: { in: runIds } } });
                await tx.zapRun.deleteMany({ where: { zapId } });
            }

            await tx.action.deleteMany({ where: { zapId } });
            await tx.trigger.deleteMany({ where: { zapId } });
            await tx.zap.delete({ where: { id: zapId } });
        });

        res.json({ message: "Zap deleted successfully" });
    } catch (err) {
        console.error('Error deleting zap:', err);
        res.status(500).json({ error: 'Failed to delete zap' });
    }
});

export default zapRouter;