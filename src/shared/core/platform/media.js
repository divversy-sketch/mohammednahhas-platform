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

export const requestNotificationPermission = () => {
  // Browser push notifications are paused for now to avoid VAPID prompts.
  // In-app Firestore notifications still work inside the platform.
  return;
};

export const sendSystemNotification = () => {
  // System notifications are disabled temporarily for better UX/performance.
  return;
};

export const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const PLATFORM_WHATSAPP_NUMBER = '201500076322';

export const openPlatformWhatsApp = (text = 'السلام عليكم، محتاج أتواصل مع إدارة منصة النحاس.') => {
    window.open(`https://wa.me/${PLATFORM_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
};

