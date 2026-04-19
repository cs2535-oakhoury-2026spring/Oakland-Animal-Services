import { useState, useEffect } from "react";
import { HANDLER_LEVEL_COLORS } from "../constants.js";
import { useResponsive } from "../hooks.js";
import { api } from "../api.js";
import Icons from "../Icons.jsx";
import Skeleton from "../components/Skeleton.jsx";
import UserDropdown from "../components/UserDropdown.jsx";
import "./HomeScreen.css";

const PLACEHOLDER_HOME = "/DogSHADOW.png";

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ user, token, onLogout, darkMode, setDarkMode, onChangePassword }) {
  const r = useResponsive();
  const initialPageParam = Number(new URLSearchParams(window.location.search).get("page") || "1");
  const initialPage = Number.isFinite(initialPageParam) && initialPageParam > 0 ? Math.floor(initialPageParam) : 1;
  const [animals, setAnimals] = useState(null);
  const [allAnimals, setAllAnimals] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    const qs = params.toString();
    const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, [page]);

  useEffect(() => {
    setLoadError(false);

    if (!searchQuery.trim()) {
      setAllAnimals(null);
      api.getAllAnimals(page, PAGE_SIZE).then((result) => {
        if (result === null) {
          setLoadError(true);
          setAnimals([]);
          setTotalAnimals(0);
          setTotalPages(1);
        } else {
          setAnimals(result.animals || []);
          setTotalAnimals(result.total || 0);
          setTotalPages(result.totalPages || 1);
        }
      });
      return;
    }

    api.getAllAnimalsAllPages(PAGE_SIZE).then((result) => {
      if (result === null) {
        setLoadError(true);
        setAllAnimals([]);
      } else {
        setAllAnimals(result || []);
      }
    });
  }, [page, searchQuery]);

  const sourceAnimals = searchQuery.trim() ? allAnimals : animals;

  // Client-side filter: apply search query across all returned animals
  const filtered = sourceAnimals
    ? sourceAnimals.filter((a) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          (a.arn && a.arn.toLowerCase().includes(q)) ||
          String(a.id).includes(q) ||
          a.location.toLowerCase().includes(q) ||
          (a.breed && a.breed.toLowerCase().includes(q))
        );
      })
    : [];

  // Highlight matched text in a string
  const highlight = (text) => {
    if (!searchQuery.trim() || !text) return text;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} style={{ backgroundColor: "#FFEB3B", padding: "0 1px", borderRadius: 2, fontWeight: 700 }}>{part}</mark>
        : part
    );
  };

  // Desktop: 2-col grid. Mobile: single column
  const isDesktop = r.width >= 768;
  const cardImg = 56;

  return (
    <main className="home-screen">
      {/* Top bar */}
      <div className="home-screen__topbar">
        <div className="home-screen__topbar-left">
          <UserDropdown user={user} onLogout={onLogout} token={token} onChangePassword={onChangePassword} />
        </div>
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" className="home-screen__logo" />
        <div className="home-screen__topbar-right">
          {setDarkMode && (
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="home-screen__theme-btn"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color="var(--clr-text-secondary)" />}
            </button>
          )}
        </div>
      </div>

      <div className={`home-screen__content home-screen__content--${isDesktop ? "desktop" : "mobile"}`}>
        {/* Title */}
        <div className="home-screen__title-row">
          <h2 className="home-screen__title" style={{ fontSize: isDesktop ? 26 : 22 }}>Available Animals</h2>
          {sourceAnimals && (
            <span className="home-screen__count">
              {searchQuery.trim()
                ? `${filtered.length} matches`
                : `${totalAnimals} animals · page ${page} of ${totalPages}`}
            </span>
          )}
        </div>
        <p className="home-screen__description">Animals currently at Oakland Animal Services</p>

        <button
          onClick={() => { window.location.href = "/?view=locations"; }}
          className="home-screen__nav-btn"
                 >
          View Kennel Locations
        </button>

        {/* Search bar */}
        <div className="home-screen__search-wrap" style={{ maxWidth: isDesktop ? 500 : "100%" }}>
          <div className="home-screen__search-icon">
            <Icons.search size={16} color="var(--clr-warm-gray)" />
          </div>
          <input
            className="home-screen__search-input"
                       placeholder="Search by name, ACR, ID, breed, or kennel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={(e) => e.currentTarget.style.borderColor = "var(--clr-header-green)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "var(--clr-input-border)"}
            aria-label="Search animals"
          />
        </div>
      </div>

      {/* Animal list / grid */}
      <div className={`home-screen__list home-screen__list--${isDesktop ? "desktop" : "mobile"}`}>
        {/* Loading skeletons */}
        {animals === null && Array.from({ length: isDesktop ? 6 : 5 }).map((_, i) => (
          <div key={i} className="home-screen__skeleton-card">
            <Skeleton width={cardImg} height={cardImg} borderRadius={8} />
            <div className="home-screen__skeleton-info">
              <Skeleton width="40%" height={14} />
              <Skeleton width="60%" height={12} />
            </div>
          </div>
        ))}

        {/* Error */}
        {loadError && (
          <div className="home-screen__message">
            Could not load animals. Please check your connection and try again.
          </div>
        )}

        {/* Empty search */}
        {animals && !loadError && filtered.length === 0 && searchQuery.trim() && (
          <div className="home-screen__message">
            No animals matching "{searchQuery}"
          </div>
        )}

        {/* Cards */}
        {filtered.map((animal) => {
          const handlerColor = HANDLER_LEVEL_COLORS[animal.handlerLevel] || HANDLER_LEVEL_COLORS.green;
          const isHold = animal.status && animal.status.toLowerCase() !== "available";
          const imgSrc = animal.image || PLACEHOLDER_HOME;
          return (
            <button
              key={animal.id}
              onClick={() => {
                const species = animal.species.toLowerCase();
                const loc = animal.location.replace(new RegExp(`^${animal.species}\\s+`, 'i'), '').toLowerCase();
                if (loc && loc !== "unknown" && !loc.includes("foster")) {
                  window.location.href = `/?type=${encodeURIComponent(species)}&location=${encodeURIComponent(loc)}`;
                } else {
                  window.location.href = `/?petId=${animal.id}&page=${page}`;
                }
              }}
              className="home-screen__card"
                           aria-label={`View ${animal.name}'s profile`}
            >
              <img
                src={imgSrc}
                alt={animal.name}
                className="home-screen__card-img"
                style={{ width: cardImg, height: cardImg }}
                onError={(e) => { e.target.src = PLACEHOLDER_HOME; }}
              />
              <div className="home-screen__card-body">
                <div className="home-screen__card-name-row">
                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: handlerColor, flexShrink: 0, boxShadow: `0 0 0 2px ${handlerColor}33` }} />
                  <span className="home-screen__card-name">
                    {highlight(animal.name)}
                  </span>
                </div>
                <div className="home-screen__card-meta">
                  {highlight(animal.species)}{animal.breed ? <> · {highlight(animal.breed)}</> : ""} · {highlight(animal.location)}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                color: isHold ? "#c0392b" : "var(--clr-status-resolved)",
                backgroundColor: isHold ? "#fdecea" : "var(--clr-status-resolved-bg)",
                border: `1px solid ${isHold ? "#e74c3c30" : "var(--clr-status-resolved-border)"}`,
                textTransform: "capitalize",
              }}>
                {animal.status}
              </span>
              <Icons.arrowRight size={16} color="var(--clr-warm-gray)" />
            </button>
          );
        })}
      </div>

      {animals && !loadError && totalPages > 1 && (
        <div className={`home-screen__pagination home-screen__list--${isDesktop ? "desktop" : "mobile"}`} style={{ maxWidth: isDesktop ? 1200 : 700, padding: isDesktop ? "0 28px" : "0 16px" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="home-screen__page-btn"
                     >
            Previous
          </button>
          <span className="home-screen__page-info">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="home-screen__page-btn"
                     >
            Next
          </button>
        </div>
      )}

    </main>
  );
}
