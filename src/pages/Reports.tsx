import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useVisits } from "@/hooks/useVisits";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const visitTypes = ["Fiscalização", "Reunião", "Denúncia", "Visita institucional", "Outro"];
const statuses = ["Agendada", "Realizada", "Cancelada"];
const PAGE_SIZE = 10;

function getTurnoLabel(time: string) {
  const hour = parseInt(time.slice(0, 2), 10);
  if (hour < 12) return "Manhã";
  if (hour < 18) return "Tarde";
  return "Noite";
}

export default function Reports() {
  const { profile } = useAuth();
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

  const totalPages = Math.max(1, Math.ceil((visits?.length ?? 0) / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (visits ?? []).slice(start, start + PAGE_SIZE);
  }, [visits, page]);

  const resetPage = () => setPage(1);

  const exportPDF = () => {
    if (!visits?.length) return;

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SINTEL - Relatorio de Visitas Sindicais", 14, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);

    const infoLines: string[] = [];
    infoLines.push(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'as' HH:mm")}`);
    if (profile?.full_name) infoLines.push(`Gerado por: ${profile.full_name}`);

    const filters: string[] = [];
    if (company) filters.push(`Empresa: ${company}`);
    if (visitType) filters.push(`Tipo: ${visitType}`);
    if (status) filters.push(`Status: ${status}`);
    if (startDate) filters.push(`De: ${format(parseISO(startDate), "dd/MM/yyyy")}`);
    if (endDate) filters.push(`Ate: ${format(parseISO(endDate), "dd/MM/yyyy")}`);
    if (filters.length > 0) infoLines.push(`Filtros: ${filters.join(" | ")}`);
    infoLines.push(`Total de registros: ${visits.length}`);

    let infoY = 26;
    infoLines.forEach((line) => {
      doc.text(line, 14, infoY);
      infoY += 5;
    });

    doc.setTextColor(0);

    const getTurno = (time: string) => {
      const hour = parseInt(time.slice(0, 2), 10);
      if (hour < 12) return "Manha";
      if (hour < 18) return "Tarde";
      return "Noite";
    };

    const tableData = visits.map((v) => [
      format(parseISO(v.visit_date), "dd/MM/yyyy"),
      getTurno(v.visit_time),
      v.company_name,
      v.company_address,
      v.visit_type,
      v.status,
      v.notes || "-",
      v.result || "-",
    ]);

    autoTable(doc, {
      startY: infoY + 4,
      head: [["Data", "Turno", "Empresa", "Endereco", "Tipo", "Status", "Observacoes", "Resultado"]],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 65, 122], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 26 },
        2: { cellWidth: 38 },
        3: { cellWidth: 48 },
        4: { cellWidth: 28 },
        5: { cellWidth: 22 },
        6: { cellWidth: 42 },
        7: { cellWidth: 42 },
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Pagina ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() - 14,
        doc.internal.pageSize.getHeight() - 8,
        { align: "right" }
      );
    }

    doc.save(`relatorio-visitas-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const statusColor = (s: string) =>
    s === "Agendada" ? "bg-primary/10 text-primary" :
    s === "Realizada" ? "bg-success/10 text-success" :
    "bg-destructive/10 text-destructive";

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
            <h1 className="page-header">Relatórios</h1>
            <p className="page-subtitle">Exporte e analise seus dados de visitas</p>
          </div>
          <Button onClick={exportPDF} disabled={!visits?.length}>
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
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

        <p className="text-sm text-muted-foreground">
          {visits?.length ?? 0} resultado(s) encontrado(s)
        </p>

        {/* Desktop: tabela */}
        <div className="hidden md:block rounded-lg border bg-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Notas</TableHead>
                <TableHead className="hidden lg:table-cell">Resultado</TableHead>
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
                  <TableRow key={v.id}>
                    <TableCell>{format(parseISO(v.visit_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{getTurnoLabel(v.visit_time)}</TableCell>
                    <TableCell className="font-medium">{v.company_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{v.company_address}</TableCell>
                    <TableCell>{v.visit_type}</TableCell>
                    <TableCell><Badge variant="secondary" className={statusColor(v.status)}>{v.status}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[150px] truncate text-sm">{v.notes || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[150px] truncate text-sm">{v.result || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
          ) : paged.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma visita encontrada.</p>
          ) : (
            paged.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold">{v.company_name}</p>
                    <Badge variant="secondary" className={statusColor(v.status)}>{v.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{v.company_address}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{format(parseISO(v.visit_date), "dd/MM/yyyy")} — {getTurnoLabel(v.visit_time)}</span>
                    <span>{v.visit_type}</span>
                  </div>
                  {v.notes && <p className="text-sm text-muted-foreground line-clamp-2">{v.notes}</p>}
                  {v.result && <p className="text-sm line-clamp-2"><strong>Resultado:</strong> {v.result}</p>}
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
