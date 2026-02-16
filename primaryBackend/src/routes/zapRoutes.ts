import { Router } from "express";
import { ZapCreateSchema } from "../types";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../authMiddleware";

const zapRouter = Router();
const prismaClient = new PrismaClient();

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



export default zapRouter;