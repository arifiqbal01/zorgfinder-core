import { useEffect, useState } from "react";

export default function useReviewInvite() {
  const [state, setState] = useState({
    providerId: null,
    inviteId: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setState({
        providerId: null,
        inviteId: null,
        loading: false,
        error: "Missing invite token.",
      });
      return;
    }

    fetch(`/wp-json/zorg/v1/review-invites/verify?token=${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json?.success) {
          setState({
            providerId: null,
            inviteId: null,
            loading: false,
            error: json?.message || "Invite is invalid or expired.",
          });
          return;
        }

        setState({
          providerId: json.data.provider_id,
          inviteId: json.data.invite_id,
          loading: false,
          error: null,
        });
      })
      .catch(() => {
        setState({
          providerId: null,
          inviteId: null,
          loading: false,
          error: "Failed to verify invite.",
        });
      });
  }, []);

  return state;
}
