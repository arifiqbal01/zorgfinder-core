import CompareSection from "../components/CompareSection";

export default function SectionReimbursements({ providers, differencesOnly }) {
    return (
        <CompareSection
            id="reimbursements"
            title="Reimbursements"
            labels={[
                "Reimbursement Type",
                "Coverage"
            ]}
            providers={providers}
            differencesOnly={differencesOnly}
            dataMapper={(p) => [
                p.reimbursements?.map(r => r.type).join(", ") || "None",
                p.reimbursements?.map(r => r.coverage_details || r.description).join("; ") || "None"
            ]}
        />
    );
}
