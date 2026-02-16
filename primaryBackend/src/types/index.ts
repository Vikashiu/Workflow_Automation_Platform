import { number, z } from "zod";

export const SignupData = z.object({
    username: z.string(),
    password: z.string(),
    name: z.string(),
})

export const SigninData = z.object({
    username: z.string(),
    password: z.string(),
});

export const ZapCreateSchema = z.object({
    name: z.string().optional(),
    availableTriggerId: z.string(),
    triggerMetadata: z.any().optional(),
    actions: z.array(z.object({
        availableActionId: z.string(),
        sortingOrder: z.number(),
        actionMetadata: z.any().optional()
    }))
});