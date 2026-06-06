import Joi from "joi";

export const adminCreateVendorSchema = Joi.object({
    company_name: Joi.string().trim().min(2).max(255).required().messages({
        "any.required": "Company name is required.",
        "string.empty": "Company name is required.",
    }),
    contact_person: Joi.string().trim().min(2).max(255).required().messages({
        "any.required": "Contact person is required.",
        "string.empty": "Contact person is required.",
    }),
    email: Joi.string().trim().email().lowercase().required().messages({
        "any.required": "Email is required.",
        "string.empty": "Email is required.",
        "string.email": "Please provide a valid email address.",
    }),
    phone: Joi.string().trim().pattern(/^\+?[\d\s\-().]{7,20}$/).optional().allow(""),
    category: Joi.string().trim().max(100).optional().allow(""),
    gst_number: Joi.string().trim().uppercase().pattern(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/).optional().allow(""),
    address: Joi.string().trim().max(1000).optional().allow(""),
    city: Joi.string().trim().max(100).optional().allow(""),
    state: Joi.string().trim().max(100).optional().allow(""),
    notes: Joi.string().trim().max(2000).optional().allow("")
});

export const adminUpdateVendorSchema = Joi.object({
    company_name: Joi.string().trim().min(2).max(255).optional(),
    contact_person: Joi.string().trim().min(2).max(255).optional(),
    email: Joi.string().trim().email().lowercase().optional(),
    phone: Joi.string().trim().pattern(/^\+?[\d\s\-().]{7,20}$/).optional().allow(""),
    category: Joi.string().trim().max(100).optional().allow(""),
    gst_number: Joi.string().trim().uppercase().pattern(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/).optional().allow(""),
    address: Joi.string().trim().max(1000).optional().allow(""),
    city: Joi.string().trim().max(100).optional().allow(""),
    state: Joi.string().trim().max(100).optional().allow(""),
    notes: Joi.string().trim().max(2000).optional().allow("")
});
