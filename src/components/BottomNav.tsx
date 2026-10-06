import { LayoutDashboard, ClipboardList, PlusCircle, BarChart3 } from "lucide-react";
import { NavLink } from "@/components/NavLink";

export const navItems = [
  { title: "Início", url: "/dashboard", icon: LayoutDashboard },
  { title: "Visitas", url: "/visitas", icon: ClipboardList },
  { title: "Nova", url: "/nova-visita", icon: PlusCircle },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-4">
        {navItems.map((item) => (
          <li key={item.url}>
            <NavLink
              to={item.url}
              end
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
              activeClassName="text-primary font-medium"
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
