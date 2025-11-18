import { __ } from "@wordpress/i18n";
import { PanelBody, TextControl, SelectControl } from "@wordpress/components";
import { InspectorControls } from "@wordpress/block-editor";
import { useEffect, useState } from "react";

const Edit = ({ attributes, setAttributes }) => {
  const { providerId, title } = attributes;

  const [providers, setProviders] = useState([]);

  useEffect(() => {
    // Load providers for dropdown
    fetch("/wp-json/zorg/v1/providers?per_page=999")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success) setProviders(json.data);
      })
      .catch(() => setProviders([]));
  }, []);

  return (
    <>
      <InspectorControls>
        <PanelBody title="Appointment Settings" initialOpen={true}>
          <TextControl
            label="Form Title"
            value={title}
            onChange={(value) => setAttributes({ title: value })}
          />

          <SelectControl
            label="Default Provider"
            value={providerId}
            options={[
              { label: "None (user selects)", value: 0 },
              ...providers.map((p) => ({
                label: p.name,
                value: p.id,
              })),
            ]}
            onChange={(value) => setAttributes({ providerId: Number(value) })}
          />
        </PanelBody>
      </InspectorControls>

      <div className="zf-block-preview">
        <h3>{title}</h3>
        <p className="text-gray-500 text-sm">
          Appointment form will appear here on the website.
        </p>
      </div>
    </>
  );
};

export default Edit;
