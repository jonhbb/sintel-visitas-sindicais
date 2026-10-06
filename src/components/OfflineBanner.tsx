import { CloudOff, RefreshCw } from "lucide-react";
import { useOnline } from "@/hooks/useOnline";
import { usePendingSyncCount } from "@/hooks/useVisits";

export function OfflineBanner() {
  const online = useOnline();
  const pending = usePendingSyncCount();

  if (online && pending === 0) return null;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${
        online ? "bg-primary/10 text-primary" : "bg-orange-100 text-orange-800"
      }`}
    >
      {online ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CloudOff className="h-3.5 w-3.5" />}
      {online
        ? `Sincronizando ${pending} alteraç${pending === 1 ? "ão" : "ões"}...`
        : `Sem internet${pending ? ` — ${pending} alteraç${pending === 1 ? "ão" : "ões"} aguardando envio` : " — mostrando dados salvos"}`}
    </div>
  );
}
