import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { MOBILE_STUDENT_NAV_ITEMS } from '../../shared/constants/navigation';

const MobileStudentBottomNav = ({ activeTab, setActiveTab }) => {
  const handleClick = (key) => {
    if (key === 'logout') return signOut(auth);
    setActiveTab?.(key);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9990] bg-white border-t border-slate-200 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] px-2 py-2 safe-bottom-nav">
      <div className="grid grid-cols-5 gap-1">
        {MOBILE_STUDENT_NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button key={item.key} onClick={() => handleClick(item.key)} className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[10px] font-black transition active:scale-95 ${active ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-amber-50'}`}>
              <Icon size={20}/>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileStudentBottomNav;
