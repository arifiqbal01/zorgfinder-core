import { createRoot } from "react-dom/client";
import React from "react";
import ReviewForm from "./components/ReviewForm";
import useReviewInvite from "./hooks/useReviewInvite";

function SubmitReviewApp() {
  const { providerId, inviteId, loading, error } = useReviewInvite();

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-600">
        Validating invite…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!providerId || !inviteId) {
    return (
      <div className="p-10 text-center text-gray-600">
        Invalid or expired invite.
      </div>
    );
  }

  return (
    <ReviewForm
      providerId={providerId}
      inviteId={inviteId}
    />
  );
}

function mountSubmitReview() {
  const el = document.querySelector(".zf-submit-review-root");
  if (!el) return;

  if (el.dataset.mounted === "true") return;
  el.dataset.mounted = "true";

  createRoot(el).render(<SubmitReviewApp />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountSubmitReview);
} else {
  mountSubmitReview();
}
