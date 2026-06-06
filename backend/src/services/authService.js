import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/app.js";
import STATUS_CODES from "../config/constants.js";
import db from "../models/index.js";
import AppError from "../utils/appError.js";
import sendEmail from "../utils/email.js";
import getEmailHtml from "../utils/getEmailHtml.js";

const toTitleCase = (str) =>
    str
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

const authService = {
    async register(data) {
        const {
            name,
            email,
            password,
            role,
            company_name,
            contact_person,
            phone,
            category,
            gst_number,
            address,
            city,
            state,
            notes,
        } = data;

        const normalizedEmail = email.toLowerCase().trim();

        if (role === "admin") {
            throw new AppError(
                "Admin accounts cannot be self-registered.",
                STATUS_CODES.FORBIDDEN
            );
        }

        const existingUser = await db.User.findOne({
            where: { email: normalizedEmail },
            paranoid: false,
        });

        if (existingUser && !existingUser.deleted_at) {
            throw new AppError(
                "An account with this email already exists.",
                STATUS_CODES.CONFLICT
            );
        }

        if (role === "vendor") {
            const existingVendor = await db.Vendor.findOne({
                where: { email: normalizedEmail },
                paranoid: false,
            });

            if (existingVendor && !existingVendor.deleted_at) {
                throw new AppError(
                    "A vendor profile with this email already exists.",
                    STATUS_CODES.CONFLICT
                );
            }
        }

        const result = await db.sequelize.transaction(async (t) => {
            const user = await db.User.create(
                {
                    name: toTitleCase(name),
                    email: normalizedEmail,
                    password,
                    role,
                    status: "pending",
                    is_active: true,
                },
                { transaction: t }
            );

            let vendorProfile = null;
            if (role === "vendor") {
                vendorProfile = await db.Vendor.create(
                    {
                        company_name: toTitleCase(company_name),
                        category: category || null,
                        contact_person: toTitleCase(contact_person),
                        email: normalizedEmail,
                        phone: phone || null,
                        gst_number: gst_number ? gst_number.toUpperCase() : null,
                        address: address || null,
                        city: city || null,
                        state: state || null,
                        notes: notes || null,
                        user_id: user.id,
                    },
                    { transaction: t }
                );
            }

            return { user, vendorProfile };
        });

        const responseData = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            status: result.user.status,
        };

        if (result.vendorProfile) {
            responseData.vendor_id = result.vendorProfile.id;
            responseData.company_name = result.vendorProfile.company_name;
        }

        const message =
            role === "vendor"
                ? "Vendor account created. Please wait for admin approval before logging in."
                : "Account created successfully. Please wait for admin approval before logging in.";

        return { message, account: responseData };
    },

    async login(data) {
        const { email, password } = data;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await db.User.findOne({
            where: { email: normalizedEmail },
            paranoid: false,
        });

        if (!user) {
            throw new AppError("Invalid credentials.", STATUS_CODES.UNAUTHORIZED);
        }

        if (user.deleted_at) {
            throw new AppError(
                "This account no longer exists. Please contact support.",
                STATUS_CODES.FORBIDDEN
            );
        }

        if (!user.is_active) {
            throw new AppError(
                "Your account has been blocked. Please contact support.",
                STATUS_CODES.FORBIDDEN
            );
        }

        if (user.status === "pending") {
            throw new AppError(
                "Your account is pending admin approval. You will be notified once approved.",
                STATUS_CODES.FORBIDDEN
            );
        }

        if (user.status === "rejected") {
            throw new AppError(
                "Your account application has been rejected. Please contact support.",
                STATUS_CODES.FORBIDDEN
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new AppError("Invalid credentials.", STATUS_CODES.UNAUTHORIZED);
        }

        if (!config.jwt_secret) {
            throw new AppError(
                "Server configuration error. Please contact support.",
                STATUS_CODES.INTERNAL_SERVER_ERROR
            );
        }

        const payload = {
            user_id: user.id,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, config.jwt_secret, {
            expiresIn: config.jwt_expires_in || "15m",
        });

        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
        };

        return { user: safeUser, token };
    },

    async forgotPassword({ email }) {
        const normalizedEmail = email.toLowerCase().trim();

        const user = await db.User.findOne({ where: { email: normalizedEmail } });

        if (!user) {
            return { message: "If that email exists, a reset link has been sent." };
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + config.password_reset_expires_minutes * 60 * 1000);

        const existingRecord = await db.PasswordResetToken.findOne({ where: { user_id: user.id } });

        if (existingRecord) {
            await existingRecord.update({ token: rawToken, expires_at: expiresAt });
        } else {
            await db.PasswordResetToken.create({ user_id: user.id, token: rawToken, expires_at: expiresAt });
        }

        const resetLink = `${config.frontend_url}/auth/reset-password/${rawToken}`;

        const html = await getEmailHtml("forgot-password", {
            name: user.name,
            resetLink,
            expiryTime: `${config.password_reset_expires_minutes} minutes`,
        });

        await sendEmail({
            to: user.email,
            subject: "Reset Your VendorBridge Password",
            html,
        });

        return { message: "If that email exists, a reset link has been sent." };
    },

    async resetPassword({ token, password }) {
        const record = await db.PasswordResetToken.findOne({ where: { token } });

        if (!record) {
            throw new AppError("Invalid or expired reset token.", STATUS_CODES.BAD_REQUEST);
        }

        if (new Date() > new Date(record.expires_at)) {
            await record.destroy();
            throw new AppError("Reset token has expired. Please request a new one.", STATUS_CODES.BAD_REQUEST);
        }

        const user = await db.User.findByPk(record.user_id);

        if (!user) {
            await record.destroy();
            throw new AppError("User not found.", STATUS_CODES.NOT_FOUND);
        }

        await user.update({ password });
        await record.destroy();

        return { message: "Password has been reset successfully. You can now log in with your new password." };
    },

    async getMe(userId) {
        const user = await db.User.findByPk(userId, {
            include: [{ model: db.Vendor }],
        });

        if (!user) {
            throw new AppError("User not found.", STATUS_CODES.NOT_FOUND);
        }

        return user;
    },
};

export default authService;