import { useState, useEffect } from "react";
import { useResponsive } from "../../hooks.js";
import { api } from "../../api.js";
import Icons from "../../Icons.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import UserDropdown from "../../components/UserDropdown.jsx";
import ChangePasswordModal from "../ChangePasswordModal.jsx";
import CreateUserModal from "./CreateUserModal.jsx";
import ResetPasswordModal from "./ResetPasswordModal.jsx";
import BatchImportModal from "./BatchImportModal.jsx";
import "./UserManagementScreen.css";

// ─── User Management Screen ───────────────────────────────────────────────────
export default function UserManagementScreen({ user, token, onLogout, darkMode, setDarkMode }) {
  const r = useResponsive();
  const isDesktop = r.width >= 768;
  const isAdmin = user?.role === "admin";

  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("volunteer");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const tabs = isAdmin
    ? [{ key: "volunteer", label: "Volunteers" }, { key: "staff", label: "Staff" }, { key: "device", label: "Devices" }, { key: "admin", label: "Admin" }]
    : [{ key: "volunteer", label: "Volunteers" }];

  const fetchUsers = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await api.getUsers(token);
      setUsers(data);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = (users || []).filter((u) => {
    if (u.role !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.username?.toLowerCase().includes(q) || u.deviceName?.toLowerCase().includes(q);
  });

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: "Expired", color: "#BE3A2B", bg: "#fef2f2" };
    if (diffDays <= 7) return { label: `Expires in ${diffDays}d`, color: "#e65100", bg: "#fff3e0" };
    return { label: `Expires ${exp.toLocaleDateString()}`, color: "#2d7a24", bg: "#f0fdf4" };
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    setDeleteLoading(true);
    setActionError("");
    try {
      await api.deleteUser(token, showDeleteConfirm.userId);
      setShowDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <main className="user-mgmt-screen">
      {/* Top bar */}
      <div className="user-mgmt-screen__topbar">
        <div className="user-mgmt-screen__topbar-left">
          <UserDropdown user={user} onLogout={onLogout} token={token} onChangePassword={() => setShowChangePassword(true)} />
        </div>
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" className="user-mgmt-screen__logo" />
        <div className="user-mgmt-screen__topbar-right">
          <button onClick={() => setDarkMode(!darkMode)} className="user-mgmt-screen__theme-btn" aria-label="Toggle dark mode">
            {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color="var(--clr-text-secondary)" />}
          </button>
        </div>
      </div>

      <div className={`user-mgmt-screen__content user-mgmt-screen__content--${isDesktop ? "desktop" : "mobile"}`}>
        {/* Header */}
        <div className="user-mgmt-screen__header-row">
          <button onClick={() => { window.location.href = "/"; }} className="user-mgmt-screen__back-btn" aria-label="Back">
            <Icons.back size={20} color="var(--clr-warm-gray)" />
          </button>
          <div className="user-mgmt-screen__title-group">
            <Icons.users size={22} color="var(--clr-header-green)" />
            <h2 className="user-mgmt-screen__title" style={{ fontSize: isDesktop ? 24 : 20 }}>User Management</h2>
          </div>
        </div>
        <p className="user-mgmt-screen__description">
          {isAdmin ? "Manage all user accounts" : "Manage volunteer accounts"}
        </p>

        {/* Tabs + actions row */}
        <div className="user-mgmt-screen__tabs-row">
          <div className="user-mgmt-screen__tabs">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`user-mgmt-screen__tab-btn user-mgmt-screen__tab-btn--${activeTab === t.key ? "active" : "inactive"}`}
                             >
                {t.label}
              </button>
            ))}
          </div>
          {activeTab !== "admin" && (
            <div className="user-mgmt-screen__actions">
              {isAdmin && (
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="user-mgmt-screen__batch-btn"
                                 >
                  <Icons.clipboardList size={15} color="var(--clr-text-secondary)" />
                  Batch Import
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="user-mgmt-screen__new-btn"
                             >
                <Icons.plus size={15} />
                New {activeTab === "volunteer" ? "Volunteer" : activeTab === "staff" ? "Staff" : "Device"}
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="user-mgmt-screen__search-wrap">
          <div className="user-mgmt-screen__search-icon">
            <Icons.search size={15} color="var(--clr-warm-gray)" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}s…`}
            className="user-mgmt-screen__search-input"
                     />
        </div>

        {actionError && (
          <div className="user-mgmt-screen__alert user-mgmt-screen__alert--action" role="alert">
            <Icons.alertCircle size={15} color="#BE3A2B" />
            <span className="user-mgmt-screen__alert-text--sm">{actionError}</span>
          </div>
        )}

        {loadError && (
          <div className="user-mgmt-screen__alert user-mgmt-screen__alert--load">
            <Icons.alertCircle size={16} color="#BE3A2B" />
            <span className="user-mgmt-screen__alert-text--md">{loadError}</span>
          </div>
        )}

        {loading && (
          <div className="user-mgmt-screen__skeleton-list">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={64} borderRadius={10} />)}
          </div>
        )}

        {/* Admin tab — env-var account, read-only */}
        {activeTab === "admin" && (
          <div className="user-mgmt-screen__admin-section">
            <div className="user-mgmt-screen__admin-card">
              <div className="user-mgmt-screen__admin-avatar">
                <Icons.shield size={16} color="var(--clr-header-green)" />
              </div>
              <div className="user-mgmt-screen__admin-info">
                <div className="user-mgmt-screen__admin-name">admin <span className="user-mgmt-screen__admin-note">(env account)</span></div>
                <div className="user-mgmt-screen__admin-meta">Password managed via <code>ADMIN_PASS</code> in server .env — cannot be reset here</div>
              </div>
              <span className="user-mgmt-screen__admin-badge">System Admin</span>
            </div>
            <div className="user-mgmt-screen__admin-hint">
              To change the admin password, update <code>ADMIN_PASS</code> in the server <code>.env</code> file and restart the backend.
            </div>
          </div>
        )}

        {activeTab !== "admin" && !loading && !loadError && filteredUsers.length === 0 && (
          <div className="user-mgmt-screen__empty">
            No {activeTab} accounts found.
          </div>
        )}

        {!loading && activeTab !== "admin" && filteredUsers.length > 0 && (
          <div className="user-mgmt-screen__user-list">
            {filteredUsers.map((u) => {
              const expStatus = getExpiryStatus(u.expiryDate);
              return (
                <div key={u.userId} className="user-mgmt-screen__user-card" style={{ flexWrap: isDesktop ? "nowrap" : "wrap" }}>
                  {/* Avatar */}
                  <div className="user-mgmt-screen__user-avatar">
                    <Icons.user size={16} color="var(--clr-warm-gray)" />
                  </div>
                  {/* Info */}
                  <div className="user-mgmt-screen__user-info">
                    <div className="user-mgmt-screen__user-name">{u.username}</div>
                    <div className="user-mgmt-screen__user-meta">
                      {u.deviceName && `Device: ${u.deviceName} · `}
                      Created {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                  {/* Expiry badge */}
                  {expStatus && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, backgroundColor: expStatus.bg, color: expStatus.color, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {expStatus.label}
                    </span>
                  )}
                  {/* Actions */}
                  <div className="user-mgmt-screen__user-actions">
                    <button
                      onClick={() => setShowResetModal(u)}
                      title="Reset password"
                      className="user-mgmt-screen__reset-btn"
                                         >
                      <Icons.key size={13} color="var(--clr-warm-gray)" />
                      {isDesktop && "Reset"}
                    </button>
                    <button
                      onClick={() => { setActionError(""); setShowDeleteConfirm(u); }}
                      title="Delete user"
                      className="user-mgmt-screen__delete-btn"
                                         >
                      <Icons.trash size={13} color="#BE3A2B" />
                      {isDesktop && "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          token={token}
          isAdmin={isAdmin}
          defaultRole={activeTab}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchUsers(); }}
        />
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <ResetPasswordModal
          token={token}
          targetUser={showResetModal}
          onClose={() => setShowResetModal(null)}
          onReset={() => setShowResetModal(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="user-mgmt-screen__delete-overlay" onClick={() => setShowDeleteConfirm(null)} role="dialog" aria-modal="true">
          <div className="user-mgmt-screen__delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="user-mgmt-screen__delete-icon">
              <Icons.trash size={22} color="#BE3A2B" />
            </div>
            <h2 className="user-mgmt-screen__delete-title">Delete Account</h2>
            <p className="user-mgmt-screen__delete-body">
              Delete <strong>{showDeleteConfirm.username}</strong>? This cannot be undone.
            </p>
            {actionError && <div className="user-mgmt-screen__delete-error">{actionError}</div>}
            <div className="user-mgmt-screen__delete-footer">
              <button onClick={() => setShowDeleteConfirm(null)} className="user-mgmt-screen__cancel-btn">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="user-mgmt-screen__confirm-delete-btn">
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && <ChangePasswordModal token={token} onClose={() => setShowChangePassword(false)} />}
      {showBatchModal && <BatchImportModal token={token} onClose={() => setShowBatchModal(false)} onDone={fetchUsers} />}
    </main>
  );
}
