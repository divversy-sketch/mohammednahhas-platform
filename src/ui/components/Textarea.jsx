export default function Textarea(props) { return <textarea className={["ui-input", "ui-textarea", props.className].filter(Boolean).join(' ')} {...props} />; }
