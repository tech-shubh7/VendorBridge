import { create } from "zustand";
import { rfqApi } from "@/api/endpoints/rfqApi";

/**
 * RFQ Store — backed by real backend API
 *
 * API payload shapes:
 *   List  → { data: Rfq[], pagination: { page, limit, total, totalPages } }
 *   Detail → { rfq: Rfq & { RfqItems, RfqVendors }, quotation_count }
 *   Create → POST body: { title, description, deadline, items, vendor_ids }
 *   Publish → PATCH /rfqs/:id/publish
 */
export const useRFQStore = create((set, get) => ({
    // ── State ────────────────────────────────────────────────────────────────
    rfqs: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    selectedRFQ: null,

    isLoading: false,
    isCreating: false,
    isPublishing: false,
    error: null,

    // ── Fetch List ────────────────────────────────────────────────────────────
    fetchRFQs: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await rfqApi.getAll(params);
            const { data, pagination } = response.data;
            set({ rfqs: data ?? [], pagination: pagination ?? get().pagination });
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to load RFQs.";
            set({ error: message });
        } finally {
            set({ isLoading: false });
        }
    },

    // ── Fetch Single ──────────────────────────────────────────────────────────
    fetchRFQById: async (id) => {
        set({ isLoading: true, error: null, selectedRFQ: null });
        try {
            const response = await rfqApi.getById(id);
            set({ selectedRFQ: response.data });
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to load RFQ.";
            set({ error: message });
        } finally {
            set({ isLoading: false });
        }
    },

    // ── Create (saves as draft) ────────────────────────────────────────────────
    /**
     * @param {{ title: string, description?: string, deadline: string,
     *           items: { item_name: string, quantity: number, unit?: string, specifications?: string }[],
     *           vendor_ids: string[] }} payload
     * @returns {Promise<{ id: string, rfq_number: string, status: string } | null>}
     */
    createRFQ: async (payload) => {
        set({ isCreating: true, error: null });
        try {
            const response = await rfqApi.create(payload);
            return response.data?.data ?? null;
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to create RFQ.";
            set({ error: message });
            throw err;
        } finally {
            set({ isCreating: false });
        }
    },

    // ── Publish ────────────────────────────────────────────────────────────────
    publishRFQ: async (id) => {
        set({ isPublishing: true, error: null });
        try {
            await rfqApi.publish(id);
            // Optimistically update status in list
            set((state) => ({
                rfqs: state.rfqs.map((r) =>
                    r.id === id ? { ...r, status: "open" } : r
                ),
            }));
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to publish RFQ.";
            set({ error: message });
            throw err;
        } finally {
            set({ isPublishing: false });
        }
    },

    // ── Helpers ────────────────────────────────────────────────────────────────
    clearError: () => set({ error: null }),
    clearSelectedRFQ: () => set({ selectedRFQ: null }),
}));
