import { Router } from "express";
import { SigninData, SignupData } from "../types";
import { prismaClient } from "../db";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../types/config";
import { authMiddleware } from "../authMiddleware";

const userRouter = Router();

userRouter.post('/signup', async (req: any, res: any) => {
    
    const body = req.body;
    const parsedData = SignupData.safeParse(body);

    if (!parsedData.success) {
        return res.status(411).json({
            message: "incorrect inputs"
        })
    }

    const userExists = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username
        }
    });
    if (userExists) {
        return res.status(403).json({
            message: "user already exists"
        })
    }

    const user = await prismaClient.user.create({
        data: {
            email: parsedData.data.username,
            password: parsedData.data.password,
            name: parsedData.data.name,
        }
    })
    const userId = user.id;
    const token = jwt.sign({
        userId
    }, JWT_PASSWORD)

    res.json({
        token: token
    });

})
userRouter.post('/signin', async (req, res) => {
    

    const body = req.body;
    const parsedData = SigninData.safeParse(body);
    if (!parsedData.success) {
        res.status(411).json({
            message: "Incorrect inputs"
        })
        return;
    }
    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
            password: parsedData.data.password,
        }
    })
    if (!user) {
        res.status(403).json({
            message: "sorry credential are incorrect"
        })
    }
    
    const id = user?.id;
    const token = jwt.sign({ id }, JWT_PASSWORD)

    res.json({
        token: token
    });

})
userRouter.get('/', authMiddleware, async (req, res) => {
    
    //@ts-ignore
    const id = req.id;
    const user = await prismaClient.user.findFirst({
        where: {
            id
        },
        select: {
            name: true,
            email: true
        }
    });
    res.json({
        user
    })


})

export default userRouter;