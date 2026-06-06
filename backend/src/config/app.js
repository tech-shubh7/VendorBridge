import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const config = {
    db: {
        host: process.env.DEV_DB_HOST,
        user: process.env.DEV_DB_USER,
        pass: process.env.DEV_DB_PASSWORD,
        name: process.env.DEV_DB_NAME,
        port: process.env.DEV_DB_PORT
    },
};

export default config;