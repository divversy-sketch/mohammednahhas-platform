export const designTokens = {
  radius: {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-3xl',
  },
  shadow: {
    soft: 'shadow-[0_8px_24px_rgba(15,23,42,0.06)]',
    card: 'shadow-[0_18px_50px_rgba(15,23,42,0.10)]',
  },
  tones: {
    admin: 'amber',
    student: 'teal',
    neutral: 'slate',
    success: 'emerald',
    danger: 'red',
    info: 'sky',
  },
};

export const cx = (...classes) => classes.filter(Boolean).join(' ');
