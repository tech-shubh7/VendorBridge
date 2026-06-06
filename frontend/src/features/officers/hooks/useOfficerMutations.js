import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { officerApi } from "@/api/endpoints/officerApi";
import { parseApiError } from "@/utils/errorHandler";
import { QUERY_KEYS } from "@/utils/constants";

/** Create a procurement officer */
export const useCreateOfficer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => officerApi.create(data),
        onSuccess: () => {
            toast.success("Procurement officer created successfully!");
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.OFFICERS });
        },
        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};

/** Update a procurement officer */
export const useUpdateOfficer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => officerApi.update(id, data),
        onSuccess: () => {
            toast.success("Procurement officer updated successfully!");
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.OFFICERS });
        },
        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};

/** Delete a procurement officer */
export const useDeleteOfficer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => officerApi.delete(id),
        onSuccess: () => {
            toast.success("Procurement officer deleted successfully!");
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.OFFICERS });
        },
        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};

/** Block / unblock a procurement officer */
export const useToggleOfficerStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, action }) => {
            if (action === "block") return officerApi.block(userId);
            if (action === "unblock") return officerApi.unblock(userId);
            throw new Error(`Invalid status action: ${action}`);
        },
        onSuccess: (_, variables) => {
            const label = variables.action === "block" ? "suspended" : "activated";
            toast.success(`Officer account ${label} successfully!`);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.OFFICERS });
        },
        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};
