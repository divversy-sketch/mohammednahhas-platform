import React from 'react';
import { canPerformAdminAction } from '../auth/actionPermissions.js';

export default function PermissionGate({ admin, action, children, fallback = null }) {
  return canPerformAdminAction(admin, action) ? <>{children}</> : fallback;
}

export function PermissionButton({ admin, action, children, className = '', disabledTitle = 'لا تملك صلاحية هذا الإجراء', ...props }) {
  const allowed = canPerformAdminAction(admin, action);
  return (
    <button {...props} disabled={!allowed || props.disabled} title={!allowed ? disabledTitle : props.title} className={`${className} ${!allowed ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
}
