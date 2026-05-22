export default function Table({ columns = [], rows = [], getRowKey = (_, index) => index }) {
  return <div className="ui-table-wrap"><table className="ui-table"><thead><tr>{columns.map((col) => <th key={col.key || col.label}>{col.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={getRowKey(row, index)}>{columns.map((col) => <td key={col.key || col.label}>{col.render ? col.render(row) : row[col.key]}</td>)}</tr>)}</tbody></table></div>;
}
