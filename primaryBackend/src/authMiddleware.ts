import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "./types/config";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization as string;

    if (!token) {
        res.status(403).json({ message: "No token provided" });
        return;
    }

    try {
        const payload = jwt.verify(token, JWT_PASSWORD);
        //@ts-ignore
        req.id = (payload as any).id;
        next();
    } catch {
        res.status(403).json({ message: "Invalid or expired token" });
    }
}
