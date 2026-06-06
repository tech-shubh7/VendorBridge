import nodemailer from "nodemailer";
import appConfig from "../config/app.js";
import AppError from "./appError.js";
import logger from "../config/logger.js";
import getEmailHtml from "./getEmailHtml.js";


const emailProvider = appConfig.email.provider || 'mailtrap';
const emailConfig = appConfig.email.providers[emailProvider] || appConfig.email.providers.mailtrap;

const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: Number(emailConfig.port),
    secure: String(emailConfig.secure) === "true",
    auth: {
        user: emailConfig.user,
        pass: emailConfig.password
    },
});

const FROM_ADDRESS = appConfig.email.from;



export const sendEmail = async ({ to, subject, html, text = "" }) => {
    if (!to || !subject || !html) {
        throw new AppError("sendEmail requires to, subject and html");
    }

    const info = await transporter.sendMail({
        from: FROM_ADDRESS,
        to,
        subject,
        html,
        text
    });

    logger.info(`Email sent to ${to}. MessageId: ${info.messageId}`);
    return info;
};

export const sendRfqInvitationEmail = async (to, rfqNumber, title, rfqId) => {
    const appUrl = appConfig.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
    const rfqLink = `${appUrl}/vendor/rfqs/${rfqId}`;

    const htmlContent = await getEmailHtml("rfq-invitation", {
        rfqNumber,
        title,
        rfqLink
    });

    try {
        return await sendEmail({
            to,
            subject: `New RFQ Invitation: ${rfqNumber} - ${title}`,
            html: htmlContent
        });
    } catch (error) {
        logger.error(`Failed to send RFQ email to ${to}: ${error.message}`);
        return null;
    }
};

export const sendInvoiceEmail = async (to, cc = '', invoiceNumber, pdfBuffer, customMessage = '') => {
    const subject = `Invoice ${invoiceNumber} from VendorBridge`;

    const html = await getEmailHtml("invoice-email", {
        invoiceNumber,
        customMessage
    });

    const mailOptions = {
        from: FROM_ADDRESS,
        to,
        subject,
        html,
        attachments: [
            {
                filename: `${invoiceNumber}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    };

    if (cc) mailOptions.cc = cc;

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Invoice email sent to ${to}. MessageId: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`Failed to send invoice email to ${to}: ${error.message}`);
        return null;
    }
};

export default sendEmail;