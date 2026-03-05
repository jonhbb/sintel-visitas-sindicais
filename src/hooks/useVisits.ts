import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

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
  created_at: string;
  updated_at: string;
};

export type VisitInsert = Omit<Visit, "id" | "created_at" | "updated_at">;
export type VisitUpdate = Partial<Omit<Visit, "id" | "user_id" | "created_at" | "updated_at">>;

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

export function useCreateVisit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (visit: Omit<VisitInsert, "user_id">) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("visits")
        .insert({ ...visit, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      toast({ title: "Visita salva com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar visita", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: VisitUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("visits")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      toast({ title: "Visita atualizada com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar visita", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("visits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      toast({ title: "Visita excluída com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir visita", description: error.message, variant: "destructive" });
    },
  });
}
