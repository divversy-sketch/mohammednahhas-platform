import { AnimatePresence } from 'framer-motion';
import { NxPromptCenter, NxToastCenter } from '../v2/ui/Overlays.jsx';
import { DebugCollector } from '../shared/core/debugTools.jsx';
import DesignSystemLoader from '../shared/components/DesignSystemLoader.jsx';
import MobileExamHelperStyles from '../shared/components/MobileExamHelperStyles.jsx';

export default function AppProviders({ children, user, performanceBooster = null }) {
  return (
    <>
      <NxToastCenter />
      <NxPromptCenter />
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
