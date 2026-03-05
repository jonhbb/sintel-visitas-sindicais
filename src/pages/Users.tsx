import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Pencil, Trash2, Loader2, Users as UsersIcon, ShieldCheck, User } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function UsersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("user");

  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editActive, setEditActive] = useState(true);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser.mutateAsync({ email: newEmail, password: newPassword, fullName: newName, role: newRole });
    setCreateOpen(false);
    setNewEmail(""); setNewPassword(""); setNewName(""); setNewRole("user");
  };

  const openEdit = (u: typeof users extends (infer T)[] ? T : never) => {
    setEditId(u.id); setEditName(u.full_name); setEditRole(u.role); setEditActive(u.active); setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUser.mutateAsync({ id: editId, full_name: editName, role: editRole, active: editActive });
    setEditOpen(false);
  };

  const totalUsers = users?.length ?? 0;
  const adminCount = users?.filter(u => u.role === "admin").length ?? 0;
  const activeCount = users?.filter(u => u.active).length ?? 0;

  const DeleteUserButton = ({ userId, email }: { userId: string; email: string }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
          <AlertDialogDescription>Tem certeza que deseja excluir <strong>{email}</strong>? Todos os dados serão removidos permanentemente.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteUser.mutate(userId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">Crie, edite e gerencie os usuários do sistema.</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="mr-2 h-4 w-4" /> Novo Usuário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Novo Usuário</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Nome completo</Label>
                  <Input id="create-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do usuário" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">E-mail</Label>
                  <Input id="create-email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@exemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">Senha</Label>
                  <Input id="create-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={createUser.isPending}>
                    {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar Usuário
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalUsers}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{adminCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{activeCount}</div></CardContent>
          </Card>
        </div>

        {/* Desktop: tabela */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role === "admin" ? "Admin" : "Usuário"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.active ? "default" : "outline"} className={u.active ? "bg-green-600" : ""}>{u.active ? "Ativo" : "Inativo"}</Badge>
                      </TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => openEdit(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                          {u.id !== currentUser?.id && <DeleteUserButton userId={u.id} email={u.email} />}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!users || users.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Mobile: cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (!users || users.length === 0) ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</p>
          ) : (
            users.map(u => (
              <Card key={u.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant={u.active ? "default" : "outline"} className={u.active ? "bg-green-600" : ""}>
                      {u.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role === "admin" ? "Admin" : "Usuário"}</Badge>
                    <span className="text-muted-foreground">desde {new Date(u.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-end gap-2 pt-1 border-t">
                    <Button variant="outline" size="sm" onClick={() => openEdit(u)}><Pencil className="h-3.5 w-3.5 mr-1" /> Editar</Button>
                    {u.id !== currentUser?.id && <DeleteUserButton userId={u.id} email={u.email} />}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome completo</Label>
                <Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome do usuário" />
              </div>
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Usuário ativo</Label>
                <Switch id="edit-active" checked={editActive} onCheckedChange={setEditActive} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
