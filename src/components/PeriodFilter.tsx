import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";

export type PeriodOption = "today" | "next7" | "week" | "month" | "custom";

interface PeriodFilterProps {
  onPeriodChange: (start: string, end: string) => void;
}

export function PeriodFilter({ onPeriodChange }: PeriodFilterProps) {
  const [active, setActive] = useState<PeriodOption>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const today = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  const periods: { key: PeriodOption; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "next7", label: "Próx. 7 dias" },
    { key: "week", label: "Semana atual" },
    { key: "month", label: "Mês atual" },
    { key: "custom", label: "Personalizado" },
  ];

  const handlePeriod = (key: PeriodOption) => {
    setActive(key);
    switch (key) {
      case "today":
        onPeriodChange(fmt(today), fmt(today));
        break;
      case "next7":
        onPeriodChange(fmt(today), fmt(addDays(today, 7)));
        break;
      case "week":
        onPeriodChange(fmt(startOfWeek(today, { weekStartsOn: 1 })), fmt(endOfWeek(today, { weekStartsOn: 1 })));
        break;
      case "month":
        onPeriodChange(fmt(startOfMonth(today)), fmt(endOfMonth(today)));
        break;
    }
  };

  const handleCustom = () => {
    if (customStart && customEnd) onPeriodChange(customStart, customEnd);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {periods.map((p) => (
        <Button
          key={p.key}
          variant={active === p.key ? "default" : "outline"}
          size="sm"
          onClick={() => handlePeriod(p.key)}
        >
          {p.label}
        </Button>
      ))}
      {active === "custom" && (
        <div className="flex items-center gap-2 ml-2">
          <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-36 h-8" />
          <span className="text-muted-foreground text-sm">até</span>
          <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-36 h-8" />
          <Button size="sm" variant="secondary" onClick={handleCustom}>Aplicar</Button>
        </div>
      )}
    </div>
  );
}
