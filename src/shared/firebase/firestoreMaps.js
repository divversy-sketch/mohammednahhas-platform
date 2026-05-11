const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export const mapDocs = (snapshot) => snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

export const sortByCreatedAtDesc = (items = []) => [...items].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
export const sortBySubmittedAtDesc = (items = []) => [...items].sort((a, b) => toMillis(b.submittedAt || b.createdAt) - toMillis(a.submittedAt || a.createdAt));
export const sortByTimestampDesc = (items = []) => [...items].sort((a, b) => toMillis(b.timestamp || b.createdAt) - toMillis(a.timestamp || a.createdAt));
