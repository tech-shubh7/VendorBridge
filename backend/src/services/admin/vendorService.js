import db from "../../models/index.js";
import AppError from "../../utils/appError.js";
import STATUS_CODES from "../../config/constants.js";
import config from "../../config/app.js";
import sendEmail from "../../utils/email.js";
import getEmailHtml from "../../utils/getEmailHtml.js";

const toTitleCase = (str) =>
    str
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

const SAFE_VENDOR_ATTRIBUTES = [
    "id", "company_name", "category", "contact_person", "email", "phone", "gst_number", "address", "city", "state", "rating", "notes", "user_id", "created_at", "updated_at"
];

const vendorService = {

    async index(page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const { count, rows } = await db.Vendor.findAndCountAll({
            attributes: SAFE_VENDOR_ATTRIBUTES,
            limit,
            offset,
            order: [["created_at", "DESC"]],
        });

        return {
            vendors: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit),
            },
        };
    },

    async store(name, email, password, role) {
        const normalizedEmail = email.toLowerCase().trim();
        const capitalizedName = toTitleCase(name);

        const existingvendor = await db.Vendor.findOne({ where: { email: normalizedEmail } });
        if (existingvendor) {
            throw new AppError("A vendor with this email already exists.", STATUS_CODES.BAD_REQUEST);
        }

        const createPayload = {
            company_name: capitalizedName,
            contact_person: capitalizedName,
            email: normalizedEmail,
            role: "vendor"
        };

        const vendor = await db.Vendor.create(createPayload);

        const loginLink = `${config.base_url}/auth/login`;

        const html = await getEmailHtml("account-creation", {
            vendorname: vendor.company_name,
            email: vendor.email,
            password,
            loginLink,
        });
        await sendEmail({
            to: vendor.email,
            subject: "Your Account Has Been Created - Vendor Bridge App",
            html,
        });

        return vendor.toJSON();
    },

    async show(vendorId) {
        const vendor = await db.Vendor.findByPk(vendorId, {
            attributes: SAFE_VENDOR_ATTRIBUTES,
        });

        if (!vendor) {
            throw new AppError("vendor not found.", STATUS_CODES.NOT_FOUND);
        }

        return vendor.toJSON();
    },

    async update(vendorId, data = {}) {
        const {
            name,
            email,
            password,
            role
        } = data;
        const vendor = await db.Vendor.findByPk(vendorId);

        if (!vendor) {
            throw new AppError("vendor not found.", STATUS_CODES.NOT_FOUND);
        }

        const updatePayload = {};

        if (name !== undefined && name !== null) {
            updatePayload.company_name = toTitleCase(name);
        }

        if (email !== undefined && email !== null) {
            const normalizedEmail = email.toLowerCase().trim();
            if (normalizedEmail !== vendor.email) {
                const existing = await db.Vendor.findOne({ where: { email: normalizedEmail } });
                if (existing && existing.id !== vendor.id) {
                    throw new AppError("This email is already registered.", STATUS_CODES.BAD_REQUEST);
                }
            }
            updatePayload.email = email.toLowerCase().trim();
        }

        if (role !== undefined && role !== null) {
            updatePayload.role = role;
        }

        await vendor.update(updatePayload);

        return vendor.toJSON();
    },

    async destroy(vendorId) {
        const vendor = await db.Vendor.findByPk(vendorId);

        if (!vendor) {
            throw new AppError("vendor not found.", STATUS_CODES.NOT_FOUND);
        }

        await vendor.destroy();

        return vendor.toJSON();
    },
};

export default vendorService;