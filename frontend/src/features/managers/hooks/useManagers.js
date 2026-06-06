import { useQuery } from "@tanstack/react-query";
import { managerApi } from "@/api/endpoints/managerApi";
import { QUERY_KEYS } from "@/utils/constants";

/**
 * useManagers – paginated + filtered list of managers
 *
 * Usage:
 *   const { data, isLoading } = useManagers({ page: 1, limit: 10, search: "" });
 *   const managers = data?.users || [];
 */
const useManagers = (params = {}) => {
    return useQuery({
        queryKey: [...QUERY_KEYS.MANAGERS, params],
        queryFn: () => managerApi.getAll(params).then((res) => res.data?.data),
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 5,
    });
};

export default useManagers;
