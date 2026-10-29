import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ModulePlaceholderPageProps = {
  title: string;
};

export function ModulePlaceholderPage({
  title,
}: ModulePlaceholderPageProps) {
  return (
    <section aria-labelledby="page-title">
      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
        Personal Financial
      </p>

      <h1
        id="page-title"
        className="mt-2 text-3xl font-semibold tracking-tight"
      >
        {title}
      </h1>

      <Card className="mt-8 rounded-2xl">
        <CardHeader>
          <CardTitle>Module en préparation</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            La navigation est prête. Le contenu de cette page sera construit
            lors de son étape dédiée.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}