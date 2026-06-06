import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { STORAGE_KEYS } from "@/utils/constants";

/**
 * Global Auth Store (Zustand)
 *
 * Persisted to localStorage so the user stays logged in on page refresh.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuthStore();
 */
const useAuthStore = create(
    persist(
        (set) => ({
            /** @type {{ id: string, username: string, email: string, avatar_url: string } | null} */
            user: null,

            /** Derived from user presence */
            isAuthenticated: false,

            /**
             * Called after a successful login API call
             * @param {{ id: string, username: string, email: string, avatar_url: string }} userData
             */
            login: (userData) =>
                set({
                    user: userData,
                    isAuthenticated: true,
                }),

            /**
             * Update user data (e.g. after profile edit)
             * @param {Partial<typeof user>} updates
             */
            setUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),

            /**
             * Clear auth state (on logout or token expiry)
             */
            logout: () =>
                set({
                    user: null,
                    isAuthenticated: false,
                }),
        }),
        {
            name: STORAGE_KEYS.AUTH,           // localStorage key
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({          // Only persist these fields
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export { useAuthStore };
