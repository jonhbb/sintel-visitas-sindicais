import { useEffect, useState, useMemo, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCreateVisit, useUpdateVisit, useVisits } from "@/hooks/useVisits";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2 } from "lucide-react";
import { format } from "date-fns";

const visitTypes = ["Fiscalização", "Reunião", "Denúncia", "Visita institucional", "Outro"];
const statuses = ["Agendada", "Realizada", "Cancelada"];

export default function NewVisit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const { data: allVisits } = useVisits({});
  const editVisit = allVisits?.find((v) => v.id === editId);

  const createVisit = useCreateVisit();
  const updateVisit = useUpdateVisit();

  const now = new Date();
  const [form, setForm] = useState({
    visit_date: format(now, "yyyy-MM-dd"),
    visit_time: format(now, "HH:mm"),
    company_name: "",
    company_address: "",
    visit_type: "Fiscalização",
    status: "Agendada",
    notes: "",
    result: "",
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const companies = useMemo(() => {
    if (!allVisits) return [];
    const map = new Map<string, string>();
    allVisits.forEach((v) => {
      if (!map.has(v.company_name)) {
        map.set(v.company_name, v.company_address);
      }
    });
    return Array.from(map, ([name, address]) => ({ name, address }));
  }, [allVisits]);

  const filtered = useMemo(() => {
    if (!form.company_name.trim()) return [];
    const q = form.company_name.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [form.company_name, companies]);

  useEffect(() => {
    if (editVisit) {
      setForm({
        visit_date: editVisit.visit_date,
        visit_time: editVisit.visit_time.slice(0, 5),
        company_name: editVisit.company_name,
        company_address: editVisit.company_address,
        visit_type: editVisit.visit_type,
        status: editVisit.status,
        notes: editVisit.notes || "",
        result: editVisit.result || "",
      });
    }
  }, [editVisit]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCompany = (company: { name: string; address: string }) => {
    setForm((f) => ({ ...f, company_name: company.name, company_address: company.address }));
    setShowSuggestions(false);
    setSuggestionIndex(-1);
  };

  const handleCompanyKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSuggestionIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSuggestionIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && suggestionIndex >= 0) {
      e.preventDefault();
      selectCompany(filtered[suggestionIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateVisit.mutate({ id: editId, ...form }, { onSuccess: () => navigate("/visitas") });
    } else {
      createVisit.mutate(form, { onSuccess: () => navigate("/visitas") });
    }
  };

  const isSubmitting = createVisit.isPending || updateVisit.isPending;
  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle>{editId ? "Editar Visita" : "Nova Visita"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visit_date">Data da Visita *</Label>
                  <Input id="visit_date" type="date" value={form.visit_date} onChange={(e) => update("visit_date", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visit_time">Horário *</Label>
                  <Input id="visit_time" type="time" value={form.visit_time} onChange={(e) => update("visit_time", e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2 relative" ref={wrapperRef}>
                <Label htmlFor="company_name">Nome da Empresa *</Label>
                <Input
                  id="company_name"
                  value={form.company_name}
                  onChange={(e) => {
                    update("company_name", e.target.value);
                    setShowSuggestions(true);
                    setSuggestionIndex(-1);
                  }}
                  onFocus={() => form.company_name.trim() && setShowSuggestions(true)}
                  onKeyDown={handleCompanyKeyDown}
                  placeholder="Digite para buscar ou cadastrar nova..."
                  autoComplete="off"
                  required
                />
                {showSuggestions && filtered.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filtered.map((c, i) => (
                      <button
                        key={c.name}
                        type="button"
                        className={`w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-accent transition-colors ${i === suggestionIndex ? "bg-accent" : ""}`}
                        onClick={() => selectCompany(c)}
                      >
                        <Building2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_address">Endereço da Empresa *</Label>
                <Input id="company_address" value={form.company_address} onChange={(e) => update("company_address", e.target.value)} placeholder="Rua, número, bairro, cidade..." required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Visita</Label>
                  <Select value={form.visit_type} onValueChange={(v) => update("visit_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {visitTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => update("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Observações sobre a visita..." rows={3} />
              </div>

              {form.status === "Realizada" && (
                <div className="space-y-2">
                  <Label htmlFor="result">Resultado</Label>
                  <Textarea id="result" value={form.result} onChange={(e) => update("result", e.target.value)} placeholder="Descreva o resultado da visita..." rows={3} />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editId ? "Atualizar Visita" : "Salvar Visita"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/visitas")}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
