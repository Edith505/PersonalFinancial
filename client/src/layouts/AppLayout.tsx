import { useState } from "react";
import { Menu, Moon, Sun, Wallet, X } from "lucide-react";
import { Outlet } from "react-router";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/navigation/Sidebar";
import { UserProfileBlock } from "@/components/profile/UserProfileBlock";

export function AppLayout() {
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={isDark ? "dark" : undefined}>
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

        <div className="lg:pl-64">
          <header className="border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Menu principal"
                  aria-expanded={menuOpen}
                  aria-controls="mobile-navigation"
                  onClick={() => setMenuOpen((current) => !current)}
                >
                  {menuOpen ? (
                    <X aria-hidden="true" className="size-5" />
                  ) : (
                    <Menu aria-hidden="true" className="size-5" />
                  )}
                </Button>

                <UserProfileBlock
                  displayName="Alex Morgan"
                  subtitle="Profil de démonstration"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Activer le thème sombre"
                aria-pressed={isDark}
                onClick={() => setIsDark((current) => !current)}
              >
                {isDark ? (
                  <Sun aria-hidden="true" className="size-4" />
                ) : (
                  <Moon aria-hidden="true" className="size-4" />
                )}
              </Button>
            </div>

            <div
              id="mobile-navigation"
              hidden={!menuOpen}
              className="mt-4 lg:hidden"
            >
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </div>
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto max-w-7xl px-5 py-8 sm:px-8"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}