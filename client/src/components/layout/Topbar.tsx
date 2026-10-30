import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfileBlock } from "@/components/profile/UserProfileBlock";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type TopbarProps = {
  menuOpen: boolean;
  onToggleMenu: () => void;
};

export function Topbar({ menuOpen, onToggleMenu }: TopbarProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label="Menu principal"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={onToggleMenu}
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

        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}