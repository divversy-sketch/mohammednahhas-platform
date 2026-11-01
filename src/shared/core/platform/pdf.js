import { platformNotify } from './notifications.jsx';

// html2pdf is ~600KB, so it is fetched only the first time a student asks for a PDF.
let html2pdfLoader = null;
export const loadHtml2Pdf = () => {
    if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
    if (window.html2pdf) return Promise.resolve(window.html2pdf);
    if (!html2pdfLoader) {
        html2pdfLoader = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = 'html2pdf-script';
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.async = true;
            script.onload = () => resolve(window.html2pdf);
            script.onerror = (error) => { html2pdfLoader = null; reject(error); };
            document.head.appendChild(script);
        });
    }
    return html2pdfLoader;
};

// تقرير الامتحان الجديد (shared/report/examReport.js): بيتطبع PDF حقيقي بالعربي السليم، بجرافيكس وأيقونات،
// وجوه التطبيق بيفتح شاشة «حفظ PDF» بتاعة أندرويد. (القديم كان صورة للصفحة والعربي بيبوظ والتحميل ما بيشتغلش في التطبيق.)
export const generatePDF = (type, data) => {
    platformNotify('بنجهّز التقرير…');
    import('../../report/examReport.js')
        .then((m) => m.openExamReport(data || {}, { audience: type === 'admin' ? 'admin' : 'student' }))
        .catch(() => platformNotify('ما قدرناش نجهّز التقرير. جرّب تاني.'));
};
