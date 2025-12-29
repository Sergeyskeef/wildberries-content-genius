import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Database,
  Sparkles,
  Settings,
  User,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Дашборд" },
  { to: "/sources", icon: Search, label: "Источники" },
  { to: "/content", icon: Database, label: "База контента" },
  { to: "/generator", icon: Sparkles, label: "Генератор" },
  { to: "/history", icon: History, label: "История" },
  { to: "/profile", icon: User, label: "Профиль эксперта" },
  { to: "/settings", icon: Settings, label: "Настройки" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">ContentFlow</h1>
            <p className="text-xs text-sidebar-foreground/60">для Wildberries</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Наташа</p>
              <p className="text-xs text-sidebar-foreground/60">Эксперт WB</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
