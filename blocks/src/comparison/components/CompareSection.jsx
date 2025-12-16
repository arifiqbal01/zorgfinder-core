import SectionColumn from "./SectionColumn";
import { Card } from "../../ui";

export default function CompareSection({
  id,
  title,
  labels,
  providers,
  dataMapper,
  differencesOnly,
}) {
  return (
    <section id={id} className="my-20">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900">
        {title}
      </h2>

      <Card className="overflow-x-auto p-0">
        <div className="grid grid-cols-[220px_repeat(auto-fill,minmax(240px,1fr))]">
          {/* LABELS */}
          <div className="bg-gray-50 border-r">
            {labels.map((label) => (
              <div
                key={label}
                className="px-5 py-4 text-sm font-medium text-gray-600 border-b"
              >
                {label}
              </div>
            ))}
          </div>

          {/* PROVIDERS */}
          {providers.map((provider) => (
            <SectionColumn
              key={provider.id}
              provider={provider}
              labels={labels}
              dataMapper={dataMapper}
              differencesOnly={differencesOnly}
              providers={providers}
            />
          ))}
        </div>
      </Card>
    </section>
  );
}
