import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import CompareTable from './components/CompareTable';
import useCompare from './hooks/useCompare';

export default function Edit() {
  const [idsText, setIdsText] = useState('');
  const { data, loading, error, fetchCompare } = useCompare();

  useEffect(() => {
    if (idsText) {
      const ids = idsText.split(',').map((s) => s.trim()).filter(Boolean).slice(0,5);
      if (ids.length) fetchCompare(ids);
    }
  }, [idsText]);

  return (
    <div className="zorg-compare-block">
      <div className="zorg-compare__controls">
        <label>
          {__('Provider IDs (comma separated)', 'zorgfinder-core')}
        </label>
        <input
          value={idsText}
          onChange={(e) => setIdsText(e.target.value)}
          placeholder="e.g. 12,45,7"
          className="zorg-compare__input"
        />
      </div>

      <div className="zorg-compare__preview">
        {loading && <p>{__('Loading…', 'zorgfinder-core')}</p>}
        {error && <p className="error">{error.message || error}</p>}
        {!loading && data && data.length === 0 && <p>{__('No providers found.', 'zorgfinder-core')}</p>}
        {data && data.length > 0 && <CompareTable providers={data} editorMode />}
      </div>

      <p className="zorg-compare__note">
        {__('Editor preview — frontend will fetch live data from the API.', 'zorgfinder-core')}
      </p>
    </div>
  );
}
