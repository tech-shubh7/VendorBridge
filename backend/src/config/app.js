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
    frontend_url: process.env.FRONTEND_URL || 'http://localhost:5173',
    password_reset_expires_minutes: parseInt(process.env.PASSWORD_RESET_EXPIRES_MINUTES || '10', 10),
    db: {
        host: process.env.DEV_DB_HOST,
        user: process.env.DEV_DB_USER,
        pass: process.env.DEV_DB_PASSWORD,
        name: process.env.DEV_DB_NAME,
        port: process.env.DEV_DB_PORT
    },
    email: {
        from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
        providers: {
            mailtrap: {
                host: process.env.MAILTRAP_HOST,
                port: process.env.MAILTRAP_PORT || 2525,
                secure: process.env.MAILTRAP_SECURE === "true",
                user: process.env.MAILTRAP_USER,
                password: process.env.MAILTRAP_PASSWORD
            }
        }
    }
};

export default config;