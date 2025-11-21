import React, { useEffect, useState } from "react";
import TopSummaryCards from "./components/TopSummaryCards";
import QuickNav from "./components/QuickNav";
import DifferencesToggle from "./components/DifferencesToggle";
import SectionFeatures from "./sections/SectionFeatures";
import SectionReimbursements from "./sections/SectionReimbursements";
import SectionReviews from "./sections/SectionReviews";
import SectionAppointments from "./sections/SectionAppointments";
import SectionDetails from "./sections/SectionDetails";
import ProviderSearch from "./components/ProviderSearch";
import useCompare from "./hooks/useCompare";

const STORAGE_KEY = "zorg_compare_cart_v1";

function readCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
}

function writeCart(ids) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export default function ComparePage() {
    const { data, loading, error, fetchCompare } = useCompare();
    const [ids, setIds] = useState(readCart());
    const [differencesOnly, setDifferencesOnly] = useState(false);

    useEffect(() => {
        if (ids.length) fetchCompare(ids);
    }, []);

    function updateCart(newIds) {
        writeCart(newIds);
        setIds(newIds);
        if (newIds.length) fetchCompare(newIds);
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">

            {/* SEARCH */}
            <ProviderSearch
                onSelect={(id) => updateCart([...new Set([...ids, id])].slice(0,5))}
            />

            {loading && <p className="text-gray-500">Loading comparison…</p>}
            {error && <p className="text-red-500">{error.message}</p>}

            {data && data.length > 0 && (
                <>
                    <TopSummaryCards providers={data} />

                    <QuickNav />

                    <DifferencesToggle
                        value={differencesOnly}
                        onChange={() => setDifferencesOnly(!differencesOnly)}
                    />

                    {/* SECTIONS */}
                    <SectionFeatures
                        providers={data}
                        differencesOnly={differencesOnly}
                    />

                    <SectionReimbursements
                        providers={data}
                        differencesOnly={differencesOnly}
                    />

                    <SectionReviews
                        providers={data}
                        differencesOnly={differencesOnly}
                    />

                    <SectionAppointments
                        providers={data}
                        differencesOnly={differencesOnly}
                    />

                    <SectionDetails
                        providers={data}
                        differencesOnly={differencesOnly}
                    />
                </>
            )}
        </div>
    );
}
