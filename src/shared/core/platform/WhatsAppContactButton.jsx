import { MessageCircle } from '../../icons/lucide-shim.jsx';
import { openPlatformWhatsApp } from './media.js';

export const WhatsAppContactButton = ({ compact = false }) => (
    <button
        type="button"
        onClick={() => openPlatformWhatsApp()}
        className={compact
            ? "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-black shadow-lg flex items-center gap-2 transition"
            : "fixed bottom-5 left-5 z-[999] bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-full font-black shadow-2xl flex items-center gap-2 transition transform hover:-translate-y-1"}
        title="التواصل مع الإدارة عبر واتساب"
    >
        <MessageCircle size={20}/> واتساب الإدارة
    </button>
);

