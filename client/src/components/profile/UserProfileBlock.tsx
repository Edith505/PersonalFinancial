import { Link } from "react-router";

type UserProfileBlockProps = {
  displayName: string;
  subtitle?: string;
};

export function UserProfileBlock({
  displayName,
  subtitle = "Personal Finance",
}: UserProfileBlockProps) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <Link
      to="/settings"
      aria-label={`Paramètres du profil de ${displayName}`}
      className="flex min-w-0 items-center gap-3 rounded-xl p-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:bg-slate-800"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      >
        {initials || "?"}
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">
          {displayName}
        </span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </span>
      </span>
    </Link>
  );
}