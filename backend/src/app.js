import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import config from "./config/app.js";
import STATUS_CODES from "./config/constants.js";
import errorHandler from "./middlewares/errorHandler.js";
import appRoutes from "./routes/index.js";
import AppError from "./utils/appError.js";

const allowedOrigins = (config.allowed_origins || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

const app = express();

// Secure HTTP Headers
app.use(helmet());

// Rate Limiting (protect against brute force attacks)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use(limiter);

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new AppError("Not allowed by CORS policy", STATUS_CODES.FORBIDDEN));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(cors(corsOptions));

// Body Parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Cookie Parsing
app.use(cookieParser());

// Compression
app.use(compression());

// app Routes
app.use("/api/v1", appRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        service: "Admin-Service",
        uptime: `${process.uptime().toFixed(0)}s`,
        timestamp: new Date().toISOString()
    });
});

// Error Handling
app.use((req, res, next) => {
    next(new AppError(`The resource ${req.originalUrl} was not found!`, STATUS_CODES.NOT_FOUND))
});

app.use(errorHandler);

export default app;
