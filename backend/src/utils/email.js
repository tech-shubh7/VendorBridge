import nodemailer from "nodemailer";
import appConfig from "../config/app.js";
import AppError from "./appError.js";
import logger from "../config/logger.js";


const transporter = nodemailer.createTransport({
    host: appConfig.email.providers.mailtrap.host,
    port: Number(appConfig.email.providers.mailtrap.port),
    secure: String(appConfig.email.providers.mailtrap.secure) === "true",
    auth: {
        user: appConfig.email.providers.mailtrap.user,
        pass: appConfig.email.providers.mailtrap.password
    },
});

const sendEmail = async ({ to, subject, html, text = "" }) => {
    if (!to || !subject || !html) {
        throw new AppError("sendEmail requires to, subject and html");
    }

    const info = await transporter.sendMail({
        from: appConfig.email.from,
        to,
        subject,
        html,
        text
    });

    logger.info(`Email sent to ${to}. MessageId: ${info.messageId}`);
    return info;
};

export default sendEmail;