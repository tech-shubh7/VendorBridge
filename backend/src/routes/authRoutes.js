import express from "express";
import * as AuthController from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import loginSchema from "../validations/loginValidation.js";
import { forgotPasswordSchema, resetPasswordSchema } from "../validations/passwordResetValidation.js";
import registerSchema from "../validations/registerValidation.js";

const router = express.Router();

router.post("/register", validate(registerSchema), AuthController.register);
router.post("/login", validate(loginSchema), AuthController.login);
router.post("/forgot-password", validate(forgotPasswordSchema), AuthController.forgotPassword);
router.patch("/reset-password/:token", validate(resetPasswordSchema), AuthController.resetPassword);
router.post("/logout", authenticate, AuthController.logout);

export default router;