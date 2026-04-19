import { useState, useEffect, useCallback, useMemo } from "react";
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
  const [showActorSuggestions, setShowActorSuggestions] = useState(false);
  const [showActionSuggestions, setShowActionSuggestions] = useState(false);

  const [expandedLog, setExpandedLog] = useState(null);
  const [petCache, setPetCache] = useState({});
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [exporting, setExporting] = useState(false);

  const knownActionSuggestions = [
    "CREATED",
    "DELETED",
    "STATUS_CHANGED",
    "BULK_DELETED",
    "USER_CREATED",
    "USER_UPDATED",
    "USER_DELETED",
    "USER_PASSWORD_RESET",
    "PASSWORD_CHANGED",
    "SUMMARY_GENERATED",
  ];

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

  const buildFilters = useCallback((pg = 1, limit = 25) => {
    const tags = [
      showBehavior && "behaviorNote",
      showObserver && "observerNote",
      isAdmin && showAuth && "authEvent",
    ].filter(Boolean).join(",");

    return {
      tags: tags || "behaviorNote",
      actor: filterActor.trim() || undefined,
      action: filterAction.trim() || undefined,
      from: filterFrom || undefined,
      to: filterTo || undefined,
      page: pg,
      limit,
    };
  }, [filterAction, filterActor, filterFrom, filterTo, isAdmin, showAuth, showBehavior, showObserver]);

  const csvEscape = (val) => {
    const raw = val == null ? "" : String(val);
    return `"${raw.replace(/"/g, '""')}"`;
  };

  const exportFilteredLogsToCsv = useCallback(async () => {
    try {
      setExporting(true);
      setLoadError("");

      const exportLimit = 200;
      const firstPage = await api.getActivityLogs(token, buildFilters(1, exportLimit));
      const total = firstPage.totalPages || 1;
      const allLogs = [...(firstPage.logs || [])];

      for (let p = 2; p <= total; p += 1) {
        const data = await api.getActivityLogs(token, buildFilters(p, exportLimit));
        allLogs.push(...(data.logs || []));
      }

      const headers = [
        "timestamp",
        "tag",
        "action",
        "actor",
        "petId",
        "jsonData",
      ];

      const rows = allLogs.map((log) => {
        const petId = log?.jsonData?.petId ?? "";
        return [
          log.timestamp || "",
          log.tag || "",
          log.action || "",
          log.actor || "",
          petId,
          log.jsonData ? JSON.stringify(log.jsonData) : "",
        ];
      });

      const csv = [headers, ...rows]
        .map((cols) => cols.map(csvEscape).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = url;
      link.setAttribute("download", `activity-log-export-${stamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setLoadError(err.message || "Failed to export activity logs");
    } finally {
      setExporting(false);
    }
  }, [buildFilters, token]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const tagColors = {
    behaviorNote: { bg: "#e8f5e9", text: "#2d7a24", label: "Behavior" },
    observerNote: { bg: "#e3f2fd", text: "#1565c0", label: "Medical" },
    authEvent: { bg: "#fce4ec", text: "#c62828", label: "Auth" },
  };

  const tagBadge = (tag) => {
    const t = tagColors[tag] || { bg: "var(--clr-input-bg)", text: "var(--clr-warm-gray)", label: tag };
    return (
      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, backgroundColor: t.bg, color: t.text, whiteSpace: "nowrap", marginLeft: 8 }}>
        {t.label}
      </span>
    );
  };

  const getLogPetImage = (log) => {
    const petId = getLogPetId(log);
    if (!petId) return null;
    return petCache[petId]?.imageUrl || null;
  };

  const getLogPetLabel = (log) => {
    const petId = getLogPetId(log);
    if (!petId) return null;
    return petCache[petId]?.name || petId;
  };

  const getLogNoteText = (log) => {
    if (!log?.jsonData) return null;
    return log.jsonData.content || log.jsonData.note || log.jsonData.body || log.jsonData.message || null;
  };

  useEffect(() => {
    if (!Array.isArray(logs) || logs.length === 0) return;
    const animalPetIds = Array.from(new Set(
      logs
        .map(getLogPetId)
        .filter(Boolean),
    ));
    const missingPetIds = animalPetIds.filter((petId) => !petCache[petId]);
    if (missingPetIds.length === 0) return;

    let active = true;
    Promise.all(
      missingPetIds.map((petId) =>
        api.getPet(petId)
          .then((pet) => ({ petId, pet }))
          .catch(() => null),
      ),
    ).then((results) => {
      if (!active) return;
      setPetCache((prev) => {
        const next = { ...prev };
        results.forEach((item) => {
          if (item?.petId && item.pet) next[item.petId] = item.pet;
        });
        return next;
      });
    });

    return () => {
      active = false;
    };
  }, [logs, petCache]);

  const actionSuggestions = useMemo(() => {
    const observedActions = Array.isArray(logs)
      ? logs.map((log) => log.action).filter((action) => typeof action === "string" && action.trim())
      : [];
    return Array.from(new Set([...knownActionSuggestions, ...observedActions])).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const actorSuggestions = useMemo(() => {
    const observedActors = Array.isArray(logs)
      ? logs.map((log) => log.actor).filter((actor) => typeof actor === "string" && actor.trim())
      : [];
    return Array.from(new Set(observedActors)).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const filteredActorSuggestions = useMemo(() => {
    const q = filterActor.trim().toLowerCase();
    return actorSuggestions
      .filter((actor) => !q || actor.toLowerCase().includes(q))
      .slice(0, 8);
  }, [actorSuggestions, filterActor]);

  const filteredActionSuggestions = useMemo(() => {
    const rawTokens = filterAction
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const currentToken = rawTokens.length > 0
      ? rawTokens[rawTokens.length - 1].toUpperCase()
      : "";
    const existingSelections = new Set(rawTokens.slice(0, -1).map((t) => t.toUpperCase()));

    return actionSuggestions
      .filter((action) => !existingSelections.has(action.toUpperCase()))
      .filter((action) => !currentToken || action.toUpperCase().includes(currentToken))
      .slice(0, 8);
  }, [actionSuggestions, filterAction]);

  const applyActionSuggestion = (selectedAction) => {
    const rawParts = filterAction.split(",");
    const prefixParts = rawParts
      .slice(0, -1)
      .map((p) => p.trim())
      .filter(Boolean);

    const nextValue = prefixParts.length > 0
      ? `${prefixParts.join(", ")}, ${selectedAction}`
      : selectedAction;

    setFilterAction(nextValue);
    setShowActionSuggestions(false);
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
            <div>
              <label className="activity-log-screen__filter-label">Actor (username)</label>
              <div className="activity-log-screen__actor-autocomplete">
                <input
                  type="text"
                  value={filterActor}
                  onChange={(e) => {
                    setFilterActor(e.target.value);
                    setShowActorSuggestions(true);
                  }}
                  onFocus={() => setShowActorSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowActorSuggestions(false), 120)}
                  placeholder="Filter by user…"
                  className="activity-log-screen__filter-input"
                />
                {showActorSuggestions && filteredActorSuggestions.length > 0 && (
                  <div className="activity-log-screen__actor-suggestions" role="listbox" aria-label="Actor suggestions">
                    {filteredActorSuggestions.map((actor) => (
                      <button
                        key={actor}
                        type="button"
                        className="activity-log-screen__actor-suggestion-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setFilterActor(actor);
                          setShowActorSuggestions(false);
                        }}
                      >
                        {actor}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="activity-log-screen__filter-label">Action</label>
              <div className="activity-log-screen__action-autocomplete">
                <input
                  type="text"
                  value={filterAction}
                  onChange={(e) => {
                    setFilterAction(e.target.value);
                    setShowActionSuggestions(true);
                  }}
                  onFocus={() => setShowActionSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowActionSuggestions(false), 120)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && showActionSuggestions && filteredActionSuggestions.length > 0) {
                      e.preventDefault();
                      applyActionSuggestion(filteredActionSuggestions[0]);
                    }
                  }}
                  placeholder="e.g. USER_CREATED, DELETED"
                  className="activity-log-screen__filter-input"
                />
                {showActionSuggestions && filteredActionSuggestions.length > 0 && (
                  <div className="activity-log-screen__action-suggestions" role="listbox" aria-label="Action suggestions">
                    {filteredActionSuggestions.map((action) => (
                      <button
                        key={action}
                        type="button"
                        className="activity-log-screen__action-suggestion-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyActionSuggestion(action)}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="activity-log-screen__filter-label">From date</label>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="activity-log-screen__filter-input"
              />
            </div>

            <div>
              <label className="activity-log-screen__filter-label">To date</label>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="activity-log-screen__filter-input"
              />
            </div>
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
            <button onClick={() => { setFilterActor(""); setFilterAction(""); setFilterFrom(""); setFilterTo(""); setShowBehavior(true); setShowObserver(true); setShowAuth(true); }} className="activity-log-screen__clear-btn">
              Reset
            </button>
            <button
              onClick={exportFilteredLogsToCsv}
              disabled={loading || exporting}
              className="activity-log-screen__export-btn"
            >
              {exporting ? "Exporting…" : "Export CSV"}
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
              const petId = getLogPetId(log);
              const isAnimalRelated = Boolean(petId);
              return (
                <div key={log.logId} className="activity-log-screen__log-row">
                  <div
                    className="activity-log-screen__log-header"
                    style={{ cursor: hasData ? "pointer" : "default" }}
                    onClick={() => hasData && setExpandedLog(isExpanded ? null : log.logId)}
                  >
                    {isAnimalRelated && petId && (
                      <div className="activity-log-screen__pet-card">
                        <div className="activity-log-screen__pet-name">{getLogPetLabel(log)}</div>
                        {getLogPetImage(log) ? (
                          <img
                            src={getLogPetImage(log)}
                            alt={`${getLogPetLabel(log)} photo`}
                            className="activity-log-screen__pet-image"
                          />
                        ) : null}
                      </div>
                    )}
                    <div className="activity-log-screen__log-body">
                      <div className={`activity-log-screen__log-action${isDesktop ? " activity-log-screen__log-action--desktop" : ""}`}>
                        {log.action}
                        {tagBadge(log.tag)}
                      </div>
                      <div className="activity-log-screen__log-meta">
                        by <strong>{log.actor}</strong> · {formatTimestamp(log.timestamp)}
                      </div>
                      {getLogNoteText(log) && (
                        <div className="activity-log-screen__note-preview">
                          {getLogNoteText(log)}
                        </div>
                      )}
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
                      {getLogNoteText(log) ? (
                        <div className="activity-log-screen__log-note-full">
                          {getLogNoteText(log)}
                        </div>
                      ) : null}
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
