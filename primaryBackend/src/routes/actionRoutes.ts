import { Router } from "express";
import { prismaClient } from "../db";

const router = Router();


import { ActionInputSchemas } from "../actionSchemas";

router.get("/available", async (req, res) => {
  const actionsData = await prismaClient.availableAction.findMany({});

  // Attach the loosely-coupled schema definitions to the response payload
  const availableActions = actionsData.map(action => ({
    ...action,
    inputSchema: ActionInputSchemas[action.name] || null
  }));

  res.json({
    availableActions
  });
});


export const actionRouter = router;