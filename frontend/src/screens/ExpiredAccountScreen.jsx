import Icons from "../Icons.jsx";
import "./ExpiredAccountScreen.css";

export default function ExpiredAccountScreen({ user, onLogout, darkMode, setDarkMode }) {
  return (
    <div className="expired-account-screen">
      <div className="expired-account-header">
        <button onClick={() => setDarkMode(!darkMode)} className="expired-account-theme-btn" aria-label="Toggle dark mode">
          {darkMode ? <Icons.sun size={18} /> : <Icons.moon size={18} />}
        </button>
      </div>

      <div className="expired-account-content">
        <div className="expired-account-icon">
          <Icons.alertCircle size={64} color="#BE3A2B" />
        </div>

        <h1 className="expired-account-title">Account Expired</h1>

        <p className="expired-account-message">
          Your volunteer account has expired and is no longer active. Please contact your administrator to renew your access.
        </p>

        <button onClick={onLogout} className="expired-account-logout-btn">
          <Icons.arrowRight size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
