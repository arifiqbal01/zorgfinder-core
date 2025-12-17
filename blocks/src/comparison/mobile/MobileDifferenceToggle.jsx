import { Toggle } from '../../ui';
import { __ } from '../utils/i18n';

export default function MobileDifferenceToggle({ value, onChange }) {
  // ✅ guard against missing handler
  if (typeof value !== 'boolean' || typeof onChange !== 'function') {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <Toggle
        label={__('Show only the differences', 'zorg')}
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}
