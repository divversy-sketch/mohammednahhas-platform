
import { Settings as GearIcon } from '../icons/lucide-shim.jsx';

export const AppLoadingScreen = ({
  title = 'منصة النحاس التعليمية',
  message = 'جاري التحميل...',
  variant = 'student'
}) => {
  const isAdmin = variant === 'admin';

  return (
    <div className="h-screen live-loading-screen flex items-center justify-center font-['Cairo'] bg-slate-50" dir="rtl">
      <div className="live-loader-card bg-white/90 border border-amber-100 rounded-3xl shadow-2xl p-8 w-[88%] max-w-sm text-center relative overflow-hidden">
        <div className="live-loader-orb w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 mx-auto mb-5 flex items-center justify-center text-white shadow-xl relative">
          <GearIcon className="gear-loader-main w-10 h-10" />
          <GearIcon className="gear-loader-small w-5 h-5 absolute -bottom-1 -left-1 text-amber-100" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-500 font-bold">
          {message || (isAdmin ? 'جاري تحميل لوحة الإدارة...' : 'جاري تحميل واجهة الطالب...')}
        </p>
      </div>
    </div>
  );
};

export const RouteLoadingScreen = ({ mode }) => (
  <AppLoadingScreen
    title="منصة النحاس التعليمية"
    message={mode === 'admin' ? 'جاري تحميل لوحة الإدارة...' : 'جاري تحميل واجهة الطالب...'}
    variant={mode}
  />
);

export default AppLoadingScreen;
