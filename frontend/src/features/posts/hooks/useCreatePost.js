import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { postApi } from "@/api/endpoints/postApi";
import { parseApiError } from "@/utils/errorHandler";
import { QUERY_KEYS } from "@/utils/constants";

/**
 * useCreatePost hook
 *
 * Wraps the create post mutation with:
 * - Optimistic cache invalidation after success
 * - Toast notifications
 * - FormData support (for media uploads)
 *
 * Usage:
 *   const { mutate: createPost, isPending } = useCreatePost();
 *   const formData = new FormData();
 *   formData.append("caption", "Hello world!");
 *   createPost(formData);
 */
const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (formData) => postApi.create(formData),

        onSuccess: () => {
            toast.success("Post created!");
            // Invalidate the posts list so it refetches with the new post
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.POSTS });
        },

        onError: (error) => {
            const { message } = parseApiError(error);
            toast.error(message);
        },
    });
};

export default useCreatePost;
