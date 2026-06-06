import logger from "../../config/logger";


export const index = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(10, Math.max(1, parseInt(req.query.limit, 10) || 10));

        const response = await vendorService.index(page, limit);

        return successResponse({
            res,
            statusCode: STATUS_CODES.SUCCESS,
            message: "Vendors fetched successfully.",
            data: response,
        });
    } catch (error) {
        logger.error(`admin vendor index error: ${error.message}`);
        next(error);
    }
};

export const store = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        const response = await vendorService.store(name, email, password, role);

        return successResponse({
            res,
            statusCode: STATUS_CODES.CREATED,
            message: "Vendor created successfully.",
            data: response,
        });
    } catch (error) {
        logger.error(`admin vendor store error: ${error.message}`);
        next(error);
    }
};

export const show = async (req, res, next) => {
    try {
        const vendorId = req.params.id;

        const response = await vendorService.show(vendorId);

        return successResponse({
            res,
            statusCode: STATUS_CODES.SUCCESS,
            message: "Vendor fetched successfully.",
            data: response,
        });
    } catch (error) {
        logger.error(`admin vendor show error: ${error.message}`);
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const vendorId = req.params.id;
        const { name, email, password, role } = req.body;

        const response = await vendorService.update(vendorId, { name, email, password, role });

        return successResponse({
            res,
            statusCode: STATUS_CODES.SUCCESS,
            message: "Vendor updated successfully.",
            data: response,
        });
    } catch (error) {
        logger.error(`admin vendor update error: ${error.message}`);
        next(error);
    }
};

export const destroy = async (req, res, next) => {
    try {
        const vendorId = req.params.id;

        const response = await vendorService.destroy(vendorId);

        return successResponse({
            res,
            statusCode: STATUS_CODES.SUCCESS,
            message: "Vendor deleted successfully.",
            data: response,
        });
    } catch (error) {
        logger.error(`admin vendor destroy error: ${error.message}`);
        next(error);
    }
};
