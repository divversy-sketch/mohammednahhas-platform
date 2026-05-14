export const defaultImagePlacement = {
  fit: 'contain',
  positionX: 50,
  positionY: 50,
  scale: 1,
  stretchX: 1,
  stretchY: 1,
};

const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

export const normalizeImagePlacement = (placement = {}) => ({
  fit: ['contain', 'cover', 'fill'].includes(placement?.fit) ? placement.fit : defaultImagePlacement.fit,
  positionX: clamp(placement?.positionX, 0, 100, defaultImagePlacement.positionX),
  positionY: clamp(placement?.positionY, 0, 100, defaultImagePlacement.positionY),
  scale: clamp(placement?.scale, 0.5, 2, defaultImagePlacement.scale),
  stretchX: clamp(placement?.stretchX, 0.5, 2, defaultImagePlacement.stretchX),
  stretchY: clamp(placement?.stretchY, 0.5, 2, defaultImagePlacement.stretchY),
});

export const imagePlacementStyle = (placement = {}) => {
  const p = normalizeImagePlacement(placement);
  return {
    objectFit: p.fit,
    objectPosition: `${p.positionX}% ${p.positionY}%`,
    transform: `scale(${p.scale}) scaleX(${p.stretchX}) scaleY(${p.stretchY})`,
    transformOrigin: `${p.positionX}% ${p.positionY}%`,
  };
};
