import { SKINS } from '../skins.js';

/**
 * Grid of the ten skins. Each card shows the day and night palette side by side.
 * value '' = follow the platform default (only offered when `platformDefault` is passed).
 */
export function SkinPicker({ value, onChange, platformDefault, label = 'تصميم المنصة' }) {
  const options = platformDefault ? [{ id: '', name: 'زي المنصة', tagline: `التصميم اللي المستر مختاره (${SKINS.find((s) => s.id === platformDefault)?.name || 'النحاس'})`, ref: SKINS.find((s) => s.id === platformDefault) || SKINS[0] }, ...SKINS.map((s) => ({ ...s, ref: s }))] : SKINS.map((s) => ({ ...s, ref: s }));
  return (
    <div className="nx-skins" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id || 'default'} type="button" role="radio" aria-checked={value === o.id} className="nx-skin" onClick={() => onChange(o.id)}>
          <span className="nx-skin__swatch" aria-hidden="true">
            {['light', 'dark'].map((m) => (
              <span key={m} style={{ background: o.ref[m].bg, color: o.ref[m].accent }}>
                <b>{m === 'light' ? 'نهار' : 'ليل'}</b>
                <span className="nx-skin__dots"><i style={{ background: o.ref[m].accent }} /><i style={{ background: o.ref[m].gold }} /><i style={{ background: o.ref[m].patina }} /></span>
              </span>
            ))}
          </span>
          <span className="nx-skin__name">{o.name}</span>
          <span className="nx-skin__tag">{o.tagline}</span>
        </button>
      ))}
    </div>
  );
}

export default SkinPicker;
