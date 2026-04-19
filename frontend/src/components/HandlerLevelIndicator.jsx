import { HANDLER_LEVEL_COLORS } from "../constants.js";
import './HandlerLevelIndicator.css';

// Handler level indicator (read-only from RescueGroups API)
export default function HandlerLevelIndicator({ level }) {
  const color = HANDLER_LEVEL_COLORS[level] || HANDLER_LEVEL_COLORS.green;
  return (
    <div
      className="handler-level-indicator"
      style={{
        backgroundColor: color,
        boxShadow: `0 0 0 2px ${color}44, 0 1px 3px rgba(0,0,0,0.15)`,
      }}
      title={`Handler level: ${level}`}
      aria-label={`Handler level: ${level}`}
    />
  );
}
