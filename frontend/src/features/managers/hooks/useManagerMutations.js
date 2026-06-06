import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { managerApi } from "@/api/endpoints/managerApi";
import { parseApiError } from "@/utils/errorHandler";
import { QUERY_KEYS } from "@/utils/constants";

/** Create a manager */
export const useCreateManager = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => managerApi.create(data),
        onSuccess: () => {
            toast.success("Manager created successfully!");
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MANAGERS });
        },
        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};

/** Update a manager */
export const useUpdateManager = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => managerApi.update(id, data),
        onSuccess: () => {
            toast.success("Manager updated successfully!");
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MANAGERS });
        },
        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};

/** Delete a manager */
export const useDeleteManager = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => managerApi.delete(id),
        onSuccess: () => {
            toast.success("Manager deleted successfully!");
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MANAGERS });
        },
        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};

/** Block / unblock a manager */
export const useToggleManagerStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, action }) => {
            if (action === "block") return managerApi.block(userId);
            if (action === "unblock") return managerApi.unblock(userId);
            throw new Error(`Invalid status action: ${action}`);
        },
        onSuccess: (_, variables) => {
            const label = variables.action === "block" ? "suspended" : "activated";
            toast.success(`Manager account ${label} successfully!`);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MANAGERS });
        },
        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};
