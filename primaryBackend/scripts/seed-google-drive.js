/**
 * seed-google-drive.js
 *
 * Run once to register "Google Drive" as an available action in the database.
 * Usage:
 *   cd primaryBackend
 *   node scripts/seed-google-drive.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding Google Drive action...");

    // Check if already exists
    const existing = await prisma.availableAction.findFirst({
        where: { name: "Google Drive" },
    });

    if (existing) {
        console.log("✅ 'Google Drive' action already exists in the database. No changes made.");
        console.log(`   ID: ${existing.id}`);
        return;
    }

    const action = await prisma.availableAction.create({
        data: {
            name: "Google Drive",
            image: "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg",
        },
    });

    console.log("✅ Successfully created 'Google Drive' action!");
    console.log(`   ID: ${action.id}`);
    console.log(`   Name: ${action.name}`);
    console.log("\n📋 Copy this ID and update your worker if needed.");
    console.log("   The worker uses the 'name' field (\"Google Drive\") to look up the plugin.");
}

main()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
