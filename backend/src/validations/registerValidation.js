import Joi from "joi";

const SELF_REGISTER_ROLES = ["procurement_officer", "manager", "vendor"];

const baseFields = {
    name: Joi.string().trim().min(2).max(255).required().messages({
        "string.min": "Name must be at least 2 characters.",
        "string.max": "Name must be at most 255 characters.",
        "any.required": "Name is required.",
        "string.empty": "Name is required.",
    }),

    email: Joi.string().trim().email().lowercase().required().messages({
        "string.email": "Please provide a valid email address.",
        "any.required": "Email is required.",
        "string.empty": "Email is required.",
    }),

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

    role: Joi.string()
        .valid(...SELF_REGISTER_ROLES)
        .required()
        .messages({
            "any.only": `Role must be one of: ${SELF_REGISTER_ROLES.join(", ")}.`,
            "any.required": "Role is required.",
            "string.empty": "Role is required.",
        }),
};

const vendorFields = {
    company_name: Joi.string().trim().min(2).max(255).required().messages({
        "string.min": "Company name must be at least 2 characters.",
        "string.max": "Company name must be at most 255 characters.",
        "any.required": "Company name is required.",
        "string.empty": "Company name is required.",
    }),

    contact_person: Joi.string().trim().min(2).max(255).required().messages({
        "string.min": "Contact person name must be at least 2 characters.",
        "any.required": "Contact person is required for vendor registration.",
        "string.empty": "Contact person is required.",
    }),

    phone: Joi.string()
        .trim()
        .pattern(/^\+?[\d\s\-().]{7,20}$/)
        .required()
        .messages({
            "string.pattern.base": "Please provide a valid phone number (7–20 digits).",
            "any.required": "Phone number is required for vendor registration.",
            "string.empty": "Phone number is required.",
        }),

    category: Joi.string().trim().max(100).optional().allow("").messages({
        "string.max": "Category must be at most 100 characters.",
    }),

    gst_number: Joi.string()
        .trim()
        .uppercase()
        .pattern(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/)
        .optional()
        .allow("")
        .messages({
            "string.pattern.base":
                "GST number format is invalid. Expected 15-character GSTIN (e.g. 29AABCD1234E1Z5).",
        }),

    address: Joi.string().trim().max(1000).optional().allow(""),
    city: Joi.string().trim().max(100).optional().allow(""),
    state: Joi.string().trim().max(100).optional().allow(""),
    notes: Joi.string().trim().max(2000).optional().allow(""),
};

const registerSchema = (req) => {
    const role = req.body?.role;

    if (role === "vendor") {
        return Joi.object({ ...baseFields, ...vendorFields });
    }

    return Joi.object({ ...baseFields });
};

export default registerSchema;
