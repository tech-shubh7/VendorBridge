import { useQuery } from "@tanstack/react-query";
import { postApi } from "@/api/endpoints/postApi";
import { QUERY_KEYS } from "@/utils/constants";

/**
 * usePosts hook
 *
 * Fetches a paginated list of posts using TanStack Query.
 * Handles caching, background refetching, and loading/error states.
 *
 * Usage:
 *   const { data, isLoading, isError, error } = usePosts({ page: 1, limit: 20 });
 *   const posts = data?.data?.data || [];
 */
const usePosts = (params = {}) => {
    return useQuery({
        queryKey: [...QUERY_KEYS.POSTS, params],
        queryFn: () => postApi.getAll(params).then((res) => res.data),
        staleTime: 1000 * 60 * 2, // Data is fresh for 2 minutes
        gcTime: 1000 * 60 * 10,   // Keep in cache for 10 minutes
    });
};

export default usePosts;
