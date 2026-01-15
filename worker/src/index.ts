import { Kafka } from "kafkajs";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "./utils/email";
import { setDefaultHighWaterMark } from "nodemailer/lib/xoauth2";
import { appendRow } from "./utils/google_sheet";
import {createCalendarEvent} from "./utils/google_calender";
import { appendNotionRow } from "./utils/notion";
require('dotenv').config();
const TOPIC_NAME = "zap-events"
const prismaClient = new PrismaClient();
const kafka = new Kafka({
    clientId: 'outbox-processor',
    brokers: ['localhost:9092']
});

async function main(){

    

    const producer = kafka.producer();
    await producer.connect();
    const consumer = kafka.consumer({ groupId: 'main-worker'});
    await consumer.connect();
    console.log("working")
    await consumer.subscribe({topic:TOPIC_NAME, fromBeginning:true});
    await consumer.run ({
        autoCommit:false,
        eachMessage: async ({ topic, partition, message}) => {
            console.log({
                partition,
                offset:message.offset,
                value: message.value?.toString(),
            })
            
            // console.log(message);

            if(!message.value?.toString()){
                return;
            }
            const parsedValue = JSON.parse(message.value?.toString());
            const zapRunId = parsedValue.zapRunId;
            const stage = parsedValue.stage;

            const zapRunDetails = await prismaClient.zapRun.findFirst({
                where: {
                    id:zapRunId
                },
                include:{
                    zap:{
                        include:{
                            actions:{
                                include:{
                                    type:true
                                }
                            }
                        }
                    }
                }
            });

            
            const currentAction = zapRunDetails?.zap.actions.find((x:any) => x.sortingOrder === stage);

            console.log(currentAction)
            if(!currentAction){
                console.log("Current action not found");
                return;
            }

            if(currentAction.type.id === "email"){
                console.log("sending email");
                console.log(currentAction.metadata)
                if(currentAction.metadata != null) await sendEmail(currentAction.metadata as { email: string; body: string });
                 
            }
            if(currentAction.type.id ==="Google Sheet"){

                console.log("googlesheet");
                // await appendRow("1", currentAction.metadata);

            }


            if(currentAction.type.id === "Google Calender"){
                console.log("📅 Creating Google Calendar event");
                    
                console.log("..................................")
                console.log(currentAction.metadata);
                // await createCalendarEvent(
                //     "1",currentAction.metadata as {
                //         title:string,
                //         location:string,
                //         description:string,
                //         start:string,
                //         end:string
                //     }
                    
                // );    
            }

            await new Promise(r => setTimeout(r, 1000));

            const zapId = message.value?.toString();
            const lastStage = (zapRunDetails?.zap.actions?.length || 1) - 1;
            
            if(lastStage !== stage){
                
                await producer.send({
                    topic: TOPIC_NAME,
                    messages:[{
                        value:JSON.stringify({
                            stage:stage+1,
                            zapRunId
                        })
                    }]
                })
            }
            
            console.log("processing done")

            await consumer.commitOffsets([{
                topic: TOPIC_NAME,
                partition:partition,
                offset:(parseInt(message.offset) + 1).toString()
            }])
        }
    })
}
main()