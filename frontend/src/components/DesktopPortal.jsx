import { useState } from "react";
import { HANDLER_LEVEL_COLORS, CURRENT_STATUSES, PLACEHOLDER_CAT, PLACEHOLDER_DOG } from "../constants.js";
import Icons from "../Icons.jsx";
import UserDropdown from "./UserDropdown.jsx";
import HandlerLevelIndicator from "./HandlerLevelIndicator.jsx";
import MedicalNoteCard from "./notes/MedicalNoteCard.jsx";
import BehaviorNoteCard from "./notes/BehaviorNoteCard.jsx";
import CreateNoteModal from "./notes/CreateNoteModal.jsx";
import CreateBehaviorNoteModal from "./notes/CreateBehaviorNoteModal.jsx";
import './DesktopPortal.css';

// ─── Desktop Portal (iPad/Desktop two-column layout, width >= 768px) ─────────
export default function DesktopPortal({
  user, token, pet, notes: _notes, behaviorNotes: _behaviorNotes,
  filteredNotes, filteredBehaviorNotes,
  activeTab, setActiveTab,
  searchQuery, handleMedicalSearch,
  behaviorSearchQuery, handleBehaviorSearch,
  isSearching,
  aiQuery, setAiQuery, aiResponse, handleAiQuery, aiLoading,
  medicalNotesVisible, setMedicalNotesVisible,
  behaviorNotesVisible, setBehaviorNotesVisible,
  NOTES_PER_PAGE,
  showCreateModal, setShowCreateModal,
  showCreateBehaviorModal, setShowCreateBehaviorModal,
  pendingDeleteMedicalNote,
  setPendingDeleteMedicalNote,
  deleteDontShowAgainChecked,
  setDeleteDontShowAgainChecked,
  handleConfirmDeleteMedicalNote,
  pendingDeleteBehaviorNote,
  setPendingDeleteBehaviorNote,
  behaviorDeleteDontShowAgainChecked,
  setBehaviorDeleteDontShowAgainChecked,
  handleConfirmDeleteBehaviorNote,
  handleNoteCreated,
  handleToggleMedicalStatus,
  handleMedicalStaffCommentUpdate,
  handleRequestDeleteMedicalNote,
  handleRequestDeleteBehaviorNote,
  handleBehaviorNoteCreated,
  onBack, onLogout, onChangePassword,
  darkMode, setDarkMode,
}) {
  const [descExpanded, setDescExpanded] = useState(false);

  const tabs = [
    { key: "medical", label: "Medical Observations" },
    { key: "behavior", label: "Behavior Notes" },
    { key: "summary", label: "AI Summary" },
  ];

  return (
    <main role="main" aria-label={`${pet.name} details`} className="dp-main">

      {/* Top Bar */}
      <header role="banner" className="dp-header">
        <div className="dp-header-left">
          {onBack && (
            <button
              onClick={onBack}
              className="dp-back-btn"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--clr-input-bg)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              aria-label="Back to animal list"
            >
              <Icons.back size={22} color="var(--clr-text-secondary)" />
            </button>
          )}
          <UserDropdown user={user} onLogout={onLogout} token={token} onChangePassword={onChangePassword || (() => {})} />
        </div>
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" className="dp-header-logo" />
        <div className="dp-header-right">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="dp-darkmode-btn"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--clr-input-bg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color="var(--clr-text-secondary)" />}
          </button>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="dp-layout">

        {/* LEFT COLUMN: Pet Profile */}
        <div className="dp-left-col">

          {/* Pet Image Card */}
          <div className="dp-image-card">
            <img
              src={pet.imageUrl}
              alt={`Photo of ${pet.name}`}
              className="dp-pet-photo"
              onError={(e) => { e.target.src = pet.species === "Cat" ? PLACEHOLDER_CAT : PLACEHOLDER_DOG; }}
            />
          </div>

          {/* Pet Info Card */}
          <div className="dp-info-card">

            {/* Name + Status Row */}
            <div className="dp-name-row">
              <div className="dp-name-inner">
                <HandlerLevelIndicator level={pet.handlerLevel || "green"} />
                <h1 className="dp-pet-name">{pet.name}</h1>
              </div>
              {pet.status && (() => {
                const statusValue = (pet.status || "").toLowerCase().trim();
                const isAvail = statusValue === "available";
                const color = isAvail ? "var(--clr-status-resolved)" : "var(--clr-brick-red)";
                return (
                  <span style={{
                    fontSize: 13, fontWeight: 600, color,
                    backgroundColor: isAvail ? "var(--clr-status-resolved-bg)" : "var(--clr-status-raised-bg)",
                    padding: "5px 14px",
                    borderRadius: 20,
                    border: `1px solid ${color}`,
                    textTransform: "capitalize",
                    opacity: 0.9,
                  }}>
                    {pet.status}
                  </span>
                );
              })()}
            </div>

            {/* Description with Read More/Less */}
            {pet.description && (
              <div className="dp-description-wrap">
                <p className={`dp-description-text${descExpanded ? "" : " clamped"}`}>
                  {pet.description}
                </p>
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  aria-expanded={descExpanded}
                  className="dp-read-more-btn"
                                 >
                  {descExpanded ? "Show Less" : "Read More"}
                </button>
              </div>
            )}

            {/* Quick Stats - 2x3 Grid */}
            <div className="dp-stats-grid">
              {[
                { label: "Sex", value: pet.sex },
                { label: "Age", value: pet.age },
                { label: "Breed", value: pet.breed },
                { label: "Species", value: pet.species },
                { label: "Neutered", value: pet.spayedNeutered || "Unknown" },
                { label: "Weight", value: pet.weight || "N/A" },
              ].filter(d => d.value).map((stat, i, arr) => {
                const getSexColor = () => {
                  if (stat.label !== "Sex") return "var(--clr-text-primary)";
                  const sex = stat.value?.toLowerCase();
                  if (sex === "female") return darkMode ? "#ff6bb5" : "#d946a6";
                  if (sex === "male") return darkMode ? "#60b5ff" : "#1d72d8";
                  return "var(--clr-text-primary)";
                };
                return (
                  <div
                    key={stat.label}
                    className={`dp-stat-cell${i % 2 === 0 ? " border-right" : ""}${i < arr.length - 2 ? " border-bottom" : ""}`}
                  >
                    <div className="dp-stat-label">{stat.label}</div>
                    <div className="dp-stat-value" style={{ color: getSexColor() }}>{stat.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Detail Grid - 2x2 */}
            <div className="dp-detail-grid">
              {[
                { label: "ACR", value: pet.arn },
                { label: "Location", value: pet.location },
                { label: "Animal ID", value: pet.petId },
                { label: "Handler Level", value: (pet.handlerLevel || "green").toUpperCase(), color: HANDLER_LEVEL_COLORS[pet.handlerLevel || "green"] },
              ].map((detail, i) => (
                <div
                  key={detail.label}
                  className={`dp-detail-cell${i % 2 === 0 ? " border-right" : " border-left-pad"}`}
                >
                  <div className="dp-detail-label">{detail.label}</div>
                  <div className="dp-detail-value">
                    {detail.color ? (
                      <span className="dp-handler-badge" style={{ backgroundColor: detail.color }}>{detail.value}</span>
                    ) : detail.value}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Tabs + Content */}
        <div className="dp-right-col">

          {/* Tab Navigation */}
          <nav className="dp-tabs" role="tablist" aria-label="Pet information tabs">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  id={`desktop-tab-${tab.key}`}
                  aria-controls={`desktop-panel-${tab.key}`}
                  className={`dp-tab-btn${active ? " active" : ""}`}
                  style={{
                    color: active ? (darkMode ? "#8eff8e" : "var(--clr-header-green)") : "var(--clr-warm-gray)",
                  }}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setMedicalNotesVisible(NOTES_PER_PAGE);
                    setBehaviorNotesVisible(NOTES_PER_PAGE);
                  }}
                  onKeyDown={(e) => {
                    const idx = tabs.findIndex(t => t.key === tab.key);
                    if (e.key === "ArrowRight") { e.preventDefault(); const next = tabs[(idx + 1) % tabs.length]; setActiveTab(next.key); document.getElementById(`desktop-tab-${next.key}`)?.focus(); }
                    if (e.key === "ArrowLeft") { e.preventDefault(); const prev = tabs[(idx - 1 + tabs.length) % tabs.length]; setActiveTab(prev.key); document.getElementById(`desktop-tab-${prev.key}`)?.focus(); }
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Medical Observations Tab */}
          {activeTab === "medical" && (
            <div role="tabpanel" id="desktop-panel-medical" aria-labelledby="desktop-tab-medical">
              <div className="dp-search-row">
                <div className="dp-search-wrap">
                  <div className="dp-search-icon">
                    <Icons.search size={16} color="var(--clr-warm-gray)" />
                  </div>
                  <input
                    className="dp-search-input"
                                       placeholder="Search observations..."
                    value={searchQuery}
                    onChange={(e) => handleMedicalSearch(e.target.value)}
                    aria-label="Search observations"
                    onFocus={(e) => e.currentTarget.style.borderColor = "var(--clr-header-green)"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "var(--clr-input-border)"}
                  />
                  {isSearching && (
                    <div className="dp-searching-label">Searching...</div>
                  )}
                </div>
                <button
                  className="dp-add-btn"
                                   onClick={() => setShowCreateModal(true)}
                  aria-label="New observation"
                >
                  <Icons.plus size={16} color="#fff" /> Add New
                </button>
              </div>

              <div className="dp-notes-list">
                {filteredNotes.length > 0 ? (
                  <>
                    {filteredNotes.map((note) => (
                      <MedicalNoteCard
                        key={note.id}
                        note={note}
                        userRole={user.role}
                        onToggleStatus={handleToggleMedicalStatus}
                        onDelete={handleRequestDeleteMedicalNote}
                        onStaffCommentUpdate={handleMedicalStaffCommentUpdate}
                        searchQuery={searchQuery}
                      />
                    ))}
                  </>
                ) : (
                  <div className="dp-empty-state">
                    {searchQuery ? "No observations matching your search." : "No medical observations yet."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Behavior Notes Tab */}
          {activeTab === "behavior" && (
            <div role="tabpanel" id="desktop-panel-behavior" aria-labelledby="desktop-tab-behavior">
              <div className="dp-search-row">
                <div className="dp-search-wrap">
                  <div className="dp-search-icon">
                    <Icons.search size={16} color="var(--clr-warm-gray)" />
                  </div>
                  <input
                    className="dp-search-input"
                                       placeholder="Search behavior notes..."
                    value={behaviorSearchQuery}
                    onChange={(e) => handleBehaviorSearch(e.target.value)}
                    aria-label="Search behavior notes"
                    onFocus={(e) => e.currentTarget.style.borderColor = "var(--clr-header-green)"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "var(--clr-input-border)"}
                  />
                </div>
                <button
                  className="dp-add-btn"
                                   onClick={() => setShowCreateBehaviorModal(true)}
                  aria-label="New behavior note"
                >
                  <Icons.plus size={16} color="#fff" /> Add New
                </button>
              </div>

              <div className="dp-notes-list">
                {filteredBehaviorNotes.length > 0 ? (
                  <>
                    {filteredBehaviorNotes.map((note) => (
                      <BehaviorNoteCard
                        key={note.id}
                        note={note}
                        currentUser={user.displayName}
                        userRole={user.role}
                        onDelete={handleRequestDeleteBehaviorNote}
                        searchQuery={behaviorSearchQuery}
                      />
                    ))}
                  </>
                ) : (
                  <div className="dp-empty-state">
                    {behaviorSearchQuery ? "No behavior notes matching your search." : "No behavior notes yet."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Summary Tab */}
          {activeTab === "summary" && (
            <div
              role="tabpanel"
              id="desktop-panel-summary"
              aria-labelledby="desktop-tab-summary"
              className="dp-summary-panel"
            >
              <h3 className="dp-summary-heading">Ask AI About This Animal</h3>
              <p className="dp-summary-sub">
                Ask questions about medical observations, behavior notes, or anything related to {pet.name}.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label className="dp-summary-label">Your Question</label>
                <textarea
                  className="dp-summary-textarea"
                                   placeholder="e.g., What is the current health status? Are there any behavioral concerns?"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAiQuery(); }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "var(--clr-header-green)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "var(--clr-input-border)"}
                  aria-label="AI query input"
                />
                <div className="dp-summary-hint">Press Cmd/Ctrl + Enter to submit</div>
              </div>

              <button
                className="dp-summary-submit-btn"
                style={{ opacity: !aiQuery.trim() || aiLoading ? 0.5 : 1 }}
                onClick={handleAiQuery}
                disabled={!aiQuery.trim() || aiLoading}
              >
                {aiLoading ? "Generating..." : "Ask AI"}
              </button>

              {aiResponse && (
                <div className="dp-ai-response">
                  <div className="dp-ai-response-label">AI Response</div>
                  <div className="dp-ai-response-text">{aiResponse}</div>
                </div>
              )}

              {!aiResponse && (
                <div className="dp-ai-placeholder">
                  Response will appear here after you ask a question
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && <CreateNoteModal petId={pet.petId} userName={user.displayName} userRole={user.role} onClose={() => setShowCreateModal(false)} onSubmit={handleNoteCreated} existingNotes={_notes} />}
      {showCreateBehaviorModal && <CreateBehaviorNoteModal petId={pet.petId} userName={user.displayName} onClose={() => setShowCreateBehaviorModal(false)} onSubmit={handleBehaviorNoteCreated} existingNotes={_behaviorNotes} />}
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
    </main>
  );
}
