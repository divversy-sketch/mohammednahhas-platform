


import { Smartphone } from '../../shared/icons/lucide-shim.jsx';


export const AppConversionGuidePanel = () => (
  <div className="glass-panel rounded-2xl p-5 border-t-4 border-sky-600">
    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><Smartphone className="text-sky-600"/> تجهيز APK و iOS</h2>
    <div className="space-y-3 text-sm font-bold text-slate-700 leading-relaxed">
      <p>هذه الخطوة لا تغير المنصة، لكنها تجهزها للتحويل لتطبيق Android و iOS باستخدام Capacitor.</p>
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-left overflow-auto" dir="ltr">
        npm install @capacitor/core @capacitor/cli<br/>
        npx cap init NahhasPlatform com.nahhas.platform --web-dir=dist<br/>
        npm run build<br/>
        npx cap add android<br/>
        npx cap copy<br/>
        npx cap open android
      </div>
      <p>لـ iOS ستحتاج جهاز Mac ثم:</p>
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-left overflow-auto" dir="ltr">
        npx cap add ios<br/>
        npx cap copy<br/>
        npx cap open ios
      </div>
    </div>
  </div>
);

export default AppConversionGuidePanel;
