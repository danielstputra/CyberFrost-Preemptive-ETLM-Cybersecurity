export function Scanlines() {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none" style={{
      background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,246,255,0.006) 3px, rgba(0,246,255,0.006) 4px)',
      animation: 'scanline 8s linear infinite',
    }} />
  );
}
