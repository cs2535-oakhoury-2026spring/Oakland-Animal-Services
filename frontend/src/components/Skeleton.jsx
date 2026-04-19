// ─── Loading Skeleton Component ───────────────────────────────────────────────
import './Skeleton.css';

export default function Skeleton({ width = "100%", height = 16, borderRadius = 8, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
      aria-hidden="true"
    />
  );
}
