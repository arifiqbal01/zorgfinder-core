import SaveCompareButton from "../components/SaveCompareButton";

export default function CompareHeader({ title, providerIds }) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-900">
          {title}
        </h2>

        <SaveCompareButton providerIds={providerIds} />
      </div>
    </div>
  );
}
