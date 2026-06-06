import Joi from "joi";

const loginSchema = Joi.object({
    email: Joi.string().trim().email().lowercase().required().messages({
        "string.email": "Please provide a valid email address.",
        "any.required": "Email is required.",
        "string.empty": "Email is required.",
    }),

    password: Joi.string().min(1).required().messages({
        "any.required": "Password is required.",
        "string.empty": "Password is required.",
    }),
});

export default loginSchema;
