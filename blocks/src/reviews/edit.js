import { useState, useEffect } from "@wordpress/element";
import { PanelBody, SelectControl, ToggleControl, RangeControl } from "@wordpress/components";
import { InspectorControls } from "@wordpress/block-editor";

const Edit = ({ attributes, setAttributes }) => {
  const { providerId, limit, approvedOnly, withComments, ratingFilter, sortBy } = attributes;

  const [reviews, setReviews] = useState([]);

  const fetchReviews = async () => {
    const params = new URLSearchParams();

    if (providerId) params.append("provider_id", providerId);
    if (approvedOnly) params.append("approved", 1);
    if (withComments) params.append("search", " "); // will filter by having non-empty comment in PHP later

    const res = await fetch(`/wp-json/zorg/v1/reviews?${params.toString()}`);
    const json = await res.json();

    if (json.success) {
      let data = json.data;

      // rating filter
      if (ratingFilter === "5") data = data.filter(r => r.rating === 5);
      if (ratingFilter === "4") data = data.filter(r => r.rating === 4);
      if (ratingFilter === "4-5") data = data.filter(r => r.rating >= 4);

      // comments only
      if (withComments) data = data.filter(r => r.comment);

      // sort
      if (sortBy === "latest") data = data.sort((a,b)=> new Date(b.created_at)- new Date(a.created_at));
      if (sortBy === "oldest") data = data.sort((a,b)=> new Date(a.created_at)- new Date(b.created_at));
      if (sortBy === "rating") data = data.sort((a,b)=> b.rating - a.rating);

      setReviews(data.slice(0, limit));
    }
  };

  useEffect(() => { fetchReviews(); }, [providerId, limit, approvedOnly, withComments, ratingFilter, sortBy]);

  return (
    <>
      <InspectorControls>
        <PanelBody title="Review Settings">

          <RangeControl
            label="Limit"
            value={limit}
            onChange={(v) => setAttributes({ limit: v })}
            min={1}
            max={20}
          />

          <ToggleControl
            label="Approved Only"
            checked={approvedOnly}
            onChange={(v) => setAttributes({ approvedOnly: v })}
          />

          <ToggleControl
            label="With Comments Only"
            checked={withComments}
            onChange={(v) => setAttributes({ withComments: v })}
          />

          <SelectControl
            label="Rating Filter"
            value={ratingFilter}
            onChange={(v) => setAttributes({ ratingFilter: v })}
            options={[
              { label: "All Ratings", value: "all" },
              { label: "5 Stars", value: "5" },
              { label: "4 Stars", value: "4" },
              { label: "4–5 Stars", value: "4-5" }
            ]}
          />

          <SelectControl
            label="Sort By"
            value={sortBy}
            onChange={(v) => setAttributes({ sortBy: v })}
            options={[
              { label: "Latest", value: "latest" },
              { label: "Oldest", value: "oldest" },
              { label: "Highest Rated", value: "rating" }
            ]}
          />
        </PanelBody>
      </InspectorControls>

      <div className="zf-reviews-block-preview">
        <h4 className="zf-reviews-title">Reviews Preview</h4>

        {!reviews.length && <p>No reviews found.</p>}

        {reviews.map((rev) => (
          <div key={rev.id} className="zf-review-item">
            <div className="zf-rating">{rev.rating} ⭐</div>
            <div className="zf-comment">{rev.comment || "(No comment)"}</div>
            <div className="zf-date">{rev.created_at}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Edit;
