import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
};

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full min-w-0 max-w-7xl px-5 py-8 sm:px-8"
    >
      {children}
    </main>
  );
}