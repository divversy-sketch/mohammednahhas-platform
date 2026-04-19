// دالة تحويل الوقت
export const formatWatchTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 0) return 'أقل من ثانية';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    let res = [];
    if (h > 0) res.push(`${h} ساعة`);
    if (m > 0) res.push(`${m} دقيقة`);
    if (s > 0 || res.length === 0) res.push(`${s} ثانية`);
    return res.join(' و ');
};

// استخراج يوتيوب ID
export const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// دوال الإشعارات
export const requestNotificationPermission = () => { /* انسخ الكود بتاعها هنا */ };
export const sendSystemNotification = (title, body) => { /* انسخ الكود بتاعها هنا */ };

// دالة الـ PDF
export const generatePDF = (type, data) => { /* انسخ كود الـ PDF الطويل هنا بالكامل */ };