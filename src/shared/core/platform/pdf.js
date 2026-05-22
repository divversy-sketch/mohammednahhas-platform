import { platformNotify } from './notifications.jsx';

export const generatePDF = (type, data) => {
    if (!window.html2pdf) return platformNotify("جاري تحميل نظام الطباعة... يرجى الانتظار ثوانٍ والمحاولة مرة أخرى.");
    const percentage = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
    const date = new Date().toLocaleDateString('ar-EG');
    const element = document.createElement('div');
    let answersTable = '';
    if (data.questions && data.answers) {
        answersTable = `
        <div style="margin-top: 30px; page-break-before: always;">
            <h3 style="background: #eee; padding: 10px; border-right: 5px solid #d97706; font-family: 'Cairo', sans-serif;">تفاصيل الإجابات</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 15px; font-family: 'Cairo', sans-serif;">
                <thead>
                    <tr style="background-color: #f3f4f6; color: #333;">
                        <th style="border: 1px solid #ddd; padding: 10px; width: 5%;">#</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">السؤال</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 10%;">الفرع</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 15%;">إجابتك</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 15%;">الصح</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 10%;">الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.questions.map((q, i) => {
                        const branchName = q.branch || 'عام';

                        if (q.type === 'essay') {
                            const essayAnswer = data.answers?.[q.id];
                            const studentEssayText = typeof essayAnswer === 'object'
                                ? (essayAnswer?.text || (essayAnswer?.image ? 'تم رفع صورة إجابة' : 'لم يجب'))
                                : (essayAnswer || 'لم يجب');
                            const modelEssayAnswer = q.modelAnswer || 'سؤال مقالي - يحتاج مراجعة يدوية';
                            return `
                            <tr style="background-color: #eff6ff;">
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i + 1}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${q.text.replace(/\|/g, '<br>')}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #0284c7;">${branchName}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${studentEssayText}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; color: #1d4ed8;">${modelEssayAnswer}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><span style="color:#1d4ed8">📝 مقالي</span></td>
                            </tr>`;
                        }

                        const studentAnsIdx = data.answers[q.id];
                        const correctAnsIdx = q.correctIdx;
                        const isCorrect = studentAnsIdx === correctAnsIdx;
                        const studentAnsText = studentAnsIdx !== undefined ? q.options?.[studentAnsIdx] || 'لم يجب' : 'لم يجب';
                        const correctAnsText = q.options?.[correctAnsIdx] || 'غير محدد';
                        return `
                        <tr style="background-color: ${isCorrect ? '#f0fdf4' : '#fef2f2'};">
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i + 1}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${q.text.replace(/\|/g, '<br>')}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #0284c7;">${branchName}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${studentAnsText}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; color: green;">${correctAnsText}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${isCorrect ? '<span style="color:green">✔ صحيح</span>' : '<span style="color:red">✘ خطأ</span>'}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    }

    const header = `
      <div style="padding: 40px; font-family: 'Cairo', sans-serif; direction: rtl; color: #333;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d97706; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="text-align: right;"><h1 style="margin: 0; color: #d97706; font-size: 28px;">منصة النحاس التعليمية</h1><p style="margin: 5px 0 0; color: #666;">للغة العربية - أ/ محمد النحاس</p></div>
            <div style="text-align: left;"><p style="margin: 0; font-weight: bold;">تقرير نتيجة امتحان</p><p style="margin: 5px 0 0; color: #666;">${date}</p></div>
        </div>
        <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <table style="width: 100%; font-size: 18px; font-family: 'Cairo', sans-serif;">
                <tr><td style="padding: 10px; font-weight: bold; width: 20%;">اسم الطالب:</td><td style="padding: 10px;">${data.studentName}</td><td style="padding: 10px; font-weight: bold; width: 20%;">الامتحان:</td><td style="padding: 10px;">${data.examTitle || 'اختبار عام'}</td></tr>
                <tr><td style="padding: 10px; font-weight: bold; vertical-align: middle;">الدرجة:</td><td style="padding: 10px;"><div style="display: inline-block; border: 3px solid #d97706; border-radius: 8px; padding: 5px 20px; font-weight: bold; color: #d97706; direction: ltr; font-family: sans-serif; font-size: 20px; background: #fffbeb;">${data.score} / ${data.total}</div></td><td style="padding: 10px; font-weight: bold; vertical-align: middle;">النسبة:</td><td style="padding: 10px; font-size: 20px; font-weight: bold;">${percentage}%</td></tr>
                <tr><td style="padding: 10px; font-weight: bold;">الحالة:</td><td style="padding: 10px;" colspan="3"><span style="background: ${data.status === 'cheated' ? '#fee2e2' : '#dcfce7'}; color: ${data.status === 'cheated' ? '#991b1b' : '#166534'}; padding: 5px 15px; border-radius: 20px; font-size: 14px;">${data.status === 'cheated' ? 'تم إلغاؤه (غش)' : percentage >= 50 ? 'ناجح' : 'راسب'}</span></td></tr>
            </table>
        </div>
        ${answersTable}
        <div style="margin-top: 50px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;"><p style="font-size: 14px; color: #999;">تم استخراج هذا التقرير آلياً من منصة النحاس التعليمية</p></div>
      </div>`;
    element.innerHTML = header;
    const opt = { margin: 0.5, filename: `تقرير_${data.studentName}_${date}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, logging: false }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    window.html2pdf().set(opt).from(element).save();
};

