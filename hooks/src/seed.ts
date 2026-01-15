import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ===============================
  // Triggers
  // ===============================
  await prisma.availableTriggers.upsert({
    where: { id: "Webhook" },
    update: {},
    create: {
      id: "Webhook",
      name: "Webhook",
      image: "https://img.icons8.com/color/1200/webhook.jpg"
    }
  });

  // ===============================
  // Actions
  // ===============================

  await prisma.availableAction.upsert({
    where: { id: "email" },
    update: {},
    create: {
      id: "email",
      name: "email",
      image: "https://cdn-icons-png.flaticon.com/512/3178/3178158.png"
    }
  });

  await prisma.availableAction.upsert({
    where: { id: "Google Sheet" },
    update: {},
    create: {
      id: "Google Sheet",
      name: "Google Sheet",
      image: "https://cdn-icons-png.flaticon.com/512/2875/2875342.png"
    }
  });

  await prisma.availableAction.upsert({
    where: { id: "Google Calendar" },
    update: {},
    create: {
      id: "Google_Calendar",
      name: "Google Calender",
      image: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✅ Seed completed successfully");
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
