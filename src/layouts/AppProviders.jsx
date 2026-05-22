import { AnimatePresence } from 'framer-motion';
import { ToastCenter } from '../shared/core/platformShared.jsx';
import { DebugCollector } from '../shared/core/debugTools.jsx';
import DesignSystemLoader from '../shared/components/DesignSystemLoader.jsx';
import MobileExamHelperStyles from '../shared/components/MobileExamHelperStyles.jsx';

export default function AppProviders({ children, user, performanceBooster = null }) {
  return (
    <>
      <ToastCenter />
      <AnimatePresence mode="wait">
        <DesignSystemLoader />
        <DebugCollector user={user} />
        {performanceBooster}
        <MobileExamHelperStyles />
        {children}
      </AnimatePresence>
    </>
  );
}
