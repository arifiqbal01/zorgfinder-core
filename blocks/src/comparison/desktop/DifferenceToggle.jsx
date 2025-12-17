import { Toggle } from '../../ui';
import { __ } from '../utils/i18n';

export default function DifferenceToggle({ value, onChange }) {
  if (typeof value !== 'boolean') return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <Toggle
        label={__('Show only the differences', 'zorg')}
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}
