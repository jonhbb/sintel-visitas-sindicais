import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, Profile } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useUsers() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Profile[];
    },
    enabled: isAdmin,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      email: string;
      password: string;
      fullName: string;
      role: string;
    }) => {
      const { data, error } = await supabase.rpc("admin_create_user", {
        user_email: params.email,
        user_password: params.password,
        user_full_name: params.fullName,
        user_role: params.role,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Usuário criado com sucesso!" });
    },
    onError: (error) => {
      const msg = error.message.includes("já está cadastrado")
        ? "Este e-mail já está cadastrado."
        : error.message;
      toast({ title: "Erro ao criar usuário", description: msg, variant: "destructive" });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; full_name?: string; role?: string; active?: boolean }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Usuário atualizado com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar usuário", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_delete_user", {
        target_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Usuário excluído com sucesso!" });
    },
    onError: (error) => {
      const msg = error.message.includes("próprio usuário")
        ? "Não é possível excluir o próprio usuário."
        : error.message;
      toast({ title: "Erro ao excluir usuário", description: msg, variant: "destructive" });
    },
  });
}
