import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { addMinutes, isAfter, parse } from "date-fns";
import { useVisits } from "./useVisits";

const REMINDER_MINUTES_BEFORE = 60;

// Converte o uuid em um inteiro estável aceito pelo Android como id de notificação
const notificationId = (uuid: string) => parseInt(uuid.replace(/-/g, "").slice(0, 7), 16);

/** Agenda um lembrete local antes de cada visita "Agendada". Funciona offline. */
export function useVisitReminders() {
  const { data: visits } = useVisits({});

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !visits) return;

    (async () => {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== "granted") return;

      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }

      const now = new Date();
      const notifications = visits
        .filter((v) => v.status === "Agendada")
        .map((v) => {
          const visitAt = parse(`${v.visit_date} ${v.visit_time.slice(0, 5)}`, "yyyy-MM-dd HH:mm", new Date());
          return { v, at: addMinutes(visitAt, -REMINDER_MINUTES_BEFORE) };
        })
        .filter(({ at }) => isAfter(at, now))
        .map(({ v, at }) => ({
          id: notificationId(v.id),
          title: "Visita em 1 hora",
          body: `${v.company_name} às ${v.visit_time.slice(0, 5)} — ${v.company_address}`,
          schedule: { at, allowWhileIdle: true },
        }));

      if (notifications.length) await LocalNotifications.schedule({ notifications });
    })().catch(() => undefined);
  }, [visits]);
}
