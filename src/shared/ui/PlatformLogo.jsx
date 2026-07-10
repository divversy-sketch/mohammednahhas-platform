import React from 'react';
import '../../styles/components/platform-logo.css';

export default function PlatformLogo({
  variant = 'full',
  size = 'md',
  strong = false,
  className = '',
  showLabel = true,
}) {
  return (
    <div className={`platform-logo platform-logo--${variant} platform-logo--${size}${strong ? ' platform-logo--strong' : ''} ${className}`.trim()} aria-label="منصة النحاس">
      <img src="/brand/nahhas-platform-logo.png" alt="شعار منصة النحاس" draggable="false" />
      {showLabel && variant === 'mark' && (
        <span className="platform-logo__label">
          <strong>منصة النحاس</strong>
          <small>تعليم العربية بذكاء</small>
        </span>
      )}
    </div>
  );
}
