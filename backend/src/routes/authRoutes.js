import express from "express";
import * as AuthController from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import loginSchema from "../validations/loginValidation.js";
import registerSchema from "../validations/registerValidation.js";

const router = express.Router();


router.post("/register", validate(registerSchema), AuthController.register);

router.post("/login", validate(loginSchema), AuthController.login);

export default router;