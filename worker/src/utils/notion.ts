import { Client } from "@notionhq/client";

const notion = new Client({
  auth: "", // Your internal integration token
});

export async function appendNotionRow() {
//   const databaseId = process.env.NOTION_DB_ID; // Store in .env

  const response = await notion.pages.create({
    parent: { database_id: "" },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: "Zap Triggered",
            },
          },
        ],
      },
      Status: {
        select: {
          name: "Pending", // must match an existing select option
        },
      },
      Date: {
        date: {
          start: new Date().toISOString(),
        },
      },
    },
  });

  console.log("✅ Row added:", response.id);
}
