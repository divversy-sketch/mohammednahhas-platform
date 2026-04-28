import { auth } from './firebase';

export async function callAdminAI(payload) {
  const token = await auth?.currentUser?.getIdToken?.();
  const res = await fetch('/api/ai-coach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || data?.reason || 'تعذر تشغيل AI');
  return data;
}
