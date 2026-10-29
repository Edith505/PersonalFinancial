import { BrowserRouter, Route, Routes } from "react-router";
import { AppLayout } from "@/layouts/AppLayout";
import { ModulePlaceholderPage } from "@/pages/ModulePlaceholderPage";
import { navigationItems } from "@/routes/navigation";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {navigationItems.map(({ path, label }) => (
            <Route
              key={path}
              path={path}
              element={<ModulePlaceholderPage title={label} />}
            />
          ))}

          <Route
            path="*"
            element={
              <section>
                <h1 className="text-3xl font-semibold">
                  Page introuvable
                </h1>
                <p className="mt-3 text-muted-foreground">
                  Utilisez le menu pour rejoindre un module.
                </p>
              </section>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}