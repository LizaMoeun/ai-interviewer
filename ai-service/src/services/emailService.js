const nodemailer = require("nodemailer");

function getTransporter() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
        throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD are required to send email.");
    }
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
}

async function sendVerificationEmail({ email, name, token }) {
    const frontendOrigin = process.env.FRONTEND_ORIGIN?.split(",")[0]?.trim();
    if (!frontendOrigin) throw new Error("FRONTEND_ORIGIN is required for verification links.");
    const verificationUrl = `${frontendOrigin}/verify-email?token=${encodeURIComponent(token)}`;
    await getTransporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: "Verify your InterviewAI email",
        text: `Hi ${name}, verify your InterviewAI account here: ${verificationUrl}`,
        html: `<p>Hi ${name},</p><p><a href="${verificationUrl}">Verify your InterviewAI email address</a></p><p>This link expires in 24 hours.</p>`,
    });
}

module.exports = { sendVerificationEmail };