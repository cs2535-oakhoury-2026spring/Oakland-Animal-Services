import { useState, useEffect, useRef, useCallback } from "react";

// ─── Focus Trap Hook for Modals (WCAG 2.1 AA) ─────────────────────────────────
function useFocusTrap(isOpen) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = container.querySelectorAll(focusableSelectors);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Focus first element when modal opens
    setTimeout(() => firstElement?.focus(), 50);
    
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  return containerRef;
}

// ─── Escape Key Hook for Modals ───────────────────────────────────────────────
function useEscapeKey(onClose, isOpen) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isOpen]);
}

// ─── Loading Skeleton Component ───────────────────────────────────────────────
function Skeleton({ width = "100%", height = 16, borderRadius = 8, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-pulse 1.5s ease-in-out infinite",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

// Inject skeleton animation and slide transition CSS
if (typeof document !== 'undefined' && !document.getElementById('skeleton-styles')) {
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = `
    @keyframes skeleton-pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes slide-left {
      0% { transform: translateX(100%); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    }
    @keyframes slide-right {
      0% { transform: translateX(-100%); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// Load Poppins font
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
fontLink.rel = "stylesheet";
if (!document.querySelector('link[href*="Poppins"]')) document.head.appendChild(fontLink);

// ─── Responsive Hook ─────────────────────────────────────────────────────────
function useResponsive() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  const isPhone = width <= 480;
  const isTablet = width > 480 && width <= 1024;
  const isDesktop = width > 1024;
  // Max container width: phone = full width, tablet = 600px, desktop = 500px
  const containerWidth = isPhone ? "100%" : isTablet ? 600 : 500;
  const padding = isPhone ? 14 : 20;
  const petImageSize = isPhone ? 100 : 130;
  const petNameSize = isPhone ? 19 : 22;
  const detailSize = isPhone ? 13 : 15;
  const bodySize = isPhone ? 14 : 15;
  const tabSize = isPhone ? 12 : 14;
  return { width, isPhone, isTablet, isDesktop, containerWidth, padding, petImageSize, petNameSize, detailSize, bodySize, tabSize };
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const Icons = {
  microphone: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="1" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" /><line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  ),
  user: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="7" r="4" /><path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
    </svg>
  ),
  qrCode: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" rx="0.5" />
      <rect x="5" y="5" width="2" height="2" fill={color} stroke="none" /><rect x="17" y="5" width="2" height="2" fill={color} stroke="none" /><rect x="5" y="17" width="2" height="2" fill={color} stroke="none" />
    </svg>
  ),
  pencil: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  ),
  plus: ({ size = 20, color = "#fff" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  search: ({ size = 18, color = "#999" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  ),
  sun: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  chevron: ({ size = 16, color = "#888", down = true }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: down ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  arrowRight: ({ size = 16, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  back: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
};

// ─── Placeholder Image ───────────────────────────────────────────────────────
// Replace with actual image URLs from RescueGroups API when connected
const PLACEHOLDER_CAT = "https://placekitten.com/300/300";
const PLACEHOLDER_DOG = "https://placedog.net/300/300";

// ─── Mock Data & Service Layer ───────────────────────────────────────────────
// NOTE: Pet data comes from RescueGroups API via backend proxy.
// Per-endpoint flags — each method marked REAL or MOCK based on backend availability.

const mockPets = [
  { petId: "12345678910", name: "Fluffly", species: "Cat", location: "Cat W-5", microchip: "123456789101213", arn: "736727", status: "available", imageUrl: PLACEHOLDER_CAT, handlerLevel: "green" },
  { petId: "12345678912", name: "Whiskers", species: "Cat", location: "Cat W-5", microchip: "111222333444555", arn: "736729", status: "available", imageUrl: PLACEHOLDER_CAT, handlerLevel: "pink" },
  { petId: "12345678913", name: "Mittens", species: "Cat", location: "Cat W-5", microchip: "222333444555666", arn: "736730", status: "available", imageUrl: PLACEHOLDER_CAT, handlerLevel: "yellow" },
];

const mockObserverNotes = [
  { id: 1, petId: "12345678910", case: "Limp On Right Leg", by: "Shannon", status: "Raised", type: "medical", body: "Noticed limping during morning check. The cat appears to favor the left side when walking. No visible swelling or wounds detected on initial observation. Will need further examination by veterinary staff.", createdAt: "2026-03-01T09:00:00Z" },
  { id: 2, petId: "12345678910", case: "Limp On Right Leg", by: "Shannon", status: "Resolved", type: "medical", body: "Follow-up examination completed. Vet confirmed minor sprain, no fracture detected. Prescribed rest and limited activity for one week. Pain medication administered. Cat responding well to treatment.", createdAt: "2026-03-02T14:00:00Z" },
];

const mockBehaviorNotes = [
  { id: 1001, petId: "12345678910", case: "Stress-related behavior", by: "Shannon", body: "Cat has been hiding in the back of the kennel for most of the day. Not responding to usual enrichment activities. Appetite seems normal but social interaction is minimal. This may be stress-related due to recent kennel move.", createdAt: "2026-03-02T10:15:00Z" },
  { id: 1002, petId: "12345678910", case: "Enrichment progress", by: "Shannon", body: "Responded well to feather toy during enrichment. Showed interest for approximately 15 minutes. Made eye contact with handler and allowed brief chin scratches.", createdAt: "2026-03-02T15:30:00Z" },
  { id: 1003, petId: "12345678910", case: "Socialization plan", by: "Demo User", body: "Recommending quiet time and gradual socialization approach going forward.", createdAt: "2026-03-03T09:00:00Z" },
  { id: 1004, petId: "12345678911", case: "General temperament", by: "Shannon", body: "Buddy is very friendly and energetic. Enjoys walks and plays well with other dogs. Good candidate for adoption events.", createdAt: "2026-03-01T10:00:00Z" },
];

const mockUsers = [
  { username: "shannon", password: "oak2026", displayName: "Shannon", role: "medical", email: "shannon@oaklandanimal.org", department: "Veterinary Care" },
  { username: "demo", password: "demo", displayName: "Demo User", role: "staff", email: "demo@oaklandanimal.org", department: "Animal Care" },
];

// Transform backend observer note to frontend format
const transformObserverNote = (note, index) => ({
  id: note.id || Date.now() + index,
  petId: String(note.petId),
  case: note.case || "General Observation",
  by: note.author || note.by || "Unknown",
  status: note.status || "Raised",
  type: note.type || "medical",
  body: note.content || note.body || "",
  createdAt: note.timestamp || note.createdAt || new Date().toISOString(),
});

const api = {
  // MOCK — no backend auth endpoint yet
  login: async (username, password) => {
    const user = mockUsers.find((u) => u.username === username && u.password === password);
    if (user) return { success: true, user: { displayName: user.displayName, role: user.role, email: user.email, department: user.department } };
    return { success: false, error: "Invalid credentials" };
  },

  // MOCK — pet router exists but not registered in server.ts
  getPet: async (petId) => mockPets.find((p) => p.petId === petId) || mockPets[0],

  // MOCK — no backend multi-pet/kennel query endpoint yet
  getPetsByLocation: async () => mockPets,

  // REAL — connected to GET /api/pets/:petId/observer-notes
  getNotes: async (petId) => {
    try {
      const res = await fetch(`/api/pets/${petId}/observer-notes`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      const data = await res.json();
      if (data.success && Array.isArray(data.observerNotes)) {
        return data.observerNotes.map(transformObserverNote);
      }
      return [];
    } catch (err) {
      console.warn("getNotes: falling back to mock data", err);
      return mockObserverNotes.filter((n) => n.petId === petId);
    }
  },

  // REAL — connected to POST /api/observer-notes
  createNote: async (note) => {
    try {
      const res = await fetch("/api/observer-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: note.body,
          author: note.by,
          petId: parseInt(note.petId, 10) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to create note");
      const data = await res.json();
      if (data.success && data.observerNote) {
        return transformObserverNote({ ...data.observerNote, case: note.case, status: note.status }, 0);
      }
      return { ...note, id: Date.now(), createdAt: new Date().toISOString() };
    } catch (err) {
      console.warn("createNote: falling back to mock", err);
      return { ...note, id: Date.now(), createdAt: new Date().toISOString() };
    }
  },

  // MOCK — no backend endpoint for behavior notes yet
  getBehaviorNotes: async (petId) => mockBehaviorNotes.filter((n) => n.petId === petId),
  
  createBehaviorNote: async (note) => {
    const newNote = { ...note, id: Date.now(), createdAt: new Date().toISOString() };
    mockBehaviorNotes.push(newNote);
    return newNote;
  },

  // REAL — connected to POST /api/search (searches observer notes, not pets)
  searchNotes: async (query, petId) => {
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: query, maxResults: 20 }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        return data.results
          .filter((r) => String(r.petId) === String(petId))
          .map((r) => transformObserverNote(r.note, 0));
      }
      return [];
    } catch (err) {
      console.warn("searchNotes: falling back to local filter", err);
      return null; // Signal to use local filtering
    }
  },
};

// ─── Theme ───────────────────────────────────────────────────────────────────
const themes = {
  light: {
    headerGreen: "#2d5a27", tabActiveBg: "#d4edda", brickRed: "#BE3A2B", warmGray: "#666666",
    statusRaised: "#BE3A2B", statusResolved: "#2d7a24", bg: "#f2f2f2", cardBg: "#ffffff",
    cardBorder: "#cccccc", textPrimary: "#1a1a1a", textSecondary: "#333333", inputBg: "#f7f7f7",
    inputBorder: "#bbb", shadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  dark: {
    headerGreen: "#2d5a27", tabActiveBg: "#1e3d1a", brickRed: "#E04B3A", warmGray: "#aaaaaa",
    statusRaised: "#E04B3A", statusResolved: "#4CAF50", bg: "#1a1a1a", cardBg: "#2a2a2a",
    cardBorder: "#3a3a3a", textPrimary: "#f0f0f0", textSecondary: "#d0d0d0", inputBg: "#333333",
    inputBorder: "#555555", shadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
};
const font = "'Poppins', sans-serif";

// Handler level colors (from RescueGroups API animalOthernames field)
const HANDLER_LEVEL_COLORS = {
  green: "#4CAF50",
  yellow: "#FFC107",
  blue: "#2196F3",
  pink: "#E91E63",
};

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const c = themes.light;
  const r = useResponsive();

  const handleLogin = async () => {
    if (!username || !password) { setError("Please enter both fields"); return; }
    setLoading(true); setError("");
    const result = await api.login(username, password);
    setLoading(false);
    if (result.success) onLogin(result.user);
    else setError(result.error || "Invalid credentials");
  };

  const inputStyle = { width: "100%", maxWidth: 400, padding: "14px 16px", marginBottom: 12, borderRadius: 12, border: `1px solid ${c.inputBorder}`, backgroundColor: c.cardBg, color: c.textPrimary, fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: font };

  return (
    <main id="main-content" style={{ fontFamily: font, maxWidth: r.containerWidth, margin: "0 auto", minHeight: "100vh", backgroundColor: c.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: r.padding }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32, color: c.textSecondary, fontSize: 15 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: c.cardBorder, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icons.user size={20} color={c.textSecondary} />
        </div>
        <span style={{ fontWeight: 500 }}>LOGIN</span>
      </div>
      <div style={{ backgroundColor: c.headerGreen, color: "#fff", padding: "12px 40px", borderRadius: 25, fontSize: 17, fontWeight: 600, textAlign: "center", marginBottom: 40, width: "100%", maxWidth: 400 }}>Oakland Animal Services</div>
      <input style={inputStyle} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} aria-label="Username" />
      <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} aria-label="Password" />
      <button style={{ width: "100%", maxWidth: 400, padding: 14, marginTop: 8, borderRadius: 12, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1, fontFamily: font, minHeight: 48, transition: "opacity 0.2s ease, background-color 0.2s ease" }} onClick={handleLogin} disabled={loading} aria-label="Sign in">
        {loading ? "Signing in..." : "Sign In"}
      </button>
      {error && <div role="alert" style={{ color: c.brickRed, fontSize: 14, marginTop: 8 }}>{error}</div>}
      <div style={{ marginTop: 24, fontSize: 13, color: c.warmGray, textAlign: "center", lineHeight: 1.6 }}>Demo credentials:<br />shannon / oak2026 (medical)<br />demo / demo (staff)</div>
    </main>
  );
}

// ─── Animal Selection Screen ─────────────────────────────────────────────────
function AnimalSelection({ animals, onSelect, user, onLogout, c }) {
  const r = useResponsive();
  return (
    <main id="main-content" style={{ fontFamily: font, maxWidth: r.containerWidth, margin: "0 auto", minHeight: "100vh", backgroundColor: c.bg, padding: "0 0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: c.textSecondary }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: c.cardBorder, display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.user size={16} color={c.textSecondary} /></div>
          <span style={{ fontWeight: 500 }}>{user.displayName}</span>
        </div>
        <button onClick={onLogout} style={{ fontSize: 13, color: c.warmGray, background: "none", border: "none", cursor: "pointer", fontFamily: font, minHeight: 44, minWidth: 44 }} aria-label="Logout">Logout</button>
      </div>
      <div style={{ padding: "16px 16px 0" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: c.textPrimary, marginBottom: 4 }}>Select an Animal</h2>
        <p style={{ fontSize: 14, color: c.textSecondary, marginBottom: 16 }}>Choose which animal to view</p>
      </div>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {animals.map((pet) => (
          <button key={pet.petId} onClick={() => onSelect(pet.petId)}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, backgroundColor: c.cardBg, borderRadius: 14, border: `1px solid ${c.cardBorder}`, cursor: "pointer", fontFamily: font, textAlign: "left", width: "100%", boxShadow: c.shadow, transition: "transform 0.15s, box-shadow 0.15s", minHeight: 44 }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = c.shadow; }}
            aria-label={`View ${pet.name}'s profile`}
          >
            <img src={pet.imageUrl} alt={pet.name} style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: `2px solid ${c.cardBorder}` }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: c.textPrimary }}>{pet.name}</div>
              <div style={{ fontSize: 13, color: c.textSecondary }}>{pet.species} · {pet.location}</div>
            </div>
            <Icons.arrowRight size={18} color={c.warmGray} />
          </button>
        ))}
      </div>
    </main>
  );
}

// ─── User Dropdown ───────────────────────────────────────────────────────────
function UserDropdown({ user, onLogout, c }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: c.textSecondary, background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: font, minHeight: 44 }} aria-label="User menu" aria-expanded={open}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: c.cardBorder, display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.user size={16} color={c.textSecondary} /></div>
        <span style={{ fontWeight: 500 }}>{user.displayName}</span>
        <Icons.chevron size={14} color={c.warmGray} down={!open} />
      </button>
      {open && (
        <div role="menu" style={{ position: "absolute", top: 44, left: 0, backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: 16, minWidth: 220, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", fontFamily: font }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: c.textPrimary, marginBottom: 8 }}>{user.displayName}</div>
          <div style={{ fontSize: 13, color: c.textSecondary, marginBottom: 4 }}>{user.email}</div>
          <div style={{ fontSize: 13, color: c.textSecondary, marginBottom: 4 }}>Department: {user.department}</div>
          <div style={{ fontSize: 13, color: c.warmGray, marginBottom: 12, textTransform: "capitalize" }}>Role: {user.role}</div>
          <div style={{ borderTop: `1px solid ${c.cardBorder}`, paddingTop: 10 }}>
            <button role="menuitem" onClick={onLogout} style={{ fontSize: 14, color: c.brickRed, background: "none", border: "none", cursor: "pointer", fontFamily: font, fontWeight: 500, padding: 0, minHeight: 44 }}>Logout</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Handler level indicator (read-only from RescueGroups API)
function HandlerLevelIndicator({ level }) {
  const color = HANDLER_LEVEL_COLORS[level] || HANDLER_LEVEL_COLORS.green;
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        backgroundColor: color,
        border: "2px solid rgba(255,255,255,0.8)",
        boxShadow: `0 0 0 2px ${color}44, 0 1px 3px rgba(0,0,0,0.15)`,
        flexShrink: 0,
      }}
      title={`Handler level: ${level}`}
      aria-label={`Handler level: ${level}`}
    />
  );
}

// ─── Edit Medical Note Modal ─────────────────────────────────────────────────
function EditNoteModal({ note, userRole, onClose, onSave, c }) {
  const [body, setBody] = useState(note.body);
  const [caseName, setCaseName] = useState(note.case || "");
  const [status, setStatus] = useState(note.status || "Raised");
  const canChangeStatus = userRole === "medical";
  const handleSave = () => { onSave({ ...note, body, case: caseName, ...(canChangeStatus ? { status } : {}) }); onClose(); };
  const fieldStyle = { width: "100%", padding: "12px 14px", marginBottom: 12, borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg, color: c.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: font };
  const labelStyle = { fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" };
  
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit medical observation">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380, maxHeight: "80vh", overflow: "auto", fontFamily: font }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: c.textPrimary }}>Edit Medical Observation</h2>
        <label style={labelStyle}>Case Title</label>
        <input style={fieldStyle} value={caseName} onChange={(e) => setCaseName(e.target.value)} aria-label="Case title" />
        {canChangeStatus && (<><label style={labelStyle}>Status</label><select style={fieldStyle} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="Raised">Raised</option><option value="Resolved">Resolved</option></select></>)}
        <label style={labelStyle}>Notes</label>
        <textarea style={{ ...fieldStyle, minHeight: 120, resize: "vertical" }} value={body} onChange={(e) => setBody(e.target.value)} aria-label="Observation notes" />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: "transparent", color: c.textSecondary, fontSize: 15, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={onClose}>Cancel</button>
          <button style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Behavior Note Modal ─────────────────────────────────────────────
function CreateBehaviorNoteModal({ petId, userName, onClose, onSubmit, c }) {
  const [caseName, setCaseName] = useState("");
  const [body, setBody] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const toggleSpeech = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) { alert("Speech recognition not supported."); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR(); r.continuous = true; r.interimResults = true;
    r.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setBody(t); };
    r.onerror = () => setIsListening(false); r.onend = () => setIsListening(false);
    r.start(); recognitionRef.current = r; setIsListening(true);
  };

  const handleSubmit = async () => {
    if (!caseName.trim() || !body.trim()) return;
    const created = await api.createBehaviorNote({ petId, by: userName, body, case: caseName });
    onSubmit(created); onClose();
  };

  const fieldStyle = { width: "100%", padding: "12px 14px", marginBottom: 12, borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg, color: c.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: font };
  const labelStyle = { fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose} role="dialog" aria-modal="true" aria-label="New behavior note">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380, maxHeight: "80vh", overflow: "auto", fontFamily: font }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: c.textPrimary }}>New Behavior Note</h2>
        <label style={labelStyle}>Case Title</label>
        <input style={fieldStyle} placeholder="e.g. Socialization Progress" value={caseName} onChange={(e) => setCaseName(e.target.value)} aria-label="Case title" />
        <label style={labelStyle}>
          Observation Notes
          <button style={{ width: 34, height: 34, marginLeft: 8, verticalAlign: "middle", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", backgroundColor: isListening ? c.brickRed : c.inputBg, transition: "background-color 0.2s ease" }} onClick={toggleSpeech} aria-label={isListening ? "Stop speech to text" : "Start speech to text"}>
            <Icons.microphone size={16} color={isListening ? "#fff" : c.textPrimary} />
          </button>
        </label>
        <textarea style={{ ...fieldStyle, minHeight: 100, resize: "vertical" }} placeholder="Describe your observation..." value={body} onChange={(e) => setBody(e.target.value)} aria-label="Observation notes" />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: "transparent", color: c.textSecondary, fontSize: 15, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={onClose}>Cancel</button>
          <button style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Behavior Note Modal ────────────────────────────────────────────────
function EditBehaviorNoteModal({ note, onClose, onSave, c }) {
  const [body, setBody] = useState(note.body);
  const [caseName, setCaseName] = useState(note.case || "");
  const handleSave = () => { onSave({ ...note, body, case: caseName }); onClose(); };
  const fieldStyle = { width: "100%", padding: "12px 14px", marginBottom: 12, borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg, color: c.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: font };
  const labelStyle = { fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" };
  
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit behavior note">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380, maxHeight: "80vh", overflow: "auto", fontFamily: font }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: c.textPrimary }}>Edit Behavior Note</h2>
        <label style={labelStyle}>Case Title</label>
        <input style={fieldStyle} value={caseName} onChange={(e) => setCaseName(e.target.value)} aria-label="Case title" />
        <label style={labelStyle}>Notes</label>
        <textarea style={{ ...fieldStyle, minHeight: 120, resize: "vertical" }} value={body} onChange={(e) => setBody(e.target.value)} aria-label="Observation notes" />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: "transparent", color: c.textSecondary, fontSize: 15, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={onClose}>Cancel</button>
          <button style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Medical Note Modal ───────────────────────────────────────────────
function CreateNoteModal({ petId, userName, userRole, onClose, onSubmit, c }) {
  const [caseName, setCaseName] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("Raised");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const canSetStatus = userRole === "medical";
  
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const toggleSpeech = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) { alert("Speech recognition not supported."); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR(); r.continuous = true; r.interimResults = true;
    r.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setBody(t); };
    r.onerror = () => setIsListening(false); r.onend = () => setIsListening(false);
    r.start(); recognitionRef.current = r; setIsListening(true);
  };

  const handleSubmit = async () => {
    if (!caseName.trim() || !body.trim()) return;
    const created = await api.createNote({ petId, by: userName, type: "medical", body, case: caseName, status: canSetStatus ? status : "Raised" });
    onSubmit(created); onClose();
  };

  const fieldStyle = { width: "100%", padding: "12px 14px", marginBottom: 12, borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg, color: c.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: font };
  const labelStyle = { fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose} role="dialog" aria-modal="true" aria-label="New medical observation">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380, maxHeight: "80vh", overflow: "auto", fontFamily: font }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: c.textPrimary }}>New Medical Observation</h2>
        <label style={labelStyle}>Case Title</label>
        <input style={fieldStyle} placeholder="e.g. Limp On Right Leg" value={caseName} onChange={(e) => setCaseName(e.target.value)} aria-label="Case title" />
        {canSetStatus && (<><label style={labelStyle}>Status</label><select style={fieldStyle} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="Raised">Raised</option><option value="Resolved">Resolved</option></select></>)}
        <label style={labelStyle}>
          Observation Notes
          <button style={{ width: 34, height: 34, marginLeft: 8, verticalAlign: "middle", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", backgroundColor: isListening ? c.brickRed : c.inputBg, transition: "background-color 0.2s ease" }} onClick={toggleSpeech} aria-label={isListening ? "Stop speech to text" : "Start speech to text"}>
            <Icons.microphone size={16} color={isListening ? "#fff" : c.textPrimary} />
          </button>
        </label>
        <textarea style={{ ...fieldStyle, minHeight: 100, resize: "vertical" }} placeholder="Describe your observation..." value={body} onChange={(e) => setBody(e.target.value)} aria-label="Observation notes" />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: "transparent", color: c.textSecondary, fontSize: 15, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={onClose}>Cancel</button>
          <button style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
}

// ─── Medical Note Card ───────────────────────────────────────────────────────
function MedicalNoteCard({ note, currentUser, onEdit, c }) {
  const isOwner = note.by === currentUser;
  const [hovered, setHovered] = useState(false);
  
  // Format timestamp to precise datetime
  const formatTimestamp = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return "";
    }
  };
  
  return (
    <article 
      style={{ 
        backgroundColor: c.cardBg, 
        borderRadius: 12, 
        padding: 16, 
        border: `1px solid ${c.cardBorder}`, 
        marginBottom: 12, 
        boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.1)" : c.shadow,
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header with title and status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary, margin: "0 0 6px 0", lineHeight: 1.3 }}>
            {note.case}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: c.warmGray, fontWeight: 500 }}>
              {note.by}
            </span>
            <span style={{ fontSize: 11, color: c.warmGray }}>•</span>
            <span style={{ fontSize: 12, color: c.warmGray }}>
              {formatTimestamp(note.createdAt)}
            </span>
          </div>
        </div>
        <span 
          style={{ 
            fontSize: 11, 
            fontWeight: 600, 
            color: note.status === "Raised" ? c.statusRaised : c.statusResolved, 
            backgroundColor: note.status === "Raised" ? `${c.statusRaised}18` : `${c.statusResolved}18`, 
            padding: "4px 12px", 
            borderRadius: 12,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            flexShrink: 0
          }}
        >
          {note.status}
        </span>
      </div>
      
      {/* Body content */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: c.textSecondary, flex: 1, margin: 0 }}>
          {note.body}
        </p>
        {isOwner && (
          <button 
            onClick={() => onEdit(note)} 
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              padding: 6, 
              flexShrink: 0, 
              minHeight: 44, 
              minWidth: 44, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              transition: "opacity 0.2s ease",
              opacity: hovered ? 1 : 0.6
            }} 
            aria-label="Edit your observation"
          >
            <Icons.pencil size={16} color={c.warmGray} />
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Behavior Note Card (same as medical) ───────────────────────────────────
function BehaviorNoteCard({ note, currentUser, onEdit, c }) {
  const isOwner = note.by === currentUser;
  const [hovered, setHovered] = useState(false);
  
  const formatTimestamp = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return "";
    }
  };
  
  return (
    <article 
      style={{ 
        backgroundColor: c.cardBg, 
        borderRadius: 12, 
        padding: 16, 
        border: `1px solid ${c.cardBorder}`, 
        marginBottom: 12, 
        boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.1)" : c.shadow,
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary, margin: "0 0 6px 0", lineHeight: 1.3 }}>
            {note.case}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: c.warmGray, fontWeight: 500 }}>
              {note.by}
            </span>
            <span style={{ fontSize: 11, color: c.warmGray }}>•</span>
            <span style={{ fontSize: 12, color: c.warmGray }}>
              {formatTimestamp(note.createdAt)}
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: c.textSecondary, flex: 1, margin: 0 }}>
          {note.body}
        </p>
        {isOwner && (
          <button 
            onClick={() => onEdit(note)} 
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              padding: 6, 
              flexShrink: 0, 
              minHeight: 44, 
              minWidth: 44, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              opacity: hovered ? 1 : 0.6,
              transition: "opacity 0.2s ease"
            }}
            aria-label="Edit note"
          >
            <Icons.pencil size={16} color={c.warmGray} />
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Summary Tab (AI Chat Interface) ────────────────────────────────────────
function SummaryTab({ aiQuery, aiResponse, onQueryChange, onSubmit, c }) {
  const textareaRef = useRef(null);
  
  const handleSubmit = () => {
    onSubmit();
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  return (
    <section style={{ padding: "12px 16px 100px" }} aria-label="AI Summary">
      <div style={{ backgroundColor: c.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${c.cardBorder}`, boxShadow: c.shadow }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: c.textPrimary, margin: "0 0 8px 0" }}>Ask AI About This Animal</h3>
        <p style={{ fontSize: 13, color: c.textSecondary, margin: "0 0 16px 0", lineHeight: 1.5 }}>
          Ask questions about medical observations, behavior notes, or anything related to this animal.
        </p>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 6, display: "block", fontWeight: 500 }}>Your Question</label>
          <textarea 
            ref={textareaRef}
            style={{ 
              width: "100%", 
              padding: "12px 14px", 
              borderRadius: 10, 
              border: `1px solid ${c.inputBorder}`, 
              backgroundColor: c.inputBg, 
              color: c.textPrimary, 
              fontSize: 14, 
              outline: "none", 
              minHeight: 100, 
              resize: "vertical", 
              boxSizing: "border-box", 
              fontFamily: font, 
              lineHeight: 1.6 
            }} 
            placeholder="e.g., What is the current health status? Are there any behavioral concerns?"
            value={aiQuery} 
            onChange={(e) => onQueryChange(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
            aria-label="AI query input" 
          />
          <div style={{ fontSize: 11, color: c.warmGray, marginTop: 6 }}>Press Cmd/Ctrl + Enter to submit</div>
        </div>
        
        <button 
          style={{ 
            width: "100%", 
            padding: 12, 
            borderRadius: 10, 
            border: "none", 
            backgroundColor: c.headerGreen, 
            color: "#fff", 
            fontSize: 15, 
            fontWeight: 600, 
            cursor: "pointer", 
            fontFamily: font, 
            minHeight: 44, 
            transition: "background-color 0.2s ease",
            opacity: !aiQuery.trim() ? 0.5 : 1
          }} 
          onClick={handleSubmit}
          disabled={!aiQuery.trim()}
        >
          Ask AI
        </button>
        
        {aiResponse && (
          <div style={{ marginTop: 20, padding: 16, backgroundColor: c.inputBg, borderRadius: 10, border: `1px solid ${c.cardBorder}` }}>
            <div style={{ fontSize: 13, color: c.warmGray, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>AI Response</div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: c.textPrimary, whiteSpace: "pre-wrap" }}>
              {aiResponse}
            </div>
          </div>
        )}
        
        {!aiResponse && (
          <div style={{ marginTop: 20, padding: 20, textAlign: "center", fontSize: 13, color: c.warmGray, fontStyle: "italic" }}>
            Response will appear here after you ask a question
          </div>
        )}
      </div>
    </section>
  );
}

// ─── QR Code Modal ───────────────────────────────────────────────────────────
function QRCodeModal({ pet, onClose, c }) {
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);
  
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose} role="dialog" aria-modal="true" aria-label="QR code">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 32, width: "100%", maxWidth: 300, textAlign: "center", fontFamily: font }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: c.textPrimary }}>Scan QR Code</h2>
        <div style={{ width: 180, height: 180, margin: "0 auto 16px", backgroundColor: c.inputBg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${c.cardBorder}` }}>
          <div style={{ textAlign: "center" }}><Icons.qrCode size={80} color={c.textPrimary} /><div style={{ fontSize: 11, color: c.warmGray, marginTop: 8 }}>QR Placeholder</div></div>
        </div>
        <div style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.5, marginBottom: 12 }}>Scan to open <strong>{pet.name}</strong>'s profile</div>
        <button style={{ padding: "10px 24px", borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ─── Main Portal ─────────────────────────────────────────────────────────────
function Portal({ user, petId, onLogout, onBack, darkMode, setDarkMode }) {
  const c = darkMode ? themes.dark : themes.light;
  const r = useResponsive();
  const [pet, setPet] = useState(null);
  const [notes, setNotes] = useState([]);
  const [behaviorNotes, setBehaviorNotes] = useState([]);
  const [activeTab, setActiveTab] = useState("summary");
  const [prevTab, setPrevTab] = useState("summary");
  const [slideDirection, setSlideDirection] = useState("right");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateBehaviorModal, setShowCreateBehaviorModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editingBehaviorNote, setEditingBehaviorNote] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [behaviorSearchQuery, setBehaviorSearchQuery] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(true);

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

  const handleNoteCreated = (n) => setNotes((prev) => [n, ...prev]);
  const handleNoteEdited = (n) => setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
  const handleBehaviorNoteCreated = (n) => setBehaviorNotes((prev) => [n, ...prev]);
  const handleBehaviorNoteEdited = (n) => setBehaviorNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
  
  const handleAiQuery = () => {
    if (!aiQuery.trim()) return;
    setAiResponse("AI response will be connected later. For now, this is a placeholder response based on your query: \"" + aiQuery + "\"");
  };

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (n.body || "").toLowerCase().includes(q) || (n.case || "").toLowerCase().includes(q) || (n.by || "").toLowerCase().includes(q);
  });
  
  const filteredBehaviorNotes = behaviorNotes.filter((n) => {
    if (!behaviorSearchQuery.trim()) return true;
    const q = behaviorSearchQuery.toLowerCase();
    return (n.body || "").toLowerCase().includes(q) || (n.case || "").toLowerCase().includes(q) || (n.by || "").toLowerCase().includes(q);
  });

  if (loading || !pet) {
    return (
      <div style={{ fontFamily: font, maxWidth: r.containerWidth, margin: "0 auto", minHeight: "100vh", backgroundColor: c.bg, padding: r.padding }}>
        {/* Skeleton Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0" }}>
          <Skeleton width={30} height={30} borderRadius={15} />
          <Skeleton width={100} height={16} />
        </div>
        {/* Skeleton Pet Card */}
        <div style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 16, border: `1px solid ${c.cardBorder}`, marginTop: 12 }}>
          <div style={{ display: "flex", gap: 14 }}>
            <Skeleton width={r.petImageSize} height={r.petImageSize} borderRadius={8} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton width="60%" height={22} />
              <Skeleton width="80%" height={14} />
              <Skeleton width="70%" height={14} />
              <Skeleton width="50%" height={14} />
            </div>
          </div>
        </div>
        {/* Skeleton Tabs */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Skeleton width="33%" height={44} borderRadius={10} />
          <Skeleton width="33%" height={44} borderRadius={10} />
          <Skeleton width="33%" height={44} borderRadius={10} />
        </div>
        {/* Skeleton Content */}
        <div style={{ marginTop: 16 }}>
          <div style={{ backgroundColor: c.cardBg, borderRadius: 12, padding: 16, border: `1px solid ${c.cardBorder}` }}>
            <Skeleton width="40%" height={14} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={16} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main id="main-content" style={{ fontFamily: font, maxWidth: r.containerWidth, margin: "0 auto", minHeight: "100vh", backgroundColor: c.bg, position: "relative" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, minHeight: 44, minWidth: 44, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Back to animal list">
              <Icons.back size={20} color={c.textSecondary} />
            </button>
          )}
          <UserDropdown user={user} onLogout={onLogout} c={c} />
        </div>
      </div>

      {/* Pet Card */}
      <div style={{ margin: "12px 16px", backgroundColor: c.cardBg, borderRadius: 16, border: `1px solid ${c.cardBorder}`, boxShadow: c.shadow }}>
        <div style={{ padding: r.isPhone ? 16 : 20, display: "flex", gap: r.isPhone ? 14 : 18, alignItems: "flex-start" }}>
          {/* Pet Image - LEFT */}
          <img style={{ width: r.isPhone ? 100 : 120, height: r.isPhone ? 100 : 120, borderRadius: 12, objectFit: "cover", border: `2px solid ${c.cardBorder}`, flexShrink: 0 }} src={pet.imageUrl} alt={`Photo of ${pet.name}`} />
          
          {/* Details - RIGHT */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Name with Handler Level and QR Button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <HandlerLevelIndicator level={pet.handlerLevel || "green"} />
                <h2 style={{ fontSize: r.isPhone ? 16 : 18, fontWeight: 700, color: c.textPrimary, margin: 0 }}>{pet.name}</h2>
              </div>
              <button onClick={() => setShowQR(true)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${c.inputBorder}`, backgroundColor: "transparent", color: c.textSecondary, cursor: "pointer", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, fontFamily: font, transition: "all 0.2s ease", flexShrink: 0 }} aria-label="Show QR code">
                <Icons.qrCode size={13} color={c.textSecondary} />
                {!r.isPhone && <span style={{ fontSize: 11 }}>View QR</span>}
              </button>
            </div>
            
            {/* Pet Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: r.isPhone ? 12 : 13, lineHeight: 1.5 }}>
                <span style={{ color: c.textSecondary, fontWeight: 600 }}>Animal ID: </span>
                <span style={{ color: c.textPrimary }}>{pet.petId}</span>
              </div>
              
              <div style={{ fontSize: r.isPhone ? 12 : 13, lineHeight: 1.5 }}>
                <span style={{ color: c.textSecondary, fontWeight: 600 }}>Location: </span>
                <span style={{ color: c.textPrimary }}>{pet.location}</span>
              </div>
              
              <div style={{ fontSize: r.isPhone ? 12 : 13, lineHeight: 1.5 }}>
                <span style={{ color: c.textSecondary, fontWeight: 600 }}>Microchip: </span>
                <span style={{ color: c.textPrimary }}>{pet.microchip}</span>
              </div>
              
              <div style={{ fontSize: r.isPhone ? 12 : 13, lineHeight: 1.5 }}>
                <span style={{ color: c.textSecondary, fontWeight: 600 }}>ARN: </span>
                <span style={{ color: c.textPrimary }}>{pet.arn}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav style={{ display: "flex", margin: "0 16px", backgroundColor: c.cardBg, borderRadius: 12, padding: 3, border: `1px solid ${c.cardBorder}` }} role="tablist" aria-label="Pet information tabs">
        {tabs.map((tab, index) => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} role="tab" aria-selected={active} aria-controls={`panel-${tab.key}`}
              style={{ flex: 1, padding: "10px 6px", fontSize: 13, fontWeight: active ? 700 : 500, color: active ? (darkMode ? "#8eff8e" : c.headerGreen) : c.warmGray, backgroundColor: active ? c.tabActiveBg : "transparent", border: "none", borderRadius: 10, cursor: "pointer", transition: "all 0.3s ease", fontFamily: font, minHeight: 44 }}
              onClick={() => { 
                const currentIndex = tabs.findIndex(t => t.key === activeTab);
                setSlideDirection(index > currentIndex ? "left" : "right");
                setPrevTab(activeTab);
                setActiveTab(tab.key); 
                setSearchQuery(""); 
              }}>
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab Content with Slide Animation */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div 
          key={activeTab}
          role="tabpanel" 
          id={`panel-${activeTab}`}
          style={{
            animation: `slide-${slideDirection} 0.3s ease-out`,
          }}
        >
        {activeTab === "summary" && <SummaryTab aiQuery={aiQuery} aiResponse={aiResponse} onQueryChange={setAiQuery} onSubmit={handleAiQuery} c={c} />}

        {activeTab === "medical" && (
          <>
            <div style={{ margin: "12px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><Icons.search size={16} color={c.warmGray} /></div>
                <input style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: c.cardBg, color: c.textPrimary, fontSize: 15, outline: "none", fontFamily: font, boxSizing: "border-box" }}
                  placeholder="Search observations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="Search observations" />
              </div>
              <button style={{ width: 44, height: 44, borderRadius: "50%", border: "none", backgroundColor: c.headerGreen, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                onClick={() => setShowCreateModal(true)} aria-label="New observation"><Icons.plus size={18} /></button>
            </div>
            <div style={{ padding: "0 16px 100px" }}>
              {filteredNotes.length > 0 ? filteredNotes.map((note) => (
                <MedicalNoteCard key={note.id} note={note} currentUser={user.displayName} onEdit={setEditingNote} c={c} />
              )) : (
                <div style={{ textAlign: "center", padding: 40, color: c.warmGray, fontSize: 15 }}>
                  {searchQuery ? "No observations matching your search." : "No medical observations yet."}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "behavior" && (
          <>
            <div style={{ margin: "12px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><Icons.search size={16} color={c.warmGray} /></div>
                <input style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: c.cardBg, color: c.textPrimary, fontSize: 15, outline: "none", fontFamily: font, boxSizing: "border-box" }}
                  placeholder="Search behavior notes..." value={behaviorSearchQuery} onChange={(e) => setBehaviorSearchQuery(e.target.value)} aria-label="Search behavior notes" />
              </div>
              <button style={{ width: 44, height: 44, borderRadius: "50%", border: "none", backgroundColor: c.headerGreen, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                onClick={() => setShowCreateBehaviorModal(true)} aria-label="New behavior note"><Icons.plus size={18} /></button>
            </div>
            <div style={{ padding: "0 16px 100px" }}>
              {filteredBehaviorNotes.length > 0 ? filteredBehaviorNotes.map((note) => (
                <BehaviorNoteCard key={note.id} note={note} currentUser={user.displayName} onEdit={setEditingBehaviorNote} c={c} />
              )) : (
                <div style={{ textAlign: "center", padding: 40, color: c.warmGray, fontSize: 15 }}>
                  {behaviorSearchQuery ? "No behavior notes matching your search." : "No behavior notes yet."}
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </div>

      {/* Dark/Light mode toggle */}
      <button onClick={() => setDarkMode(!darkMode)}
        style={{ position: "fixed", bottom: 24, right: 24, width: 48, height: 48, borderRadius: "50%", backgroundColor: c.headerGreen, color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 10 }}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
        {darkMode ? <Icons.sun size={22} color="#fff" /> : <Icons.moon size={22} color="#fff" />}
      </button>

      {showCreateModal && <CreateNoteModal petId={pet.petId} userName={user.displayName} userRole={user.role} onClose={() => setShowCreateModal(false)} onSubmit={handleNoteCreated} c={c} />}
      {editingNote && <EditNoteModal note={editingNote} userRole={user.role} onClose={() => setEditingNote(null)} onSave={handleNoteEdited} c={c} />}
      {showCreateBehaviorModal && <CreateBehaviorNoteModal petId={pet.petId} userName={user.displayName} onClose={() => setShowCreateBehaviorModal(false)} onSubmit={handleBehaviorNoteCreated} c={c} />}
      {editingBehaviorNote && <EditBehaviorNoteModal note={editingBehaviorNote} onClose={() => setEditingBehaviorNote(null)} onSave={handleBehaviorNoteEdited} c={c} />}
      {showQR && <QRCodeModal pet={pet} onClose={() => setShowQR(false)} c={c} />}
    </main>
  );
}

// ─── App Root ────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const c = darkMode ? themes.dark : themes.light;
  const r = useResponsive();

  useEffect(() => {
    if (user) {
      api.getPetsByLocation().then((pets) => {
        setAnimals(pets);
        if (pets.length === 1) setSelectedPetId(pets[0].petId);
      });
    }
  }, [user]);

  const handleLogout = () => { setUser(null); setSelectedPetId(null); setAnimals([]); };

  if (!user) return <LoginScreen onLogin={setUser} />;

  if (!selectedPetId && animals.length > 1) {
    return <AnimalSelection animals={animals} onSelect={setSelectedPetId} user={user} onLogout={handleLogout} c={c} />;
  }

  if (selectedPetId) {
    return <Portal user={user} petId={selectedPetId} onLogout={handleLogout} onBack={animals.length > 1 ? () => setSelectedPetId(null) : null} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  return <div style={{ fontFamily: font, maxWidth: r.containerWidth, margin: "0 auto", minHeight: "100vh", backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: c.warmGray, fontSize: 15 }}>Loading animals...</div></div>;
}
