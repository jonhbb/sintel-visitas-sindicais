import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PeriodFilter } from "@/components/PeriodFilter";
import { useVisits, Visit } from "@/hooks/useVisits";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, CalendarCheck, CheckCircle2, XCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

export default function Dashboard() {
  const { profile } = useAuth();
  const today = new Date();
  const [startDate, setStartDate] = useState(fmt(startOfMonth(today)));
  const [endDate, setEndDate] = useState(fmt(endOfMonth(today)));

  const { data: visits, isLoading } = useVisits({ startDate, endDate });
  const { data: upcoming } = useVisits({ startDate: fmt(today), status: "Agendada" });
  const { data: allVisits } = useVisits({});
  const recentVisits = useMemo(() => (allVisits ?? []).slice(0, 10), [allVisits]);

  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const displayName = profile?.full_name || profile?.email || "";

  const stats = useMemo(() => {
    const v = visits ?? [];
    return {
      total: v.length,
      agendada: v.filter((x) => x.status === "Agendada").length,
      realizada: v.filter((x) => x.status === "Realizada").length,
      cancelada: v.filter((x) => x.status === "Cancelada").length,
    };
  }, [visits]);

  const chartData = useMemo(() => {
    const v = visits ?? [];
    const map: Record<string, number> = {};
    v.forEach((visit) => {
      const d = visit.visit_date;
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: format(parseISO(date), "dd/MM", { locale: ptBR }),
        visitas: count,
      }));
  }, [visits]);

  const statusColor = (s: string) =>
    s === "Agendada" ? "bg-primary/10 text-primary" :
    s === "Realizada" ? "bg-success/10 text-success" :
    "bg-destructive/10 text-destructive";

  const statCards = [
    { label: "Total de visitas", value: stats.total, icon: ClipboardList, color: "text-primary" },
    { label: "Agendadas", value: stats.agendada, icon: CalendarCheck, color: "text-primary" },
    { label: "Realizadas", value: stats.realizada, icon: CheckCircle2, color: "text-success" },
    { label: "Canceladas", value: stats.cancelada, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="page-header">
            {greeting}{displayName ? `, ${displayName}` : ""}
          </h1>
          <p className="page-subtitle">Visão geral das suas visitas sindicais</p>
        </div>

        <PeriodFilter onPeriodChange={(s, e) => { setStartDate(s); setEndDate(e); }} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="stat-card">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-3xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              )}
            </div>
          ))}
        </div>

        {chartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Visitas por dia</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Próximas Visitas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? <Skeleton className="h-20" /> : (upcoming ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma visita agendada.</p>
              ) : (
                (upcoming ?? []).slice(0, 5).map((v) => (
                  <VisitRow key={v.id} visit={v} statusColor={statusColor} />
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Visitas Recentes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? <Skeleton className="h-20" /> : recentVisits.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma visita registrada.</p>
              ) : (
                recentVisits.map((v) => (
                  <VisitRow key={v.id} visit={v} statusColor={statusColor} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function VisitRow({ visit, statusColor }: { visit: Visit; statusColor: (s: string) => string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{visit.company_name}</p>
        <p className="text-xs text-muted-foreground">
          {format(parseISO(visit.visit_date), "dd/MM/yyyy")} às {visit.visit_time.slice(0, 5)}
        </p>
      </div>
      <Badge variant="secondary" className={statusColor(visit.status)}>
        {visit.status}
      </Badge>
    </div>
  );
}
