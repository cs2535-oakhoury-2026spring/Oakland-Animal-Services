import { useState } from "react";
import { isCurrentAnimal, PLACEHOLDER_CAT, PLACEHOLDER_DOG } from "../constants.js";
import { useResponsive } from "../hooks.js";
import Icons from "../Icons.jsx";
import UserDropdown from "./UserDropdown.jsx";
import './AnimalSelection.css';

// ─── Animal Selection Screen ─────────────────────────────────────────────────
// Only shown when multiple animals share the same kennel location.
// Current = Available or Foster (or unknown — can't confirm otherwise)
// Past = anything explicitly non-available: Not Available, Adopted, Deceased, Hold, etc.

// If a QR code URL leads to a kennel with 1 animal, this screen is skipped.
export default function AnimalSelection({ animals, onSelect, user, token, onLogout, onBack, darkMode, setDarkMode, onRefresh, refreshing = false, onChangePassword }) {
  const r = useResponsive();
  const isDesktop = r.width >= 768;
  const location = animals[0]?.location || "";
  const maxWidth = isDesktop ? 860 : 480;

  const currentAnimals = animals.filter(isCurrentAnimal);
  const pastAnimals = animals.filter((p) => !isCurrentAnimal(p));
  const [tab, setTab] = useState("current");
  const displayed = tab === "current" ? currentAnimals : pastAnimals;

  const imgSize = isDesktop ? 72 : 64;
  const [showRefreshTip, setShowRefreshTip] = useState(false);

  return (
    <main id="main-content" className="as-main">

      {/* Top Bar */}
      <header
        className="as-header"
        style={{ padding: isDesktop ? "14px 28px" : "10px 12px" }}
      >
        <div className="as-header-left" style={{ gap: isDesktop ? 12 : 4 }}>
          <button
            onClick={onBack}
            className="as-back-btn"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--clr-input-bg)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            aria-label="Back to home"
          >
            <Icons.back size={isDesktop ? 22 : 20} color="var(--clr-text-secondary)" />
          </button>
          <UserDropdown user={user} onLogout={onLogout} token={token} compact={!isDesktop} onChangePassword={onChangePassword} />
        </div>
        <img
          src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"}
          alt="Oakland Animal Services"
          className="as-header-logo"
          style={{ height: isDesktop ? 40 : 32 }}
        />
        <div className="as-header-right">
          {setDarkMode && (
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="as-darkmode-btn"
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--clr-input-bg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color="var(--clr-text-secondary)" />}
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="as-content" style={{ maxWidth, padding: isDesktop ? "32px 28px" : "20px 16px" }}>
        {/* Heading */}
        <div style={{ marginBottom: isDesktop ? 20 : 14 }}>
          <div className="as-heading-label">Location</div>
          <div className="as-heading-row">
            <h2 className="as-heading-h2" style={{ fontSize: isDesktop ? 26 : 20 }}>
              Select an Animal: <span className="as-heading-location">{location}</span>
            </h2>
            {onRefresh && (
              <div className="as-refresh-wrapper">
                <button
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="as-refresh-btn"
                  style={{ padding: isDesktop ? "8px 14px" : "7px 10px", opacity: refreshing ? 0.6 : 1 }}
                  onMouseEnter={(e) => { setShowRefreshTip(true); if (!refreshing) e.currentTarget.style.backgroundColor = "var(--clr-input-bg)"; }}
                  onMouseLeave={(e) => { setShowRefreshTip(false); e.currentTarget.style.backgroundColor = "transparent"; }}
                  onFocus={() => setShowRefreshTip(true)}
                  onBlur={() => setShowRefreshTip(false)}
                  aria-label="Refresh animal list"
                >
                  <Icons.refresh size={isDesktop ? 16 : 15} color="var(--clr-text-secondary)" spinning={refreshing} />
                  {isDesktop && <span>{refreshing ? "Refreshing…" : "Refresh"}</span>}
                </button>
                {showRefreshTip && (
                  <div role="tooltip" className="as-tooltip">
                    {refreshing ? "Refreshing…" : "Click to refresh to get the most up-to-date list of animals at this location."}
                    <div className="as-tooltip-arrow" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Current / Past tabs */}
        <nav className="as-tabs" style={{ marginBottom: isDesktop ? 24 : 16 }}>
          {[{ key: "current", label: "Current", count: currentAnimals.length }, { key: "past", label: "Past", count: pastAnimals.length }].map(({ key, label, count }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`as-tab-btn${active ? " active" : ""}`}
                style={{ color: active ? (darkMode ? "#8eff8e" : "var(--clr-header-green)") : "var(--clr-warm-gray)" }}
              >
                {label} ({count})
              </button>
            );
          })}
        </nav>

        {/* Empty state */}
        {displayed.length === 0 && (
          <div className="as-empty">
            {tab === "current" ? "No animals currently assigned to this kennel." : "No past animals found at this location."}
          </div>
        )}

        {/* Animal list — 2-col grid on desktop */}
        <div
          className="as-grid"
          style={{ gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: isDesktop ? 14 : 10 }}
        >
          {displayed.map((pet) => (
            <button
              key={pet.petId}
              onClick={() => onSelect(pet.petId)}
              className={`as-animal-card${tab === "past" ? " past" : ""}`}
              style={{ padding: isDesktop ? 18 : 14 }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)"; e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow)"; e.currentTarget.style.opacity = tab === "past" ? "0.75" : "1"; }}
              aria-label={`View ${pet.name}'s profile`}
            >
              <img
                src={pet.imageUrl}
                alt={pet.name}
                className="as-animal-img"
                style={{ width: imgSize, height: imgSize }}
                onError={(e) => { e.target.src = pet.species === "Cat" ? PLACEHOLDER_CAT : PLACEHOLDER_DOG; }}
              />
              <div className="as-animal-info">
                <div className="as-animal-name" style={{ fontSize: isDesktop ? 17 : 16 }}>{pet.name}</div>
                <div className="as-animal-id">ID: {pet.petId}</div>
                <div className="as-animal-species">
                  {pet.species}
                  {tab === "past" && pet.status && pet.status !== "Unknown" && (
                    <span className="as-animal-status-badge">· {pet.status}</span>
                  )}
                </div>
              </div>
              <Icons.arrowRight size={18} color="var(--clr-warm-gray)" />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
