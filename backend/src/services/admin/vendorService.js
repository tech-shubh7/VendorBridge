

const SAFE_VENDOR_ATTRIBUTES = [
    "id", "name", "email", "role",
    "avatar", "identity_proofs",
    "is_email_verified", "is_approved", "is_active",
    "created_at", "updated_at",
];

const vendorService = {

    async index(page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const { count, rows } = await db.Vendor.findAndCountAll({
            where: { role: "vendor" },
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
            name: capitalizedName,
            email: normalizedEmail,
            password,
            is_email_verified: true,
            is_approved: 1,
            role: "vendor"
        };

        const vendor = await db.Vendor.create(createPayload);

        const loginLink = `${config.base_url}/auth/login`;

        const html = await getEmailHtml("account-creation", {
            vendorname: vendor.name,
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

    /**
     * Fetch a single vendor by primary key — whitelisted attributes only.
     */
    async show(vendorId) {
        const vendor = await db.Vendor.findByPk(vendorId, {
            attributes: SAFE_VENDOR_ATTRIBUTES,
        });

        if (!vendor) {
            throw new AppError("vendor not found.", STATUS_CODES.NOT_FOUND);
        }

        return vendor.toJSON();
    },

    /**
     * Partially update a vendor's profile.
     * Only fields present in the payload are updated.
     * @param {string} vendorId
     * @param {{ name?, email?, password?, role? }} fields
     */
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
            updatePayload.name = toTitleCase(name);
        }

        if (email !== undefined && email !== null) {
            const normalizedEmail = email.toLowerCase().trim();
            if (normalizedEmail !== vendor.email) {
                const existing = await db.vendor.findOne({ where: { email: normalizedEmail } });
                if (existing && existing.id !== vendor.id) {
                    throw new AppError("This email is already registered.", STATUS_CODES.BAD_REQUEST);
                }
            }
            updatePayload.email = email.toLowerCase().trim();
        }

        if (password !== undefined && password !== null) {
            updatePayload.password = password;
        }

        if (role !== undefined && role !== null) {
            updatePayload.role = role;
        }

        await vendor.update(updatePayload);

        return vendor.toJSON();
    },

    /**
     * Soft-delete a vendor by setting is_deleted = true.
     */
    async destroy(vendorId) {
        const vendor = await db.vendor.findByPk(vendorId);

        if (!vendor) {
            throw new AppError("vendor not found.", STATUS_CODES.NOT_FOUND);
        }

        if (vendor.role === "admin") {
            throw new AppError("admin cannot be deleted", STATUS_CODES.FORBIDDEN);
        }

        await vendor.destroy();

        return vendor.toJSON();
    },
};

export default vendorService;