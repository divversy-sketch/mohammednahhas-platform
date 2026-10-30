// Development-only preview of the admin shell with empty data (never bundled in production).
// Open: /?nxPreview=admin&tab=payments
import { useState } from 'react';
import { AdminDashboardShell } from '@features/admin-dashboard/shell/AdminDashboardShell.jsx';
import { buildOwnerAdminProfile } from '@config/adminPermissions';
import legacyTabsSource from '@features/admin-dashboard/tabs/legacy/AdminDashboardTabsLegacy.jsx?raw';

// every name the admin tabs read from ctx, so the preview can give each one an empty value (spreading a Proxy loses them)
const CTX_KEYS = (legacyTabsSource.match(/const \{([\s\S]*?)\} = ctx;/) || ['', ''])[1].split(',').map((k) => k.trim()).filter((k) => /^[A-Za-z_]\w*$/.test(k));
const NEW_CONTENT = { title: '', url: '', thumbnailUrl: '', imagePlacement: {}, type: 'video', videoSection: 'explanation', isPublic: false, grade: '3sec', allowedEmails: '', isPremium: false, linkedExamId: '', estimatedDurationMinutes: '', chaptersText: '', branch: '' };

const noop = () => {};
// Any field the tabs read comes back empty: setters/handlers are no-ops, flags are false, collections are [].
const emptyCtx = (extra) => new Proxy(extra, {
  get(target, key) {
    if (key in target) return target[key];
    if (typeof key !== 'string') return undefined;
    if (/^(set|handle|on|open|close|toggle|save|delete|create|update|load|refresh|fetch|approve|reject|send|export|generate|add|remove|reset|start|stop)/.test(key)) return noop;
    if (/^(is|show|has|can|loading|busy)/.test(key)) return false;
    if (/(Filter|Search|Query|Text|Name|Title|Id|Mode|View|Tab)$/.test(key)) return '';
    if (/(Form|Settings|Config|Stats|Draft)$/.test(key)) return {};
    if (/(s|List|Items|Map)$/.test(key)) return [];
    return null;
  },
});

function materialize(proxy, extra) {
  const out = { ...extra };
  CTX_KEYS.forEach((k) => { if (!(k in out)) out[k] = proxy[k]; });
  return out;
}

export default function AdminPreview() {
  const params = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(params.get('tab') || 'dashboard');
  const [grade, setGrade] = useState('all');
  const [examView, setExamView] = useState(params.get('view') || 'manage');
  const [viewingResult, setViewingResult] = useState(null);
  const [examBuilder, setExamBuilder] = useState({ title: '', grade: '3sec', duration: 60, startTime: '', endTime: '', questions: [], accessCode: '', isPremium: false, examImageUrl: '', imagePlacement: { fit: 'contain', position: 'center', size: 100 }, accessRule: { enabled: false, requiredExamId: '', requiredPercentage: 70, visibilityWhenLocked: 'locked', useBestAttempt: true, allowAdminOverride: true } });
  const [bulkText, setBulkText] = useState('');
  const profile = { ...buildOwnerAdminProfile({ uid: 'preview', email: 'owner@preview' }), name: 'أ. محمد النحاس' };
  const now = Date.now();
  const demo = params.get('demo') ? {
    activeUsersList: Array.from({ length: 48 }, (_, i) => ({ id: `u${i}`, name: `طالب ${i + 1}`, phone: `0101234${String(5000 + i)}`, grade: 'third_secondary', subscriptionStatus: i % 3 ? 'premium' : 'free', status: 'active' })),
    pendingUsers: [{ id: 'p1', name: 'سارة أحمد' }, { id: 'p2', name: 'عمر خالد' }, { id: 'p3', name: 'منة الله' }],
    passwordResetRequests: [{ id: 'r1' }],
    messagesList: [{ id: 'm1', status: 'open' }, { id: 'm2', status: 'open' }],
    contentList: Array.from({ length: 23 }, (_, i) => ({ id: `c${i}` })),
    examsList: [{ id: 'e1', title: 'امتحان البلاغة الشامل', startTime: new Date(now - 36e5).toISOString(), endTime: new Date(now + 36e5).toISOString() }, { id: 'e2', title: 'النحو' }, { id: 'e3', title: 'القصة' }],
    examResults: [
      ...Array.from({ length: 90 }, (_, i) => ({ id: `x${i}`, examId: i < 6 ? 'e1' : 'e2', studentId: `u${i}`, studentName: `طالب ${i + 1}`, status: 'completed', score: 12 + (i % 8), total: 20, percentage: 30 + ((i * 37) % 70), examLock: i % 3 ? 'pinned' : 'web', antiCheatWarnings: i % 11 === 0 ? 2 : 0, antiCheatLog: i % 11 === 0 ? [{ type: 'app_unpinned', at: new Date(now - 4e6).toISOString() }, { type: 'focus_or_visibility_lost', at: new Date(now - 3e6).toISOString() }] : [], branchStats: { 'البلاغة': { earned: 3 + (i % 5), possible: 8 }, 'النحو': { earned: 5 + (i % 3), possible: 7 }, 'النصوص': { earned: 2 + (i % 4), possible: 5 } }, timeTaken: 1500 + i * 13, submittedAt: new Date(now - ((i * 7919) % 13) * 864e5 - 36e5).toISOString() })),
      ...[['u20', 'live', 14], ['u21', 'live', 6], ['u22', 'live', 19], ['u23', 'away', 9], ['u24', 'old', 3]].map(([sid, kind, n], i) => ({ id: `lv${i}`, examId: 'e1', studentId: sid, studentName: ['مريم سامي', 'عمر خالد', 'منة الله', 'أحمد علي', 'كريم حسن'][i], status: 'in_progress', presence: kind === 'away' ? 'away' : 'online', lastSeenAt: new Date(now - (kind === 'old' ? 6e5 : 12e3)).toISOString(), answeredCount: n, totalQuestions: 20, remainingTime: 1800 - i * 200, submittedAt: new Date(now - 9e5).toISOString(), currentQIndex: n, network: i === 1 ? 'offline' : 'online', appState: kind === 'away' ? 'background' : 'active', device: { app: i % 2 ? 'web' : 'app', model: ['SM-A145F', 'Windows', 'Redmi Note 12', 'iPhone', 'SM-A057F'][i] }, battery: { level: [76, 41, 12, 63, 8][i], charging: i === 0 }, examLock: i % 2 ? 'web' : 'pinned', lastEvent: { t: 'q', at: now - [20e3, 15e3, 140e3, 6e5, 6e5][i] }, questionTimes: { 1: 40, 2: 65, 3: 30, 4: 210, 5: 50, 6: 95, 7: 20, 8: 44, 9: 120, 10: 60 }, answerChanges: i + 1, answers: Object.fromEntries(Array.from({ length: n }, (_, k) => [`q${k}`, k % 4])) })),
      { id: 'hold1', examId: 'e1', studentId: 'u25', studentName: 'سلمى نبيل', status: 'security_hold', antiCheatWarnings: 3, antiCheatLog: [{ type: 'app_unpinned', at: new Date(now - 3e5).toISOString() }], answeredCount: 11, totalQuestions: 20, lastSeenAt: new Date(now - 2e5).toISOString() },
    ],
  } : {};
  if (params.get('demo') && typeof window !== 'undefined') {
    const t = (m) => now - m * 60e3;
    const mk = (attemptId, events) => ({ attemptId, examId: 'e1', events });
    window.__nxDemoEvents = [
      mk('lv0', [{ t: 'open', at: t(22), n: 20, left: 3600, locked: 1 }, { t: 'q', at: t(21), i: 2, from: 1, spent: 40 }, { t: 'ans', at: t(20.5), i: 2, kind: 'first' }, { t: 'ans', at: t(15), i: 4, kind: 'change' }, { t: 'screen_off', at: t(9), secs: 35 }, { t: 'q', at: t(0.3), i: 15, from: 14, spent: 50 }]),
      mk('lv1', [{ t: 'open', at: t(18), n: 20, left: 3600 }, { t: 'ans', at: t(16), i: 3, kind: 'first' }, { t: 'offline', at: t(0.8) }]),
      mk('lv2', [{ t: 'open', at: t(25), n: 20, left: 3600, locked: 1 }, { t: 'battery_low', at: t(6), level: 14 }, { t: 'q', at: t(2.3), i: 20, from: 19, spent: 70 }]),
      mk('lv3', [{ t: 'open', at: t(20), n: 20 }, { t: 'ans', at: t(11), i: 9, kind: 'first' }, { t: 'hide', at: t(10) }]),
      mk('lv4', [{ t: 'open', at: t(30), n: 20 }, { t: 'ans', at: t(12), i: 3, kind: 'first' }, { t: 'submit_try', at: t(10.2) }, { t: 'submit_fail', at: t(10), err: 'timeout' }]),
      mk('hold1', [{ t: 'open', at: t(15), n: 20 }, { t: 'warn', at: t(9), reason: 'focus_or_visibility_lost', n: 1 }, { t: 'unpin', at: t(4) }, { t: 'hold', at: t(3.4), reason: 'app_unpinned', n: 3 }]),
      ...Array.from({ length: 6 }, (_, i) => mk(`x${i}`, [{ t: 'open', at: t(40 + i), n: 20 }, { t: 'submit_try', at: t(5 + i) }, { t: 'submit_ok', at: t(5 + i), score: 12 + i, of: 20 }])),
    ];
  }
  const base = { ...demo, newContent: NEW_CONTENT, filteredPendingUsers: demo.pendingUsers || [], filteredActiveUsers: demo.activeUsersList || [], filteredContentList: demo.contentList || [], filteredExamsList: demo.examsList || [] };
  const extra = { ...base, activeTab, setActiveTab, adminGradeFilter: grade, setAdminGradeFilter: setGrade, adminExamView: examView, setAdminExamView: setExamView, viewingResult, setViewingResult, examBuilder, setExamBuilder, bulkText, setBulkText, userData: profile, user: { uid: 'preview' }, adminProfile: profile };
  const ctx = materialize(emptyCtx(extra), extra);
  return <AdminDashboardShell user={{ uid: 'preview' }} adminProfile={profile} activeTab={activeTab} setActiveTab={setActiveTab} adminGradeFilter={grade} setAdminGradeFilter={setGrade} dashboardContext={ctx} />;
}
