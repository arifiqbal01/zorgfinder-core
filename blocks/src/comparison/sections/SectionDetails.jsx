import CompareSection from "../components/CompareSection";

export default function SectionDetails({ providers, differencesOnly }) {
    return (
        <CompareSection
            id="details"
            title="Additional Details"
            labels={["Address", "Email", "Phone"]}
            providers={providers}
            differencesOnly={differencesOnly}
            dataMapper={(p) => [
                p.address || "—",
                p.email || "—",
                p.phone || "—"
            ]}
        />
    );
}
