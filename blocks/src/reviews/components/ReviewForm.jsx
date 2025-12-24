import { useEffect, useState } from "react";
import StarRatingPicker from "./StarRatingPicker";
import useReviewSubmit from "../hooks/useReviewSubmit";
import Button from "../../ui/Button";

export default function ReviewForm({ providerId, inviteId }) {
  const submitReview = useReviewSubmit();

  const [ratings, setRatings] = useState({
    staff: 0,
    communication: 0,
    cleanliness: 0,
    facilities: 0,
    professionalism: 0,
  });

  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("idle");

  // ✅ correct auth source
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!window?.zorgFinderApp?.isLoggedIn
  );

  // 🔁 react to login from drawer
  useEffect(() => {
    const onAuth = () => {
      setIsLoggedIn(!!window?.zorgFinderApp?.isLoggedIn);
    };

    window.addEventListener("zf:auth-updated", onAuth);
    return () => window.removeEventListener("zf:auth-updated", onAuth);
  }, []);

  const openAuth = () => {
    window?.zfOpenAuth?.({ mode: "login" });
  };

  const submit = async () => {
    setStatus("submitting");

    const res = await submitReview({
      provider_id: providerId,
      invite_id: inviteId,
      ratings,
      comment,
    });

    setStatus(res.ok ? "success" : "error");
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-3">
          Login required
        </h2>

        <p className="text-gray-600 mb-4">
          Please log in or register to submit your review.
        </p>

        <Button onClick={openAuth}>
          Login / Register
        </Button>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-semibold text-green-600">
          Thank you for your review!
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow space-y-4">
      <h2 className="text-xl font-semibold">
        Submit your review
      </h2>

      {Object.keys(ratings).map((key) => (
        <div key={key} className="flex justify-between items-center">
          <span className="capitalize text-gray-700">
            {key}
          </span>
          <StarRatingPicker
            value={ratings[key]}
            onChange={(v) =>
              setRatings({ ...ratings, [key]: v })
            }
          />
        </div>
      ))}

      <textarea
        className="input w-full min-h-[120px]"
        placeholder="Write your comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <Button onClick={submit} disabled={status === "submitting"}>
        Submit review
      </Button>

      {status === "error" && (
        <div className="text-red-600 text-sm">
          Failed to submit review.
        </div>
      )}
    </div>
  );
}
