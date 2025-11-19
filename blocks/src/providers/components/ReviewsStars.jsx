import { useReviews } from '../hooks/useReviews';

export default function ReviewsStars({ providerId }) {
    const { rating, count } = useReviews(providerId);

    return (
        <div className="zf-stars">
            ⭐ {rating} ({count})
        </div>
    );
}
