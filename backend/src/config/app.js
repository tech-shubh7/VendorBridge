import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const config = {
    port: process.env.PORT,
    app_name: process.env.APP_NAME || 'Vendor Bridge App',
    base_url: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
    env: process.env.NODE_ENV || 'development',
    allowed_origins: process.env.ALLOWED_ORIGINS,
    jwt_secret: process.env.JWT_SECRET,
    jwt_expires_in: process.env.JWT_EXPIRES_IN,
    db: {
        host: process.env.DEV_DB_HOST,
        user: process.env.DEV_DB_USER,
        pass: process.env.DEV_DB_PASSWORD,
        name: process.env.DEV_DB_NAME,
        port: process.env.DEV_DB_PORT
    },
};

export default config;