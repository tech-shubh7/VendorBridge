import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/endpoints/authApi";
import { useAuthStore } from "@/store/authStore";
import { QUERY_KEYS } from "@/utils/constants";
import { useEffect } from "react";

/**
 * useMe hook
 *
 * Fetches the currently authenticated user's detailed profile.
 * Automatically updates the Zustand authStore's user state.
 */
const useMe = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const query = useQuery({
        queryKey: QUERY_KEYS.ME,
        queryFn: async () => {
            const response = await authApi.getMe();
            return response.data?.data;
        },
        enabled: isAuthenticated, // Only run the query if we have an active session (localStorage state says authenticated)
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    useEffect(() => {
        if (query.data) {
            setUser(query.data);
        }
    }, [query.data, setUser]);

    return query;
};

export default useMe;
