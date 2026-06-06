import STATUS_CODES from "../../config/constants.js";
import db from "../../models/index.js";
import AppError from "../../utils/appError.js";

const toTitleCase = (str) =>
    str
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

const userService = {
    async listUsers(query) {
        const {
            page = 1,
            limit = 10,
            role,
            status,
            is_active,
            search,
            sortBy = "created_at",
            sortOrder = "DESC",
        } = query;

        const limitVal = parseInt(limit, 10);
        const offsetVal = (parseInt(page, 10) - 1) * limitVal;

        const whereClause = {};

        if (role) {
            whereClause.role = role;
        }
        if (status) {
            whereClause.status = status;
        }
        if (is_active !== undefined) {
            whereClause.is_active = is_active === "true" || is_active === true;
        }

        if (search) {
            const Op = db.Sequelize.Op;
            const searchPattern = `%${search.trim()}%`;
            whereClause[Op.or] = [
                { name: { [Op.iLike]: searchPattern } },
                { email: { [Op.iLike]: searchPattern } },
            ];
        }

        const { count, rows } = await db.User.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.Vendor,
                },
            ],
            limit: limitVal,
            offset: offsetVal,
            order: [[sortBy, sortOrder.toUpperCase()]],
            distinct: true,
        });

        return {
            users: rows,
            total: count,
            page: parseInt(page, 10),
            limit: limitVal,
            totalPages: Math.ceil(count / limitVal),
        };
    },

    async createUser(data) {
        const {
            name,
            email,
            password,
            role,
            company_name,
            contact_person,
            phone,
            category,
            gst_number,
            address,
            city,
            state,
            notes,
        } = data;

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await db.User.findOne({
            where: { email: normalizedEmail },
            paranoid: false,
        });

        if (existingUser && !existingUser.deleted_at) {
            throw new AppError("An account with this email already exists.", STATUS_CODES.CONFLICT);
        }

        if (role === "vendor") {
            const existingVendor = await db.Vendor.findOne({
                where: { email: normalizedEmail },
                paranoid: false,
            });

            if (existingVendor && !existingVendor.deleted_at) {
                throw new AppError("A vendor profile with this email already exists.", STATUS_CODES.CONFLICT);
            }
        }

        const result = await db.sequelize.transaction(async (t) => {
            const user = await db.User.create(
                {
                    name: toTitleCase(name),
                    email: normalizedEmail,
                    password,
                    role,
                    status: "approved",
                    is_active: true,
                },
                { transaction: t }
            );

            let vendorProfile = null;
            if (role === "vendor") {
                vendorProfile = await db.Vendor.create(
                    {
                        company_name: toTitleCase(company_name),
                        category: category || null,
                        contact_person: toTitleCase(contact_person),
                        email: normalizedEmail,
                        phone: phone || null,
                        gst_number: gst_number ? gst_number.toUpperCase() : null,
                        address: address || null,
                        city: city || null,
                        state: state || null,
                        notes: notes || null,
                        user_id: user.id,
                    },
                    { transaction: t }
                );
            }

            return { user, vendorProfile };
        });

        const userJson = result.user.toJSON();
        if (result.vendorProfile) {
            userJson.Vendor = result.vendorProfile.toJSON();
        }

        return userJson;
    },

    async getUserById(id) {
        const user = await db.User.findByPk(id, {
            include: [{ model: db.Vendor }],
        });

        if (!user) {
            throw new AppError("User not found.", STATUS_CODES.NOT_FOUND);
        }

        return user.toJSON();
    },

    async updateUser(id, data) {
        const user = await db.User.findByPk(id, {
            include: [{ model: db.Vendor }],
        });

        if (!user) {
            throw new AppError("User not found.", STATUS_CODES.NOT_FOUND);
        }

        if (data.email) {
            const normalizedEmail = data.email.toLowerCase().trim();
            if (normalizedEmail !== user.email) {
                const existingUser = await db.User.findOne({
                    where: { email: normalizedEmail },
                    paranoid: false,
                });
                if (existingUser && !existingUser.deleted_at) {
                    throw new AppError("An account with this email already exists.", STATUS_CODES.CONFLICT);
                }

                if (user.role === "vendor" || data.role === "vendor") {
                    const existingVendor = await db.Vendor.findOne({
                        where: { email: normalizedEmail },
                        paranoid: false,
                    });
                    if (existingVendor && !existingVendor.deleted_at) {
                        throw new AppError("A vendor profile with this email already exists.", STATUS_CODES.CONFLICT);
                    }
                }
            }
        }

        const result = await db.sequelize.transaction(async (t) => {
            const userUpdatePayload = {};
            if (data.name) userUpdatePayload.name = toTitleCase(data.name);
            if (data.email) userUpdatePayload.email = data.email.toLowerCase().trim();
            if (data.password) userUpdatePayload.password = data.password;
            if (data.role) userUpdatePayload.role = data.role;
            if (data.is_active !== undefined) userUpdatePayload.is_active = data.is_active;
            if (data.status) userUpdatePayload.status = data.status;

            await user.update(userUpdatePayload, { transaction: t });

            const currentRole = data.role || user.role;
            let vendorProfile = null;

            if (currentRole === "vendor") {
                let vendor = await db.Vendor.findOne({
                    where: { user_id: user.id },
                    transaction: t,
                });

                const vendorPayload = {};
                if (data.company_name) vendorPayload.company_name = toTitleCase(data.company_name);
                if (data.contact_person) vendorPayload.contact_person = toTitleCase(data.contact_person);
                if (data.email) vendorPayload.email = data.email.toLowerCase().trim();
                if (data.phone) vendorPayload.phone = data.phone;
                if (data.category) vendorPayload.category = data.category;
                if (data.gst_number) vendorPayload.gst_number = data.gst_number.toUpperCase();
                if (data.address) vendorPayload.address = data.address;
                if (data.city) vendorPayload.city = data.city;
                if (data.state) vendorPayload.state = data.state;
                if (data.notes) vendorPayload.notes = data.notes;

                if (!vendor) {
                    vendorProfile = await db.Vendor.create(
                        {
                            company_name: vendorPayload.company_name || toTitleCase(data.name || user.name),
                            contact_person: vendorPayload.contact_person || toTitleCase(data.name || user.name),
                            email: vendorPayload.email || user.email,
                            phone: vendorPayload.phone || null,
                            category: vendorPayload.category || null,
                            gst_number: vendorPayload.gst_number || null,
                            address: vendorPayload.address || null,
                            city: vendorPayload.city || null,
                            state: vendorPayload.state || null,
                            notes: vendorPayload.notes || null,
                            user_id: user.id,
                        },
                        { transaction: t }
                    );
                } else {
                    await vendor.update(vendorPayload, { transaction: t });
                    vendorProfile = vendor;
                }
            }

            return { user, vendorProfile };
        });

        const updatedUser = await db.User.findByPk(id, {
            include: [{ model: db.Vendor }],
        });

        return updatedUser.toJSON();
    },

    async deleteUser(id) {
        const user = await db.User.findByPk(id);

        if (!user) {
            throw new AppError("User not found.", STATUS_CODES.NOT_FOUND);
        }

        await db.sequelize.transaction(async (t) => {
            await user.destroy({ transaction: t });

            if (user.role === "vendor") {
                await db.Vendor.destroy({
                    where: { user_id: id },
                    transaction: t,
                });
            }
        });

        return { message: "User deleted successfully." };
    },

    async manageApprovalStatus(id, status) {
        const user = await db.User.findByPk(id);

        if (!user) {
            throw new AppError("User not found.", STATUS_CODES.NOT_FOUND);
        }

        if (user.status !== "pending") {
            throw new AppError("Approval action already taken for this account", STATUS_CODES.BAD_REQUEST);
        }

        if (!["approved", "rejected"].includes(status)) {
            throw new AppError("Approval status must be 'approved' or 'rejected'.", STATUS_CODES.BAD_REQUEST);
        }

        if (status === "approved") {
            await user.update({ status: "approved" });
        } else {
            await user.update({ status: "rejected" });
        }

        return user.toJSON();
    },

    async manageAccountStatus(userId, status) {
        const user = await db.User.findByPk(userId);

        if (!user) {
            throw new AppError("User not found.", STATUS_CODES.NOT_FOUND);
        }

        if (status === "unblocked" && user.is_active === true) {
            throw new AppError("User is already unblocked", STATUS_CODES.BAD_REQUEST);
        }
        if (status === "blocked" && user.is_active === false) {
            throw new AppError("User is already blocked", STATUS_CODES.BAD_REQUEST);
        }

        if (!["blocked", "unblocked"].includes(status)) {
            throw new AppError("Account status must be 'blocked' or 'unblocked'.", STATUS_CODES.BAD_REQUEST);
        }

        if (status === "blocked") {
            await user.update({ is_active: false });
        } else {
            await user.update({ is_active: true });
        }

        return user.toJSON();
    },
};

export default userService;