import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../config/logger.js";

const __fileName = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__fileName);

const getEmailHtml = async (templateName, data) => {
    try {
        const templatePath = path.join(__dirname, `../views/emails/templates/${templateName}.ejs`);

        const html = await ejs.renderFile(templatePath, data);

        return html;
    } catch (error) {
        logger.error(`Email Template Error: ${error.message}`);
        throw error;
    }
}


export default getEmailHtml;