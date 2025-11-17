// File: assets/js/review-form-frontend.js
(function () {
  if (typeof window.ZF_REVIEW_FORM_LOADED !== 'undefined') {
    // already loaded
    return;
  }
  window.ZF_REVIEW_FORM_LOADED = true;

  const REST_BASE = (window.zorgFinderReview && zorgFinderReview.restUrl) ? zorgFinderReview.restUrl : '/wp-json/zorg/v1/';
  const NONCE = (window.zorgFinderReview && zorgFinderReview.nonce) ? zorgFinderReview.nonce : null;

  function createMessage(container, text, type = 'success') {
    container.innerHTML = `<div class="zf-message-${type}">${text}</div>`;
  }

  function clearMessage(container) {
    container.innerHTML = '';
  }

  function setStars(starWrapper, val) {
    const stars = starWrapper.querySelectorAll('.zf-star');
    stars.forEach(s => {
      const n = Number(s.getAttribute('data-star'));
      if (n <= val) {
        s.classList.add('active');
        s.setAttribute('aria-checked', 'true');
      } else {
        s.classList.remove('active');
        s.setAttribute('aria-checked', 'false');
      }
    });
    starWrapper.setAttribute('data-selected', String(val));
  }

  function initForm(wrapper) {
    const form = wrapper.querySelector('.zf-review-form-inner');
    const starsGroup = wrapper.querySelector('.zf-stars');
    const hiddenRating = wrapper.querySelector('.zf-rating');
    const providerInput = wrapper.querySelector('.zf-provider-id');
    const message = wrapper.querySelector('.zf-message');

    if (!form) return;

    // Prevent double submit
    form.dataset.submitting = '0';

    // Initialize stars from hidden value (if any)
    const initial = Number(hiddenRating ? hiddenRating.value : 0);
    if (starsGroup) setStars(starsGroup, initial);

    // Star click / keyboard support (delegation)
    if (starsGroup) {
      starsGroup.addEventListener('click', (ev) => {
        const star = ev.target.closest('.zf-star');
        if (!star) return;
        const val = Number(star.getAttribute('data-star') || 0);
        if (hiddenRating) hiddenRating.value = String(val);
        setStars(starsGroup, val);
      });

      // keyboard navigation
      starsGroup.addEventListener('keydown', (ev) => {
        const key = ev.key;
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(key)) return;
        ev.preventDefault();
        const current = Number(starsGroup.getAttribute('data-selected') || 0);
        let next = current;
        if (key === 'ArrowLeft' || key === 'ArrowDown') next = Math.max(1, current - 1);
        if (key === 'ArrowRight' || key === 'ArrowUp') next = Math.min(5, current + 1);
        if (key === 'Enter' || key === ' ') {
          // same as click — do nothing special here
        }
        if (hiddenRating) hiddenRating.value = String(next);
        setStars(starsGroup, next);
      });
    }

    // Prevent duplicate handlers if script somehow re-inits same form
    if (form.dataset.zfInitialized === '1') return;
    form.dataset.zfInitialized = '1';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearMessage(message);

      if (form.dataset.submitting === '1') return;
      form.dataset.submitting = '1';

      const provider_id = providerInput ? providerInput.value : wrapper.dataset.providerId || '';
      const rating = hiddenRating ? Number(hiddenRating.value) : 0;
      const comment = (form.querySelector('.zf-comment') || {}).value || '';

      if (! provider_id || ! rating) {
        createMessage(message, 'Provider and rating are required.', 'error');
        form.dataset.submitting = '0';
        return;
      }

      try {
        const res = await fetch(REST_BASE + 'reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': NONCE || ''
          },
          body: JSON.stringify({
            provider_id: Number(provider_id),
            rating: Number(rating),
            comment: String(comment || '')
          })
        });

        const json = await res.json();

        if (json && json.success) {
          createMessage(message, 'Review submitted — pending approval.', 'success');
          form.reset();
          if (starsGroup) setStars(starsGroup, 0);
        } else {
          const msg = (json && (json.message || (json.data && json.data.message))) ? (json.message || json.data.message) : 'Could not save review.';
          createMessage(message, msg, 'error');
        }
      } catch (err) {
        createMessage(message, 'Network error. Please try again later.', 'error');
      } finally {
        form.dataset.submitting = '0';
      }
    });
  }

  // Init existing blocks on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.zf-review-form').forEach(wrapper => {
      initForm(wrapper);
    });
  });

  // Observe dynamic insertion (e.g. page builders that add blocks later)
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const node of Array.from(m.addedNodes)) {
        if (!(node instanceof HTMLElement)) continue;
        const found = node.querySelectorAll && node.querySelectorAll('.zf-review-form');
        if (found && found.length) {
          found.forEach(wrapper => initForm(wrapper));
        }
        if (node.matches && node.matches('.zf-review-form')) initForm(node);
      }
    }
  });

  observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

})();
