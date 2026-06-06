import { create } from "zustand";
import { rfqApi } from "@/api/endpoints/rfqApi";

/**
 * RFQ Store — backed by real API
 * Manages RFQ list state, pagination, loading, and error state.
 */
export const useRFQStore = create((set) => ({
    rfqs: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    isLoading: false,
    isCreating: false,
    isPublishing: false,
    error: null,

    fetchRFQs: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
            const res = await rfqApi.getAll(params);
            const { data, pagination } = res.data;
            set({
                rfqs: data || [],
                pagination: pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
                isLoading: false,
            });
        } catch (err) {
            set({
                error: err.response?.data?.message || "Failed to load RFQs",
                isLoading: false,
            });
        }
    },

    createRFQ: async (payload) => {
        set({ isCreating: true, error: null });
        try {
            const res = await rfqApi.create(payload);
            const created = res.data?.data;
            set({ isCreating: false });
            return created;
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to create RFQ";
            set({ error: msg, isCreating: false });
            throw err;
        }
    },

    publishRFQ: async (id) => {
        set({ isPublishing: true, error: null });
        try {
            const res = await rfqApi.publish(id);
            const published = res.data?.data;
            set({ isPublishing: false });
            return published;
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to publish RFQ";
            set({ error: msg, isPublishing: false });
            throw err;
        }
    },
}));
