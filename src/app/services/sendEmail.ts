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

export async function sendEmailGroup(
  to: string[],
  cc: string[],
  cco: string[],
  subject: string,
  text: string,
  html?: string,
  replyTo?: string | string[]
) {
  try {
    // Filtra arrays vazios para não enviar campos desnecessários
    const mailOptions: nodemailer.SendMailOptions = {
      from: `${NOME_LOJA} <${EMAIL_USER}>`,
      subject,
      text,
    };

    //verificar se exite ao menos um destinatário
    if (to.length < 1 && cc.length < 1 && cco.length < 1) {
      throw new Error("Não é possível enviar e-mail sem destinatários");
    }

    // Adiciona destinatários apenas se houver
    if (to && to.length > 0) {
      mailOptions.to = to;
    }

    // Adiciona CC apenas se houver
    if (cc && cc.length > 0) {
      mailOptions.cc = cc;
    }

    // Adiciona CCO (BCC no nodemailer) apenas se houver
    if (cco && cco.length > 0) {
      mailOptions.bcc = cco;
    }

    // Adiciona Reply-To se fornecido
    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    // Adiciona HTML apenas se fornecido
    if (html) {
      mailOptions.html = html;
    }

    await transporter.sendMail(mailOptions);

    const recipients = [...(to || []), ...(cc || []), ...(cco || [])];
    console.log(`✅ E-mail enviado para: ${recipients.join(", ")}`);
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    throw new Error("Erro ao enviar e-mail");
  }
}
