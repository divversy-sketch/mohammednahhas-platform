import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { MOBILE_STUDENT_NAV_ITEMS } from '../../shared/constants/navigation';

const MobileStudentBottomNav = ({ activeTab, setActiveTab }) => {
  const handleClick = (key) => {
    if (key === 'logout') return signOut(auth);
    setActiveTab?.(key);
  };

  return (
    <nav
      className="nh-bottom-nav"
      aria-label="التنقل السريع"
      role="navigation"
    >
      {MOBILE_STUDENT_NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const active = activeTab === item.key ||
          (item.key === 'settings' && activeTab === 'performance');
        return (
          <button
            key={item.key}
            onClick={() => handleClick(item.key)}
            className={`nh-bottom-nav__item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
          >
            <span className="nh-bottom-nav__icon">
              <Icon size={21} />
            </span>
            <span className="nh-bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileStudentBottomNav;
