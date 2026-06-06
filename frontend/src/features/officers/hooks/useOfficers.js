import { useQuery } from "@tanstack/react-query";
import { officerApi } from "@/api/endpoints/officerApi";
import { QUERY_KEYS } from "@/utils/constants";

/**
 * useOfficers – paginated + filtered list of procurement officers
 *
 * Usage:
 *   const { data, isLoading } = useOfficers({ page: 1, limit: 10, search: "" });
 *   const officers = data?.users || [];
 */
const useOfficers = (params = {}) => {
    return useQuery({
        queryKey: [...QUERY_KEYS.OFFICERS, params],
        queryFn: () => officerApi.getAll(params).then((res) => res.data?.data),
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 5,
    });
};

export default useOfficers;
