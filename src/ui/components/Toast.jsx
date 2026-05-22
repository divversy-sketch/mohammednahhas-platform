export default function Toast({ title, message, tone = 'info' }) { return <div className={`ui-toast ui-toast--${tone}`}><strong>{title}</strong>{message && <p>{message}</p>}</div>; }
