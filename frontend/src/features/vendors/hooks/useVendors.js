import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/api/endpoints/vendorApi";
import { QUERY_KEYS } from "@/utils/constants";

/**
 * useVendors hook
 *
 * Fetches a paginated and filtered list of vendors using TanStack Query.
 *
 * Usage:
 *   const { data, isLoading, isError, error } = useVendors({ page: 1, limit: 10, search: "", status: "" });
 *   const vendors = data?.vendors || [];
 */
const useVendors = (params = {}) => {
    return useQuery({
        queryKey: [...QUERY_KEYS.VENDORS, params],
        queryFn: () => vendorApi.getAll(params).then((res) => res.data?.data),
        staleTime: 1000 * 30, // Fresh for 30s
        gcTime: 1000 * 60 * 5,  // Cache for 5m
    });
};

export default useVendors;
