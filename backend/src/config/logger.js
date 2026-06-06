import winston from "winston";

/**
 * Logger configuration using Winston.
 * Logs messages to a file named 'application.log' with timestamps and log levels.
 */
const fileTransport = new winston.transports.File({
    filename: "application.log",
    format: winston.format.combine(
        winston.format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
});

const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
});

const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
        fileTransport,
        consoleTransport
    ],
});

export default logger;

