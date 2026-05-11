

export default function ExamWatermarkLayer({ positions = [], user }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {positions.map((pos, i) => (
        <div key={i} className="watermark-text" style={{ top: pos.top, left: pos.left }}>
          {user?.displayName} - {user?.email}
        </div>
      ))}
    </div>
  );
}
