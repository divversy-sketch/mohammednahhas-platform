// كاميرا جوه شاشة الامتحان نفسها: الطالب بيصوّر ورقة إجابته من غير ما يخرج من التطبيق.
// قبل كده «صوّر إجابتك» كان بيفتح تطبيق الكاميرا بتاع الموبايل، فالتطبيق كان بيخرج من الامتحان
// (وأحيانًا أندرويد بيقفله خالص في الخلفية) وكمان بيتعارض مع تثبيت الشاشة.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@v2/ui/Icon.jsx';

export const canUseInAppCamera = () => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

export function InAppCamera({ onCapture, onClose, onFallback }) {
  const video = useRef(null);
  const stream = useRef(null);
  const [state, setState] = useState('starting'); // starting | live | shot | error
  const [shot, setShot] = useState(null); // { url, blob }
  const [facing, setFacing] = useState('environment');

  useEffect(() => {
    let alive = true;
    const start = async () => {
      setState('starting');
      try {
        stream.current?.getTracks().forEach((t) => t.stop());
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (!alive) { s.getTracks().forEach((t) => t.stop()); return; }
        stream.current = s;
        if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => {}); }
        setState('live');
      } catch (e) {
        console.warn('camera failed:', e?.name, e?.message);
        if (alive) setState('error');
      }
    };
    start();
    return () => { alive = false; stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; };
  }, [facing]);

  useEffect(() => () => { if (shot?.url) URL.revokeObjectURL(shot.url); }, [shot]);

  const take = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const max = 1600;
    const scale = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((blob) => { if (blob) { setShot({ blob, url: URL.createObjectURL(blob) }); setState('shot'); } }, 'image/jpeg', 0.86);
  };

  const use = () => {
    if (!shot) return;
    const file = new File([shot.blob], `essay-${Date.now()}.jpg`, { type: 'image/jpeg' });
    stream.current?.getTracks().forEach((t) => t.stop());
    onCapture(file);
  };

  return (
    <div className="cxe-cam" dir="rtl" role="dialog" aria-modal="true" aria-label="تصوير الإجابة">
      <div className="cxe-cam__stage">
        <video ref={video} playsInline muted autoPlay style={{ display: state === 'shot' ? 'none' : 'block' }} />
        {shot && state === 'shot' && <img src={shot.url} alt="الصورة اللي اتصورت" />}
        {state === 'live' && <span className="cxe-cam__frame" aria-hidden="true" />}
        {state === 'starting' && <p className="cxe-cam__msg"><i className="cxe-cam__spin" />بنفتح الكاميرا…</p>}
        {state === 'error' && (
          <div className="cxe-cam__msg">
            <Icon name="alert" />
            <b>الكاميرا ما فتحتش</b>
            <span>لو ظهرت رسالة إذن، اختار «سماح». ولو مش ظاهرة: من إعدادات الموبايل ← التطبيقات ← منصة النحاس ← الأذونات ← الكاميرا.</span>
            {onFallback && <button type="button" onClick={onFallback}>اختار صورة من الموبايل بدل كده</button>}
          </div>
        )}
      </div>
      <div className="cxe-cam__bar">
        {state === 'shot' ? (
          <>
            <button type="button" className="is-ghost" onClick={() => { setShot(null); setState('live'); }}><Icon name="refresh" />صوّر تاني</button>
            <button type="button" className="is-pri" onClick={use}><Icon name="check" />استخدم الصورة</button>
          </>
        ) : (
          <>
            <button type="button" className="is-ghost" onClick={onClose}><Icon name="close" />إلغاء</button>
            <button type="button" className="cxe-cam__shutter" onClick={take} disabled={state !== 'live'} aria-label="صوّر" />
            <button type="button" className="is-ghost" onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))} disabled={state === 'starting'}><Icon name="refresh" />لف الكاميرا</button>
          </>
        )}
      </div>
    </div>
  );
}
