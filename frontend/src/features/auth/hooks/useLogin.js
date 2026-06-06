import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "@/api/endpoints/authApi";
import { useAuthStore } from "@/store/authStore";
import { parseApiError } from "@/utils/errorHandler";
import { ROUTES } from "@/utils/constants";

/**
 * useLogin hook
 *
 * Wraps the login mutation with:
 * - Auto-store user in Zustand on success
 * - Toast notifications for success/error
 * - Navigate to home on success
 *
 * Usage:
 *   const { mutate: login, isPending } = useLogin();
 *   login({ email, password });
 */
const useLogin = () => {
    const loginStore = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (credentials) => authApi.login(credentials),

        onSuccess: (response) => {
            const user = response.data?.data;
            if (user) {
                loginStore(user);
                toast.success(`Welcome back, @${user.username}!`);
                navigate(ROUTES.HOME);
            }
        },

        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};

export default useLogin;
