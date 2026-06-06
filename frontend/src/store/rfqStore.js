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
}));
