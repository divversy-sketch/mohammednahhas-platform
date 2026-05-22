export default function ErrorState({ message = 'حدث خطأ أثناء تحميل البيانات. حاول مرة أخرى.' }) { return <div className="ui-state ui-state--error">{message}</div>; }
