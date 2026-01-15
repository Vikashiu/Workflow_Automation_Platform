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
const kafkajs_1 = require("kafkajs");
const client_1 = require("@prisma/client");
const email_1 = require("./utils/email");
require('dotenv').config();
const TOPIC_NAME = "zap-events";
const prismaClient = new client_1.PrismaClient();
const kafka = new kafkajs_1.Kafka({
    clientId: 'outbox-processor',
    brokers: ['localhost:9092']
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const producer = kafka.producer();
        yield producer.connect();
        const consumer = kafka.consumer({ groupId: 'main-worker' });
        yield consumer.connect();
        console.log("working");
        yield consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });
        yield consumer.run({
            autoCommit: false,
            eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ topic, partition, message }) {
                var _b, _c, _d, _e, _f;
                console.log({
                    partition,
                    offset: message.offset,
                    value: (_b = message.value) === null || _b === void 0 ? void 0 : _b.toString(),
                });
                // console.log(message);
                if (!((_c = message.value) === null || _c === void 0 ? void 0 : _c.toString())) {
                    return;
                }
                const parsedValue = JSON.parse((_d = message.value) === null || _d === void 0 ? void 0 : _d.toString());
                const zapRunId = parsedValue.zapRunId;
                const stage = parsedValue.stage;
                const zapRunDetails = yield prismaClient.zapRun.findFirst({
                    where: {
                        id: zapRunId
                    },
                    include: {
                        zap: {
                            include: {
                                actions: {
                                    include: {
                                        type: true
                                    }
                                }
                            }
                        }
                    }
                });
                const currentAction = zapRunDetails === null || zapRunDetails === void 0 ? void 0 : zapRunDetails.zap.actions.find((x) => x.sortingOrder === stage);
                console.log(currentAction);
                if (!currentAction) {
                    console.log("Current action not found");
                    return;
                }
                if (currentAction.type.id === "email") {
                    console.log("sending email");
                    console.log(currentAction.metadata);
                    if (currentAction.metadata != null)
                        yield (0, email_1.sendEmail)(currentAction.metadata);
                }
                if (currentAction.type.id === "Google Sheet") {
                    console.log("googlesheet");
                    // await appendRow("1", currentAction.metadata);
                }
                if (currentAction.type.id === "Google Calender") {
                    console.log("📅 Creating Google Calendar event");
                    console.log("..................................");
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
                yield new Promise(r => setTimeout(r, 1000));
                const zapId = (_e = message.value) === null || _e === void 0 ? void 0 : _e.toString();
                const lastStage = (((_f = zapRunDetails === null || zapRunDetails === void 0 ? void 0 : zapRunDetails.zap.actions) === null || _f === void 0 ? void 0 : _f.length) || 1) - 1;
                if (lastStage !== stage) {
                    yield producer.send({
                        topic: TOPIC_NAME,
                        messages: [{
                                value: JSON.stringify({
                                    stage: stage + 1,
                                    zapRunId
                                })
                            }]
                    });
                }
                console.log("processing done");
                yield consumer.commitOffsets([{
                        topic: TOPIC_NAME,
                        partition: partition,
                        offset: (parseInt(message.offset) + 1).toString()
                    }]);
            })
        });
    });
}
main();
