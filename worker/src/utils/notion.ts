import { Client } from "@notionhq/client";

import { PrismaClient } from "@prisma/client";
const prismaClient = new PrismaClient();

export async function appendNotionRow(userId: string, metadata: any) {
  const creds = await prismaClient.notionCredential.findFirst({
    where: { userId }
  });

  if (!creds) {
    throw new Error("No Notion credentials found for user.");
  }

  const notion = new Client({
    auth: creds.accessToken,
  });

  // metadata should contain databaseId and content (as defined in NotionSelector)
  const databaseId = metadata.databaseId;
  const content = metadata.content || "New Zap Item";

  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: content,
            },
          },
        ],
      },
      // You can add more dynamic properties if you expand the Selector
    },
  });

  console.log("✅ Row added to Notion:", response.id);
}
