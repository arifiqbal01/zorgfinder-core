import CompareColumn from "./CompareColumn";

export default function CompareTableSection({
    id,
    title,
    labels,
    providers,
    tab,
    differencesOnly
}) {
    return (
        <section id={id} className="my-12">
            <h2 className="text-2xl font-semibold mb-6">{title}</h2>

            <div className="grid grid-cols-[220px_repeat(auto-fill,minmax(240px,1fr))] gap-4">
                
                {/* Left Labels */}
                <div className="space-y-4">
                    {labels.map(label => (
                        <div
                            key={label}
                            className="py-3 px-4 bg-gray-50 rounded font-medium text-gray-700"
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Provider values */}
                {providers.map(provider => (
                    <CompareColumn
                        key={provider.id}
                        provider={provider}
                        tab={tab}
                        differencesOnly={differencesOnly}
                        allProviders={providers}
                    />
                ))}
            </div>
        </section>
    );
}
