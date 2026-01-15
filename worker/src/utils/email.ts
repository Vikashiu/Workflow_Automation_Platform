// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

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

import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config(); 


export async function sendEmail(metadata: { email: string; body: string }) {
  const resend = new Resend(process.env.RESEND_KEY);
  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: metadata.email,
      subject: 'Hello from Zap',
      html: `<strong>${metadata.body}</strong>`,
    });

    console.log('Email sent:', response);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
