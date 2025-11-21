import CompareSection from "../components/CompareSection";

export default function SectionAppointments({ providers, differencesOnly }) {
    return (
        <CompareSection
            id="appointments"
            title="Appointments"
            labels={["Next Available", "Taken Slots"]}
            providers={providers}
            differencesOnly={differencesOnly}
            dataMapper={(p) => [
                p.appointments?.next_available_date || "—",
                p.appointments?.taken_slots?.join(", ") || "None"
            ]}
        />
    );
}
