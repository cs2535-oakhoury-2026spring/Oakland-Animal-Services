// DesktopPortal.jsx
// iPad/Desktop two-column layout for the Oakland Animal Services Portal.
//
// WINDSURF INTEGRATION INSTRUCTIONS:
// 1. Place this file in frontend/src/DesktopPortal.jsx
// 2. In App.jsx, import it: import DesktopPortal from './DesktopPortal';
// 3. In the Portal component, add a check at the top of the render (after loading):
//    if (r.width >= 768) {
//      return <DesktopPortal 
//        user={user} pet={pet} notes={notes} behaviorNotes={behaviorNotes}
//        filteredNotes={filteredNotes} filteredBehaviorNotes={filteredBehaviorNotes}
//        activeTab={activeTab} setActiveTab={setActiveTab}
//        searchQuery={searchQuery} handleMedicalSearch={handleMedicalSearch}
//        behaviorSearchQuery={behaviorSearchQuery} setBehaviorSearchQuery={setBehaviorSearchQuery}
//        isSearching={isSearching}
//        aiQuery={aiQuery} setAiQuery={setAiQuery} aiResponse={aiResponse} handleAiQuery={handleAiQuery}
//        medicalNotesVisible={medicalNotesVisible} setMedicalNotesVisible={setMedicalNotesVisible}
//        behaviorNotesVisible={behaviorNotesVisible} setBehaviorNotesVisible={setBehaviorNotesVisible}
//        NOTES_PER_PAGE={NOTES_PER_PAGE}
//        showCreateModal={showCreateModal} setShowCreateModal={setShowCreateModal}
//        showCreateBehaviorModal={showCreateBehaviorModal} setShowCreateBehaviorModal={setShowCreateBehaviorModal}
//        editingNote={editingNote} setEditingNote={setEditingNote}
//        editingBehaviorNote={editingBehaviorNote} setEditingBehaviorNote={setEditingBehaviorNote}
//        showQR={showQR} setShowQR={setShowQR}
//        handleNoteCreated={handleNoteCreated} handleNoteEdited={handleNoteEdited}
//        handleBehaviorNoteCreated={handleBehaviorNoteCreated} handleBehaviorNoteEdited={handleBehaviorNoteEdited}
//        onBack={onBack} onLogout={onLogout}
//        darkMode={darkMode} setDarkMode={setDarkMode}
//        c={c} r={r}
//      />;
//    }
// 4. Export the following from App.jsx so this file can import them:
//    Icons, UserDropdown, HandlerLevelIndicator, MedicalNoteCard, BehaviorNoteCard,
//    SummaryTab, CreateNoteModal, EditNoteModal, CreateBehaviorNoteModal, EditBehaviorNoteModal,
//    QRCodeModal, HighlightedText, Skeleton, formatTimestamp, themes, font,
//    HANDLER_LEVEL_COLORS, PLACEHOLDER_CAT, PLACEHOLDER_DOG
//
// Alternatively, Windsurf can inline this directly into App.jsx as a component.
// The phone layout in Portal stays completely untouched.

import { useState } from "react";

// These will be imported from App.jsx — Windsurf should handle the wiring
// import { Icons, UserDropdown, HandlerLevelIndicator, MedicalNoteCard, BehaviorNoteCard,
//   SummaryTab, CreateNoteModal, EditNoteModal, CreateBehaviorNoteModal, EditBehaviorNoteModal,
//   QRCodeModal, HighlightedText, Skeleton, formatTimestamp, themes, font,
//   HANDLER_LEVEL_COLORS, PLACEHOLDER_CAT, PLACEHOLDER_DOG } from './App';

export default function DesktopPortal({
  user, pet, notes, behaviorNotes,
  filteredNotes, filteredBehaviorNotes,
  activeTab, setActiveTab,
  searchQuery, handleMedicalSearch,
  behaviorSearchQuery, setBehaviorSearchQuery,
  isSearching,
  aiQuery, setAiQuery, aiResponse, handleAiQuery,
  medicalNotesVisible, setMedicalNotesVisible,
  behaviorNotesVisible, setBehaviorNotesVisible,
  NOTES_PER_PAGE,
  showCreateModal, setShowCreateModal,
  showCreateBehaviorModal, setShowCreateBehaviorModal,
  editingNote, setEditingNote,
  editingBehaviorNote, setEditingBehaviorNote,
  handleNoteCreated, handleNoteEdited,
  handleBehaviorNoteCreated, handleBehaviorNoteEdited,
  onBack, onLogout,
  darkMode, setDarkMode,
  c, r,
}) {
  const font = "'Poppins', sans-serif";
  const [hoveredDetail, setHoveredDetail] = useState(null);

  // All the pet detail fields available from the API (Baobao-style)
  const leftColumnDetails = [
    { label: "ACR", value: pet.arn },
    { label: "Status", value: pet.status, badge: true },
    { label: "Species", value: pet.species },
    { label: "Sex", value: pet.sex },
    { label: "Breed", value: pet.breed },
    { label: "Location", value: pet.location },
  ].filter(d => d.value && d.value !== "N/A" && d.value !== "Unknown");

  const rightColumnDetails = [
    { label: "Age", value: pet.age },
    { label: "Handler", value: pet.handlerLevel, handler: true },
  ].filter(d => d.value);

  const tabs = [
    { key: "medical", label: "Medical Observations" },
    { key: "behavior", label: "Behavior Notes" },
    { key: "summary", label: "AI Summary" },
  ];

  return (
    <main style={{ fontFamily: font, maxWidth: 1200, margin: "0 auto", minHeight: "100vh", backgroundColor: c.bg, position: "relative" }}>

      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, minHeight: 44, minWidth: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, transition: "background-color 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.inputBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              aria-label="Back to animal list">
              <Icons.back size={22} color={c.textSecondary} />
            </button>
          )}
          <UserDropdown user={user} onLogout={onLogout} c={c} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: `1px solid ${c.cardBorder}`, cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 40, minWidth: 40, transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.inputBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color={c.textSecondary} />}
          </button>
        </div>
      </header>

      {/* ── Main Two-Column Layout ─────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 24, padding: "24px 28px", alignItems: "flex-start" }}>

        {/* ── LEFT COLUMN: Pet Profile ─────────────────────────────────── */}
        <div style={{ width: 380, flexShrink: 0 }}>

          {/* Pet Image Card */}
          <div style={{ backgroundColor: c.cardBg, borderRadius: 16, border: `1px solid ${c.cardBorder}`, boxShadow: c.shadow, overflow: "hidden", marginBottom: 16 }}>
            <img
              src={pet.imageUrl}
              alt={`Photo of ${pet.name}`}
              style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
              onError={(e) => { e.target.src = pet.species === "Cat" ? PLACEHOLDER_CAT : PLACEHOLDER_DOG; }}
            />
          </div>

          {/* Pet Info Card */}
          <div style={{ backgroundColor: c.cardBg, borderRadius: 16, border: `1px solid ${c.cardBorder}`, boxShadow: c.shadow, padding: 24 }}>

            {/* Name + Status Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <HandlerLevelIndicator level={pet.handlerLevel || "green"} />
                <h1 style={{ fontSize: 26, fontWeight: 700, color: c.textPrimary, margin: 0 }}>{pet.name}</h1>
              </div>
              {pet.status && (
                <span style={{
                  fontSize: 13, fontWeight: 600, color: c.statusResolved,
                  backgroundColor: `${c.statusResolved}15`, padding: "5px 14px",
                  borderRadius: 20, border: `1px solid ${c.statusResolved}30`,
                  textTransform: "capitalize"
                }}>
                  {pet.status}
                </span>
              )}
            </div>

            {/* Description */}
            {pet.description && (
              <p style={{ fontSize: 14, lineHeight: 1.6, color: c.textSecondary, margin: "0 0 20px 0" }}>
                {pet.description}
              </p>
            )}

            {/* Quick Stats - 2x3 Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginBottom: 20, borderRadius: 10, border: `1px solid ${c.cardBorder}`, overflow: "hidden" }}>
              {[
                { label: "Sex", value: pet.sex },
                { label: "Age", value: pet.age },
                { label: "Breed", value: pet.breed },
                { label: "Species", value: pet.species },
                { label: "Neutered", value: pet.spayedNeutered || "Unknown" },
                { label: "Weight", value: pet.weight || "N/A" },
              ].filter(d => d.value).map((stat, i, arr) => (
                <div key={stat.label} style={{
                  padding: "12px 10px", textAlign: "center",
                  borderRight: i % 2 === 0 ? `1px solid ${c.cardBorder}` : "none",
                  borderBottom: i < arr.length - 2 ? `1px solid ${c.cardBorder}` : "none",
                  backgroundColor: c.inputBg,
                }}>
                  <div style={{ fontSize: 10, color: c.warmGray, marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</div>
                  <div style={{ fontSize: 13, color: c.textPrimary, fontWeight: 600 }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Detail Grid - 2x2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: `1px solid ${c.cardBorder}` }}>
              {[
                { label: "ACR", value: pet.arn },
                { label: "Location", value: pet.location },
                { label: "Animal ID", value: pet.petId },
                { label: "Handler", value: (pet.handlerLevel || "green").toUpperCase(), color: HANDLER_LEVEL_COLORS[pet.handlerLevel || "green"] },
              ].map((detail, i) => (
                <div key={detail.label} style={{
                  padding: "12px 0", borderBottom: `1px solid ${c.cardBorder}`,
                  borderRight: i % 2 === 0 ? `1px solid ${c.cardBorder}` : "none",
                  paddingLeft: i % 2 === 0 ? 0 : 16,
                  paddingRight: i % 2 === 0 ? 16 : 0,
                }}>
                  <div style={{ fontSize: 12, color: c.warmGray, fontWeight: 600, marginBottom: 3 }}>{detail.label}</div>
                  <div style={{ fontSize: 14, color: c.textPrimary, fontWeight: 500 }}>
                    {detail.color ? (
                      <span style={{ backgroundColor: detail.color, color: "#fff", padding: "2px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>{detail.value}</span>
                    ) : detail.value}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── RIGHT COLUMN: Tabs + Content ─────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Tab Navigation */}
          <nav style={{
            display: "flex", backgroundColor: c.cardBg, borderRadius: 12, padding: 4,
            border: `1px solid ${c.cardBorder}`, marginBottom: 16, boxShadow: c.shadow,
          }} role="tablist" aria-label="Pet information tabs">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} role="tab" aria-selected={active}
                  style={{
                    flex: 1, padding: "12px 16px", fontSize: 14, fontWeight: active ? 700 : 500,
                    color: active ? (darkMode ? "#8eff8e" : c.headerGreen) : c.warmGray,
                    backgroundColor: active ? c.tabActiveBg : "transparent",
                    border: "none", borderRadius: 10, cursor: "pointer",
                    transition: "all 0.2s ease", fontFamily: font, minHeight: 48,
                  }}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setMedicalNotesVisible(NOTES_PER_PAGE);
                    setBehaviorNotesVisible(NOTES_PER_PAGE);
                  }}>
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* ── Medical Observations Tab ── */}
          {activeTab === "medical" && (
            <div>
              {/* Search + Add */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                    <Icons.search size={16} color={c.warmGray} />
                  </div>
                  <input
                    style={{
                      width: "100%", padding: "12px 16px 12px 38px", borderRadius: 10,
                      border: `1px solid ${c.inputBorder}`, backgroundColor: c.cardBg,
                      color: c.textPrimary, fontSize: 15, outline: "none", fontFamily: font,
                      boxSizing: "border-box", transition: "border-color 0.2s",
                    }}
                    placeholder="Search observations..."
                    value={searchQuery}
                    onChange={(e) => handleMedicalSearch(e.target.value)}
                    aria-label="Search observations"
                    onFocus={(e) => e.currentTarget.style.borderColor = c.headerGreen}
                    onBlur={(e) => e.currentTarget.style.borderColor = c.inputBorder}
                  />
                  {isSearching && (
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: c.warmGray }}>Searching...</div>
                  )}
                </div>
                <button style={{
                  height: 48, padding: "0 20px", borderRadius: 10, border: "none",
                  backgroundColor: c.headerGreen, color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, fontFamily: font,
                  fontSize: 14, fontWeight: 600, flexShrink: 0, transition: "opacity 0.15s",
                }}
                  onClick={() => setShowCreateModal(true)}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  aria-label="New observation">
                  <Icons.plus size={16} color="#fff" /> Add New
                </button>
              </div>

              {/* Notes List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredNotes.length > 0 ? (
                  <>
                    {filteredNotes.slice(0, medicalNotesVisible).map((note) => (
                      <MedicalNoteCard key={note.id} note={note} currentUser={user.displayName} userRole={user.role} onEdit={setEditingNote} c={c} searchQuery={searchQuery} />
                    ))}
                    {filteredNotes.length > medicalNotesVisible && (
                      <button
                        onClick={() => setMedicalNotesVisible(prev => prev + NOTES_PER_PAGE)}
                        style={{
                          padding: "12px 20px", borderRadius: 10, border: `1px solid ${c.cardBorder}`,
                          backgroundColor: c.cardBg, color: c.textPrimary, fontSize: 14,
                          fontWeight: 600, cursor: "pointer", fontFamily: font, textAlign: "center",
                          transition: "all 0.15s", minHeight: 44,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.inputBg; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = c.cardBg; }}
                        aria-label="Load more observations">
                        Load More ({filteredNotes.length - medicalNotesVisible} remaining)
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: 60, color: c.warmGray, fontSize: 15, backgroundColor: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}` }}>
                    {searchQuery ? "No observations matching your search." : "No medical observations yet."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Behavior Notes Tab ── */}
          {activeTab === "behavior" && (
            <div>
              {/* Compatibility Info Boxes */}
              <div style={{ display: "flex", marginBottom: 16, borderRadius: 10, border: `1px solid ${c.cardBorder}`, overflow: "hidden", boxShadow: c.shadow }}>
                {[
                  { label: "Kids over 12?", value: pet.kidsOver12 || "Unknown" },
                  { label: "Kids under 12?", value: pet.kidsUnder12 || "Unknown" },
                  { label: "Live with cats?", value: pet.canLiveWithCats || "Unknown" },
                  { label: "Dog-to-dog", value: pet.dogToDog || "Unknown" },
                ].map((s, i, a) => (
                  <div key={s.label} style={{
                    flex: 1, padding: "12px 8px", textAlign: "center",
                    borderRight: i < a.length - 1 ? `1px solid ${c.cardBorder}` : "none",
                    backgroundColor: c.cardBg,
                  }}>
                    <div style={{ fontSize: 10, color: c.warmGray, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>{s.label}</div>
                    <div style={{
                      fontSize: 13, fontWeight: 600, display: "inline-block", padding: "3px 10px", borderRadius: 6,
                      color: s.value === "Unlikely" ? c.statusRaised : s.value === "Gentle" ? c.statusResolved : c.warmGray,
                      backgroundColor: s.value === "Unlikely" ? `${c.statusRaised}12` : s.value === "Gentle" ? `${c.statusResolved}12` : `${c.warmGray}12`,
                    }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Search + Add */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                    <Icons.search size={16} color={c.warmGray} />
                  </div>
                  <input
                    style={{
                      width: "100%", padding: "12px 16px 12px 38px", borderRadius: 10,
                      border: `1px solid ${c.inputBorder}`, backgroundColor: c.cardBg,
                      color: c.textPrimary, fontSize: 15, outline: "none", fontFamily: font,
                      boxSizing: "border-box", transition: "border-color 0.2s",
                    }}
                    placeholder="Search behavior notes..."
                    value={behaviorSearchQuery}
                    onChange={(e) => setBehaviorSearchQuery(e.target.value)}
                    aria-label="Search behavior notes"
                    onFocus={(e) => e.currentTarget.style.borderColor = c.headerGreen}
                    onBlur={(e) => e.currentTarget.style.borderColor = c.inputBorder}
                  />
                </div>
                <button style={{
                  height: 48, padding: "0 20px", borderRadius: 10, border: "none",
                  backgroundColor: c.headerGreen, color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, fontFamily: font,
                  fontSize: 14, fontWeight: 600, flexShrink: 0, transition: "opacity 0.15s",
                }}
                  onClick={() => setShowCreateBehaviorModal(true)}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  aria-label="New behavior note">
                  <Icons.plus size={16} color="#fff" /> Add New
                </button>
              </div>

              {/* Notes List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredBehaviorNotes.length > 0 ? (
                  <>
                    {filteredBehaviorNotes.slice(0, behaviorNotesVisible).map((note) => (
                      <BehaviorNoteCard key={note.id} note={note} currentUser={user.displayName} userRole={user.role} onEdit={setEditingBehaviorNote} c={c} searchQuery={behaviorSearchQuery} />
                    ))}
                    {filteredBehaviorNotes.length > behaviorNotesVisible && (
                      <button
                        onClick={() => setBehaviorNotesVisible(prev => prev + NOTES_PER_PAGE)}
                        style={{
                          padding: "12px 20px", borderRadius: 10, border: `1px solid ${c.cardBorder}`,
                          backgroundColor: c.cardBg, color: c.textPrimary, fontSize: 14,
                          fontWeight: 600, cursor: "pointer", fontFamily: font, textAlign: "center",
                          transition: "all 0.15s", minHeight: 44,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.inputBg; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = c.cardBg; }}
                        aria-label="Load more behavior notes">
                        Load More ({filteredBehaviorNotes.length - behaviorNotesVisible} remaining)
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: 60, color: c.warmGray, fontSize: 15, backgroundColor: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}` }}>
                    {behaviorSearchQuery ? "No behavior notes matching your search." : "No behavior notes yet."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AI Summary Tab ── */}
          {activeTab === "summary" && (
            <div style={{ backgroundColor: c.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${c.cardBorder}`, boxShadow: c.shadow }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: c.textPrimary, margin: "0 0 8px 0" }}>Ask AI About This Animal</h3>
              <p style={{ fontSize: 14, color: c.textSecondary, margin: "0 0 20px 0", lineHeight: 1.5 }}>
                Ask questions about medical observations, behavior notes, or anything related to {pet.name}.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 6, display: "block", fontWeight: 500 }}>Your Question</label>
                <textarea
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: 10,
                    border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg,
                    color: c.textPrimary, fontSize: 15, outline: "none", minHeight: 120,
                    resize: "vertical", boxSizing: "border-box", fontFamily: font, lineHeight: 1.6,
                    transition: "border-color 0.2s",
                  }}
                  placeholder="e.g., What is the current health status? Are there any behavioral concerns?"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAiQuery(); }}
                  onFocus={(e) => e.currentTarget.style.borderColor = c.headerGreen}
                  onBlur={(e) => e.currentTarget.style.borderColor = c.inputBorder}
                  aria-label="AI query input"
                />
                <div style={{ fontSize: 12, color: c.warmGray, marginTop: 6 }}>Press Cmd/Ctrl + Enter to submit</div>
              </div>

              <button
                style={{
                  width: "100%", padding: 14, borderRadius: 10, border: "none",
                  backgroundColor: c.headerGreen, color: "#fff", fontSize: 15,
                  fontWeight: 600, cursor: "pointer", fontFamily: font, minHeight: 48,
                  transition: "opacity 0.15s", opacity: !aiQuery.trim() ? 0.5 : 1,
                }}
                onClick={handleAiQuery}
                disabled={!aiQuery.trim()}
                onMouseEnter={(e) => { if (aiQuery.trim()) e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = !aiQuery.trim() ? "0.5" : "1"; }}
              >
                Ask AI
              </button>

              {aiResponse && (
                <div style={{ marginTop: 24, padding: 20, backgroundColor: c.inputBg, borderRadius: 12, border: `1px solid ${c.cardBorder}` }}>
                  <div style={{ fontSize: 13, color: c.warmGray, marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>AI Response</div>
                  <div style={{ fontSize: 15, lineHeight: 1.7, color: c.textPrimary, whiteSpace: "pre-wrap" }}>{aiResponse}</div>
                </div>
              )}

              {!aiResponse && (
                <div style={{ marginTop: 24, padding: 30, textAlign: "center", fontSize: 14, color: c.warmGray, fontStyle: "italic", backgroundColor: c.inputBg, borderRadius: 12, border: `1px dashed ${c.cardBorder}` }}>
                  Response will appear here after you ask a question
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals (same as phone) ── */}
      {showCreateModal && <CreateNoteModal petId={pet.petId} userName={user.displayName} userRole={user.role} onClose={() => setShowCreateModal(false)} onSubmit={handleNoteCreated} c={c} />}
      {editingNote && <EditNoteModal note={editingNote} userRole={user.role} onClose={() => setEditingNote(null)} onSave={handleNoteEdited} c={c} />}
      {showCreateBehaviorModal && <CreateBehaviorNoteModal petId={pet.petId} userName={user.displayName} onClose={() => setShowCreateBehaviorModal(false)} onSubmit={handleBehaviorNoteCreated} c={c} />}
      {editingBehaviorNote && <EditBehaviorNoteModal note={editingBehaviorNote} onClose={() => setEditingBehaviorNote(null)} onSave={handleBehaviorNoteEdited} c={c} />}
    </main>
  );
}
