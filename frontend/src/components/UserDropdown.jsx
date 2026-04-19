import { useState, useEffect, useRef } from "react";
import Icons from "../Icons.jsx";
import './UserDropdown.css';

export default function UserDropdown({ user, onLogout, token, compact = false, onChangePassword }) {
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const ref = useRef(null);
  
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (open && token && user?.role === "volunteer") {
      const fetchUser = async () => {
        try {
          const response = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setUserData(data?.user || data);
          }
        } catch (err) {
          console.error("Failed to fetch user data:", err);
        }
      };
      fetchUser();
    }
  }, [open, token, user?.role]);

  const getExpiryDisplay = (expiryDate) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    const now = new Date();
    const diffMs = exp - now;

    if (diffMs < 0) {
      const expiredHoursAgo = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
      const expiredDaysAgo = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
      if (expiredDaysAgo > 0) {
        return `Expired ${expiredDaysAgo}d ago`;
      }
      return `Expired ${expiredHoursAgo}h ago`;
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays < 1) return `Expires in ${diffHours}h`;
    if (diffDays <= 7) return `Expires in ${diffDays}d ${diffHours}h`;
    return `Expires ${exp.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
  };

  const isAdmin = user?.role === "admin";
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";
  const currentPath = window.location.search;
  const volunteerExpiry = userData?.expiresAt || user?.expiresAt;
  const expiryDisplay = user?.role === "volunteer" && volunteerExpiry ? getExpiryDisplay(volunteerExpiry) : null;

  const navItem = (label, icon, href, isCurrent) => (
    <button
      role="menuitem"
      onClick={() => { setOpen(false); window.location.href = href; }}
      className={`ud-nav-item${isCurrent ? " active" : ""}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div ref={ref} className="ud-wrapper">
      <button
        onClick={() => setOpen(!open)}
        className={`ud-trigger${compact ? " compact" : ""}`}
        aria-label="User menu"
        aria-expanded={open}
      >
        <div className="ud-avatar">
          <Icons.user size={16} color="var(--clr-text-secondary)" />
        </div>
        {!compact && (
          <>
            <span className="ud-trigger-name">{user?.displayName || user?.username || "User"}</span>
            {expiryDisplay && <span className="ud-trigger-expiry">{expiryDisplay}</span>}
          </>
        )}
        {!compact && <Icons.chevron size={14} color="var(--clr-warm-gray)" down={!open} />}
      </button>
      {open && (
        <div role="menu" className="ud-menu">
          <div className="ud-user-info">
            <div className="ud-user-name">{user?.displayName || user?.username}</div>
            <div className="ud-user-role">{user?.role}</div>
          </div>
          <div className="ud-section">
            {navItem("Available Animals", <Icons.arrowRight size={14} color="var(--clr-warm-gray)" />, "/", !currentPath || currentPath === "?")}
            {navItem("Kennel Locations", <Icons.qrCode size={14} color="var(--clr-warm-gray)" />, "/?view=locations", currentPath.includes("view=locations"))}
            {isStaffOrAdmin && navItem("Activity Log", <Icons.clipboardList size={14} color="var(--clr-warm-gray)" />, "/?view=activity", currentPath.includes("view=activity"))}
            {isStaffOrAdmin && navItem("User Management", <Icons.users size={14} color="var(--clr-warm-gray)" />, "/?view=users", currentPath.includes("view=users"))}
          </div>
          <div className="ud-section-bottom">
            {onChangePassword && (
              <button role="menuitem" onClick={() => { setOpen(false); onChangePassword(); }} className="ud-change-password-btn">
                <Icons.lock size={14} color="var(--clr-warm-gray)" />
                Change Password
              </button>
            )}
            <button role="menuitem" onClick={onLogout} className="ud-signout-btn">
              <Icons.arrowRight size={14} color="var(--clr-brick-red)" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
