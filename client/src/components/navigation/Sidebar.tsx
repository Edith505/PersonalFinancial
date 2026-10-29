import { NavLink } from "react-router";
import { navigationItems } from "@/routes/navigation";

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <nav aria-label="Navigation principale" className="space-y-1">
      {navigationItems.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm",
              "focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-blue-600",
              isActive
                ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
            ].join(" ")
          }
        >
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}