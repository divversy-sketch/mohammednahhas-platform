import React from 'react';

const MobileExamHelperStyles = () => (
  <style>{`
    @media (max-width: 768px) {
      body { padding-bottom: 74px; }
      .mobile-sticky-actions {
        position: sticky;
        bottom: 0;
        z-index: 80;
        background: rgba(255,255,255,.95);
        backdrop-filter: blur(10px);
        border-top: 1px solid #e2e8f0;
        padding: 10px;
        margin: 0 -1rem;
      }
      .mobile-readable-card {
        max-height: 38vh;
        overflow: auto;
      }
      .mobile-hide-messages {
        display: none !important;
      }
    }
  `}</style>
);

export default MobileExamHelperStyles;
