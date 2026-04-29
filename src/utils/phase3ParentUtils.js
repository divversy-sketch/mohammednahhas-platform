// src/utils/phase3ParentUtils.js
export function calcAveragePercentage(results = []) {
  if (!Array.isArray(results) || results.length === 0) return 0;
  return Math.round(
    results.reduce((sum, r) => sum + Number(r.percentage || 0), 0) / results.length
  );
}

export function normalizePhone(value = "") {
  return String(value || "").replace(/\D/g, "").slice(0, 11);
}
