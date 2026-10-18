// Development-only preview of the admin shell with empty data (never bundled in production).
// Open: /?nxPreview=admin&tab=payments
import { useState } from 'react';
import { AdminDashboardShell } from '@features/admin-dashboard/shell/AdminDashboardShell.jsx';
import { buildOwnerAdminProfile } from '@config/adminPermissions';

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

export default function AdminPreview() {
  const params = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(params.get('tab') || 'dashboard');
  const [grade, setGrade] = useState('all');
  const profile = { ...buildOwnerAdminProfile({ uid: 'preview', email: 'owner@preview' }), name: 'أ. محمد النحاس' };
  const ctx = emptyCtx({ activeTab, setActiveTab, adminGradeFilter: grade, setAdminGradeFilter: setGrade, userData: profile, user: { uid: 'preview' }, adminProfile: profile });
  return <AdminDashboardShell user={{ uid: 'preview' }} adminProfile={profile} activeTab={activeTab} setActiveTab={setActiveTab} adminGradeFilter={grade} setAdminGradeFilter={setGrade} dashboardContext={ctx} />;
}
