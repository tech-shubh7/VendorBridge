import Joi from "joi";

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().trim().email().lowercase().required().messages({
        "string.email": "Please provide a valid email address.",
        "any.required": "Email is required.",
        "string.empty": "Email is required.",
    }),
});

export const resetPasswordSchema = Joi.object({
    password: Joi.string()
        .min(8)
        .max(72)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])/, "password-strength")
        .required()
        .messages({
            "string.min": "Password must be at least 8 characters.",
            "string.max": "Password must be at most 72 characters.",
            "string.pattern.name": "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
            "any.required": "Password is required.",
            "string.empty": "Password is required.",
        }),

    confirm_password: Joi.any()
        .valid(Joi.ref("password"))
        .required()
        .messages({
            "any.only": "Confirm password must match password.",
            "any.required": "Confirm password is required.",
        }),
});
