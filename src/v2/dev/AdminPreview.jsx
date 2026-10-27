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
  const [examView, setExamView] = useState(params.get('view') || '');
  const [viewingResult, setViewingResult] = useState(null);
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
      ...[['u20', 'live', 14], ['u21', 'live', 6], ['u22', 'live', 19], ['u23', 'away', 9], ['u24', 'old', 3]].map(([sid, kind, n], i) => ({ id: `lv${i}`, examId: 'e1', studentId: sid, studentName: ['مريم سامي', 'عمر خالد', 'منة الله', 'أحمد علي', 'كريم حسن'][i], status: 'in_progress', presence: kind === 'away' ? 'away' : 'online', lastSeenAt: new Date(now - (kind === 'old' ? 6e5 : 12e3)).toISOString(), answeredCount: n, totalQuestions: 20, remainingTime: 1800 - i * 200, submittedAt: new Date(now - 9e5).toISOString() })),
      { id: 'hold1', examId: 'e1', studentId: 'u25', studentName: 'سلمى نبيل', status: 'security_hold', antiCheatWarnings: 3, antiCheatLog: [{ type: 'app_unpinned', at: new Date(now - 3e5).toISOString() }], answeredCount: 11, totalQuestions: 20, lastSeenAt: new Date(now - 2e5).toISOString() },
    ],
  } : {};
  const base = { ...demo, newContent: NEW_CONTENT, filteredPendingUsers: demo.pendingUsers || [], filteredActiveUsers: demo.activeUsersList || [], filteredContentList: demo.contentList || [], filteredExamsList: demo.examsList || [] };
  const extra = { ...base, activeTab, setActiveTab, adminGradeFilter: grade, setAdminGradeFilter: setGrade, adminExamView: examView, setAdminExamView: setExamView, viewingResult, setViewingResult, userData: profile, user: { uid: 'preview' }, adminProfile: profile };
  const ctx = materialize(emptyCtx(extra), extra);
  return <AdminDashboardShell user={{ uid: 'preview' }} adminProfile={profile} activeTab={activeTab} setActiveTab={setActiveTab} adminGradeFilter={grade} setAdminGradeFilter={setGrade} dashboardContext={ctx} />;
}
