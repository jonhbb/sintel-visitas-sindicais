import { useQuery, useMutation, useIsMutating, QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import { PendingPhoto, uploadPhoto, removePhotos } from "@/lib/photos";

export type Visit = {
  id: string;
  user_id: string;
  visit_date: string;
  visit_time: string;
  company_name: string;
  company_address: string;
  visit_type: string;
  status: string;
  notes: string | null;
  result: string | null;
  latitude: number | null;
  longitude: number | null;
  photos: string[];
  created_at: string;
  updated_at: string;
};

export type VisitFields = Omit<Visit, "id" | "user_id" | "created_at" | "updated_at">;
export type CreateVisitVars = VisitFields & { id: string; user_id: string; newPhotos?: PendingPhoto[] };
export type UpdateVisitVars = Partial<VisitFields> & { id: string; newPhotos?: PendingPhoto[] };
type DeleteVisitVars = { id: string; photos: string[] };

const VISITS = ["visits"] as const;
const SCOPE = { id: "visits" }; // serializa mutações para sincronizar na ordem em que foram feitas

export function useVisits(filters?: {
  startDate?: string;
  endDate?: string;
  company?: string;
  visitType?: string;
  status?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["visits", filters],
    queryFn: async () => {
      let query = supabase
        .from("visits")
        .select("*")
        .order("visit_date", { ascending: false })
        .order("visit_time", { ascending: false });

      if (filters?.startDate) query = query.gte("visit_date", filters.startDate);
      if (filters?.endDate) query = query.lte("visit_date", filters.endDate);
      if (filters?.company) query = query.ilike("company_name", `%${filters.company}%`);
      if (filters?.visitType) query = query.eq("visit_type", filters.visitType);
      if (filters?.status) query = query.eq("status", filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data as Visit[];
    },
    enabled: !!user,
  });
}

// Só atualiza do servidor quando não há mais nada pendente, senão apagaria o que ainda não foi enviado
const settle = (qc: QueryClient) => {
  if (qc.isMutating({ mutationKey: VISITS }) <= 1) qc.invalidateQueries({ queryKey: VISITS });
};

const patchCache = (qc: QueryClient, fn: (list: Visit[]) => Visit[]) =>
  qc.setQueriesData<Visit[]>({ queryKey: VISITS }, (old) => (old ? fn(old) : old));

/**
 * As funções ficam registradas no QueryClient (e não nos hooks) para que mutações
 * salvas offline possam ser retomadas depois de fechar e reabrir o app.
 */
export function registerVisitMutations(qc: QueryClient) {
  qc.setMutationDefaults([...VISITS, "create"], {
    scope: SCOPE,
    retry: 2,
    mutationFn: async ({ newPhotos = [], ...visit }: CreateVisitVars) => {
      for (const p of newPhotos) await uploadPhoto(p);
      const { data, error } = await supabase
        .from("visits")
        .upsert(visit, { onConflict: "id" }) // idempotente se a mesma mutação for reenviada
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (vars: CreateVisitVars) => {
      await qc.cancelQueries({ queryKey: VISITS });
      const { newPhotos: _n, ...rest } = vars;
      const now = new Date().toISOString();
      patchCache(qc, (list) => [{ ...rest, created_at: now, updated_at: now } as Visit, ...list]);
    },
    onSuccess: () => toast({ title: "Visita salva com sucesso!" }),
    onError: (error: Error) =>
      toast({ title: "Erro ao salvar visita", description: error.message, variant: "destructive" }),
    onSettled: () => settle(qc),
  });

  qc.setMutationDefaults([...VISITS, "update"], {
    scope: SCOPE,
    retry: 2,
    mutationFn: async ({ id, newPhotos = [], ...updates }: UpdateVisitVars) => {
      for (const p of newPhotos) await uploadPhoto(p);
      const { data, error } = await supabase.from("visits").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, newPhotos: _n, ...updates }: UpdateVisitVars) => {
      await qc.cancelQueries({ queryKey: VISITS });
      patchCache(qc, (list) => list.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    },
    onSuccess: () => toast({ title: "Visita atualizada com sucesso!" }),
    onError: (error: Error) =>
      toast({ title: "Erro ao atualizar visita", description: error.message, variant: "destructive" }),
    onSettled: () => settle(qc),
  });

  qc.setMutationDefaults([...VISITS, "delete"], {
    scope: SCOPE,
    retry: 2,
    mutationFn: async ({ id, photos }: DeleteVisitVars) => {
      const { error } = await supabase.from("visits").delete().eq("id", id);
      if (error) throw error;
      await removePhotos(photos).catch(() => undefined);
    },
    onMutate: async ({ id }: DeleteVisitVars) => {
      await qc.cancelQueries({ queryKey: VISITS });
      patchCache(qc, (list) => list.filter((v) => v.id !== id));
    },
    onSuccess: () => toast({ title: "Visita excluída com sucesso!" }),
    onError: (error: Error) =>
      toast({ title: "Erro ao excluir visita", description: error.message, variant: "destructive" }),
    onSettled: () => settle(qc),
  });
}

export function useCreateVisit() {
  const { user } = useAuth();
  const mutation = useMutation<unknown, Error, CreateVisitVars>({ mutationKey: [...VISITS, "create"] });

  return {
    ...mutation,
    // Gera o id no aparelho para a visita já existir offline
    mutate: (
      visit: VisitFields & { newPhotos?: PendingPhoto[]; id?: string },
      options?: Parameters<typeof mutation.mutate>[1],
    ) => {
      if (!user) return toast({ title: "Não autenticado", variant: "destructive" });
      mutation.mutate({ ...visit, id: visit.id ?? crypto.randomUUID(), user_id: user.id }, options);
    },
  };
}

export function useUpdateVisit() {
  return useMutation<unknown, Error, UpdateVisitVars>({ mutationKey: [...VISITS, "update"] });
}

export function useDeleteVisit() {
  return useMutation<unknown, Error, DeleteVisitVars>({ mutationKey: [...VISITS, "delete"] });
}

export function usePendingSyncCount() {
  return useIsMutating({ mutationKey: VISITS });
}
