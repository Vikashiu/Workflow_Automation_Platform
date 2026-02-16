import { Router, Request, Response } from "express";
import { prismaClient } from "../db";
import { flattenObject, getPrimitiveFields } from "../utils/jsonFlattener";

const router = Router();

router.get("/available", async (req, res) => {
    const availableTriggers = await prismaClient.availableTriggers.findMany({});

    res.json({
        availableTriggers
    });
});

/**
 * GET /triggers/:id/fields
 * Returns available fields that can be used as template placeholders
 * Extracted from the trigger's samplePayload
 */
router.get("/:triggerId/fields", async (req: Request, res: Response): Promise<void> => {
    try {
        const { triggerId } = req.params as { triggerId: string };

        const trigger = await prismaClient.trigger.findUnique({
            where: { id: triggerId }
        });

        if (!trigger) {
            res.status(404).json({
                error: "Trigger not found",
                details: `No trigger with ID: ${triggerId}`
            });
            return;
        }

        // Parse samplePayload if it exists
        const samplePayload = typeof trigger.samplePayload === "string"
            ? JSON.parse(trigger.samplePayload as string)
            : trigger.samplePayload || {};

        if (Object.keys(samplePayload).length === 0) {
            res.json({
                fields: [],
                samplePayload: {},
                message: "No sample payload provided. Please configure trigger and add a sample payload."
            });
            return;
        }

        // Flatten the payload to extract all available fields
        const allFields = flattenObject(samplePayload);
        
        // For template placeholders, we primarily want primitive types
        const primitiveFields = getPrimitiveFields(allFields);

        res.json({
            fields: primitiveFields,
            allFields: allFields,  // Include all fields for advanced users
            samplePayload: samplePayload,
            totalFields: primitiveFields.length
        });

    } catch (error) {
        console.error("Error fetching trigger fields:", error);
        res.status(500).json({
            error: "Failed to fetch trigger fields",
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * PUT /triggers/:id/sample-payload
 * Updates the sample payload for a trigger
 */
router.put("/:triggerId/sample-payload", async (req: Request, res: Response): Promise<void> => {
    try {
        const { triggerId } = req.params as { triggerId: string };
        const { samplePayload } = req.body as { samplePayload: any };

        if (!samplePayload || typeof samplePayload !== "object") {
            res.status(400).json({
                error: "Invalid sample payload",
                details: "samplePayload must be a valid JSON object"
            });
            return;
        }

        const updatedTrigger = await prismaClient.trigger.update({
            where: { id: triggerId },
            data: {
                samplePayload: samplePayload
            }
        });

        res.json({
            message: "Sample payload updated successfully",
            trigger: updatedTrigger
        });

    } catch (error) {
        console.error("Error updating trigger sample payload:", error);
        res.status(500).json({
            error: "Failed to update sample payload",
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

export const triggerRouter = router;
