import { useEffect, useState } from '@wordpress/element';
import { Spinner, Notice } from '@wordpress/components';

const Edit = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/wp-json/zorg/v1/providers')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch providers');
        return res.json();
      })
      .then((data) => {
        console.log('API Response:', data);

        // ✅ Right place to safely assign provider data
        setProviders(Array.isArray(data?.data) ? data.data : []);

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Notice status="error" isDismissible={false}>{error}</Notice>;
  if (!providers.length) return <Notice status="warning">No providers found.</Notice>;

  return (
    <div className="zf-card">
      <h3 className="text-xl font-semibold mb-4">ZorgFinder Providers</h3>
      <ul className="space-y-2">
        {providers.map((p) => (
          <li key={p.id} className="border-b border-gray-100 pb-2">
            <strong className="text-gray-900">{p.name}</strong>
            <p className="text-sm text-gray-500">{p.type_of_care}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Edit;
