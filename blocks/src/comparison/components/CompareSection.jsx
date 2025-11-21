import React from "react";
import SectionColumn from "./SectionColumn";

export default function CompareSection({ id, title, labels, providers, dataMapper, differencesOnly }) {
    return (
        <section id={id} className="my-20">
            <h2 className="text-3xl font-semibold mb-8 text-gray-900">{title}</h2>

            <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-100 bg-white">
                <div className="grid grid-cols-[220px_repeat(auto-fill,minmax(240px,1fr))]">

                    {/* LEFT LABELS */}
                    <div className="bg-gray-50 border-r border-gray-100">
                        {labels.map(label => (
                            <div
                                key={label}
                                className="py-4 px-5 font-medium text-gray-700 border-b border-gray-100"
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* VALUES */}
                    {providers.map(provider => (
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
            </div>
        </section>
    );
}
