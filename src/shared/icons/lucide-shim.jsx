// This project used a local placeholder icon shim that rendered a generic plus icon
// for many names. Re-export the real lucide-react icons so every tab/card has a
// distinct readable icon.
export * from 'lucide-react';

import React from 'react';
import {
  CircleHelp,
  CircleAlert,
  CirclePlus,
  ShieldCheck as RealShieldCheck,
  Clock,
  MessageCircle as RealMessageCircle,
  ChevronLeft,
  LayoutDashboard,
  BookOpen,
  PlayCircle,
  ClipboardList,
  FileText,
  Code2,
  GraduationCap,
  Crown,
  User,
  Settings,
} from 'lucide-react';

export const HelpCircle = CircleHelp;
export const AlertCircle = CircleAlert;
export const PlusCircle = CirclePlus;
export const Clock3 = Clock;
export const ShieldCheck = RealShieldCheck;
export const MessageCircle = RealMessageCircle;
export const Code = Code2;
export const Layout = LayoutDashboard;

// A harmless default fallback for any legacy default import.
const DefaultIcon = (props) => <CirclePlus {...props} />;
export default DefaultIcon;
