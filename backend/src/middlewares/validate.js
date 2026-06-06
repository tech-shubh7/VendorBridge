import STATUS_CODES from "../config/constants.js";
import AppError from "../utils/appError.js";

/**
 * Middleware to validate request body against a Joi schema.
 * If validation fails, it throws an AppError with details of the validation errors.
 * If validation passes, it calls the next middleware.
 */
export const validate = (schemaOrFactory, source = "body") => async (req, res, next) => {
    try {
        const schema = typeof schemaOrFactory === "function" ? schemaOrFactory(req) : schemaOrFactory;

        const payload = req[source] ?? {};
        const validatedData = await schema.validateAsync(payload, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
            errors: { label: "key" }
        });
        req[source] = validatedData;
        next();
    } catch (error) {
        if (error.isJoi) {
            const fieldErrors = {};
            error.details.forEach((detail) => {
                const field = detail.path.join(".");
                if (!fieldErrors[field]) {
                    if (detail.type === "string.multi" && Array.isArray(detail.context?.messages)) {
                        fieldErrors[field] = detail.context.messages.join(" ");
                    } else {
                        fieldErrors[field] = detail.message.replace(/"/g, "");
                    }
                }
            });

            const appError = new AppError("Validation failed.", STATUS_CODES.UNPROCESSABLE_ENTITY);
            appError.errors = fieldErrors;
            return next(appError);
        }

        next(error);
    }
};