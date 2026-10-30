import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

const storageKey = "personal-financial-theme";

function getInitialTheme(): Theme {
  try {
    const savedTheme = window.localStorage.getItem(storageKey);

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {
    // Le thème reste utilisable si le stockage est indisponible.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // La préférence reste active pour la session courante.
    }
  }, [theme]);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Thème sombre"
      aria-pressed={isDark}
      title={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
      onClick={() =>
        setTheme((current) => (current === "dark" ? "light" : "dark"))
      }
    >
      {isDark ? (
        <Sun aria-hidden="true" className="size-4" />
      ) : (
        <Moon aria-hidden="true" className="size-4" />
      )}
    </Button>
  );
}