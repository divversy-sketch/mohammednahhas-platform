import { useEffect, useMemo, useState } from 'react';
import { subscribePublicContent } from '../services/publicContent.service.js';

export function usePublicContent() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribePublicContent(
      (items) => {
        setContent(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const videos = useMemo(() => content.filter((item) => item.type === 'video'), [content]);
  const htmls = useMemo(() => content.filter((item) => item.type === 'html'), [content]);

  return { content, videos, htmls, loading, error };
}
