export default function useReviewSubmit() {
  return async ({ provider_id, invite_id, ratings, comment }) => {
    const nonce = window?.zorgFinderApp?.nonce;

    if (!nonce) {
      return {
        ok: false,
        status: 403,
        message: "Missing security nonce",
      };
    }

    const res = await fetch("/wp-json/zorg/v1/reviews", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": nonce,
      },
      body: JSON.stringify({
        provider_id,
        invite_id,
        rating_staff: Number(ratings.staff),
        rating_communication: Number(ratings.communication),
        rating_cleanliness: Number(ratings.cleanliness),
        rating_facilities: Number(ratings.facilities),
        rating_professionalism: Number(ratings.professionalism),
        comment,
      }),
    });

    const json = await res.json();

    return {
      ok: res.ok,
      status: res.status,
      ...json,
    };
  };
}
