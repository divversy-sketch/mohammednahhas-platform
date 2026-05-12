import EmptyState from './EmptyState.jsx';

function getValue(row, column) {
  if (!column) return '';
  if (typeof column.render === 'function') return column.render(row);
  if (typeof column.accessor === 'function') return column.accessor(row);
  if (typeof column.accessor === 'string') return row?.[column.accessor];
  return row?.[column.key];
}

export default function ResponsiveDataCards({ rows = [], columns = [], actions, emptyTitle = 'لا توجد بيانات', emptyDescription = 'جرّب تغيير البحث أو الفلاتر.' }) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="v2-responsive-card-list">
      {rows.map((row, rowIndex) => (
        <article className="v2-responsive-data-card" key={row?.id || rowIndex}>
          <div className="v2-responsive-data-card__body">
            {columns.map((column) => (
              <div className="v2-responsive-data-card__item" key={column.key || column.header}>
                <span>{column.header || column.label}</span>
                <strong>{getValue(row, column) || '—'}</strong>
              </div>
            ))}
          </div>
          {typeof actions === 'function' ? <div className="v2-responsive-data-card__actions">{actions(row)}</div> : null}
        </article>
      ))}
    </div>
  );
}
