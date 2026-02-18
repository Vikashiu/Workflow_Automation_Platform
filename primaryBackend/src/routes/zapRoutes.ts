import { Router } from "express";
import { ZapCreateSchema } from "../types";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../authMiddleware";

const zapRouter = Router();
const prismaClient = new PrismaClient();

// GET /api/v1/zap/runs/all - Fetch all ZapRuns across all user's Zaps
// Status logic: if ZapRunOutbox record exists → "queued" (processor hasn't picked it up yet)
//               if ZapRunOutbox record is gone → "completed" (worker finished processing)
zapRouter.get('/runs/all', authMiddleware, async (req, res) => {
    try {
        //@ts-ignore
        const userId = req.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        // Get all zap IDs belonging to this user
        const userZaps = await prismaClient.zap.findMany({
            where: { userId: parseInt(userId) },
            select: { id: true, name: true }
        });

        const zapIds = userZaps.map(z => z.id);
        const zapNameMap: Record<string, string> = {};
        userZaps.forEach(z => { zapNameMap[z.id] = z.name; });

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
                            trigger: {
                                select: {
                                    type: { select: { name: true, image: true } }
                                }
                            },
                            actions: {
                                select: {
                                    sortingOrder: true,
                                    type: { select: { name: true, image: true } }
                                },
                                orderBy: { sortingOrder: 'asc' }
                            }
                        }
                    }
                }
            }),
            prismaClient.zapRun.count({
                where: { zapId: { in: zapIds } }
            })
        ]);

        // Use real status from DB (set by worker), with outbox as fallback for brand-new runs
        const enrichedRuns = runs.map(run => ({
            id: run.id,
            zapId: run.zapId,
            zapName: run.zap.name || 'Untitled Zap',
            status: run.status,  // 'pending' | 'running' | 'completed' | 'failed'
            payload: run.payload,
            createdAt: run.createdAt,
            trigger: run.zap.trigger?.type ?? null,
            actions: run.zap.actions.map(a => a.type)
        }));

        res.json({ runs: enrichedRuns, total, page, limit });
    } catch (err) {
        console.error('Error fetching all runs:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

zapRouter.post('/create', authMiddleware, async (req, res) => {

    const body = req.body;
    //@ts-ignore
    const id = req.id;
    const parsedData = ZapCreateSchema.safeParse(body);

    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        });
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

        })

        const trigger = await tx.trigger.create({
            data: {
                TriggerId: parsedData.data.availableTriggerId,
                zapId: zap.id
            }
        })

        await tx.zap.update({
            where: {
                id: zap.id
            },
            data: {
                TriggerId: trigger.id
            }
        })
        return zap.id;
    })
    res.json({
        zapId
    })
    return;

})
zapRouter.get('/allzap', authMiddleware, async (req, res) => {

    //@ts-ignore
    const id = req.id;
    const zaps = await prismaClient.zap.findMany({
        where: {
            userId: id
        },
        include: {
            actions: {
                include: {
                    type: true
                }
            }, trigger: {
                include: {
                    type: true
                }
            }
        }
    })

    res.json({
        zaps
    })
    console.log(zaps)
})
zapRouter.get('/user', authMiddleware, async (req, res) => {
    try {
        //@ts-ignore
        const id = req.id; // assuming authMiddleware sets req.user
        const zaps = await prismaClient.zap.findMany({
            where: { userId: id },
            include: {
                actions: {
                    include: {
                        type: true
                    }
                }, trigger: {
                    include: {
                        type: true
                    }
                }
            }
        }); // newest first
        res.json({
            zaps
        })
    } catch (err) {
        console.log('Error fetching user zaps:', err);
        res.status(500).json({ error: 'Server error' });
    }
});
zapRouter.get('/:zapId', authMiddleware, async (req, res) => {

    //@ts-ignore
    const id = req.id;

    const zapId = req.params.zapId;

    const zap = await prismaClient.zap.findFirst({
        where: {
            id: zapId
        },
        include: {
            actions: {
                include: {
                    type: true
                }
            },
            trigger: {
                include: {
                    type: true
                }
            }
        }
    })
    res.json({
        zap
    })
})

zapRouter.get('/:zapId/runs/latest', authMiddleware, async (req, res) => {
    //@ts-ignore
    const id = req.id;
    const zapId = req.params.zapId;

    // Validate ownership
    const zap = await prismaClient.zap.findFirst({
        where: { id: zapId, userId: parseInt(id) }
    });

    if (!zap) {
        res.status(404).json({ message: "Zap not found" });
        return;
    }

    const run = await prismaClient.zapRun.findFirst({
        where: { zapId: zapId },
        orderBy: { createdAt: 'desc' }
    });

    res.json({ run });
});

zapRouter.patch('/:zapId', authMiddleware, async (req, res) => {
    //@ts-ignore
    const id = req.id;
    const zapId = req.params.zapId;
    const body = req.body;

    // Validate ownership
    const zap = await prismaClient.zap.findFirst({
        where: { id: zapId, userId: parseInt(id) }
    });

    if (!zap) {
        res.status(404).json({ message: "Zap not found" });
        return;
    }

    if (body.name) {
        await prismaClient.zap.update({
            where: { id: zapId },
            data: { name: body.name }
        });
    }

    res.json({ message: "Updated" });
});

zapRouter.delete('/:zapId', authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.id;
    const zapId = req.params.zapId;

    // Validate ownership
    const zap = await prismaClient.zap.findFirst({
        where: { id: zapId, userId: parseInt(userId) }
    });

    if (!zap) {
        res.status(404).json({ message: "Zap not found or unauthorized" });
        return;
    }

    try {
        await prismaClient.$transaction(async (tx) => {
            // 1. Delete ZapRunOutbox entries (child of ZapRun)
            const runs = await tx.zapRun.findMany({
                where: { zapId },
                select: { id: true }
            });
            const runIds = runs.map(r => r.id);

            if (runIds.length > 0) {
                await tx.zapRunOutbox.deleteMany({
                    where: { zapRunId: { in: runIds } }
                });
                // 2. Delete ZapRuns
                await tx.zapRun.deleteMany({ where: { zapId } });
            }

            // 3. Delete Actions
            await tx.action.deleteMany({ where: { zapId } });

            // 4. Delete Trigger
            await tx.trigger.deleteMany({ where: { zapId } });

            // 5. Finally delete the Zap itself
            await tx.zap.delete({ where: { id: zapId } });
        });

        res.json({ message: "Zap deleted successfully" });
    } catch (err) {
        console.error('Error deleting zap:', err);
        res.status(500).json({ error: 'Failed to delete zap' });
    }
});

export default zapRouter;