(function () {
    if (typeof window.ZF_REVIEW_FORM_LOADED !== "undefined") return;
    window.ZF_REVIEW_FORM_LOADED = true;

    // REST prefix and nonce passed via wp_localize_script
    const REST_BASE =
        window.zorgFinderReview?.restUrl?.endsWith("/")
            ? window.zorgFinderReview.restUrl
            : window.zorgFinderReview?.restUrl + "/" ||
              "/wp-json/zorg/v1/";

    const NONCE = window.zorgFinderReview?.nonce || null;

    function createMessage(container, text, type = "success") {
        container.innerHTML = `<div class="zf-message-${type}">${text}</div>`;
    }

    function clearMessage(container) {
        container.innerHTML = "";
    }

    function initForm(wrapper) {
        if (!(wrapper instanceof HTMLElement)) return;

        const form = wrapper.querySelector(".zf-review-form-inner");
        if (!form) return;

        const providerInput = wrapper.querySelector(".zf-provider-id");
        const ratingInput = wrapper.querySelector(".zf-rating");
        const commentInput = wrapper.querySelector(".zf-comment");
        const message = wrapper.querySelector(".zf-message");

        // prevent double-init
        if (form.dataset.zfInit === "1") return;
        form.dataset.zfInit = "1";

        form.dataset.submitting = "0";

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearMessage(message);

            if (form.dataset.submitting === "1") return;
            form.dataset.submitting = "1";

            const provider_id =
                providerInput?.value ||
                wrapper.dataset?.providerId ||
                "";

            const rating = Number(ratingInput?.value || 0);
            const comment = commentInput?.value?.trim() || "";

            if (!provider_id || rating < 1) {
                createMessage(
                    message,
                    "Provider and rating are required.",
                    "error"
                );
                form.dataset.submitting = "0";
                return;
            }

            const submitBtn = form.querySelector(".zf-submit-btn");
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add("zf-disabled");
            }

            try {
                const res = await fetch(REST_BASE + "reviews", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-WP-Nonce": NONCE || "",
                    },
                    body: JSON.stringify({
                        provider_id: Number(provider_id),
                        rating,
                        comment,
                    }),
                });

                const json = await res.json();

                if (json?.success) {
                    createMessage(
                        message,
                        "Review submitted — pending approval.",
                        "success"
                    );

                    // Reset form
                    form.reset();

                    // Real-time average update (optional)
                    updateAverageRating(provider_id);
                } else {
                    createMessage(
                        message,
                        json?.message ||
                            json?.data?.message ||
                            "Could not save review.",
                        "error"
                    );
                }
            } catch (err) {
                createMessage(
                    message,
                    "Network error. Please try again later.",
                    "error"
                );
            } finally {
                form.dataset.submitting = "0";
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove("zf-disabled");
                }
            }
        });
    }

    // Real-time average rating update after submission
    function updateAverageRating(providerId) {
        if (!providerId) return;

        fetch(`${REST_BASE}reviews?provider_id=${providerId}`)
            .then((r) => r.json())
            .then((data) => {
                if (!data?.success) return;

                const avg = data?.data?.average;
                if (typeof avg === "undefined") return;

                document
                    .querySelectorAll(
                        `.zf-provider-average[data-provider="${providerId}"] .avg-value`
                    )
                    .forEach((el) => {
                        el.textContent = Number(avg).toFixed(1);
                    });
            })
            .catch(() => {});
    }

    // Init on DOM load
    document.addEventListener("DOMContentLoaded", () => {
        document
            .querySelectorAll(".zf-review-form")
            .forEach((wrapper) => initForm(wrapper));
    });

    // Init for dynamically added forms (page builders)
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;

                if (node.matches(".zf-review-form")) {
                    initForm(node);
                }

                const forms =
                    node.querySelectorAll?.(".zf-review-form") || [];
                forms.forEach((f) => initForm(f));
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
