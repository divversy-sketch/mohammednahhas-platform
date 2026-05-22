import { useEffect, useState } from 'react';
import { subscribeCollection } from '../services/support.service.js';

export function useUpdateTicketStatus(collectionName = 'support') {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeCollection(collectionName, (nextItems) => {
      setItems(nextItems);
      setError(null);
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });
    return unsubscribe;
  }, [collectionName]);

  return { items, loading, error };
}

export default useUpdateTicketStatus;
