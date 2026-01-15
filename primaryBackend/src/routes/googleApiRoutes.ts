
import { Router } from "express";
import { authMiddleware } from "../authMiddleware";
// Assuming the functions from the 'google-sheets-api-expansion' artifact are in this path

import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";

const app = Router();
const prismaClient = new PrismaClient();

// This function is essentially the logic you had in your original /sheets route.
// It's better to keep it separate for clarity.

async function getAuthenticatedClient(userId: string) {
    const creds = await prismaClient.googleCredentials.findFirst({ where: { userId } });

    if (!creds || !creds.accessToken || !creds.refreshToken) {
        throw new Error(`No valid Google credentials found for user ID: ${userId}.`);
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials({
        access_token: creds.accessToken,
        refresh_token: creds.refreshToken,
    });

    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            console.log('Access token was refreshed.');
            await prismaClient.googleCredentials.update({
                where: { userId: userId },
                data: { accessToken: tokens.access_token },
            });
        }
    });

    return oauth2Client;
}


/**
 * Fetches the list of worksheets (tabs) for a given spreadsheet.
 * @param userId The ID of the user.
 * @param spreadsheetId The ID of the Google Spreadsheet.
 * @returns A promise that resolves to an array of worksheet titles.
 */
export async function getWorksheets(userId: string, spreadsheetId: string): Promise<string[]> {
    const auth = await getAuthenticatedClient(userId);
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const response = await sheets.spreadsheets.get({
            spreadsheetId,
        });
        
        const worksheetTitles = response.data.sheets?.map(sheet => sheet.properties?.title || '').filter(Boolean);
        return worksheetTitles || [];

    } catch (error: any) {
        console.error("Error fetching worksheets:", error.response?.data || error.message);
        throw new Error("Failed to fetch worksheets.");
    }
}

/**
 * Fetches the header row (columns) from a specific worksheet.
 * @param userId The ID of the user.
 * @param spreadsheetId The ID of the Google Spreadsheet.
 * @param sheetName The name of the worksheet (tab).
 * @returns A promise that resolves to an array of column header strings.
 */
export async function getSheetColumns(userId: string, spreadsheetId: string, sheetName: string): Promise<string[]> {
    const auth = await getAuthenticatedClient(userId);
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!1:1`, // Fetches the entire first row
        });

        return response.data.values?.[0] || [];
    } catch (error: any) {
        console.error("Error fetching sheet columns:", error.response?.data || error.message);
        throw new Error("Failed to fetch sheet columns.");
    }
}

async function getGoogleSheets(userId: string) {
    const creds = await prismaClient.googleCredentials.findFirst({ where: { userId } });

    if (!creds || !creds.accessToken || !creds.refreshToken) {
        throw new Error(`No valid Google credentials found for user ID: ${userId}.`);
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials({
        access_token: creds.accessToken,
        refresh_token: creds.refreshToken,
    });

    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            console.log('Access token was refreshed for fetching sheets.');
            await prismaClient.googleCredentials.update({
                where: { userId: userId },
                data: { accessToken: tokens.access_token },
            });
        }
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id, name)',
        pageSize: 100,
    });

    const files = response.data.files;
    if (files && files.length) {
        return files.map(file => ({
            id: file.id || '',
            name: file.name || 'Untitled Spreadsheet'
        }));
    } else {
        return [];
    }
}


// Route 1: Get all spreadsheets
app.get('/sheets', authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.id.toString();

    try {
        const sheets = await getGoogleSheets(userId);
        res.json({ sheets });
    } catch (error) {
        console.error("Error fetching Google Sheets:", error);
        res.status(500).json({ message: "Failed to fetch Google Sheets." });
    }
});

// Route 2: Get all worksheets for a given spreadsheet
app.get("/sheets/:spreadsheetId/worksheets", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.id.toString();
    const { spreadsheetId } = req.params;

    try {
        const worksheets = await getWorksheets(userId, spreadsheetId);
        res.json({ worksheets });
    } catch (error) {
        console.error("Error fetching worksheets:", error);
        res.status(500).json({ message: "Failed to fetch worksheets." });
    }
});

// Route 3: Get all columns for a given worksheet
app.get("/sheets/:spreadsheetId/worksheets/:sheetName/columns", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.id.toString();
    const { spreadsheetId, sheetName } = req.params;

    try {
        const columns = await getSheetColumns(userId, spreadsheetId, sheetName);
        res.json({ columns });
    } catch (error) {
        console.error("Error fetching columns:", error);
        res.status(500).json({ message: "Failed to fetch columns." });
    }
});

export const googleApiRoute = app;
