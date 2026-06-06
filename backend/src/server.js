import app from './app.js';
import config from './config/app.js';
import logger from './config/logger.js';
import db from "./models/index.js";

const PORT = config.port || 7000;

let server;
let isShuttingDown = false;

/**
 * Central Shutdown Handler
 */
const shutdown = async (reason, error = null) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    try {
        if (error) {
            console.error(reason, error);
            logger.error(reason);
            logger.error(error.stack || error);
        } else {
            logger.info(reason);
        }

        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }

        await db.sequelize.close();

        logger.info('Shutdown complete');

        setTimeout(() => process.exit(error ? 1 : 0), 300);
    } catch (err) {
        console.error("FORCED SHUTDOWN", err);
        process.exit(1);
    }
}

/**
 * Global Exception Handlers
 */
process.on('uncaughtException', (error) => {
    shutdown('UNCAUGHT EXCEPTION! Shutting down...', error);
});

process.on('unhandledRejection', (reason) => {
    shutdown('UNHANDLED REJECTION! Shutting down...', reason);
});

/**
 * Server Start Logic
 */
const startServer = async () => {
    try {
        await db.sequelize.authenticate();
        logger.info(`Database connected successfully`);
        server = app.listen(PORT, () => {
            logger.info(`Server is running on http://localhost:${PORT}`);
            logger.info(`Environment: ${config.env}`);
            logger.info(`Application Name: ${config.app_name}`);
        });

    } catch (error) {
        await shutdown('Failed to start server', error);
    }
};

startServer();

/**
 * Graceful Shutdown Signals
 */
process.on('SIGTERM', () => shutdown('SIGTERM RECEIVED'));
process.on('SIGINT', () => shutdown('SIGINT RECEIVED'));