import { useState, useEffect, useCallback } from "react";
import { useResponsive } from "../hooks.js";
import { api } from "../api.js";
import { formatTimestamp } from "../utils.js";
import Icons from "../Icons.jsx";
import Skeleton from "../components/Skeleton.jsx";
import UserDropdown from "../components/UserDropdown.jsx";
import ChangePasswordModal from "./ChangePasswordModal.jsx";
import "./ActivityLogScreen.css";

// ─── Activity Log Screen ──────────────────────────────────────────────────────
export default function ActivityLogScreen({ user, token, onLogout, darkMode, setDarkMode }) {
  const r = useResponsive();
  const isDesktop = r.width >= 768;
  const isAdmin = user?.role === "admin";

  const [logs, setLogs] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [filterActor, setFilterActor] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showBehavior, setShowBehavior] = useState(true);
  const [showObserver, setShowObserver] = useState(true);
  const [showAuth, setShowAuth] = useState(true);

  const [expandedLog, setExpandedLog] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const fetchLogs = useCallback(async (pg = 1) => {
    setLoading(true);
    setLoadError("");
    try {
      const tags = [
        showBehavior && "behaviorNote",
        showObserver && "observerNote",
        isAdmin && showAuth && "authEvent",
      ].filter(Boolean).join(",");

      const data = await api.getActivityLogs(token, {
        tags: tags || "behaviorNote",
        actor: filterActor.trim() || undefined,
        action: filterAction.trim() || undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
        page: pg,
        limit: 25,
      });
      setLogs(data.logs || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || pg);
    } catch (err) {
      setLoadError(err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [token, filterActor, filterAction, filterFrom, filterTo, showBehavior, showObserver, showAuth, isAdmin]);

  useEffect(() => { fetchLogs(1); }, []);

  const tagColors = {
    behaviorNote: { bg: "#e8f5e9", text: "#2d7a24", label: "Behavior" },
    observerNote: { bg: "#e3f2fd", text: "#1565c0", label: "Medical" },
    authEvent: { bg: "#fce4ec", text: "#c62828", label: "Auth" },
  };

  const tagBadge = (tag) => {
    const t = tagColors[tag] || { bg: "var(--clr-input-bg)", text: "var(--clr-warm-gray)", label: tag };
    return (
      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, backgroundColor: t.bg, color: t.text, whiteSpace: "nowrap" }}>
        {t.label}
      </span>
    );
  };

  const getLogPetId = (log) => {
    if (!log || !log.jsonData) return null;
    const rawPetId = log.jsonData.petId;
    if (typeof rawPetId === "number" && Number.isFinite(rawPetId)) return String(rawPetId);
    if (typeof rawPetId === "string" && rawPetId.trim()) return rawPetId.trim();
    return null;
  };

  const openAnimalFromLog = (petId) => {
    if (!petId) return;
    window.location.href = `/?petId=${encodeURIComponent(petId)}`;
  };

  const renderPaginationControls = (extraClass = "") => {
    if (totalPages <= 1) return null;
    return (
      <div className={`activity-log-screen__pagination ${extraClass}`.trim()}>
        <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1} className="activity-log-screen__page-btn">Previous</button>
        <span className="activity-log-screen__page-info">Page {page} of {totalPages}</span>
        <label className="activity-log-screen__page-select-wrap">
          <span className="activity-log-screen__page-select-label">Go to</span>
          <select
            value={page}
            onChange={(e) => fetchLogs(Number(e.target.value))}
            className="activity-log-screen__page-select"
            aria-label="Select activity log page"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <button onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages} className="activity-log-screen__page-btn">Next</button>
      </div>
    );
  };

  return (
    <main className="activity-log-screen">
      {/* Top bar */}
      <div className="activity-log-screen__topbar">
        <div className="activity-log-screen__topbar-left">
          <UserDropdown user={user} onLogout={onLogout} token={token} onChangePassword={() => setShowChangePassword(true)} />
        </div>
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" className="activity-log-screen__logo" />
        <div className="activity-log-screen__topbar-right">
          <button onClick={() => setDarkMode(!darkMode)} className="activity-log-screen__theme-btn" aria-label="Toggle dark mode">
            {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color="var(--clr-text-secondary)" />}
          </button>
        </div>
      </div>

      <div className={`activity-log-screen__content activity-log-screen__content--${isDesktop ? "desktop" : "mobile"}`}>
        {/* Header */}
        <div className="activity-log-screen__header-row">
          <button onClick={() => { window.location.href = "/"; }} className="activity-log-screen__back-btn" aria-label="Back to home">
            <Icons.back size={20} color="var(--clr-warm-gray)" />
          </button>
          <div className="activity-log-screen__title-group">
            <Icons.clipboardList size={22} color="var(--clr-header-green)" />
            <h2 className="activity-log-screen__title" style={{ fontSize: isDesktop ? 24 : 20 }}>Activity Log</h2>
          </div>
        </div>
        <p className="activity-log-screen__description">
          {isAdmin ? "All system activity including auth events" : "Behavior and medical note activity"}
        </p>

        {/* Filters card */}
        <div className={`activity-log-screen__filters activity-log-screen__filters--${isDesktop ? "desktop" : "mobile"}`}>
          <div className="activity-log-screen__filter-grid" style={{ gridTemplateColumns: isDesktop ? "1fr 1fr 1fr 1fr" : "1fr 1fr" }}>
            {[
              { label: "Actor (username)", val: filterActor, set: setFilterActor, placeholder: "Filter by user…" },
              { label: "Action", val: filterAction, set: setFilterAction, placeholder: "e.g. USER_CREATED" },
              { label: "From date", val: filterFrom, set: setFilterFrom, type: "date" },
              { label: "To date", val: filterTo, set: setFilterTo, type: "date" },
            ].map(({ label, val, set, placeholder, type = "text" }) => (
              <div key={label}>
                <label className="activity-log-screen__filter-label">{label}</label>
                <input type={type} value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder} className="activity-log-screen__filter-input" />
              </div>
            ))}
          </div>

          <div className="activity-log-screen__toggle-row">
            <span className="activity-log-screen__toggle-heading">Show:</span>
            {[
              { key: "behavior", label: "Behavior Notes", val: showBehavior, set: setShowBehavior },
              { key: "observer", label: "Medical Notes", val: showObserver, set: setShowObserver },
              ...(isAdmin ? [{ key: "auth", label: "Auth Events", val: showAuth, set: setShowAuth }] : []),
            ].map(({ key, label, val, set }) => (
              <label key={key} className="activity-log-screen__toggle-label">
                <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} />
                {label}
              </label>
            ))}
          </div>

          <div className="activity-log-screen__filter-actions">
            <button onClick={() => fetchLogs(1)} disabled={loading} className="activity-log-screen__apply-btn">
              {loading ? "Loading…" : "Apply Filters"}
            </button>
            <button onClick={() => { setFilterActor(""); setFilterAction(""); setFilterFrom(""); setFilterTo(""); setShowBehavior(true); setShowObserver(true); setShowAuth(true); }} className="activity-log-screen__clear-btn">
              Clear
            </button>
          </div>
        </div>

        {/* Results count */}
        {logs !== null && !loading && (
          <div className="activity-log-screen__count-row">
            <div className="activity-log-screen__count">
              {loadError ? "" : `${totalCount} event${totalCount !== 1 ? "s" : ""} · page ${page} of ${totalPages}`}
            </div>
            {!loadError && renderPaginationControls("activity-log-screen__pagination--top")}
          </div>
        )}

        {/* Error */}
        {loadError && (
          <div className="activity-log-screen__error">
            <Icons.alertCircle size={16} color="#BE3A2B" />
            <span className="activity-log-screen__error-text">{loadError}</span>
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="activity-log-screen__skeleton-list">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={60} borderRadius={10} />
            ))}
          </div>
        )}

        {/* Log rows */}
        {!loading && logs && logs.length === 0 && !loadError && (
          <div className="activity-log-screen__empty">
            No activity logs found for the selected filters.
          </div>
        )}

        {!loading && logs && logs.length > 0 && (
          <div className="activity-log-screen__log-list">
            {logs.map((log) => {
              const isExpanded = expandedLog === log.logId;
              const hasData = log.jsonData && Object.keys(log.jsonData).length > 0;
              const isAnimalRelated = log.tag === "behaviorNote" || log.tag === "observerNote";
              const petId = getLogPetId(log);
              return (
                <div key={log.logId} className="activity-log-screen__log-row">
                  <div
                    className="activity-log-screen__log-header"
                    style={{ cursor: hasData ? "pointer" : "default" }}
                    onClick={() => hasData && setExpandedLog(isExpanded ? null : log.logId)}
                  >
                    <div className="activity-log-screen__log-tag">{tagBadge(log.tag)}</div>
                    <div className="activity-log-screen__log-body">
                      <div className={`activity-log-screen__log-action${isDesktop ? " activity-log-screen__log-action--desktop" : ""}`}>
                        {log.action}
                      </div>
                      <div className="activity-log-screen__log-meta">
                        by <strong>{log.actor}</strong> · {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                    {isAnimalRelated && petId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAnimalFromLog(petId);
                        }}
                        className="activity-log-screen__animal-btn"
                      >
                        Go To Animal
                      </button>
                    )}
                    {hasData && (
                      <div className="activity-log-screen__log-chevron">
                        <Icons.chevron size={14} color="var(--clr-warm-gray)" down={!isExpanded} />
                      </div>
                    )}
                  </div>
                  {isExpanded && hasData && (
                    <div className="activity-log-screen__log-detail">
                      <pre className="activity-log-screen__log-pre">
                        {JSON.stringify(log.jsonData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && renderPaginationControls()}
      </div>

      {showChangePassword && <ChangePasswordModal token={token} onClose={() => setShowChangePassword(false)} />}
    </main>
  );
}
