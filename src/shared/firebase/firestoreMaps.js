export const mapDocs = (snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

export const sortByFirestoreDateDesc = (fieldName) => (rows) =>
  [...rows].sort((a, b) => (b?.[fieldName]?.seconds || 0) - (a?.[fieldName]?.seconds || 0));

export const sortBySubmittedAtDesc = sortByFirestoreDateDesc('submittedAt');
export const sortByCreatedAtDesc = sortByFirestoreDateDesc('createdAt');
export const sortByTimestampDesc = sortByFirestoreDateDesc('timestamp');
