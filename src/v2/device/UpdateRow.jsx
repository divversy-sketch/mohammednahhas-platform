import { useState } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { checkForUpdateNow } from './liveUpdate.js';

// صف «الجهاز» في حسابي: نوع النسخة + زرار يدوّر على تحديث.
export function UpdateRow() {
  const [state, setState] = useState('idle'); // idle | checking | latest | found | offline
  const live = !['localhost', '127.0.0.1'].includes(window.location.hostname);
  const when = typeof __NX_BUILD_TIME__ !== 'undefined' ? new Date(__NX_BUILD_TIME__).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const sha = typeof __NX_BUILD_COMMIT__ !== 'undefined' && __NX_BUILD_COMMIT__ ? ` · ${__NX_BUILD_COMMIT__}` : '';

  const onCheck = async () => {
    if (state === 'found') { window.location.reload(); return; }
    setState('checking');
    try {
      const info = await checkForUpdateNow();
      if (!info.latest) setState('offline');
      else setState(info.hasUpdate ? 'found' : 'latest');
    } catch { setState('offline'); }
  };

  const label = { idle: 'دوّر على تحديث', checking: 'بيدوّر…', latest: 'عندك آخر نسخة ✓', found: 'حدّث دلوقتي', offline: 'مفيش نت، جرّب تاني' }[state];
  return (
    <div className="nx-row">
      <span className="nx-tile"><Icon name="phone" /></span>
      <span className="nx-row__main">
        <span className="nx-row__title">{live ? 'تحديث مباشر ✓' : 'نسخة مدمجة في التطبيق'}</span>
        <span className="nx-row__sub" style={{ whiteSpace: 'normal' }}>{live ? 'أي تحديث بينزل على الموقع بيظهر هنا لوحده.' : 'محتاج APK جديد مع كل تحديث.'} نسخة: {when}{sha}</span>
      </span>
      {live && (
        <button type="button" onClick={onCheck} disabled={state === 'checking'} style={{ flexShrink: 0, border: '1px solid currentColor', borderRadius: 12, padding: '7px 10px', background: 'transparent', color: 'inherit', font: 'inherit', fontSize: 12, opacity: 0.85, cursor: 'pointer' }}>{label}</button>
      )}
    </div>
  );
}

export default UpdateRow;
