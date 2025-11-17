import { useState, useEffect } from "@wordpress/element";
import { PanelBody, ToggleControl, TextControl, SelectControl } from "@wordpress/components";
import { InspectorControls } from "@wordpress/block-editor";

export default function Edit({ attributes, setAttributes }) {
  const { providerId, showTitle, titleText } = attributes;
  const [providers, setProviders] = useState([]);

  // Fetch providers for dropdown
  const fetchProviders = async () => {
    const res = await fetch("/wp-json/zorg/v1/providers?per_page=999");
    const json = await res.json();
    if (json.success) setProviders(json.data);
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  return (
    <>
      <InspectorControls>
        <PanelBody title="Form Settings">

          <ToggleControl
            label="Show Title"
            checked={showTitle}
            onChange={(v) => setAttributes({ showTitle: v })}
          />

          {showTitle && (
            <TextControl
              label="Form Title"
              value={titleText}
              onChange={(v) => setAttributes({ titleText: v })}
            />
          )}

          <SelectControl
            label="Provider"
            value={providerId}
            onChange={(v) => setAttributes({ providerId: parseInt(v) })}
            options={[
              { label: "User selects provider", value: 0 },
              ...providers.map((p) => ({
                label: `${p.name} (#${p.id})`,
                value: p.id,
              })),
            ]}
          />
        </PanelBody>
      </InspectorControls>

      <div className="zf-review-form-preview">
        {showTitle && <h3>{titleText}</h3>}
        <p>(Review form will display on the frontend)</p>
      </div>
    </>
  );
}
