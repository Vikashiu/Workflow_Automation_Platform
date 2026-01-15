"use strict";
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
// dotenv.config(); // Load .env if not already loaded globally
// export async function sendEmail(metadata: { email: string; body: string }) {
//   console.log("Sending email to:", metadata.email);
//   const transporter = nodemailer.createTransport({
//     host: 'smtp.resend.com',
//     secure: true,
//     port: 465,
//     auth: {
//       user: 'resend',
//       pass: process.env.RESEND_KEY || '', // Prefer using env
//     },
//   });
//   try {
//     const info = await transporter.sendMail({
//       from: process.env.RESEND_FROM,
//       to: metadata.email,
//       subject: 'Hello World',
//       html: `<strong>${metadata.body}</strong>`,
//     });
//     console.log('Message sent:', info.messageId);
//   } catch (err: any) {
//     console.log('Failed to send email:', err);
//   }
// }
const resend_1 = require("resend");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function sendEmail(metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        const resend = new resend_1.Resend(process.env.RESEND_KEY);
        try {
            const response = yield resend.emails.send({
                from: process.env.RESEND_FROM || 'onboarding@resend.dev',
                to: metadata.email,
                subject: 'Hello from Zap',
                html: `<strong>${metadata.body}</strong>`,
            });
            console.log('Email sent:', response);
        }
        catch (error) {
            console.error('Failed to send email:', error);
        }
    });
}
