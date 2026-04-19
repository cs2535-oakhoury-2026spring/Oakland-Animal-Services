import { useState, useEffect, useRef, useCallback } from "react";
import { findSimilarNotes } from "../utils/noteSearcher.js";
import { NOTES_PER_PAGE, PLACEHOLDER_CAT, PLACEHOLDER_DOG, HANDLER_LEVEL_COLORS } from "../constants.js";
import { useResponsive } from "../hooks.js";
import { api, noteDataCache } from "../api.js";
import Icons from "../Icons.jsx";
import Skeleton from "./Skeleton.jsx";
import UserDropdown from "./UserDropdown.jsx";
import HandlerLevelIndicator from "./HandlerLevelIndicator.jsx";
import SummaryTab from "./SummaryTab.jsx";
import QRCodeModal from "./QRCodeModal.jsx";
import DesktopPortal from "./DesktopPortal.jsx";
import MedicalNoteCard from "./notes/MedicalNoteCard.jsx";
import BehaviorNoteCard from "./notes/BehaviorNoteCard.jsx";
import CreateNoteModal from "./notes/CreateNoteModal.jsx";
import CreateBehaviorNoteModal from "./notes/CreateBehaviorNoteModal.jsx";
import './Portal.css';

// ─── Portal ───────────────────────────────────────────────────────────────────
export default function Portal({ user, token, petId, onLogout, onBack, darkMode, setDarkMode, onChangePassword }) {
  const r = useResponsive();
  const [pet, setPet] = useState(null);
  const [notes, setNotes] = useState([]);
  const [behaviorNotes, setBehaviorNotes] = useState([]);
  const [activeTab, setActiveTab] = useState("summary");
  const [, setPrevTab] = useState("summary");
  const [slideDirection, setSlideDirection] = useState("right");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateBehaviorModal, setShowCreateBehaviorModal] = useState(false);
  const [pendingDeleteMedicalNote, setPendingDeleteMedicalNote] = useState(null);
  const [skipMedicalDeleteConfirm, setSkipMedicalDeleteConfirm] = useState(false);
  const [deleteDontShowAgainChecked, setDeleteDontShowAgainChecked] = useState(false);
  const [pendingDeleteBehaviorNote, setPendingDeleteBehaviorNote] = useState(null);
  const [skipBehaviorDeleteConfirm, setSkipBehaviorDeleteConfirm] = useState(false);
  const [behaviorDeleteDontShowAgainChecked, setBehaviorDeleteDontShowAgainChecked] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [behaviorSearchQuery, setBehaviorSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [behaviorSearchResults, setBehaviorSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(true);
  const [medicalNotesVisible, setMedicalNotesVisible] = useState(5);
  const [behaviorNotesVisible, setBehaviorNotesVisible] = useState(5);
  const [expanded, setExpanded] = useState(false);
  const searchTimerRef = useRef(null);

  const tabs = [
    { key: "summary", label: "Summary" },
    { key: "medical", label: "Medical Observations" },
    { key: "behavior", label: "Behavior Notes" },
  ];

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [petData, notesData, bNotes] = await Promise.all([api.getPet(petId), api.getNotes(petId), api.getBehaviorNotes(petId)]);
      setPet(petData);
      setNotes(notesData);
      setBehaviorNotes(bNotes);
      setLoading(false);
    })();
  }, [petId]);

  // Client-side search for medical notes with keyword highlighting
  const handleMedicalSearch = useCallback((query) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimerRef.current = setTimeout(() => {
      const mapped = notes.map((n) => ({
        id: n.id,
        petId: n.petId,
        title: n.case,
        content: n.body,
        author: n.by,
        timestamp: new Date(n.createdAt),
        status: n.status,
        type: n.type,
      }));
      const results = findSimilarNotes(query, mapped, { noteDataCache, maxResults: 50 });
      const enriched = results.map((r) => {
        const existing = notes.find((n) => n.id === r.observerNote.id);
        return {
          ...existing,
          highlightedBody: r.highlightedContent || "",
          highlightedCase: r.highlightedTitle || "",
          matchCount: r.matchCount || 0,
        };
      });
      setSearchResults(enriched.length > 0 ? enriched : null);
      setIsSearching(false);
    }, 300);
  }, [notes]);

  const behaviorSearchTimerRef = useRef(null);
  const handleBehaviorSearch = useCallback((query) => {
    setBehaviorSearchQuery(query);
    if (behaviorSearchTimerRef.current) clearTimeout(behaviorSearchTimerRef.current);
    if (!query.trim()) {
      setBehaviorSearchResults(null);
      return;
    }
    behaviorSearchTimerRef.current = setTimeout(() => {
      const mapped = behaviorNotes.map((n) => ({
        id: n.id,
        petId: n.petId,
        title: n.case,
        content: n.body,
        author: n.by,
        timestamp: new Date(n.createdAt),
      }));
      const results = findSimilarNotes(query, mapped, { noteDataCache, maxResults: 50 });
      const enriched = results.map((r) => {
        const existing = behaviorNotes.find((n) => n.id === r.observerNote.id);
        return {
          ...existing,
          highlightedBody: r.highlightedContent || "",
          highlightedCase: r.highlightedTitle || "",
          matchCount: r.matchCount || 0,
        };
      });
      setBehaviorSearchResults(enriched.length > 0 ? enriched : null);
    }, 300);
  }, [behaviorNotes]);

  const handleNoteCreated = (n) => {
    if (!n || n.id == null) return;
    setNotes((prev) => [n, ...prev]);
  };

  const updateMedicalNoteState = useCallback((noteId, updater) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? updater(n) : n)));
    setSearchResults((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((n) => (n.id === noteId ? updater(n) : n));
    });
  }, []);

  const removeMedicalNoteState = useCallback((noteId) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setSearchResults((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.filter((n) => n.id !== noteId);
    });
  }, []);

  const handleToggleMedicalStatus = async (note) => {
    const canManageMedical = user?.role === "admin" || user?.role === "staff";
    if (!canManageMedical) return;

    const isRaised = (note.status || "").toUpperCase() === "RAISED";
    const nextStatus = isRaised ? "RESOLVED" : "RAISED";
    const ok = await api.updateNote(note.id, nextStatus);
    if (!ok) return;

    updateMedicalNoteState(note.id, (n) => ({ ...n, status: nextStatus }));
  };

  const performDeleteMedicalNote = async (note) => {
    await api.deleteNote(note.id);
    removeMedicalNoteState(note.id);
  };

  const handleRequestDeleteMedicalNote = async (note) => {
    if (skipMedicalDeleteConfirm) {
      await performDeleteMedicalNote(note);
      return;
    }
    setDeleteDontShowAgainChecked(false);
    setPendingDeleteMedicalNote(note);
  };

  const handleConfirmDeleteMedicalNote = async () => {
    if (!pendingDeleteMedicalNote) return;
    await performDeleteMedicalNote(pendingDeleteMedicalNote);
    if (deleteDontShowAgainChecked) {
      setSkipMedicalDeleteConfirm(true);
    }
    setPendingDeleteMedicalNote(null);
    setDeleteDontShowAgainChecked(false);
  };
  const handleBehaviorNoteCreated = (n) => {
    if (!n || n.id == null) return;
    setBehaviorNotes((prev) => [n, ...prev]);
  };

  const removeBehaviorNoteState = useCallback((noteId) => {
    setBehaviorNotes((prev) => prev.filter((n) => n.id !== noteId));
    setBehaviorSearchResults((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.filter((n) => n.id !== noteId);
    });
  }, []);

  const performDeleteBehaviorNote = useCallback(async (note) => {
    await api.deleteBehaviorNote(note.id);
    removeBehaviorNoteState(note.id);
  }, [removeBehaviorNoteState]);

  const handleRequestDeleteBehaviorNote = async (note) => {
    if (skipBehaviorDeleteConfirm) {
      await performDeleteBehaviorNote(note);
      return;
    }
    setBehaviorDeleteDontShowAgainChecked(false);
    setPendingDeleteBehaviorNote(note);
  };

  const handleConfirmDeleteBehaviorNote = async () => {
    if (!pendingDeleteBehaviorNote) return;
    await performDeleteBehaviorNote(pendingDeleteBehaviorNote);
    if (behaviorDeleteDontShowAgainChecked) {
      setSkipBehaviorDeleteConfirm(true);
    }
    setPendingDeleteBehaviorNote(null);
    setBehaviorDeleteDontShowAgainChecked(false);
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    setAiResponse("Generating AI summary...");
    try {
      const summary = await api.getSummary(petId, aiQuery.trim());
      setAiResponse(summary);
    } catch (err) {
      console.error("AI query error:", err);
      setAiResponse("Failed to generate summary. Please try again.");
    }
  };

  const filteredNotes = searchQuery.trim()
    ? (searchResults ?? notes)
    : notes;

  const filteredBehaviorNotes = behaviorSearchQuery.trim()
    ? (behaviorSearchResults ?? behaviorNotes)
    : behaviorNotes;

  if (loading || !pet) {
    return (
      <div className="portal-loading" style={{ maxWidth: r.containerWidth, margin: "0 auto", padding: r.padding }}>
        {/* Skeleton Header */}
        <div className="portal-skeleton-header">
          <Skeleton width={30} height={30} borderRadius={15} />
          <Skeleton width={100} height={16} />
        </div>
        {/* Skeleton Pet Card */}
        <div className="portal-skeleton-pet-card">
          <div className="portal-skeleton-pet-card-inner">
            <Skeleton width={r.petImageSize} height={r.petImageSize} borderRadius={8} />
            <div className="portal-skeleton-pet-details">
              <Skeleton width="60%" height={22} />
              <Skeleton width="80%" height={14} />
              <Skeleton width="70%" height={14} />
              <Skeleton width="50%" height={14} />
            </div>
          </div>
        </div>
        {/* Skeleton Tabs */}
        <div className="portal-skeleton-tabs">
          <Skeleton width="33%" height={44} borderRadius={10} />
          <Skeleton width="33%" height={44} borderRadius={10} />
          <Skeleton width="33%" height={44} borderRadius={10} />
        </div>
        {/* Skeleton Content */}
        <div className="portal-skeleton-content">
          <div className="portal-skeleton-content-card">
            <Skeleton width="40%" height={14} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={16} />
          </div>
        </div>
      </div>
    );
  }

  // Desktop/iPad two-column layout (width >= 768px)
  if (r.width >= 768) {
    return <DesktopPortal
      user={user} token={token} pet={pet} notes={notes} behaviorNotes={behaviorNotes}
      filteredNotes={filteredNotes} filteredBehaviorNotes={filteredBehaviorNotes}
      activeTab={activeTab} setActiveTab={setActiveTab}
      searchQuery={searchQuery} handleMedicalSearch={handleMedicalSearch}
      behaviorSearchQuery={behaviorSearchQuery} handleBehaviorSearch={handleBehaviorSearch}
      isSearching={isSearching}
      aiQuery={aiQuery} setAiQuery={setAiQuery} aiResponse={aiResponse} handleAiQuery={handleAiQuery}
      medicalNotesVisible={medicalNotesVisible} setMedicalNotesVisible={setMedicalNotesVisible}
      behaviorNotesVisible={behaviorNotesVisible} setBehaviorNotesVisible={setBehaviorNotesVisible}
      NOTES_PER_PAGE={NOTES_PER_PAGE}
      showCreateModal={showCreateModal} setShowCreateModal={setShowCreateModal}
      showCreateBehaviorModal={showCreateBehaviorModal} setShowCreateBehaviorModal={setShowCreateBehaviorModal}
      pendingDeleteMedicalNote={pendingDeleteMedicalNote}
      setPendingDeleteMedicalNote={setPendingDeleteMedicalNote}
      deleteDontShowAgainChecked={deleteDontShowAgainChecked}
      setDeleteDontShowAgainChecked={setDeleteDontShowAgainChecked}
      handleConfirmDeleteMedicalNote={handleConfirmDeleteMedicalNote}
      pendingDeleteBehaviorNote={pendingDeleteBehaviorNote}
      setPendingDeleteBehaviorNote={setPendingDeleteBehaviorNote}
      behaviorDeleteDontShowAgainChecked={behaviorDeleteDontShowAgainChecked}
      setBehaviorDeleteDontShowAgainChecked={setBehaviorDeleteDontShowAgainChecked}
      handleConfirmDeleteBehaviorNote={handleConfirmDeleteBehaviorNote}
      handleNoteCreated={handleNoteCreated}
      handleToggleMedicalStatus={handleToggleMedicalStatus}
      handleRequestDeleteMedicalNote={handleRequestDeleteMedicalNote}
      handleRequestDeleteBehaviorNote={handleRequestDeleteBehaviorNote}
      handleBehaviorNoteCreated={handleBehaviorNoteCreated}
      onBack={onBack} onLogout={onLogout} onChangePassword={onChangePassword}
      darkMode={darkMode} setDarkMode={setDarkMode}
      r={r}
    />;
  }

  // Phone layout (< 768px)
  return (
    <main id="main-content" className="portal-main" style={{ maxWidth: r.containerWidth, margin: "0 auto" }}>
      {/* Top bar */}
      <div className="portal-topbar">
        <div className="portal-topbar-left">
          {onBack && (
            <button onClick={onBack} className="portal-back-btn" aria-label="Back to animal list">
              <Icons.back size={20} color="var(--clr-text-secondary)" />
            </button>
          )}
          <UserDropdown user={user} onLogout={onLogout} token={token} onChangePassword={onChangePassword} />
        </div>
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" className="portal-topbar-logo" />
      </div>

      {/* Pet Card */}
      <div className="portal-pet-card">
        <div className="portal-pet-card-body" style={{ padding: r.isPhone ? 18 : 24, gap: r.isPhone ? 16 : 20 }}>
          {/* Pet Image - LEFT */}
          <img
            className="portal-pet-img"
            style={{ width: r.isPhone ? 130 : 160, height: r.isPhone ? 130 : 160 }}
            src={pet.imageUrl}
            alt={`Photo of ${pet.name}`}
            onError={(e) => { e.target.src = pet.species === "Cat" ? PLACEHOLDER_CAT : PLACEHOLDER_DOG; }}
          />

          {/* Details - RIGHT */}
          <div className="portal-pet-details">
            {/* Name with Handler Level */}
            <div className="portal-pet-name-row">
              <HandlerLevelIndicator level={pet.handlerLevel || "green"} />
              <h2 className="portal-pet-name" style={{ fontSize: r.isPhone ? 20 : 24 }}>{pet.name}</h2>
            </div>

            {/* Pet Details */}
            <div className="portal-pet-info-list">
              <div className="portal-pet-info-line" style={{ fontSize: r.isPhone ? 14 : 15 }}>
                <span className="portal-pet-info-key">Animal ID: </span>
                <span className="portal-pet-info-val">{pet.petId}</span>
              </div>

              <div className="portal-pet-info-line" style={{ fontSize: r.isPhone ? 14 : 15 }}>
                <span className="portal-pet-info-key">Location: </span>
                <span className="portal-pet-info-val">{pet.location}</span>
              </div>

              <div className="portal-pet-info-line" style={{ fontSize: r.isPhone ? 14 : 15 }}>
                <span className="portal-pet-info-key">ACR: </span>
                <span className="portal-pet-info-val">{pet.arn || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable More Details Section */}
        <div
          className="portal-expandable"
          style={{ maxHeight: expanded ? 400 : 0, opacity: expanded ? 1 : 0 }}
        >
          <div className="portal-expand-inner">
            {/* 2x3 Grid: Sex, Age, Breed, Species, Neutered, Weight */}
            <div className="portal-stats-grid">
              {[
                { label: "Sex", value: pet.sex },
                { label: "Age", value: pet.age },
                { label: "Breed", value: pet.breed },
                { label: "Species", value: pet.species },
                { label: "Neutered", value: pet.spayedNeutered || "Unknown" },
                { label: "Weight", value: pet.weight || "N/A" },
              ].map((item, i, arr) => (
                <div
                  key={item.label}
                  className={`portal-stat-cell${i % 2 === 0 ? " border-right" : ""}${i < arr.length - 2 ? " border-bottom" : ""}`}
                >
                  <div className="portal-stat-label">{item.label}</div>
                  <div className="portal-stat-value">{item.value}</div>
                </div>
              ))}
            </div>

            {/* 2x2 Grid: Handler, Location, ACR, Animal ID */}
            <div className="portal-detail-grid">
              {[
                { label: "Handler Level", value: (pet.handlerLevel || "green").toUpperCase(), special: true },
                { label: "Location", value: pet.location },
                { label: "ACR", value: pet.arn || "N/A" },
                { label: "Animal ID", value: pet.petId },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={`portal-detail-cell${i % 2 === 0 ? " border-right" : ""}${i < 2 ? " border-bottom" : ""}`}
                >
                  <div className="portal-detail-label">{item.label}</div>
                  {item.special ? (
                    <span
                      className="portal-handler-badge"
                      style={{ backgroundColor: HANDLER_LEVEL_COLORS[pet.handlerLevel || "green"] }}
                    >
                      {item.value}
                    </span>
                  ) : (
                    <div className="portal-detail-value">{item.value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="portal-toggle-btn"
          style={{ marginTop: expanded ? 12 : 0 }}
          aria-expanded={expanded}
          aria-label={expanded ? "Show less details" : "Show more details"}
        >
          {expanded ? "Less Details" : "More Details"}
          <div className={`portal-toggle-icon${expanded ? " rotated" : ""}`}>
            <Icons.chevron size={16} color="var(--clr-header-green)" down={true} />
          </div>
        </button>
      </div>

      {/* Tabs */}
      <nav className="portal-tabs" role="tablist" aria-label="Pet information tabs">
        {tabs.map((tab, index) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${tab.key}`}
              className={`portal-tab-btn${active ? " active" : ""}`}
              style={{
                color: active ? (darkMode ? "#8eff8e" : "var(--clr-header-green)") : "var(--clr-warm-gray)",
              }}
              onClick={() => {
                const currentIndex = tabs.findIndex(t => t.key === activeTab);
                setSlideDirection(index > currentIndex ? "left" : "right");
                setPrevTab(activeTab);
                setActiveTab(tab.key);
                setSearchQuery("");
                setSearchResults(null);
                handleBehaviorSearch("");
                setMedicalNotesVisible(NOTES_PER_PAGE);
                setBehaviorNotesVisible(NOTES_PER_PAGE);
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab Content with Slide Animation */}
      <div className="portal-tab-outer">
        <div
          key={activeTab}
          role="tabpanel"
          id={`panel-${activeTab}`}
          style={{ animation: `slide-${slideDirection} 0.3s ease-out` }}
        >
          {activeTab === "summary" && <SummaryTab aiQuery={aiQuery} aiResponse={aiResponse} onQueryChange={setAiQuery} onSubmit={handleAiQuery} />}

          {activeTab === "medical" && (
            <>
              <div className="portal-search-row">
                <div className="portal-search-wrap">
                  <div className="portal-search-icon"><Icons.search size={16} color="var(--clr-warm-gray)" /></div>
                  <input
                    className="portal-search-input"
                                       placeholder="Search observations..."
                    value={searchQuery}
                    onChange={(e) => handleMedicalSearch(e.target.value)}
                    aria-label="Search observations"
                  />
                </div>
                <button
                  className="portal-add-btn-circle"
                  onClick={() => setShowCreateModal(true)}
                  aria-label="New observation"
                >
                  <Icons.plus size={18} />
                </button>
              </div>
              <div className="portal-notes-area">
                {filteredNotes.length > 0 ? (
                  <>
                    {filteredNotes.slice(0, medicalNotesVisible).map((note) => (
                      <MedicalNoteCard
                        key={note.id}
                        note={note}
                        userRole={user.role}
                        onToggleStatus={handleToggleMedicalStatus}
                        onDelete={handleRequestDeleteMedicalNote}
                        searchQuery={searchQuery}
                      />
                    ))}
                    {filteredNotes.length > medicalNotesVisible && (
                      <div className="portal-load-more-wrap">
                        <div
                          className="portal-load-more-fade"
                          style={{ background: `linear-gradient(to bottom, transparent, var(--clr-bg))` }}
                        />
                        <div className="portal-load-more-inner">
                          <button
                            onClick={() => setMedicalNotesVisible(prev => prev + NOTES_PER_PAGE)}
                            className="portal-load-more-btn"
                                                       aria-label="Load more observations"
                          >
                            Load More ({filteredNotes.length - medicalNotesVisible} remaining)
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="portal-empty-state">
                    {searchQuery ? "No observations matching your search." : "No medical observations yet."}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "behavior" && (
            <>
              <div className="portal-search-row">
                <div className="portal-search-wrap">
                  <div className="portal-search-icon"><Icons.search size={16} color="var(--clr-warm-gray)" /></div>
                  <input
                    className="portal-search-input"
                                       placeholder="Search behavior notes..."
                    value={behaviorSearchQuery}
                    onChange={(e) => handleBehaviorSearch(e.target.value)}
                    aria-label="Search behavior notes"
                  />
                </div>
                <button
                  className="portal-add-btn-circle"
                  onClick={() => setShowCreateBehaviorModal(true)}
                  aria-label="New behavior note"
                >
                  <Icons.plus size={18} />
                </button>
              </div>
              <div className="portal-notes-area">
                {filteredBehaviorNotes.length > 0 ? (
                  <>
                    {filteredBehaviorNotes.slice(0, behaviorNotesVisible).map((note) => (
                      <BehaviorNoteCard
                        key={note.id}
                        note={note}
                        currentUser={user.displayName}
                        userRole={user.role}
                        onDelete={handleRequestDeleteBehaviorNote}
                        searchQuery={behaviorSearchQuery}
                      />
                    ))}
                    {filteredBehaviorNotes.length > behaviorNotesVisible && (
                      <div className="portal-load-more-wrap">
                        <div
                          className="portal-load-more-fade"
                          style={{ background: `linear-gradient(to bottom, transparent, var(--clr-bg))` }}
                        />
                        <div className="portal-load-more-inner">
                          <button
                            onClick={() => setBehaviorNotesVisible(prev => prev + NOTES_PER_PAGE)}
                            className="portal-load-more-btn"
                                                       aria-label="Load more behavior notes"
                          >
                            Load More ({filteredBehaviorNotes.length - behaviorNotesVisible} remaining)
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="portal-empty-state">
                    {behaviorSearchQuery ? "No behavior notes matching your search." : "No behavior notes yet."}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dark/Light mode toggle — phone only, desktop has it in top bar */}
      {r.width < 768 && (
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="portal-darkmode-fab"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Icons.sun size={22} color="#fff" /> : <Icons.moon size={22} color="#fff" />}
        </button>
      )}

      {showCreateModal && <CreateNoteModal petId={pet.petId} userName={user.displayName} userRole={user.role} onClose={() => setShowCreateModal(false)} onSubmit={handleNoteCreated} existingNotes={notes} />}
      {showCreateBehaviorModal && <CreateBehaviorNoteModal petId={pet.petId} userName={user.displayName} userRole={user.role} onClose={() => setShowCreateBehaviorModal(false)} onSubmit={handleBehaviorNoteCreated} existingNotes={behaviorNotes} />}
      {pendingDeleteMedicalNote && (
        <div className="portal-delete-confirm__overlay" onClick={() => setPendingDeleteMedicalNote(null)} role="dialog" aria-modal="true">
          <div className="portal-delete-confirm__box" onClick={(e) => e.stopPropagation()}>
            <div className="portal-delete-confirm__icon">
              <Icons.trash size={22} color="#BE3A2B" />
            </div>
            <h2 className="portal-delete-confirm__title">Delete Medical Observation</h2>
            <p className="portal-delete-confirm__body">
              Delete this observation? This cannot be undone.
            </p>
            <label className="portal-delete-confirm__toggle">
              <input
                type="checkbox"
                checked={deleteDontShowAgainChecked}
                onChange={(e) => setDeleteDontShowAgainChecked(e.target.checked)}
              />
              Don&apos;t show again for this session
            </label>
            <div className="portal-delete-confirm__footer">
              <button onClick={() => setPendingDeleteMedicalNote(null)} className="portal-delete-confirm__cancel-btn">Cancel</button>
              <button onClick={handleConfirmDeleteMedicalNote} className="portal-delete-confirm__confirm-btn">Delete</button>
            </div>
          </div>
        </div>
      )}
      {pendingDeleteBehaviorNote && (
        <div className="portal-delete-confirm__overlay" onClick={() => setPendingDeleteBehaviorNote(null)} role="dialog" aria-modal="true">
          <div className="portal-delete-confirm__box" onClick={(e) => e.stopPropagation()}>
            <div className="portal-delete-confirm__icon">
              <Icons.trash size={22} color="#BE3A2B" />
            </div>
            <h2 className="portal-delete-confirm__title">Delete Behavior Note</h2>
            <p className="portal-delete-confirm__body">
              Delete this behavior note? This cannot be undone.
            </p>
            <label className="portal-delete-confirm__toggle">
              <input
                type="checkbox"
                checked={behaviorDeleteDontShowAgainChecked}
                onChange={(e) => setBehaviorDeleteDontShowAgainChecked(e.target.checked)}
              />
              Don&apos;t show again for this session
            </label>
            <div className="portal-delete-confirm__footer">
              <button onClick={() => setPendingDeleteBehaviorNote(null)} className="portal-delete-confirm__cancel-btn">Cancel</button>
              <button onClick={handleConfirmDeleteBehaviorNote} className="portal-delete-confirm__confirm-btn">Delete</button>
            </div>
          </div>
        </div>
      )}
      {showQR && <QRCodeModal pet={pet} onClose={() => setShowQR(false)} />}
    </main>
  );
}
