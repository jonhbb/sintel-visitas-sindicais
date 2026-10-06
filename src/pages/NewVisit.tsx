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
import { Loader2, Building2, MapPin, Camera, X, Navigation } from "lucide-react";
import { onlineManager } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { capturePhoto, getSignedUrls, PendingPhoto } from "@/lib/photos";
import { getCurrentCoords, reverseGeocode, openMaps } from "@/lib/location";
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
  const { user } = useAuth();
  // id fixo da visita: necessário para nomear as fotos antes de salvar
  const newVisitId = useRef(crypto.randomUUID());
  const visitId = editId ?? newVisitId.current;

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [savedPhotos, setSavedPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<PendingPhoto[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

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
      setCoords(
        editVisit.latitude != null && editVisit.longitude != null
          ? { latitude: editVisit.latitude, longitude: editVisit.longitude }
          : null,
      );
      setSavedPhotos(editVisit.photos ?? []);
    }
  }, [editVisit]);

  useEffect(() => {
    if (savedPhotos.length && onlineManager.isOnline()) getSignedUrls(savedPhotos).then(setSignedUrls);
  }, [savedPhotos]);

  const handleLocate = async () => {
    setLocating(true);
    try {
      const c = await getCurrentCoords();
      setCoords(c);
      if (onlineManager.isOnline() && !form.company_address.trim()) {
        const address = await reverseGeocode(c);
        if (address) setForm((f) => ({ ...f, company_address: address }));
      }
      toast({ title: "Localização registrada" });
    } catch (err) {
      toast({ title: "Não foi possível obter a localização", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLocating(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!user) return;
    const photo = await capturePhoto(user.id, visitId);
    if (photo) setNewPhotos((p) => [...p, photo]);
  };

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
    const payload = {
      ...form,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      photos: [...savedPhotos, ...newPhotos.map((p) => p.path)],
      newPhotos,
    };
    // Offline a mutação fica na fila, então não dá para esperar o sucesso para sair da tela
    const options = onlineManager.isOnline() ? { onSuccess: () => navigate("/visitas") } : undefined;
    if (editId) {
      updateVisit.mutate({ id: editId, ...payload }, options);
    } else {
      createVisit.mutate({ id: visitId, ...payload }, options);
    }
    if (!options) {
      toast({ title: "Sem internet", description: "A visita foi salva no aparelho e será enviada quando voltar a conexão." });
      navigate("/visitas");
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

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleLocate} disabled={locating}>
                  {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                  {coords ? "Atualizar localização" : "Usar minha localização"}
                </Button>
                {(coords || form.company_address.trim()) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openMaps({ ...coords, company_address: form.company_address })}
                  >
                    <Navigation className="mr-2 h-4 w-4" /> Abrir no mapa
                  </Button>
                )}
                {coords && (
                  <span className="text-xs text-muted-foreground">
                    {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                  </span>
                )}
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

              <div className="space-y-2">
                <Label>Fotos</Label>
                <div className="flex flex-wrap gap-2">
                  {savedPhotos.map((path) => (
                    <div key={path} className="relative h-20 w-20 rounded-md border bg-muted overflow-hidden">
                      {signedUrls[path] && <img src={signedUrls[path]} alt="" className="h-full w-full object-cover" />}
                      <button
                        type="button"
                        aria-label="Remover foto"
                        className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5"
                        onClick={() => setSavedPhotos((p) => p.filter((x) => x !== path))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {newPhotos.map((photo) => (
                    <div key={photo.path} className="relative h-20 w-20 rounded-md border overflow-hidden">
                      <img src={photo.dataUrl} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        aria-label="Remover foto"
                        className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5"
                        onClick={() => setNewPhotos((p) => p.filter((x) => x.path !== photo.path))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="h-20 w-20 rounded-md border border-dashed flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:bg-accent"
                  >
                    <Camera className="h-5 w-5" /> Adicionar
                  </button>
                </div>
              </div>

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
