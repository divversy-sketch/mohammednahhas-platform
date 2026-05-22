export function GlowFrame({
  as: Tag = 'div',
  children,
  className = '',
  contentClassName = '',
  intensity = 'normal',
  tone = 'student',
  ...props
}) {
  const classes = ['glow-frame', `glow-frame--${tone}`, `glow-frame--${intensity}`, className].filter(Boolean).join(' ');
  return (
    <Tag className={classes} {...props}>
      <div className={`glow-frame__content ${contentClassName}`.trim()}>{children}</div>
    </Tag>
  );
}

export default GlowFrame;
