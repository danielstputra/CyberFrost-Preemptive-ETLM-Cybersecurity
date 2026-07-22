export function GridBackground() {
  return (
    <>
      <div className="cyber-grid" />
      <div className="cyber-noise" />
      {/* Data streams */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="data-stream"
          style={{ left: `${8 + i * 16}%`, '--dur': `${10 + i * 2}s`, '--del': `${i * 2}s` } as React.CSSProperties}>
          {Array.from({ length: 20 }).map((_, j) => (
            <div key={j}>{'0x' + (i * 20 + j).toString(16).padStart(2, '0')}</div>
          ))}
        </div>
      ))}
    </>
  );
}
