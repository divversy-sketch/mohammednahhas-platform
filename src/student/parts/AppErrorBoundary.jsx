import React from 'react';
import { AlertTriangle } from '../../shared/icons/lucide-shim.jsx';
import { logSystemError } from '../../services/monitoring/errorLogger.js';


export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'حدث خطأ غير متوقع' };
  }
  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught:', error, info);
    logSystemError(error, { area: 'student', info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-['Cairo']" dir="rtl">
          <div className="max-w-lg w-full bg-white text-slate-900 rounded-3xl p-8 shadow-2xl border-t-8 border-red-500 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={64}/>
            <h1 className="text-2xl font-black mb-2">هذا الجزء تحت الصيانة حاليًا</h1>
            <p className="text-slate-600 mb-4">نقوم بتحديث هذا الجزء من المنصة الآن. برجاء إعادة تحميل الصفحة أو المحاولة بعد قليل.</p>
            <details className="bg-slate-100 text-slate-600 p-3 rounded-xl text-sm mb-6 text-right">
              <summary className="cursor-pointer font-bold">تفاصيل تقنية للإدارة</summary>
              <code className="block text-red-700 mt-2 break-all text-left" dir="ltr">{this.state.message}</code>
            </details>
            <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800">إعادة تحميل الصفحة</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
