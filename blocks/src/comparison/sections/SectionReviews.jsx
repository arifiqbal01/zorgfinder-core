import CompareSection from "../components/CompareSection";

export default function SectionReviews({ providers, differencesOnly }) {
    return (
        <CompareSection
            id="reviews"
            title="Reviews"
            labels={["Average Rating", "Total Reviews"]}
            providers={providers}
            differencesOnly={differencesOnly}
            dataMapper={(p) => [
                p.reviews?.avg_rating || 0,
                p.reviews?.total || 0
            ]}
        />
    );
}
