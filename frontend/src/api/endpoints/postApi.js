import axiosInstance from "@/api/axiosInstance";
import { ENDPOINTS } from "@/utils/constants";

/**
 * Posts API calls
 */
export const postApi = {
    /** Get paginated list of posts */
    getAll: (params = {}) => axiosInstance.get(ENDPOINTS.POSTS, { params }),

    /** Get a single post by ID */
    getById: (id) => axiosInstance.get(ENDPOINTS.POST_BY_ID(id)),

    /**
     * Create a new post (supports media upload)
     * @param {FormData} formData
     */
    create: (formData) =>
        axiosInstance.post(ENDPOINTS.POSTS, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    /** Update a post's caption */
    update: (id, data) => axiosInstance.patch(ENDPOINTS.POST_BY_ID(id), data),

    /** Soft-delete a post */
    delete: (id) => axiosInstance.delete(ENDPOINTS.POST_BY_ID(id)),

    /** Like a post */
    like: (id) => axiosInstance.post(ENDPOINTS.POST_LIKE(id)),

    /** Unlike a post */
    unlike: (id) => axiosInstance.delete(ENDPOINTS.POST_LIKE(id)),

    /** Get comments on a post */
    getComments: (id, params = {}) =>
        axiosInstance.get(ENDPOINTS.POST_COMMENT(id), { params }),

    /** Add a comment */
    addComment: (id, data) => axiosInstance.post(ENDPOINTS.POST_COMMENT(id), data),
};
