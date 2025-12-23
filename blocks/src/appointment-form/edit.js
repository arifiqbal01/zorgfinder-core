import { useBlockProps } from "@wordpress/block-editor";

export default function Edit() {
  const blockProps = useBlockProps();

  return (
    <div {...blockProps}>
      <div className="zf-appointment-form-editor-preview">
        <strong>Appointment request form</strong>
        <ul style={{ marginTop: "8px", fontSize: "13px" }}>
          <li>• Provider (optional / contextual)</li>
          <li>• Name</li>
          <li>• Email</li>
          <li>• Phone</li>
          <li>• Notes (optional)</li>
        </ul>
        <em style={{ fontSize: "12px", opacity: 0.7 }}>
          Rendered on frontend
        </em>
      </div>
    </div>
  );
}
