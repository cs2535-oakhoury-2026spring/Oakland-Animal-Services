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
import EditExpiryModal from "./EditExpiryModal.jsx";
import "./UserManagementScreen.css";

// ─── User Management Screen ───────────────────────────────────────────────────
export default function UserManagementScreen({ user, token, onLogout, darkMode, setDarkMode }) {
  const r = useResponsive();
  const isDesktop = r.width >= 768;
  const isAdmin = user?.role === "admin";

  const getTagStyle = (tag) => {
    const text = String(tag || "No-tag").trim().toLowerCase();
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
      hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
    }

    const hue = hash % 360;
    return {
      "--tag-bg": `hsl(${hue} 60% 93%)`,
      "--tag-border": `hsl(${hue} 48% 80%)`,
      "--tag-text": `hsl(${hue} 42% 28%)`,
    };
  };

  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState("volunteer");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(null);
  const [showEditExpiryModal, setShowEditExpiryModal] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagModalScope, setTagModalScope] = useState("single");
  const [tagModalUser, setTagModalUser] = useState(null);
  const [tagModalValue, setTagModalValue] = useState("");
  const [tagModalError, setTagModalError] = useState("");
  const [tagModalLoading, setTagModalLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkExpiryDate, setBulkExpiryDate] = useState("");
  const [actionError, setActionError] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const canBatchImport = isAdmin || user?.role === "staff";

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

  const parsedTagFilters = tagFilter
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const tagFilterSet = new Set(parsedTagFilters);

  const tagSuggestions = Array.from(new Set(
    (users || [])
      .filter((u) => u.role === activeTab)
      .map((u) => String(u.tag || "No-tag").trim())
      .filter(Boolean),
  )).sort((a, b) => a.localeCompare(b));

  const tagFilterSegments = tagFilter.split(",");
  const activeTagSegmentRaw = tagFilterSegments[tagFilterSegments.length - 1] || "";
  const activeTagSegment = activeTagSegmentRaw.trim().toLowerCase();
  const committedTagFilters = new Set(
    tagFilterSegments
      .slice(0, -1)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  const visibleTagSuggestions = tagSuggestions
    .filter((tag) => {
      const normalizedTag = tag.toLowerCase();
      if (committedTagFilters.has(normalizedTag)) return false;
      if (!activeTagSegment) return true;
      return normalizedTag.includes(activeTagSegment);
    })
    .slice(0, 8);

  const filteredUsers = (users || []).filter((u) => {
    if (u.role !== activeTab) return false;
    const q = searchQuery.trim().toLowerCase();
    const haystack = [u.username, u.deviceName, u.tag]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());
    const normalizedUserTag = String(u.tag || "No-tag").trim().toLowerCase();

    if (q && !haystack.some((value) => value.includes(q))) return false;
    if (tagFilterSet.size > 0 && !tagFilterSet.has(normalizedUserTag)) return false;
    return true;
  });

  const sortedFilteredUsers = [...filteredUsers].sort((a, b) => {
    const aRaw = sortField === "expiresAt" ? a.expiresAt : a.createdAt;
    const bRaw = sortField === "expiresAt" ? b.expiresAt : b.createdAt;

    const aTime = aRaw ? new Date(aRaw).getTime() : null;
    const bTime = bRaw ? new Date(bRaw).getTime() : null;

    if (aTime == null && bTime == null) return 0;
    if (aTime == null) return 1;
    if (bTime == null) return -1;

    const diff = aTime - bTime;
    return sortDirection === "asc" ? diff : -diff;
  });

  useEffect(() => {
    setSelectedUserIds([]);
  }, [activeTab, searchQuery, tagFilter, users]);

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    const now = new Date();
    const diffMs = exp - now;
    if (diffMs < 0) {
      return {
        label: `Expired ${exp.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        color: "#BE3A2B",
        bg: "#fef2f2",
      };
    }
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (diffDays < 1) return { label: `Expires in ${diffHours}h`, color: "#BE3A2B", bg: "#fef2f2" };
    if (diffDays <= 7) return { label: `Expires in ${diffDays}d ${diffHours}h`, color: "#e65100", bg: "#fff3e0" };
    return { label: `Expires ${exp.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`, color: "#2d7a24", bg: "#f0fdf4" };
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

  const expiredVolunteerIds = filteredUsers
    .filter((u) => u.role === "volunteer" && u.expiresAt && new Date(u.expiresAt) < new Date())
    .map((u) => u.userId);
  const tagMatchedIds = tagFilterSet.size > 0 ? filteredUsers.map((u) => u.userId) : [];
  const selectedUsers = filteredUsers.filter((u) => selectedUserIds.includes(u.userId));

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) => (
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    ));
  };

  const selectAllExpired = () => {
    setSelectedUserIds(expiredVolunteerIds);
  };

  const selectAllByTag = () => {
    setSelectedUserIds(tagMatchedIds);
  };

  const applyTagSuggestion = (suggestedTag) => {
    const committed = tagFilterSegments
      .slice(0, -1)
      .map((value) => value.trim())
      .filter(Boolean);

    setTagFilter(`${[...committed, suggestedTag].join(", ")}, `);
    setShowTagSuggestions(false);
  };

  const closeTagModal = () => {
    setShowTagModal(false);
    setTagModalScope("single");
    setTagModalUser(null);
    setTagModalValue("");
    setTagModalError("");
  };

  const handleBulkRenameTag = () => {
    if (selectedUsers.length === 0) return;

    const currentTags = new Set(selectedUsers.map((selectedUser) => selectedUser.tag || ""));
    const defaultTag = currentTags.size === 1 ? selectedUsers[0].tag || "" : "";
    setTagModalScope("bulk");
    setTagModalUser(null);
    setTagModalValue(defaultTag);
    setTagModalError("");
    setShowTagModal(true);
  };

  const handleEditTag = (targetUser) => {
    if (!isAdmin && user?.role !== "staff") return;

    setTagModalScope("single");
    setTagModalUser(targetUser);
    setTagModalValue(targetUser.tag || "");
    setTagModalError("");
    setShowTagModal(true);
  };

  const handleTagModalSubmit = async () => {
    const trimmedTag = tagModalValue.trim() || "No-tag";

    setTagModalLoading(true);
    setTagModalError("");
    setActionError("");

    try {
      if (tagModalScope === "bulk") {
        if (selectedUsers.length === 0) {
          closeTagModal();
          return;
        }

        const result = await api.batchRenameUsersTag(
          token,
          selectedUsers.map((selectedUser) => selectedUser.userId),
          trimmedTag,
        );
        if (result.failed.length > 0) {
          setActionError(`Failed to rename tag for ${result.failed.length} user(s).`);
        }
        setSelectedUserIds([]);
      } else {
        if (!tagModalUser) {
          closeTagModal();
          return;
        }

        await api.updateUser(token, tagModalUser.userId, { tag: trimmedTag });
      }

      closeTagModal();
      await fetchUsers();
    } catch (err) {
      setTagModalError(err.message);
    } finally {
      setTagModalLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedUserIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    const shouldDelete = window.confirm(`Delete ${selectedUserIds.length} selected ${activeTab} account(s)? This cannot be undone.`);
    if (!shouldDelete) return;

    setBulkActionLoading(true);
    setActionError("");
    try {
      const result = await api.batchDeleteUsers(token, selectedUserIds);
      if (result.failed.length > 0) {
        setActionError(`Failed to delete ${result.failed.length} user(s).`);
      }
      setSelectedUserIds([]);
      await fetchUsers();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkExpiryUpdate = async () => {
    if (!bulkExpiryDate.trim() || selectedUserIds.length === 0) return;

    setBulkActionLoading(true);
    setActionError("");
    try {
      const isoExpiryDate = new Date(bulkExpiryDate).toISOString();
      const result = await api.batchUpdateUsers(token, selectedUserIds, {
        expiresAt: isoExpiryDate,
      });
      if (result.failed.length > 0) {
        setActionError(`Failed to update expiry for ${result.failed.length} user(s).`);
      }
      setBulkExpiryDate("");
      setSelectedUserIds([]);
      await fetchUsers();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBulkActionLoading(false);
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
          <div className="user-mgmt-screen__actions">
              {canBatchImport && activeTab === "volunteer" && (
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
                New {activeTab === "volunteer" ? "Volunteer" : activeTab === "staff" ? "Staff" : activeTab === "admin" ? "Admin" : "Device"}
              </button>
            </div>
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

        <div className="user-mgmt-screen__tag-row">
          <label className="user-mgmt-screen__tag-label">
            Tag filter
            <div className="user-mgmt-screen__tag-input-wrap">
              <input
                type="text"
                value={tagFilter}
                onChange={(e) => {
                  setTagFilter(e.target.value);
                  setShowTagSuggestions(true);
                }}
                onFocus={() => setShowTagSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowTagSuggestions(false), 120);
                }}
                placeholder="Filter by tag (comma-separated)"
                className="user-mgmt-screen__tag-input"
                aria-label="Filter users by tag"
                autoComplete="off"
              />
              {showTagSuggestions && visibleTagSuggestions.length > 0 && (
                <div className="user-mgmt-screen__tag-suggestions" role="listbox" aria-label="Tag suggestions">
                  {visibleTagSuggestions.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className="user-mgmt-screen__tag-suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyTagSuggestion(tag);
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>
        </div>

        <div className="user-mgmt-screen__sort-row">
          <label className="user-mgmt-screen__sort-label">
            Sort by
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="user-mgmt-screen__sort-select"
              aria-label="Sort users by field"
            >
              <option value="createdAt">Time Created</option>
              <option value="expiresAt">Expiry Date</option>
            </select>
          </label>
          <label className="user-mgmt-screen__sort-label">
            Order
            <select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value)}
              className="user-mgmt-screen__sort-select"
              aria-label="Sort users by order"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>

                  {(activeTab === "volunteer" || activeTab === "staff" || activeTab === "device") && (
                    <div className="user-mgmt-screen__bulk-bar">
                      {tagFilterSet.size > 0 && (
                        <button
                          onClick={selectAllByTag}
                          className="user-mgmt-screen__bulk-btn"
                          disabled={tagMatchedIds.length === 0 || bulkActionLoading}
                        >
                          <Icons.check size={13} color="var(--clr-text-secondary)" />
                          Select All with Tag
                        </button>
                      )}
                      {activeTab === "volunteer" && (
                        <button
                          onClick={selectAllExpired}
                          className="user-mgmt-screen__bulk-btn"
                          disabled={expiredVolunteerIds.length === 0 || bulkActionLoading}
                        >
                          <Icons.check size={13} color="var(--clr-text-secondary)" />
                          Select Expired ({expiredVolunteerIds.length})
                        </button>
                      )}
                      <button
                        onClick={clearSelection}
                        className="user-mgmt-screen__bulk-btn"
                        disabled={selectedUserIds.length === 0 || bulkActionLoading}
                      >
                        Deselect
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="user-mgmt-screen__bulk-delete-btn"
                        disabled={selectedUserIds.length === 0 || bulkActionLoading}
                      >
                        <Icons.trash size={13} color="#BE3A2B" />
                        {bulkActionLoading ? "Working..." : `Delete (${selectedUserIds.length})`}
                      </button>
                      <button
                        onClick={handleBulkRenameTag}
                        className="user-mgmt-screen__bulk-btn"
                        disabled={selectedUserIds.length === 0 || bulkActionLoading}
                      >
                        <Icons.pencil size={13} color="var(--clr-text-secondary)" />
                        Rename Tag
                      </button>
                      {activeTab === "volunteer" && (
                        <>
                          <input
                            type="datetime-local"
                            value={bulkExpiryDate}
                            onChange={(e) => setBulkExpiryDate(e.target.value)}
                            className="user-mgmt-screen__bulk-date-input"
                            aria-label="Bulk expiry date and time"
                          />
                          <button
                            onClick={handleBulkExpiryUpdate}
                            className="user-mgmt-screen__bulk-update-btn"
                            disabled={selectedUserIds.length === 0 || !bulkExpiryDate.trim() || bulkActionLoading}
                          >
                            Update Expiry Time
                          </button>
                        </>
                      )}
                    </div>
                  )}

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



        {!loading && !loadError && sortedFilteredUsers.length === 0 && (
          <div className="user-mgmt-screen__empty">
            No {activeTab} accounts found.
          </div>
        )}

        {!loading && sortedFilteredUsers.length > 0 && (
          <div className="user-mgmt-screen__user-list">
            {sortedFilteredUsers.map((u) => {
              const expStatus = getExpiryStatus(u.expiresAt);
              return (
                <div key={u.userId} className="user-mgmt-screen__user-card" style={{ flexWrap: isDesktop ? "nowrap" : "wrap" }}>
                  {(activeTab === "volunteer" || activeTab === "staff" || activeTab === "device") && (
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(u.userId)}
                      onChange={() => toggleUserSelection(u.userId)}
                      className="user-mgmt-screen__select-checkbox"
                      aria-label={`Select ${u.username}`}
                    />
                  )}
                  {/* Avatar */}
                  <div className="user-mgmt-screen__user-avatar">
                    <Icons.user size={16} color="var(--clr-warm-gray)" />
                  </div>
                  {/* Info */}
                  <div className="user-mgmt-screen__user-info">
                    <div className="user-mgmt-screen__user-name-row">
                      <div className="user-mgmt-screen__user-name">{u.username}</div>
                      <button
                        type="button"
                        className="user-mgmt-screen__user-tag"
                        style={getTagStyle(u.tag || "No-tag")}
                        onClick={() => handleEditTag(u)}
                        title="Click to edit tag"
                        aria-label={`Edit tag for ${u.username}`}
                      >
                        {u.tag || "No-tag"}
                      </button>
                    </div>
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
                    {activeTab === "volunteer" && (
                      <button
                        onClick={() => setShowEditExpiryModal(u)}
                        title="Edit expiry date"
                        className="user-mgmt-screen__edit-btn"
                      >
                        <Icons.pencil size={13} color="currentColor" />
                        {isDesktop && "Edit Expiry"}
                      </button>
                    )}
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

      {/* Edit Expiry Modal */}
      {showEditExpiryModal && (
        <EditExpiryModal
          token={token}
          targetUser={showEditExpiryModal}
          onClose={() => setShowEditExpiryModal(null)}
          onUpdated={() => { setShowEditExpiryModal(null); fetchUsers(); }}
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

      {showTagModal && (
        <div className="user-mgmt-screen__delete-overlay" onClick={closeTagModal} role="dialog" aria-modal="true">
          <div className="user-mgmt-screen__delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="user-mgmt-screen__delete-icon" style={{ backgroundColor: "var(--clr-input-bg)", borderColor: "var(--clr-input-border)" }}>
              <Icons.pencil size={22} color="var(--clr-text-secondary)" />
            </div>
            <h2 className="user-mgmt-screen__delete-title">Rename Tag</h2>
            <p className="user-mgmt-screen__delete-body">
              {tagModalScope === "bulk"
                ? `Set a tag for ${selectedUsers.length} selected user${selectedUsers.length === 1 ? "" : "s"}.`
                : `Set a tag for ${tagModalUser?.username || "this user"}.`}
            </p>
            <input
              type="text"
              value={tagModalValue}
              onChange={(e) => setTagModalValue(e.target.value)}
              placeholder="e.g. shelter-team"
              className="user-mgmt-screen__tag-modal-input"
              autoFocus
              aria-label="Tag name"
            />
            <p className="user-mgmt-screen__tag-modal-hint">Leave blank to save as No-tag.</p>
            {tagModalError && <div className="user-mgmt-screen__delete-error">{tagModalError}</div>}
            <div className="user-mgmt-screen__delete-footer">
              <button onClick={closeTagModal} className="user-mgmt-screen__cancel-btn" disabled={tagModalLoading}>Cancel</button>
              <button onClick={handleTagModalSubmit} disabled={tagModalLoading} className="user-mgmt-screen__confirm-tag-btn">
                {tagModalLoading ? "Saving..." : "Save Tag"}
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
