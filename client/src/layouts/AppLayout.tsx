import { useState } from "react";
import { Wallet } from "lucide-react";
import { Outlet } from "react-router";
import { PageContainer } from "@/components/layout/PageContainer";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/navigation/Sidebar";

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-blue-600 px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto border-r border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="mb-8 flex items-center gap-3 px-2">
          <Wallet aria-hidden="true" className="size-7 text-blue-600" />
          <span className="font-semibold tracking-tight">
            Personal Financial
          </span>
        </div>

        <Sidebar />
      </aside>

      <div className="min-w-0 lg:pl-64">
        <Topbar
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((current) => !current)}
        />

        <div
          id="mobile-navigation"
          hidden={!menuOpen}
          className="border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:hidden"
        >
          <Sidebar onNavigate={() => setMenuOpen(false)} />
        </div>

        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
    </div>
  );
}