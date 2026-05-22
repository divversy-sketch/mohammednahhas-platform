export default function Select({ children, ...props }) { return <select className={["ui-input", props.className].filter(Boolean).join(' ')} {...props}>{children}</select>; }
