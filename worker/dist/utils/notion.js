"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendNotionRow = appendNotionRow;
const client_1 = require("@notionhq/client");
const client_2 = require("@prisma/client");
const prismaClient = new client_2.PrismaClient();
function appendNotionRow(userId, metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        const creds = yield prismaClient.notionCredential.findFirst({
            where: { userId }
        });
        if (!creds) {
            throw new Error("No Notion credentials found for user.");
        }
        const notion = new client_1.Client({
            auth: creds.accessToken,
        });
        // metadata should contain databaseId and content (as defined in NotionSelector)
        const databaseId = metadata.databaseId;
        const content = metadata.content || "New Zap Item";
        const response = yield notion.pages.create({
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
    });
}
