import { Smartphone } from '../../shared/icons/lucide-shim.jsx';

const Code = ({ children }) => (
  <pre className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-left text-xs overflow-auto whitespace-pre" dir="ltr">{children}</pre>
);

export const AppConversionGuidePanel = () => (
  <div className="space-y-4" dir="rtl">
    <div className="bg-white rounded-3xl p-5 border shadow-sm">
      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Smartphone className="text-sky-600" /> تطبيق المنصة على الموبايل</h2>
      <p className="text-slate-500 font-bold mt-1">نفس كود المنصة بيتحول لتطبيق أندرويد (APK) وآيفون. التصاميم العشرة والوضع النهاري والليلي شغالين جوه التطبيق زي الموقع بالظبط.</p>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <section className="bg-white rounded-3xl p-5 border shadow-sm space-y-3">
        <h3 className="text-lg font-black text-slate-900">الطريقة الأولى: من جهازك (ويندوز)</h3>
        <ol className="list-decimal pr-5 space-y-1 text-sm font-bold text-slate-700">
          <li>ثبّت Node.js 20 وAndroid Studio (مرة واحدة بس).</li>
          <li>افتح فولدر المشروع ودوس دبل كليك على <b>build-apk.bat</b>.</li>
          <li>هيطلعلك ملف <b>NahhasPlatform.apk</b> جوه نفس الفولدر، ابعته للموبايل وثبّته.</li>
        </ol>
        <p className="text-xs font-bold text-slate-500">أو من سطر الأوامر:</p>
        <Code>{'npm install\nnpm run apk'}</Code>
      </section>
      <section className="bg-white rounded-3xl p-5 border shadow-sm space-y-3">
        <h3 className="text-lg font-black text-slate-900">الطريقة التانية: من GitHub من غير برامج</h3>
        <ol className="list-decimal pr-5 space-y-1 text-sm font-bold text-slate-700">
          <li>ارفع المشروع على GitHub.</li>
          <li>من Settings ← Secrets ← Actions اعمل سر اسمه <b>ENV_FILE</b> وحط فيه محتوى ملف ‎.env كله.</li>
          <li>من تبويب Actions اختار <b>Android APK</b> ودوس Run workflow.</li>
          <li>بعد حوالي ١٠ دقايق حمّل الملف من Artifacts.</li>
        </ol>
      </section>
    </div>
    <section className="bg-white rounded-3xl p-5 border shadow-sm space-y-3">
      <h3 className="text-lg font-black text-slate-900">آيفون</h3>
      <p className="text-sm font-bold text-slate-700">محتاج جهاز Mac عليه Xcode وحساب Apple Developer:</p>
      <Code>{'npm run build\nnpx cap sync ios\nnpx cap open ios'}</Code>
    </section>
  </div>
);

export default AppConversionGuidePanel;
