import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { vendorApi } from "@/api/endpoints/vendorApi";
import { parseApiError } from "@/utils/errorHandler";
import { QUERY_KEYS } from "@/utils/constants";

/**
 * Hook to create a vendor
 */
export const useCreateVendor = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => vendorApi.create(data),
        onSuccess: () => {
            toast.success("Vendor created successfully!");
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDORS });
        },
        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};

/**
 * Hook to update a vendor
 */
export const useUpdateVendor = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => vendorApi.update(id, data),
        onSuccess: () => {
            toast.success("Vendor updated successfully!");
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDORS });
        },
        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};

/**
 * Hook to delete a vendor
 */
export const useDeleteVendor = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => vendorApi.delete(id),
        onSuccess: () => {
            toast.success("Vendor deleted successfully!");
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDORS });
        },
        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};

/**
 * Hook to toggle/approve/block vendor status
 */
export const useToggleVendorStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, action }) => {
            if (action === "approve") return vendorApi.approve(userId);
            if (action === "reject") return vendorApi.reject(userId);
            if (action === "block") return vendorApi.block(userId);
            if (action === "unblock") return vendorApi.unblock(userId);
            throw new Error(`Invalid status toggle action: ${action}`);
        },
        onSuccess: (_, variables) => {
            const actionText = 
                variables.action === "approve" ? "approved" : 
                variables.action === "reject" ? "rejected" : 
                variables.action === "block" ? "blocked" : "unblocked";
            toast.success(`Vendor account ${actionText} successfully!`);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDORS });
        },
        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};
