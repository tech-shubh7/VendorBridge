import nodemailer from "nodemailer";
import appConfig from "../config/app.js";
import AppError from "./appError.js";
import logger from "../config/logger.js";


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


export const sendEmail = async ({ to, subject, html, text = "" }) => {
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

export const sendRfqInvitationEmail = async (to, rfqNumber, title, rfqId) => {
    const appUrl = appConfig.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
    const rfqLink = `${appUrl}/vendor/rfqs/${rfqId}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E0E0E0; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">New RFQ Invitation</h2>
        <p style="color: #555; font-size: 16px;">Hello,</p>
        <p style="color: #555; font-size: 16px;">You have been invited to participate in a new Request for Quotation (RFQ) on VendorBridge.</p>
        <div style="background-color: #F9F9F9; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>RFQ Number:</strong> ${rfqNumber}</p>
          <p style="margin: 5px 0;"><strong>Title:</strong> ${title}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${rfqLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            View RFQ Details
          </a>
        </div>
        <p style="color: #777; font-size: 14px;">If the button above does not work, please copy and paste the following link into your browser:<br/><a href="${rfqLink}" style="color: #4CAF50;">${rfqLink}</a></p>
        <p style="color: #777; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Best regards,<br/>VendorBridge Procurement Team</p>
      </div>
    `;

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
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E0E0E0; border-radius: 8px;">
        <h2 style="color: #1D4ED8;">Invoice ${invoiceNumber}</h2>
        <p style="color: #555; font-size: 15px;">
          ${customMessage || 'Please find your invoice attached to this email. Kindly review and process the payment by the due date.'}
        </p>
        <p style="color: #777; font-size: 13px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 12px;">
          Best regards,<br/>VendorBridge Procurement Team
        </p>
      </div>
    `;

    const mailOptions = {
        from: appConfig.email.from,
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