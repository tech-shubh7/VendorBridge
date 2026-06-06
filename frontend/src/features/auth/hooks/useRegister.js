import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "@/api/endpoints/authApi";
import { useAuthStore } from "@/store/authStore";
import { parseApiError } from "@/utils/errorHandler";
import { ROUTES } from "@/utils/constants";

/**
 * useRegister hook
 *
 * Wraps the register mutation with:
 * - Auto-store user in Zustand on success
 * - Toast notifications
 * - Navigate to home on success
 *
 * Usage:
 *   const { mutate: register, isPending } = useRegister();
 *   register({ username, email, password });
 */
const useRegister = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data) => authApi.register(data),

        onSuccess: (response) => {
            const message = response.data?.message || "Account created successfully. Please wait for admin approval.";
            toast.success(message, {
                duration: 6000,
                icon: "⏳",
            });
            navigate(ROUTES.LOGIN);
        },

        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};

export default useRegister;
