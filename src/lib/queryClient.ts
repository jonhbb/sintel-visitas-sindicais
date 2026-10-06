import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { persistStorage } from "@/lib/persistStorage";
import { registerVisitMutations } from "@/hooks/useVisits";

export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 dias

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: CACHE_MAX_AGE, staleTime: 30_000 },
  },
});

// Precisa estar registrado antes de retomar mutações salvas de uma sessão anterior
registerVisitMutations(queryClient);

export const persister = createAsyncStoragePersister({
  storage: persistStorage,
  key: "sintel-query-cache",
  throttleTime: 1000,
});
