import { useEffect } from 'react';

export function useBrowserBackTab({ activeTab, setActiveTab, setMobileMenu, fallbackTab = 'home' }) {
  useEffect(() => {
    window.history.pushState({ tab: activeTab }, '');
    const handlePopState = (event) => {
      if (event.state?.tab) {
        setActiveTab(event.state.tab);
        setMobileMenu?.(false);
        return;
      }
      setActiveTab(fallbackTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, fallbackTab, setActiveTab, setMobileMenu]);
}
