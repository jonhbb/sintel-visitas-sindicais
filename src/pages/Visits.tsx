import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useVisits, useDeleteVisit, useUpdateVisit } from "@/hooks/useVisits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isBefore, startOfDay } from "date-fns";

const visitTypes = ["Fiscalização", "Reunião", "Denúncia", "Visita institucional", "Outro"];
const statuses = ["Agendada", "Realizada", "Cancelada"];
const PAGE_SIZE = 10;

export default function Visits() {
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [visitType, setVisitType] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const { data: visits, isLoading } = useVisits({
    company: company || undefined,
    visitType: visitType || undefined,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const deleteVisit = useDeleteVisit();
  const updateVisit = useUpdateVisit();

  const today = startOfDay(new Date());
  const totalPages = Math.max(1, Math.ceil((visits?.length ?? 0) / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (visits ?? []).slice(start, start + PAGE_SIZE);
  }, [visits, page]);

  const resetPage = () => setPage(1);

  const isOverdue = (visitDate: string, visitStatus: string) =>
    visitStatus === "Agendada" && isBefore(parseISO(visitDate), today);

  const statusColor = (s: string, visitDate?: string) => {
    if (visitDate && isOverdue(visitDate, s)) return "bg-orange-100 text-orange-700 border-orange-300";
    if (s === "Agendada") return "bg-primary/10 text-primary";
    if (s === "Realizada") return "bg-success/10 text-success";
    return "bg-destructive/10 text-destructive";
  };

  const handleStatusChange = (visitId: string, newStatus: string) => {
    updateVisit.mutate({ id: visitId, status: newStatus });
  };

  const StatusDropdown = ({ id, currentStatus, visitDate }: { id: string; currentStatus: string; visitDate: string }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer">
          <Badge variant="secondary" className={`${statusColor(currentStatus, visitDate)} hover:opacity-80 transition-opacity`}>
            {isOverdue(visitDate, currentStatus) ? "Atrasada" : currentStatus}
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {statuses.map((s) => (
          <DropdownMenuItem key={s} onClick={() => handleStatusChange(id, s)} className={currentStatus === s ? "font-semibold bg-accent" : ""}>
            <Badge variant="secondary" className={`${statusColor(s)} mr-2`}>{s}</Badge>
            {currentStatus === s && "(atual)"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const DeleteButton = ({ id }: { id: string }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir visita?</AlertDialogTitle>
          <AlertDialogDescription>Esta ação não pode ser desfeita. A visita será permanentemente excluída.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteVisit.mutate(id)}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const Pagination = () => {
    if ((visits?.length ?? 0) <= PAGE_SIZE) return null;
    return (
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, visits?.length ?? 0)} de {visits?.length ?? 0}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="flex items-center text-sm px-2">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Visitas</h1>
            <p className="page-subtitle">Gerencie todas as suas visitas</p>
          </div>
          <Button onClick={() => navigate("/nova-visita")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Visita
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Input placeholder="Buscar empresa..." value={company} onChange={(e) => { setCompany(e.target.value); resetPage(); }} className="w-full sm:w-52" />
          <Select value={visitType} onValueChange={(v) => { setVisitType(v === "all" ? "" : v); resetPage(); }}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {visitTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); resetPage(); }}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-3 w-full sm:w-auto">
            <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); resetPage(); }} className="flex-1 sm:w-36" />
            <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); resetPage(); }} className="flex-1 sm:w-36" />
          </div>
        </div>

        {/* Desktop: tabela */}
        <div className="hidden md:block rounded-lg border bg-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Notas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>))}</TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma visita encontrada.</TableCell></TableRow>
              ) : (
                paged.map((v) => (
                  <TableRow key={v.id} className={isOverdue(v.visit_date, v.status) ? "bg-orange-50/50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {isOverdue(v.visit_date, v.status) && <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                        {format(parseISO(v.visit_date), "dd/MM/yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>{v.visit_time.slice(0, 5)}</TableCell>
                    <TableCell className="font-medium">{v.company_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{v.company_address}</TableCell>
                    <TableCell>{v.visit_type}</TableCell>
                    <TableCell><StatusDropdown id={v.id} currentStatus={v.status} visitDate={v.visit_date} /></TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[150px] truncate text-muted-foreground text-sm">{v.notes || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/nova-visita?id=${v.id}`)}><Pencil className="h-4 w-4" /></Button>
                        <DeleteButton id={v.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)
          ) : paged.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma visita encontrada.</p>
          ) : (
            paged.map((v) => (
              <Card key={v.id} className={isOverdue(v.visit_date, v.status) ? "border-orange-300 bg-orange-50/30" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{v.company_name}</p>
                      <p className="text-xs text-muted-foreground">{v.company_address}</p>
                    </div>
                    <StatusDropdown id={v.id} currentStatus={v.status} visitDate={v.visit_date} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {isOverdue(v.visit_date, v.status) && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                      {format(parseISO(v.visit_date), "dd/MM/yyyy")} às {v.visit_time.slice(0, 5)}
                    </span>
                    <span>{v.visit_type}</span>
                  </div>
                  {v.notes && <p className="text-sm text-muted-foreground line-clamp-2">{v.notes}</p>}
                  <div className="flex justify-end gap-1 pt-1 border-t">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/nova-visita?id=${v.id}`)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    <DeleteButton id={v.id} />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Pagination />
      </div>
    </AppLayout>
  );
}
