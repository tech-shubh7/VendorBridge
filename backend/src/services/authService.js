import bcrypt from "bcrypt";
import config from "../config/app";
import STATUS_CODES from "../config/constants";
import db from "../models/index.js";
import AppError from "../utils/appError";

const authService = {

    async register(data) {

    },

    async login(data) {
        const {
            email,
            password
        } = data;

        const user = db.User.findOne({
            where: {
                email
            }
        });

        if (!user) {
            throw new AppError("Invalid credentials", STATUS_CODES.BAD_REQUEST);
        }

        if (user.deleted_at) {
            throw new AppError("This account no longer exists.", STATUS_CODES.FORBIDDEN);
        }

        if (!user.is_active) {
            throw new AppError("Your account has been blocked by admin. Please contact support.", STATUS_CODES.FORBIDDEN);
        }

        if (user.status === "pending") {
            throw new AppError("Your account is under review. Please wait for admin approval.", STATUS_CODES.FORBIDDEN);
        }

        if (user.is_approved === "rejected") {
            throw new AppError("Your account application has been rejected by admin.", STATUS_CODES.FORBIDDEN);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new AppError("Invalid credentials", STATUS_CODES.BAD_REQUEST);
        }

        const payload = {
            user_id: user.id,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(payload, config.jwt_secret, {
            expiresIn: config.jwt_expires_in
        });

        return { user, token };

    },

};

export default authService;