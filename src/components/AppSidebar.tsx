import { LayoutDashboard, ClipboardList, PlusCircle, BarChart3, LogOut, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Visitas", url: "/visitas", icon: ClipboardList },
  { title: "Nova Visita", url: "/nova-visita", icon: PlusCircle },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

const adminItems = [
  { title: "Usuários", url: "/usuarios", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user, profile, isAdmin } = useAuth();

  const allItems = isAdmin ? [...menuItems, ...adminItems] : menuItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-4">
            {!collapsed && (
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold tracking-wide text-sidebar-primary-foreground">SINTEL</span>
                <span className="text-[10px] font-normal text-sidebar-foreground/60">Visitas Sindicais</span>
              </div>
            )}
            {collapsed && <span className="text-xs font-bold text-sidebar-primary-foreground">S</span>}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && user && (
          <div className="px-3 py-2 text-xs text-sidebar-foreground/50 truncate">
            {profile?.full_name || user.email}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="hover:bg-sidebar-accent text-sidebar-foreground/70">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
