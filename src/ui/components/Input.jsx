export default function Input(props) { return <input className={["ui-input", props.className].filter(Boolean).join(' ')} {...props} />; }
