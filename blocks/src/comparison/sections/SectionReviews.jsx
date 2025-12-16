import CompareSection from "../components/CompareSection";
import { Stars } from "../../ui";

export default function SectionReviews({ providers, differencesOnly }) {
  return (
    <CompareSection
      id="reviews"
      title="Reviews"
      labels={[
        "Overall",
        "Staff",
        "Communication",
        "Cleanliness",
        "Facilities",
        "Professionalism",
        "Total reviews",
      ]}
      providers={providers}
      differencesOnly={differencesOnly}
      dataMapper={(p) => [
        <Stars value={p.reviews?.overall || 0} />,
        p.reviews?.staff || 0,
        p.reviews?.communication || 0,
        p.reviews?.cleanliness || 0,
        p.reviews?.facilities || 0,
        p.reviews?.professionalism || 0,
        p.reviews?.count || 0,
      ]}
    />
  );
}
