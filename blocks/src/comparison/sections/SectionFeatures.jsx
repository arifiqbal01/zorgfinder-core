import CompareSection from "../components/CompareSection";

export default function SectionFeatures({ providers, differencesOnly }) {
    return (
        <CompareSection
            id="features"
            title="Features"
            labels={[
                "Type",
                "Indication",
                "Organization",
                "Religion",
                "HKZ"
            ]}
            providers={providers}
            differencesOnly={differencesOnly}
            dataMapper={(p) => [
                p.type_of_care,
                p.indication_type,
                p.organization_type,
                p.religion,
                p.has_hkz ? "Yes" : "No",
            ]}
        />
    );
}
