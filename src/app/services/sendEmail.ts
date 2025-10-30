import nodemailer from "nodemailer";
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = Number(process.env.EMAIL_PORT);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const NOME_LOJA = process.env.NOME_LOJA;

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // SSL para porta 465, senão STARTTLS
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  try {
    await transporter.sendMail({
      from: `${NOME_LOJA} <${EMAIL_USER}>`,
      to,
      subject,
      text,
      html, // será ignorado se não for passado
    });
    console.log(`✅ E-mail enviado para: ${to}`);
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    throw new Error("Erro ao enviar e-mail");
  }
}
