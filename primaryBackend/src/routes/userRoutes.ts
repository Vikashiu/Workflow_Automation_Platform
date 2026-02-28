import { Router } from "express";
import { SigninData, SignupData } from "../types";
import { prismaClient } from "../db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWT_PASSWORD } from "../types/config";
import { authMiddleware } from "../authMiddleware";

const userRouter = Router();

// POST /api/v1/user/signup
userRouter.post('/signup', async (req, res) => {
    const body = req.body;
    const parsedData = SignupData.safeParse(body);

    if (!parsedData.success) {
        res.status(411).json({ message: "Incorrect inputs" });
        return;
    }

    const userExists = await prismaClient.user.findFirst({
        where: { email: parsedData.data.username }
    });

    if (userExists) {
        res.status(403).json({ message: "User already exists" });
        return;
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 12);

    const user = await prismaClient.user.create({
        data: {
            email: parsedData.data.username,
            password: hashedPassword,
            name: parsedData.data.name,
        }
    });

    const token = jwt.sign({ id: user.id }, JWT_PASSWORD, { expiresIn: "7d" });

    res.json({ token });
});

// POST /api/v1/user/signin
userRouter.post('/signin', async (req, res) => {
    const body = req.body;
    const parsedData = SigninData.safeParse(body);

    if (!parsedData.success) {
        res.status(411).json({ message: "Incorrect inputs" });
        return;
    }

    // Fetch user by email only, then compare password hash
    const user = await prismaClient.user.findFirst({
        where: { email: parsedData.data.username }
    });

    if (!user) {
        res.status(403).json({ message: "Invalid credentials" });
        return;
    }

    const passwordValid = await bcrypt.compare(parsedData.data.password, user.password);

    if (!passwordValid) {
        res.status(403).json({ message: "Invalid credentials" });
        return;
    }

    const token = jwt.sign({ id: user.id }, JWT_PASSWORD, { expiresIn: "7d" });

    res.json({ token });
});

// GET /api/v1/user — get current user profile
userRouter.get('/', authMiddleware, async (req, res) => {
    //@ts-ignore
    const id = req.id;
    const user = await prismaClient.user.findFirst({
        where: { id },
        select: { id: true, name: true, email: true }
    });
    res.json({ user });
});

// GET /api/v1/user/connections — returns OAuth connection status
userRouter.get('/connections', authMiddleware, async (req: any, res: any) => {
    const userId = req.id?.toString();
    try {
        const [google, notion] = await Promise.all([
            prismaClient.googleCredentials.findFirst({ where: { userId } }),
            prismaClient.notionCredential.findFirst({ where: { userId } }),
        ]);
        res.json({
            google: {
                connected: !!google,
                expiryDate: google?.expiryDate ?? null,
            },
            notion: {
                connected: !!notion,
                workspaceName: notion?.workspaceName ?? null,
            },
        });
    } catch {
        res.status(500).json({ message: 'Failed to fetch connections' });
    }
});

export default userRouter;
