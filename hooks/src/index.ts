import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(express.json()); // Middleware to parse JSON body

const client = new PrismaClient();

console.log("hi there")
app.post("/hooks/catch/:userId/:zapId",async (req, res) => {
    const userId = req.params.userId;
    const zapId = req.params.zapId;
    const body = req.body;
    console.log(body);
    
    // either both step happen or nothing happen --> that remind of transactions
    // store in db a new trigger
    await client.$transaction(async (tx) => {
        const run = await tx.zapRun.create({
            data: {
                zapId: zapId,
                metadata: body
            }
        });

        console.log(run.metadata);
        await tx.zapRunOutbox.create({
            data:{
                zapRunId: run.id
            }
        })
    })
    console.log("hi there")
    res.json({
        message: "worked"
    })


    // push it on to a queue(kafka / redis)

})

app.listen(3002, () => {
    console.log("listening on 3002")
})