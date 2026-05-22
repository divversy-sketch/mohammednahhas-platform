import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Lock, Save, ShieldCheck, Unlock, User, Settings } from '@shared/icons/lucide-shim.jsx';
import Button from '@ui/components/Button.jsx';
import Card from '@ui/components/Card.jsx';
import GlowFrame from '@ui/components/GlowFrame.jsx';
import {
  defaultStudentPortalGate,
  saveStudentPortalGateSettings,
  subscribeStudentPortalGate,
} from '../services/studentPortalGate.service.js';

const listToText = (list) => (Array.isArray(list) ? list.join('\n') : '');
const textToList = (text) => String(text || '')
  .split(/[\n,;]+/g)
  .map((item) => item.trim())
  .filter(Boolean);

export default function AdminStudentPortalGateManager({ adminUser }) {
  const [draft, setDraft] = useState(defaultStudentPortalGate);
  const [uidText, setUidText] = useState('');
  const [emailText, setEmailText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeStudentPortalGate(
      (gate) => {
        setDraft(gate);
        setUidText(listToText(gate.allowedStudentIds));
        setEmailText(listToText(gate.allowedStudentEmails));
        setError('');
        setLoading(false);
      },
      (gateError) => {
        setError(gateError?.message || 'تعذر تحميل إعدادات صيانة الطالب');
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const previewStats = useMemo(() => ({
    allowedIds: textToList(uidText).length,
    allowedEmails: textToList(emailText).length,
  }), [uidText, emailText]);

  const updateDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await saveStudentPortalGateSettings({
        ...draft,
        allowedStudentIds: textToList(uidText),
        allowedStudentEmails: textToList(emailText).map((email) => email.toLowerCase()),
      }, adminUser);
      setSuccess('تم حفظ إعدادات بوابة الطالب بنجاح.');
    } catch (saveError) {
      setError(saveError?.message || 'تعذر حفظ إعدادات بوابة الطالب');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="student-gate-admin-card">
        <p className="text-sm font-black text-slate-500">جاري تحميل إعدادات بوابة الطالب...</p>
      </Card>
    );
  }

  return (
    <GlowFrame tone={draft.enabled ? 'admin' : 'student'} intensity="soft" className="student-gate-admin-frame">
      <Card className="student-gate-admin-card">
        <div className="student-gate-admin-header">
          <div>
            <p className="student-gate-kicker">أداة حماية التصميم الجديد</p>
            <h3>بوابة صيانة صفحة الطالب</h3>
            <p>
              اقفل دخول الطلاب مؤقتًا أثناء تنفيذ التصميم الجديد، واسمح لحسابات محددة فقط بمعاينة الصفحة.
            </p>
          </div>
          <div className={draft.enabled ? 'student-gate-status student-gate-status--locked' : 'student-gate-status student-gate-status--open'}>
            {draft.enabled ? <Lock size={18} /> : <Unlock size={18} />}
            <span>{draft.enabled ? 'الصيانة مفعلة' : 'الدخول مفتوح'}</span>
          </div>
        </div>

        <div className="student-gate-toggle-row">
          <div>
            <strong>حالة دخول الطلاب</strong>
            <span>{draft.enabled ? 'الطلاب غير المسموح لهم سيشاهدون رسالة الصيانة.' : 'كل الطلاب يمكنهم الدخول للمنصة.'}</span>
          </div>
          <button
            type="button"
            className={draft.enabled ? 'student-gate-switch is-on' : 'student-gate-switch'}
            onClick={() => updateDraft('enabled', !draft.enabled)}
            aria-pressed={draft.enabled}
          >
            <span />
          </button>
        </div>

        <div className="student-gate-form-grid">
          <label>
            <span>عنوان رسالة الصيانة</span>
            <input
              value={draft.title || ''}
              onChange={(event) => updateDraft('title', event.target.value)}
              placeholder="الموقع تحت الصيانة حاليًا"
            />
          </label>

          <label>
            <span>نص الرسالة الظاهر للطلاب</span>
            <textarea
              value={draft.message || ''}
              onChange={(event) => updateDraft('message', event.target.value)}
              rows={4}
              placeholder="نقوم بتجهيز التصميم الجديد للمنصة. برجاء المحاولة لاحقًا."
            />
          </label>
        </div>

        <div className="student-gate-allow-grid">
          <label>
            <span>UID الطلاب المسموح لهم بالدخول التجريبي</span>
            <textarea
              dir="ltr"
              value={uidText}
              onChange={(event) => setUidText(event.target.value)}
              rows={5}
              placeholder="ضع UID كل طالب في سطر منفصل"
            />
          </label>

          <label>
            <span>إيميلات الطلاب المسموح لهم بالدخول التجريبي</span>
            <textarea
              dir="ltr"
              value={emailText}
              onChange={(event) => setEmailText(event.target.value)}
              rows={5}
              placeholder="student@example.com"
            />
          </label>
        </div>

        <div className="student-gate-info-grid">
          <div>
            <User size={18} />
            <span>{previewStats.allowedIds} UID مسموح</span>
          </div>
          <div>
            <ShieldCheck size={18} />
            <span>{previewStats.allowedEmails} إيميل مسموح</span>
          </div>
          <div>
            <Settings size={18} />
            <span>الإعداد محفوظ في settings/student_portal_gate</span>
          </div>
        </div>

        {draft.enabled && (
          <div className="student-gate-warning">
            <AlertTriangle size={18} />
            <span>قبل تفعيل الصيانة، أضف حساب الطالب التجريبي أو حسابك في القائمة المسموحة حتى تستطيع معاينة التصميم.</span>
          </div>
        )}

        {error && <div className="student-gate-alert student-gate-alert--error">{error}</div>}
        {success && <div className="student-gate-alert student-gate-alert--success"><CheckCircle size={17} /> {success}</div>}

        <div className="student-gate-actions">
          <Button variant={draft.enabled ? 'admin' : 'student'} onClick={handleSave} disabled={saving}>
            <Save size={17} />
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات بوابة الطالب'}
          </Button>
        </div>
      </Card>
    </GlowFrame>
  );
}
