import { useResponsive } from "../hooks.js";
import Icons from "../Icons.jsx";
import './ErrorScreen.css';

// ─── Error Screen ────────────────────────────────────────────────────────────
// Shown when a kennel location URL is invalid or returns no animals
export default function ErrorScreen({ error, onLogout }) {
  const r = useResponsive();
  return (
    <main
      id="main-content"
      className="error-screen"
      style={{ padding: r.padding }}
    >
      <div className="error-screen__inner">
        <div className="error-screen__icon-wrap">
          <Icons.alertCircle size={40} color="var(--clr-brick-red)" />
        </div>
        <h1 className="error-screen__title">Location Not Found</h1>
        <p className="error-screen__message">
          {error || "The kennel location in this URL does not exist or has no animals currently assigned."}
        </p>
        <p className="error-screen__hint">
          Please verify the QR code URL or contact your administrator if you believe this is an error.
        </p>
        <button
          className="error-screen__logout-btn"
          onClick={onLogout}
        >
          Return to Login
        </button>
      </div>
    </main>
  );
}
