import { useState, useEffect } from "react";
import Icons from "../Icons.jsx";
import "./ProfileScreen.css";

// ─── Profile Screen ───────────────────────────────────────────────────────────
export default function ProfileScreen({ user, token, onLogout, onChangePassword, darkMode, setDarkMode }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [token]);

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    const now = new Date();
    const diffMs = exp - now;

    if (diffMs < 0) {
      return {
        label: "Expired",
        color: "#BE3A2B",
        status: "expired",
      };
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays < 1) {
      return {
        label: `Expires in ${diffHours}h`,
        color: "#BE3A2B",
        status: "urgent",
      };
    }
    if (diffDays <= 7) {
      return {
        label: `Expires in ${diffDays}d ${diffHours}h`,
        color: "#e65100",
        status: "soon",
      };
    }
    return {
      label: `Expires ${exp.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      color: "#2d7a24",
      status: "active",
    };
  };

  const expiryStatus = userData?.user?.expiresAt ? getExpiryStatus(userData.user.expiresAt) : null;

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <h1 className="profile-title">My Profile</h1>
        <button onClick={() => setDarkMode(!darkMode)} className="profile-theme-btn" aria-label="Toggle dark mode">
          {darkMode ? <Icons.sun size={18} /> : <Icons.moon size={18} />}
        </button>
      </div>

      {loading && <div className="profile-loading">Loading profile...</div>}
      {error && <div className="profile-error">{error}</div>}

      {userData && !loading && (
        <div className="profile-card">
          <div className="profile-section">
            <div className="profile-field">
              <label className="profile-label">Username</label>
              <div className="profile-value">{userData.user.username}</div>
            </div>

            <div className="profile-field">
              <label className="profile-label">Role</label>
              <div className="profile-value profile-role">{userData.user.role}</div>
            </div>

            {expiryStatus && (
              <div className="profile-field">
                <label className="profile-label">Account Status</label>
                <div
                  className="profile-expiry"
                  style={{
                    color: expiryStatus.color,
                    backgroundColor: expiryStatus.status === "expired" ? "#fef2f2" : expiryStatus.status === "urgent" ? "#fef2f2" : expiryStatus.status === "soon" ? "#fff3e0" : "#f0fdf4",
                  }}
                >
                  {expiryStatus.label}
                </div>
              </div>
            )}
          </div>

          <div className="profile-actions">
            {onChangePassword && (
              <button onClick={onChangePassword} className="profile-action-btn profile-action-btn--primary">
                <Icons.lock size={14} />
                Change Password
              </button>
            )}
            <button onClick={onLogout} className="profile-action-btn profile-action-btn--secondary">
              <Icons.arrowRight size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
