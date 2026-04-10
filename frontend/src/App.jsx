// Oakland Animal Services Portal - Frontend
// Connects to Express backend on port 3000 via proxy (see package.json)
/**
 * Oakland Animal Services Portal - Frontend Application
 * 
 * This is the main React application for the Oakland Animal Services Portal.
 * It provides staff with real-time access to animal data, medical observations,
 * and behavior notes integrated with the RescueGroups API.
 * 
 * Key Features:
 * - QR code-based kennel navigation for quick animal lookup
 * - Direct pet ID URLs for sharing specific animal profiles
 * - Real-time medical and behavior note management with search
 * - AI-powered summary generation from animal notes
 * - Responsive design (mobile-first with desktop two-column layout)
 * - Dark mode support
 * - Sex-based coloring on pet profile
 * - Handler-level color coding (green/yellow/blue/pink)
 */

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
  alertCircle: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

// ─── Placeholder Image ───────────────────────────────────────────────────────
// Replace with actual image URLs from RescueGroups API when connected
const PLACEHOLDER_CAT = "/DogSHADOW.png";
const PLACEHOLDER_DOG = "/DogSHADOW.png";

// Strip HTML tags from API description fields for plain-text display
function stripHtml(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

// Parse weight from description text (e.g. "about 56 pounds" → "56 lbs")
function parseWeightFromDesc(desc) {
  if (!desc) return null;
  const m = desc.match(/(\d+)\s*(?:pounds?|lbs?)/i);
  return m ? `${m[1]} lbs` : null;
}

// Compute display age as "Xy Zm/o" from description age + listing date
// Parses "X year(s) old" from description, then adds months elapsed since reference date
// Prefers receivedDate (when shelter assessed the animal) over createdDate
function computeDisplayAge(desc, createdDate, receivedDate, generalAge) {
  let baseMonths = 0;
  if (desc) {
    const ym = desc.match(/(\d+)\s*year/i);
    const mm = desc.match(/(\d+)\s*month/i);
    if (ym) baseMonths += parseInt(ym[1], 10) * 12;
    if (mm) baseMonths += parseInt(mm[1], 10);
  }
  const refDate = receivedDate || createdDate;
  if (baseMonths > 0 && refDate) {
    const ref = new Date(refDate);
    if (!isNaN(ref.getTime())) {
      const now = new Date();
      const elapsedMonths = (now.getFullYear() - ref.getFullYear()) * 12 + (now.getMonth() - ref.getMonth());
      baseMonths += Math.max(0, elapsedMonths);
    }
  }
  if (baseMonths > 0) {
    const y = Math.floor(baseMonths / 12);
    const m = baseMonths % 12;
    if (y > 0 && m > 0) return `${y}y ${m}m/o`;
    if (y > 0) return `${y}y`;
    return `${m}m/o`;
  }
  return generalAge || "Unknown";
}

// Compute display age from ISO birthdate string e.g. "2023-06-01" → "2y 10m/o"
function computeAgeFromBirthdate(birthdate) {
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return "Unknown";
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months--;
  if (months <= 0) return "< 1m/o";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y > 0 && m > 0) return `${y}y ${m}m/o`;
  if (y > 0) return `${y}y`;
  return `${m}m/o`;
}

/**
 * Parse kennel location from RescueGroups summary field
 * Example: "I am at Oakland Animal Services in kennel Cat W:5" → "Cat W:5"
 * Handles foster animals specially: returns "In Foster"
 */
function parseLocationFromSummary(summary) {
  if (!summary) return "";
  const trimmed = summary.trim();
  if (trimmed.toLowerCase().includes("foster")) return "In Foster";
  const prefix = "I am at Oakland Animal Services in kennel ";
  if (trimmed.startsWith(prefix)) {
    return trimmed.slice(prefix.length).trim();
  }
  return "";
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API SERVICE LAYER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * All frontend API calls go through this `api` object. Each method connects to
 * the Express backend running on port 3000 (proxied via package.json).
 * 
 * Backend API Routes:
 * - GET /api/pets/:id                    → Individual pet details
 * - GET /api/location/:type/:location    → Pets at a kennel (for QR codes)
 * - GET /api/pets/:id/observer-notes     → Medical observations for a pet
 * - GET /api/pets/:id/behavior-notes     → Behavior notes for a pet
 * - POST /api/observer-notes             → Create new medical observation
 * - POST /api/behavior-notes             → Create new behavior note
 * - PATCH /api/observer-notes/:id        → Update medical observation
 * - PATCH /api/behavior-notes/:id        → Update behavior note
 * - POST /api/search                     → NLP-powered search across notes
 * - POST /api/ai-summary                 → AI-generated summary from notes
 * 
 * Mock data is kept minimal and only used as fallback for getPet when API fails.
 */

const mockPets = [
  { petId: "12345678910", name: "Fluffly", species: "Cat", location: "Cat W:5", arn: "736727", status: "available", imageUrl: PLACEHOLDER_CAT, handlerLevel: "green" },
  { petId: "12345678912", name: "Whiskers", species: "Cat", location: "Cat W:5", arn: "736729", status: "available", imageUrl: PLACEHOLDER_CAT, handlerLevel: "pink" },
  { petId: "12345678913", name: "Mittens", species: "Cat", location: "Cat W:5", arn: "736730", status: "available", imageUrl: PLACEHOLDER_CAT, handlerLevel: "yellow" },
];

// Shared timestamp formatter used by note cards
const formatTimestamp = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true 
    });
  } catch {
    return "";
  }
};

// Transform backend observer note shape ({ id, title, content, author, petId, timestamp })
// into frontend shape ({ id, petId, case, by, status, type, body, createdAt })
const transformObserverNote = (note, index) => ({
  id: note.id || Date.now() + index,
  petId: String(note.petId),
  case: note.title || note.case || "General Observation",
  by: note.author || note.by || "Unknown",
  status: note.status || "Raised",
  type: note.type || "medical",
  body: note.content || note.body || "",
  createdAt: note.timestamp || note.createdAt || new Date().toISOString(),
});

const api = {

  // REAL — connected to GET /api/pets/:petId
  getPet: async (petId) => {
    try {
      const res = await fetch(`/api/pets/${petId}`);
      if (!res.ok) throw new Error("Failed to fetch pet");
      const data = await res.json();
      if (data.success && data.pet) {
        const p = data.pet;
        const plainDesc = stripHtml(p.description || "");
        return {
          petId: String(p.id),
          name: p.name,
          species: p.species || "Unknown",
          location: parseLocationFromSummary(p.summary) || "",
          imageUrl: p.image || (p.species === "Cat" ? PLACEHOLDER_CAT : PLACEHOLDER_DOG),
          summary: p.summary || "",
          arn: p.rescueId || "N/A",
          handlerLevel: (p.otherNames || "green").toLowerCase(),
          status: p.status || "Unknown",
          breed: p.breed || "",
          age: p.birthdate ? computeAgeFromBirthdate(p.birthdate) : computeDisplayAge(plainDesc, p.createdDate, p.receivedDate, p.generalAge),
          sex: p.sex || "",
          description: plainDesc,
          weight: p.weightPounds || parseWeightFromDesc(plainDesc) || "Unknown",
          spayedNeutered: p.altered || "Unknown",
        };
      }
      throw new Error("Invalid response");
    } catch (err) {
      console.warn("getPet: falling back to mock data", err);
      return mockPets.find((p) => p.petId === String(petId)) || mockPets[0];
    }
  },

  // REAL — connected to GET /api/location/:petType/:location (QR code driven)
  getPetsByLocation: async (petType, location) => {
    if (!petType || !location) {
      throw new Error("Invalid location parameters");
    }
    const res = await fetch(`/api/location/${petType}/${encodeURIComponent(location)}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Location not found");
    }
    const data = await res.json();
    if (data.success && Array.isArray(data.pets)) {
      return data.pets.map((pet) => ({
        petId: String(pet.id),
        name: pet.name,
        species: pet.species || (petType === "cat" ? "Cat" : "Dog"),
        location: location,
        imageUrl: pet.image || (petType === "cat" ? PLACEHOLDER_CAT : PLACEHOLDER_DOG),
        summary: pet.summary || "",
        status: pet.status || "Unknown",
      }));
    }
    throw new Error("No animals found at this location");
  },

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
      return [];
    }
  },

  // REAL — connected to POST /api/observer-notes
  createNote: async (note) => {
    try {
      const res = await fetch("/api/observer-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: note.case,
          content: note.body,
          author: note.by,
          petId: parseInt(note.petId, 10) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to create note");
      const data = await res.json();
      if (data.success && data.observerNote) {
        return transformObserverNote({ ...data.observerNote, status: note.status }, 0);
      }
      return { ...note, id: Date.now(), createdAt: new Date().toISOString() };
    } catch (err) {
      console.warn("createNote: falling back to mock", err);
      return { ...note, id: Date.now(), createdAt: new Date().toISOString() };
    }
  },

  // REAL — connected to GET /api/pets/:petId/behavior-notes
  getBehaviorNotes: async (petId) => {
    try {
      const res = await fetch(`/api/pets/${petId}/behavior-notes`);
      if (!res.ok) throw new Error("Failed to fetch behavior notes");
      const data = await res.json();
      if (data.success && Array.isArray(data.behaviorNotes)) {
        return data.behaviorNotes.map((note, i) => ({
          id: note.id || Date.now() + i,
          petId: String(note.petId),
          case: note.title || note.case || "Behavior Observation",
          by: note.author || "Unknown",
          body: note.content || "",
          createdAt: note.timestamp || new Date().toISOString(),
        }));
      }
      return [];
    } catch (err) {
      console.warn("getBehaviorNotes: falling back to mock data", err);
      return [];
    }
  },

  // REAL — connected to POST /api/behavior-notes
  createBehaviorNote: async (note) => {
    try {
      const res = await fetch("/api/behavior-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: note.case,
          content: note.body,
          author: note.by,
          petId: parseInt(note.petId, 10) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to create behavior note");
      const data = await res.json();
      if (data.success && data.behaviorNote) {
        return {
          id: data.behaviorNote.id || Date.now(),
          petId: String(data.behaviorNote.petId),
          case: data.behaviorNote.title || note.case,
          by: data.behaviorNote.author || note.by,
          body: data.behaviorNote.content || note.body,
          createdAt: data.behaviorNote.timestamp || new Date().toISOString(),
        };
      }
      return { ...note, id: Date.now(), createdAt: new Date().toISOString() };
    } catch (err) {
      console.warn("createBehaviorNote: falling back to mock", err);
      return { ...note, id: Date.now(), createdAt: new Date().toISOString() };
    }
  },

  // REAL — connected to POST /api/search (NLP keyword search on observer notes)
  // Note: Medical tab search uses handleMedicalSearch() which calls this endpoint
  // directly with debouncing. This method is available for programmatic use.
  searchNotes: async (query, petId) => {
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, petId: petId ? parseInt(petId, 10) : undefined, maxResults: 20 }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        return data.results.map((r) => ({
          ...transformObserverNote(r.observerNote, 0),
          highlightedBody: r.highlightedContent || "",
          matchCount: r.matchCount || 0,
        }));
      }
      return [];
    } catch (err) {
      console.warn("searchNotes: falling back to local filter", err);
      return null;
    }
  },

  // REAL — connected to POST /api/pets/:petId/behavior-notes/summarize
  // Uses OpenAI GPT-4o-mini to generate AI summaries from behavior notes
  getSummary: async (petId, prompt) => {
    try {
      const res = await fetch(`/api/pets/${petId}/behavior-notes/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt || "Summarize the note data in 2-5 concise sentences" }),
      });
      if (!res.ok) throw new Error("AI summary failed");
      const data = await res.json();
      if (data.success && data.summary) {
        return data.summary;
      }
      return "Unable to generate summary. Please try again.";
    } catch (err) {
      console.error("getSummary error:", err);
      return "AI service is currently unavailable. Please check your API key configuration.";
    }
  },

  getAllAnimals: async () => {
    try {
      const res = await fetch("/api/animals/all");
      if (!res.ok) throw new Error("Failed to fetch animals");
      const data = await res.json();
      if (data.success && Array.isArray(data.animals)) return data.animals;
      throw new Error("Invalid response");
    } catch (err) {
      console.error("getAllAnimals error:", err);
      return null;
    }
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THEME & STYLING
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Light and dark mode color palettes
const themes = {
  light: {
    headerGreen: "#2d5a27",    // Oakland Animal Services brand green
    tabActiveBg: "#d4edda",    // Active tab background (light green)
    brickRed: "#BE3A2B",       // Alert/raised status color
    warmGray: "#666666",       // Secondary text and labels
    statusRaised: "#BE3A2B",   // Medical issue raised (red)
    statusResolved: "#2d7a24", // Medical issue resolved (green)
    bg: "#f2f2f2",             // Page background
    cardBg: "#ffffff",         // Card background
    cardBorder: "#cccccc",     // Card borders
    textPrimary: "#1a1a1a",    // Primary text
    textSecondary: "#333333",  // Secondary text
    inputBg: "#f7f7f7",        // Input field background
    inputBorder: "#bbb",       // Input field border
    shadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  dark: {
    headerGreen: "#2d5a27",
    tabActiveBg: "#1e3d1a",
    brickRed: "#E04B3A",
    warmGray: "#aaaaaa",
    statusRaised: "#E04B3A",
    statusResolved: "#4CAF50",
    bg: "#1a1a1a",
    cardBg: "#2a2a2a",
    cardBorder: "#3a3a3a",
    textPrimary: "#f0f0f0",
    textSecondary: "#d0d0d0",
    inputBg: "#333333",
    inputBorder: "#555555",
    shadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
};

const font = "'Poppins', sans-serif";

/**
 * Handler level colors indicate how experienced a handler should be to work with the animal
 * Mapped from RescueGroups API animalOthernames field
 * - Green: Any handler (gentle, easy)
 * - Yellow: Experienced handler recommended
 * - Blue: Specialized handling required
 * - Pink: Extra caution/specialized protocols
 */
const HANDLER_LEVEL_COLORS = {
  green: "#4CAF50",
  yellow: "#FFC107",
  blue: "#2196F3",
  pink: "#E91E63",
};

// ─── Levenshtein Distance ─────────────────────────────────────────────────────
// Used by both HighlightedText (fuzzy highlighting) and fuzzyMatchText (local filter).
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => j === 0 ? i : 0));
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

// ─── Highlighted Text Component ──────────────────────────────────────────────
// Priority 1: backend <b> tags (exact positions from NLP fuzzy search)
// Priority 2: client-side fuzzy word highlighting (tolerates typos via Levenshtein)
// Priority 3: plain text
function HighlightedText({ text, searchQuery, highlightColor = "#FFEB3B" }) {
  // Backend returned pre-highlighted content with <b> tags — render those
  if (text && text.includes("<b>")) {
    const parts = text.split(/(<b>.*?<\/b>)/g);
    return (
      <span>
        {parts.map((part, i) => {
          if (part.startsWith("<b>") && part.endsWith("</b>")) {
            const inner = part.slice(3, -4);
            return <mark key={i} style={{ backgroundColor: highlightColor, padding: "0 1px", borderRadius: 2 }}>{inner}</mark>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  }

  // Client-side fuzzy highlighting: split text into word/non-word tokens,
  // highlight any word that fuzzy-matches a query word (handles typos).
  if (searchQuery && searchQuery.trim() && text) {
    const queryWords = searchQuery.toLowerCase().split(/\W+/).filter(Boolean);
    // Split text into alternating [word, non-word] segments preserving original case
    const segments = text.split(/(\w+)/);
    return (
      <span>
        {segments.map((seg, i) => {
          if (!/\w+/.test(seg)) return <span key={i}>{seg}</span>;
          const segLower = seg.toLowerCase();
          const isMatch = queryWords.some((qw) => {
            if (segLower.includes(qw) || qw.includes(segLower)) return true;
            const maxDist = Math.max(1, Math.floor(Math.max(qw.length, segLower.length) * 0.25));
            // Only fuzzy-match if lengths are close enough to be plausible typos
            if (Math.abs(qw.length - segLower.length) > maxDist) return false;
            return levenshtein(segLower, qw) <= maxDist;
          });
          return isMatch
            ? <mark key={i} style={{ backgroundColor: highlightColor, padding: "0 1px", borderRadius: 2 }}>{seg}</mark>
            : <span key={i}>{seg}</span>;
        })}
      </span>
    );
  }

  return <span>{text}</span>;
}

// ─── Fuzzy Match Helper ───────────────────────────────────────────────────────
// Returns true if every query word either appears as a substring or is within
// ~25% edit distance of any word in the text (tolerates 1 typo in short words).
function fuzzyMatchText(text, query) {
  if (!text || !query) return false;
  const textLower = text.toLowerCase();
  const textWords = textLower.split(/\W+/).filter(Boolean);
  const queryWords = query.toLowerCase().split(/\W+/).filter(Boolean);
  return queryWords.every((qw) => {
    if (textLower.includes(qw)) return true;
    const maxDist = Math.max(1, Math.floor(qw.length * 0.25));
    return textWords.some((tw) => levenshtein(tw, qw) <= maxDist);
  });
}

// ─── Error Screen ────────────────────────────────────────────────────────────
// Shown when a kennel location URL is invalid or returns no animals
function ErrorScreen({ error, onLogout, c }) {
  const r = useResponsive();
  return (
    <main id="main-content" style={{ fontFamily: font, maxWidth: r.containerWidth, margin: "0 auto", minHeight: "100vh", backgroundColor: c.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: r.padding }}>
      <div style={{ textAlign: "center", maxWidth: 500 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: c.cardBg, border: `2px solid ${c.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <Icons.alertCircle size={40} color={c.brickRed} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: c.textPrimary, marginBottom: 12 }}>Location Not Found</h1>
        <p style={{ fontSize: 16, color: c.warmGray, lineHeight: 1.6, marginBottom: 32 }}>
          {error || "The kennel location in this URL does not exist or has no animals currently assigned."}
        </p>
        <p style={{ fontSize: 14, color: c.textSecondary, marginBottom: 24, padding: "12px 20px", backgroundColor: c.inputBg, borderRadius: 8, border: `1px solid ${c.cardBorder}` }}>
          Please verify the QR code URL or contact your administrator if you believe this is an error.
        </p>
        <button 
          onClick={onLogout}
          style={{ 
            padding: "12px 32px", 
            borderRadius: 12, 
            border: "none", 
            backgroundColor: c.headerGreen, 
            color: "#fff", 
            fontSize: 15, 
            fontWeight: 600, 
            cursor: "pointer", 
            fontFamily: font,
            transition: "opacity 0.2s ease"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          Return to Login
        </button>
      </div>
    </main>
  );
}

// ─── Animal Selection Screen ─────────────────────────────────────────────────
// Only shown when multiple animals share the same kennel location.
// Current = Available or Foster (or unknown — can't confirm otherwise)
// Past = anything explicitly non-available: Not Available, Adopted, Deceased, Hold, etc.
const CURRENT_STATUSES = new Set(["available", "foster"]);
const isCurrentAnimal = (pet) => {
  const s = (pet.status || "").toLowerCase().trim();
  if (!s || s === "unknown") return true; // status not fetched yet — default to current
  return CURRENT_STATUSES.has(s);
};

// If a QR code URL leads to a kennel with 1 animal, this screen is skipped.
function AnimalSelection({ animals, onSelect, user, onLogout, onBack, darkMode, setDarkMode, c }) {
  const r = useResponsive();
  const isDesktop = r.width >= 768;
  const location = animals[0]?.location || "";
  const maxWidth = isDesktop ? 860 : 480;

  const currentAnimals = animals.filter(isCurrentAnimal);
  const pastAnimals = animals.filter((p) => !isCurrentAnimal(p));
  const [tab, setTab] = useState("current");
  const displayed = tab === "current" ? currentAnimals : pastAnimals;

  const imgSize = isDesktop ? 72 : 64;

  return (
    <main id="main-content" style={{ fontFamily: font, minHeight: "100vh", backgroundColor: c.bg }}>

      {/* Top Bar */}
      <header style={{
        display: "flex", alignItems: "center",
        padding: isDesktop ? "14px 28px" : "10px 12px",
        borderBottom: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg,
      }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: isDesktop ? 12 : 4 }}>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, minHeight: 44, minWidth: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, transition: "background-color 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.inputBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            aria-label="Back to home">
            <Icons.back size={isDesktop ? 22 : 20} color={c.textSecondary} />
          </button>
          <UserDropdown user={user} onLogout={onLogout} c={c} compact={!isDesktop} />
        </div>
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" style={{ height: isDesktop ? 40 : 32, objectFit: "contain" }} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          {setDarkMode && (
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{ background: "none", border: `1px solid ${c.cardBorder}`, cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 40, minWidth: 40, transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.inputBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color={c.textSecondary} />}
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth, margin: "0 auto", padding: isDesktop ? "32px 28px" : "20px 16px" }}>
        {/* Heading */}
        <div style={{ marginBottom: isDesktop ? 20 : 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.warmGray, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Location</div>
          <h2 style={{ fontSize: isDesktop ? 26 : 20, fontWeight: 700, color: c.textPrimary, margin: 0 }}>
            Select an Animal: <span style={{ color: c.headerGreen }}>{location}</span>
          </h2>
        </div>

        {/* Current / Past tabs — same style as Medical/Behavior tabs */}
        <nav style={{ display: "flex", marginBottom: isDesktop ? 24 : 16, backgroundColor: c.cardBg, borderRadius: 12, padding: 3, border: `1px solid ${c.cardBorder}` }}>
          {[{ key: "current", label: "Current", count: currentAnimals.length }, { key: "past", label: "Past", count: pastAnimals.length }].map(({ key, label, count }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)} style={{
                flex: 1, padding: "10px 6px", fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? (darkMode ? "#8eff8e" : c.headerGreen) : c.warmGray,
                backgroundColor: active ? c.tabActiveBg : "transparent",
                border: "none", borderRadius: 10, cursor: "pointer",
                transition: "all 0.2s ease", fontFamily: font, minHeight: 44,
              }}>
                {label} ({count})
              </button>
            );
          })}
        </nav>

        {/* Empty state */}
        {displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: c.warmGray, fontSize: 15, backgroundColor: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}` }}>
            {tab === "current" ? "No animals currently assigned to this kennel." : "No past animals found at this location."}
          </div>
        )}

        {/* Animal list — 2-col grid on desktop */}
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: isDesktop ? 14 : 10 }}>
          {displayed.map((pet) => (
            <button key={pet.petId} onClick={() => onSelect(pet.petId)}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: isDesktop ? 18 : 14,
                backgroundColor: c.cardBg, borderRadius: 14, border: `1px solid ${c.cardBorder}`,
                cursor: "pointer", fontFamily: font, textAlign: "left", width: "100%",
                boxShadow: c.shadow, transition: "transform 0.15s, box-shadow 0.15s", minHeight: 44,
                opacity: tab === "past" ? 0.75 : 1,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)"; e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = c.shadow; e.currentTarget.style.opacity = tab === "past" ? "0.75" : "1"; }}
              aria-label={`View ${pet.name}'s profile`}
            >
              <img
                src={pet.imageUrl}
                alt={pet.name}
                style={{ width: imgSize, height: imgSize, borderRadius: 10, objectFit: "cover", border: `1px solid ${c.cardBorder}`, flexShrink: 0 }}
                onError={(e) => { e.target.src = pet.species === "Cat" ? PLACEHOLDER_CAT : PLACEHOLDER_DOG; }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: isDesktop ? 17 : 16, fontWeight: 600, color: c.textPrimary, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pet.name}</div>
                <div style={{ fontSize: 13, color: c.textSecondary }}>ID: {pet.petId}</div>
                <div style={{ fontSize: 12, color: c.warmGray, marginTop: 2, textTransform: "capitalize" }}>
                  {pet.species}
                  {tab === "past" && pet.status && pet.status !== "Unknown" && (
                    <span style={{ marginLeft: 6, color: c.brickRed, fontWeight: 600 }}>· {pet.status}</span>
                  )}
                </div>
              </div>
              <Icons.arrowRight size={18} color={c.warmGray} />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── User Dropdown ───────────────────────────────────────────────────────────
function UserDropdown({ user, onLogout, c, compact = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: compact ? 0 : 6, fontSize: 14, color: c.textSecondary, background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: font, minHeight: 44 }} aria-label="User menu" aria-expanded={open}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: c.cardBorder, display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.user size={16} color={c.textSecondary} /></div>
        {!compact && <span style={{ fontWeight: 500 }}>{user.displayName}</span>}
        {!compact && <Icons.chevron size={14} color={c.warmGray} down={!open} />}
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
  const isMedical = userRole === "medical";
  const handleSave = () => { onSave({ ...note, ...(isMedical ? {} : { body, case: caseName }), ...(isMedical ? { status } : {}) }); onClose(); };
  const fieldStyle = { width: "100%", padding: "12px 14px", marginBottom: 12, borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg, color: c.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: font };
  const readOnlyFieldStyle = { ...fieldStyle, backgroundColor: c.cardBorder, cursor: "not-allowed", opacity: 0.6 };
  const labelStyle = { fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" };
  
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit medical observation">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380, maxHeight: "80vh", overflow: "auto", fontFamily: font }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: c.textPrimary }}>Edit Medical Observation</h2>
        <label style={labelStyle}>Case Title</label>
        <input style={isMedical ? readOnlyFieldStyle : fieldStyle} value={caseName} onChange={(e) => !isMedical && setCaseName(e.target.value)} disabled={isMedical} aria-label="Case title" />
        {isMedical && (<><label style={labelStyle}>Status</label><select style={fieldStyle} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="Raised">Raised</option><option value="Resolved">Resolved</option></select></>)}
        <label style={labelStyle}>Notes</label>
        <textarea style={{ ...(isMedical ? readOnlyFieldStyle : fieldStyle), minHeight: 120, resize: "vertical" }} value={body} onChange={(e) => !isMedical && setBody(e.target.value)} disabled={isMedical} aria-label="Observation notes" />
        {isMedical && <div style={{ fontSize: 12, color: c.warmGray, fontStyle: "italic", marginTop: -8, marginBottom: 8 }}>Medical staff can only update status</div>}
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
function MedicalNoteCard({ note, currentUser, userRole, onEdit, c, searchQuery }) {
  const isOwner = note.by === currentUser;
  const canEdit = isOwner || userRole === "medical";
  const [hovered, setHovered] = useState(false);
  
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
            <HighlightedText text={note.highlightedCase || note.case} searchQuery={searchQuery} />
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
      
      {/* Body content - highlights matched keywords when searching */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: c.textSecondary, flex: 1, margin: 0 }}>
          <HighlightedText text={note.highlightedBody || note.body} searchQuery={searchQuery} />
        </p>
        {canEdit && (
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
function BehaviorNoteCard({ note, currentUser, userRole, onEdit, c, searchQuery }) {
  const isOwner = note.by === currentUser;
  const canEdit = isOwner && userRole !== "medical";
  const [hovered, setHovered] = useState(false);
  
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
          <HighlightedText text={note.body} searchQuery={searchQuery} />
        </p>
        {canEdit && (
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

// ─── Desktop Portal (iPad/Desktop two-column layout, width >= 768px) ─────────
function DesktopPortal({
  user, pet, notes: _notes, behaviorNotes: _behaviorNotes,
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
  c,
}) {
  const [descExpanded, setDescExpanded] = useState(false);

  const tabs = [
    { key: "medical", label: "Medical Observations" },
    { key: "behavior", label: "Behavior Notes" },
    { key: "summary", label: "AI Summary" },
  ];

  return (
    <main role="main" aria-label={`${pet.name} details`} style={{ fontFamily: font, minHeight: "100vh", backgroundColor: c.bg, position: "relative" }}>

      {/* Top Bar */}
      <header role="banner" style={{ display: "flex", alignItems: "center", padding: "14px 28px", borderBottom: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
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
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" style={{ height: 40, objectFit: "contain" }} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: `1px solid ${c.cardBorder}`, cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 40, minWidth: 40, transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.inputBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color={c.textSecondary} />}
          </button>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div style={{ display: "flex", gap: 24, padding: "24px 28px", alignItems: "flex-start" }}>

        {/* LEFT COLUMN: Pet Profile */}
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
              {pet.status && (() => {
                const isAvail = CURRENT_STATUSES.has((pet.status || "").toLowerCase().trim());
                const color = isAvail ? c.statusResolved : c.brickRed;
                return (
                  <span style={{
                    fontSize: 13, fontWeight: 600, color,
                    backgroundColor: `${color}15`, padding: "5px 14px",
                    borderRadius: 20, border: `1px solid ${color}30`,
                    textTransform: "capitalize"
                  }}>
                    {pet.status}
                  </span>
                );
              })()}
            </div>

            {/* Description with Read More/Less */}
            {pet.description && (
              <div style={{ marginBottom: 20 }}>
                <p style={{
                  fontSize: 14, lineHeight: 1.6, color: c.textSecondary, margin: 0,
                  ...(!descExpanded ? { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } : {}),
                }}>
                  {pet.description}
                </p>
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  aria-expanded={descExpanded}
                  style={{
                    background: "none", border: "none", padding: 0, marginTop: 6,
                    color: c.headerGreen, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: font,
                  }}>
                  {descExpanded ? "Show Less" : "Read More"}
                </button>
              </div>
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
              ].filter(d => d.value).map((stat, i, arr) => {
                const getSexColor = () => {
                  if (stat.label !== "Sex") return c.textPrimary;
                  const sex = stat.value?.toLowerCase();
                  if (sex === "female") return darkMode ? "#ff6bb5" : "#d946a6";
                  if (sex === "male") return darkMode ? "#60b5ff" : "#1d72d8";
                  return c.textPrimary;
                };
                return (
                  <div key={stat.label} style={{
                    padding: "12px 10px", textAlign: "center",
                    borderRight: i % 2 === 0 ? `1px solid ${c.cardBorder}` : "none",
                    borderBottom: i < arr.length - 2 ? `1px solid ${c.cardBorder}` : "none",
                    backgroundColor: c.inputBg,
                  }}>
                    <div style={{ fontSize: 10, color: c.warmGray, marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</div>
                    <div style={{ fontSize: 13, color: getSexColor(), fontWeight: 600 }}>{stat.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Detail Grid - 2x2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: `1px solid ${c.cardBorder}` }}>
              {[
                { label: "ACR", value: pet.arn },
                { label: "Location", value: pet.location },
                { label: "Animal ID", value: pet.petId },
                { label: "Handler Level", value: (pet.handlerLevel || "green").toUpperCase(), color: HANDLER_LEVEL_COLORS[pet.handlerLevel || "green"] },
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

        {/* RIGHT COLUMN: Tabs + Content */}
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
                  id={`desktop-tab-${tab.key}`} aria-controls={`desktop-panel-${tab.key}`}
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
                  }}
                  onKeyDown={(e) => {
                    const idx = tabs.findIndex(t => t.key === tab.key);
                    if (e.key === "ArrowRight") { e.preventDefault(); const next = tabs[(idx + 1) % tabs.length]; setActiveTab(next.key); document.getElementById(`desktop-tab-${next.key}`)?.focus(); }
                    if (e.key === "ArrowLeft") { e.preventDefault(); const prev = tabs[(idx - 1 + tabs.length) % tabs.length]; setActiveTab(prev.key); document.getElementById(`desktop-tab-${prev.key}`)?.focus(); }
                  }}>
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Medical Observations Tab */}
          {activeTab === "medical" && (
            <div role="tabpanel" id="desktop-panel-medical" aria-labelledby="desktop-tab-medical">
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

          {/* Behavior Notes Tab */}
          {activeTab === "behavior" && (
            <div role="tabpanel" id="desktop-panel-behavior" aria-labelledby="desktop-tab-behavior">
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

          {/* AI Summary Tab */}
          {activeTab === "summary" && (
            <div role="tabpanel" id="desktop-panel-summary" aria-labelledby="desktop-tab-summary" style={{ backgroundColor: c.cardBg, borderRadius: 12, padding: 24, border: `1px solid ${c.cardBorder}`, boxShadow: c.shadow }}>
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

      {/* Modals */}
      {showCreateModal && <CreateNoteModal petId={pet.petId} userName={user.displayName} userRole={user.role} onClose={() => setShowCreateModal(false)} onSubmit={handleNoteCreated} c={c} />}
      {editingNote && <EditNoteModal note={editingNote} userRole={user.role} onClose={() => setEditingNote(null)} onSave={handleNoteEdited} c={c} />}
      {showCreateBehaviorModal && <CreateBehaviorNoteModal petId={pet.petId} userName={user.displayName} onClose={() => setShowCreateBehaviorModal(false)} onSubmit={handleBehaviorNoteCreated} c={c} />}
      {editingBehaviorNote && <EditBehaviorNoteModal note={editingBehaviorNote} onClose={() => setEditingBehaviorNote(null)} onSave={handleBehaviorNoteEdited} c={c} />}
    </main>
  );
}

// ─── Main Portal ─────────────────────────────────────────────────────────────
// The main animal detail view with tabs: Summary (AI), Medical Observations, Behavior Notes.
// Medical search uses backend NLP-powered search with keyword highlighting.
// Behavior search uses client-side filtering with text highlighting.

function Portal({ user, petId, onLogout, onBack, darkMode, setDarkMode }) {
  const c = darkMode ? themes.dark : themes.light;
  const r = useResponsive();
  const [pet, setPet] = useState(null);
  const [notes, setNotes] = useState([]);
  const [behaviorNotes, setBehaviorNotes] = useState([]);
  const [activeTab, setActiveTab] = useState("summary");
  const [, setPrevTab] = useState("summary");
  const [slideDirection, setSlideDirection] = useState("right");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateBehaviorModal, setShowCreateBehaviorModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editingBehaviorNote, setEditingBehaviorNote] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [behaviorSearchQuery, setBehaviorSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null); // Backend search results with highlighting
  const [isSearching, setIsSearching] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(true);
  const [medicalNotesVisible, setMedicalNotesVisible] = useState(5);
  const [behaviorNotesVisible, setBehaviorNotesVisible] = useState(5);
  const [expanded, setExpanded] = useState(false);
  const searchTimerRef = useRef(null);
  
  const NOTES_PER_PAGE = 5;

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

  // Backend-powered search for medical notes with keyword highlighting
  const handleMedicalSearch = useCallback((query) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, petId: parseInt(petId, 10) || 0, maxResults: 50 }),
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          // Map backend results, cross-referencing existing notes to preserve case titles
          const mapped = data.results.map((r) => {
            const backendNote = transformObserverNote(r.observerNote, 0);
            // Find the original note in state to keep frontend-only fields (case, status)
            const existing = notes.find((n) => n.id === backendNote.id);
            return {
              ...backendNote,
              case: existing?.case || backendNote.case,
              status: existing?.status || backendNote.status,
              highlightedBody: r.highlightedContent || "",
              highlightedCase: r.highlightedTitle || "",
              matchCount: r.matchCount || 0,
            };
          });
          // If backend NLP returned no results, fall back to local substring filter
          // so partial queries like "energ" still match "energetic"
          setSearchResults(mapped.length > 0 ? mapped : null);
        }
      } catch (err) {
        console.warn("Backend search failed, falling back to local filter", err);
        setSearchResults(null);
      }
      setIsSearching(false);
    }, 300);
  }, [petId, notes]);

  const handleNoteCreated = (n) => setNotes((prev) => [n, ...prev]);
  const handleNoteEdited = (n) => setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
  const handleBehaviorNoteCreated = (n) => setBehaviorNotes((prev) => [n, ...prev]);
  const handleBehaviorNoteEdited = (n) => setBehaviorNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
  
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

  // Use backend search results when available, otherwise fuzzy local filter as fallback
  const filteredNotes = searchResults !== null
    ? searchResults
    : notes.filter((n) => {
        if (!searchQuery.trim()) return true;
        return fuzzyMatchText(n.body || "", searchQuery) ||
               fuzzyMatchText(n.case || "", searchQuery) ||
               fuzzyMatchText(n.by || "", searchQuery);
      });
  
  // Client-side filtering + highlighting for behavior notes
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

  // Desktop/iPad two-column layout (width >= 768px)
  if (r.width >= 768) {
    return <DesktopPortal
      user={user} pet={pet} notes={notes} behaviorNotes={behaviorNotes}
      filteredNotes={filteredNotes} filteredBehaviorNotes={filteredBehaviorNotes}
      activeTab={activeTab} setActiveTab={setActiveTab}
      searchQuery={searchQuery} handleMedicalSearch={handleMedicalSearch}
      behaviorSearchQuery={behaviorSearchQuery} setBehaviorSearchQuery={setBehaviorSearchQuery}
      isSearching={isSearching}
      aiQuery={aiQuery} setAiQuery={setAiQuery} aiResponse={aiResponse} handleAiQuery={handleAiQuery}
      medicalNotesVisible={medicalNotesVisible} setMedicalNotesVisible={setMedicalNotesVisible}
      behaviorNotesVisible={behaviorNotesVisible} setBehaviorNotesVisible={setBehaviorNotesVisible}
      NOTES_PER_PAGE={NOTES_PER_PAGE}
      showCreateModal={showCreateModal} setShowCreateModal={setShowCreateModal}
      showCreateBehaviorModal={showCreateBehaviorModal} setShowCreateBehaviorModal={setShowCreateBehaviorModal}
      editingNote={editingNote} setEditingNote={setEditingNote}
      editingBehaviorNote={editingBehaviorNote} setEditingBehaviorNote={setEditingBehaviorNote}
      handleNoteCreated={handleNoteCreated} handleNoteEdited={handleNoteEdited}
      handleBehaviorNoteCreated={handleBehaviorNoteCreated} handleBehaviorNoteEdited={handleBehaviorNoteEdited}
      onBack={onBack} onLogout={onLogout}
      darkMode={darkMode} setDarkMode={setDarkMode}
      c={c} r={r}
    />;
  }

  // Phone layout (< 768px) — unchanged
  return (
    <main id="main-content" style={{ fontFamily: font, maxWidth: r.containerWidth, margin: "0 auto", minHeight: "100vh", backgroundColor: c.bg, position: "relative" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, minHeight: 44, minWidth: 44, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Back to animal list">
              <Icons.back size={20} color={c.textSecondary} />
            </button>
          )}
          <UserDropdown user={user} onLogout={onLogout} c={c} />
        </div>
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" style={{ height: 36, objectFit: "contain" }} />
      </div>

      {/* Pet Card */}
      <div style={{ margin: "12px 16px", backgroundColor: c.cardBg, borderRadius: 16, border: `1px solid ${c.cardBorder}`, boxShadow: c.shadow }}>
        <div style={{ padding: r.isPhone ? 18 : 24, display: "flex", gap: r.isPhone ? 16 : 20, alignItems: "flex-start" }}>
          {/* Pet Image - LEFT */}
          <img style={{ width: r.isPhone ? 130 : 160, height: r.isPhone ? 130 : 160, borderRadius: 12, objectFit: "cover", border: `2px solid ${c.cardBorder}`, flexShrink: 0 }} src={pet.imageUrl} alt={`Photo of ${pet.name}`}
            onError={(e) => { e.target.src = pet.species === "Cat" ? PLACEHOLDER_CAT : PLACEHOLDER_DOG; }} />
          
          {/* Details - RIGHT */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
            {/* Name with Handler Level */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <HandlerLevelIndicator level={pet.handlerLevel || "green"} />
              <h2 style={{ fontSize: r.isPhone ? 20 : 24, fontWeight: 700, color: c.textPrimary, margin: 0 }}>{pet.name}</h2>
            </div>
            
            {/* Pet Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: r.isPhone ? 14 : 15, lineHeight: 1.5 }}>
                <span style={{ color: c.textSecondary, fontWeight: 600 }}>Animal ID: </span>
                <span style={{ color: c.textPrimary }}>{pet.petId}</span>
              </div>
              
              <div style={{ fontSize: r.isPhone ? 14 : 15, lineHeight: 1.5 }}>
                <span style={{ color: c.textSecondary, fontWeight: 600 }}>Location: </span>
                <span style={{ color: c.textPrimary }}>{pet.location}</span>
              </div>
              
              <div style={{ fontSize: r.isPhone ? 14 : 15, lineHeight: 1.5 }}>
                <span style={{ color: c.textSecondary, fontWeight: 600 }}>ACR: </span>
                <span style={{ color: c.textPrimary }}>{pet.arn || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable More Details Section */}
        <div style={{ 
          maxHeight: expanded ? 400 : 0, 
          overflow: "hidden", 
          transition: "max-height 0.35s ease, opacity 0.3s ease", 
          opacity: expanded ? 1 : 0 
        }}>
          <div style={{ padding: "0 16px 4px" }}>
            {/* 2x3 Grid: Sex, Age, Breed, Species, Neutered, Weight */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              borderRadius: 10, 
              border: `1px solid ${c.cardBorder}`, 
              overflow: "hidden",
              marginBottom: 10
            }}>
              {[
                { label: "Sex", value: pet.sex },
                { label: "Age", value: pet.age },
                { label: "Breed", value: pet.breed },
                { label: "Species", value: pet.species },
                { label: "Neutered", value: pet.spayedNeutered || "Unknown" },
                { label: "Weight", value: pet.weight || "N/A" },
              ].map((item, i, arr) => (
                <div key={item.label} style={{
                  padding: "12px 10px",
                  textAlign: "center",
                  borderRight: i % 2 === 0 ? `1px solid ${c.cardBorder}` : "none",
                  borderBottom: i < arr.length - 2 ? `1px solid ${c.cardBorder}` : "none",
                  backgroundColor: c.inputBg,
                }}>
                  <div style={{ fontSize: 10, color: c.warmGray, marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: c.textPrimary, fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* 2x2 Grid: Handler, Location, ACR, Animal ID */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              borderRadius: 10, 
              border: `1px solid ${c.cardBorder}`, 
              overflow: "hidden"
            }}>
              {[
                { label: "Handler Level", value: (pet.handlerLevel || "green").toUpperCase(), special: true },
                { label: "Location", value: pet.location },
                { label: "ACR", value: pet.arn || "N/A" },
                { label: "Animal ID", value: pet.petId },
              ].map((item, i) => (
                <div key={item.label} style={{
                  padding: "12px 10px",
                  textAlign: "center",
                  borderRight: i % 2 === 0 ? `1px solid ${c.cardBorder}` : "none",
                  borderBottom: i < 2 ? `1px solid ${c.cardBorder}` : "none",
                  backgroundColor: c.cardBg,
                }}>
                  <div style={{ fontSize: 10, color: c.warmGray, marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</div>
                  {item.special ? (
                    <span style={{ 
                      backgroundColor: HANDLER_LEVEL_COLORS[pet.handlerLevel || "green"], 
                      color: "#fff", 
                      padding: "2px 8px", 
                      borderRadius: 4, 
                      fontSize: 13, 
                      fontWeight: 600,
                      display: "inline-block"
                    }}>{item.value}</span>
                  ) : (
                    <div style={{ fontSize: 13, color: c.textPrimary, fontWeight: 600 }}>{item.value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: "100%",
            padding: "14px 16px",
            marginTop: expanded ? 12 : 0,
            background: "none",
            border: "none",
            borderTop: `1px solid ${c.cardBorder}`,
            color: c.headerGreen,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: font,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.2s ease"
          }}
          aria-expanded={expanded}
          aria-label={expanded ? "Show less details" : "Show more details"}
        >
          {expanded ? "Less Details" : "More Details"}
          <div style={{ 
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)", 
            transition: "transform 0.3s ease",
            display: "flex",
            alignItems: "center"
          }}>
            <Icons.chevron size={16} color={c.headerGreen} down={true} />
          </div>
        </button>
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
                setSearchResults(null);
                setBehaviorSearchQuery("");
                setMedicalNotesVisible(NOTES_PER_PAGE);
                setBehaviorNotesVisible(NOTES_PER_PAGE);
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
                  placeholder="Search observations..." value={searchQuery} onChange={(e) => handleMedicalSearch(e.target.value)} aria-label="Search observations" />
              </div>
              <button style={{ width: 44, height: 44, borderRadius: "50%", border: "none", backgroundColor: c.headerGreen, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                onClick={() => setShowCreateModal(true)} aria-label="New observation"><Icons.plus size={18} /></button>
            </div>
            <div style={{ padding: "0 16px 100px", position: "relative" }}>
              {filteredNotes.length > 0 ? (
                <>
                  {filteredNotes.slice(0, medicalNotesVisible).map((note) => (
                    <MedicalNoteCard key={note.id} note={note} currentUser={user.displayName} userRole={user.role} onEdit={setEditingNote} c={c} searchQuery={searchQuery} />
                  ))}
                  {filteredNotes.length > medicalNotesVisible && (
                    <div style={{ position: "relative", marginTop: -60, paddingTop: 60 }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to bottom, transparent, ${c.bg})`, pointerEvents: "none" }} />
                      <div style={{ position: "relative", zIndex: 2, textAlign: "center", paddingTop: 20 }}>
                        <button 
                          onClick={() => setMedicalNotesVisible(prev => prev + NOTES_PER_PAGE)}
                          style={{ 
                            background: "none", 
                            border: "none", 
                            color: c.textPrimary, 
                            fontSize: 15, 
                            fontWeight: 600, 
                            cursor: "pointer", 
                            fontFamily: font,
                            transition: "opacity 0.2s ease",
                            padding: "8px 16px"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                          aria-label="Load more observations"
                        >
                          Load More ({filteredNotes.length - medicalNotesVisible} remaining)
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
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
            <div style={{ padding: "0 16px 100px", position: "relative" }}>
              {filteredBehaviorNotes.length > 0 ? (
                <>
                  {filteredBehaviorNotes.slice(0, behaviorNotesVisible).map((note) => (
                    <BehaviorNoteCard key={note.id} note={note} currentUser={user.displayName} userRole={user.role} onEdit={setEditingBehaviorNote} c={c} searchQuery={behaviorSearchQuery} />
                  ))}
                  {filteredBehaviorNotes.length > behaviorNotesVisible && (
                    <div style={{ position: "relative", marginTop: -60, paddingTop: 60 }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to bottom, transparent, ${c.bg})`, pointerEvents: "none" }} />
                      <div style={{ position: "relative", zIndex: 2, textAlign: "center", paddingTop: 20 }}>
                        <button 
                          onClick={() => setBehaviorNotesVisible(prev => prev + NOTES_PER_PAGE)}
                          style={{ 
                            background: "none", 
                            border: "none", 
                            color: c.textPrimary, 
                            fontSize: 15, 
                            fontWeight: 600, 
                            cursor: "pointer", 
                            fontFamily: font,
                            transition: "opacity 0.2s ease",
                            padding: "8px 16px"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                          aria-label="Load more behavior notes"
                        >
                          Load More ({filteredBehaviorNotes.length - behaviorNotesVisible} remaining)
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 40, color: c.warmGray, fontSize: 15 }}>
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
        <button onClick={() => setDarkMode(!darkMode)}
          style={{ position: "fixed", bottom: 24, right: 24, width: 48, height: 48, borderRadius: "50%", backgroundColor: c.headerGreen, color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 10 }}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
          {darkMode ? <Icons.sun size={22} color="#fff" /> : <Icons.moon size={22} color="#fff" />}
        </button>
      )}

      {showCreateModal && <CreateNoteModal petId={pet.petId} userName={user.displayName} userRole={user.role} onClose={() => setShowCreateModal(false)} onSubmit={handleNoteCreated} c={c} />}
      {editingNote && <EditNoteModal note={editingNote} userRole={user.role} onClose={() => setEditingNote(null)} onSave={handleNoteEdited} c={c} />}
      {showCreateBehaviorModal && <CreateBehaviorNoteModal petId={pet.petId} userName={user.displayName} onClose={() => setShowCreateBehaviorModal(false)} onSubmit={handleBehaviorNoteCreated} c={c} />}
      {editingBehaviorNote && <EditBehaviorNoteModal note={editingBehaviorNote} onClose={() => setEditingBehaviorNote(null)} onSave={handleBehaviorNoteEdited} c={c} />}
      {showQR && <QRCodeModal pet={pet} onClose={() => setShowQR(false)} c={c} />}
    </main>
  );
}

// ─── App Root ────────────────────────────────────────────────────────────────
// URL params drive the QR code flow: ?type=cat&location=holding-4:0
// Each kennel has a QR code that encodes petType + location in the URL.
const PLACEHOLDER_HOME = "/DogSHADOW.png";

// ─── Home Screen ─────────────────────────────────────────────────────────────
function HomeScreen({ user, onLogout, darkMode, setDarkMode, c }) {
  const r = useResponsive();
  const [animals, setAnimals] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.getAllAnimals().then((result) => {
      if (result === null) { setLoadError(true); setAnimals([]); }
      else setAnimals(result);
    });
  }, []);

  const SHOWN_SPECIES = new Set(["dog", "cat", "rabbit"]);

  // Client-side filter: only show dogs, cats, rabbits; also apply search query
  const filtered = animals
    ? animals.filter((a) => {
        if (!SHOWN_SPECIES.has((a.species || "").toLowerCase())) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          (a.rescueId && a.rescueId.toLowerCase().includes(q)) ||
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
    <main style={{ fontFamily: font, minHeight: "100vh", backgroundColor: c.bg, paddingBottom: 48 }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg }}>
        <div style={{ flex: 1 }}>
          <UserDropdown user={user} onLogout={onLogout} c={c} />
        </div>
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" style={{ height: 36, objectFit: "contain" }} />
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          {setDarkMode && (
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{ background: "none", border: `1px solid ${c.cardBorder}`, cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 40, minWidth: 40, transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.inputBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color={c.textSecondary} />}
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: isDesktop ? 1200 : 700, margin: "0 auto", padding: isDesktop ? "24px 28px 0" : "20px 16px 0" }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <h2 style={{ fontSize: isDesktop ? 26 : 22, fontWeight: 700, color: c.textPrimary, margin: 0 }}>All Animals</h2>
          {animals && (
            <span style={{ fontSize: 14, color: c.warmGray }}>
              {filtered.length === animals.length ? `${animals.length} animals` : `${filtered.length} of ${animals.length}`}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, color: c.textSecondary, margin: "0 0 16px" }}>All animals currently at Oakland Animal Services</p>

        {/* Search bar */}
        <div style={{ position: "relative", marginBottom: 20, maxWidth: isDesktop ? 500 : "100%" }}>
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
            placeholder="Search by name, ACR, ID, breed, or kennel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={(e) => e.currentTarget.style.borderColor = c.headerGreen}
            onBlur={(e) => e.currentTarget.style.borderColor = c.inputBorder}
            aria-label="Search animals"
          />
        </div>
      </div>

      {/* Animal list / grid */}
      <div style={{
        maxWidth: isDesktop ? 1200 : 700, margin: "0 auto",
        padding: isDesktop ? "0 28px" : "0 16px",
        display: isDesktop ? "grid" : "flex",
        gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : undefined,
        flexDirection: isDesktop ? undefined : "column",
        gap: 10,
      }}>
        {/* Loading skeletons */}
        {animals === null && Array.from({ length: isDesktop ? 6 : 5 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, backgroundColor: c.cardBg, borderRadius: 14, border: `1px solid ${c.cardBorder}` }}>
            <Skeleton width={cardImg} height={cardImg} borderRadius={8} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <Skeleton width="40%" height={14} />
              <Skeleton width="60%" height={12} />
            </div>
          </div>
        ))}

        {/* Error */}
        {loadError && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: c.warmGray, fontSize: 15, backgroundColor: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}` }}>
            Could not load animals. Please check your connection and try again.
          </div>
        )}

        {/* Empty search */}
        {animals && !loadError && filtered.length === 0 && searchQuery.trim() && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: c.warmGray, fontSize: 15, backgroundColor: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}` }}>
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
                if (loc && loc !== "unknown" && loc !== "in foster") {
                  window.location.href = `/?type=${encodeURIComponent(species)}&location=${encodeURIComponent(loc)}`;
                } else {
                  window.location.href = `/?petId=${animal.id}`;
                }
              }}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: 14,
                backgroundColor: c.cardBg, borderRadius: 14, border: `1px solid ${c.cardBorder}`,
                cursor: "pointer", fontFamily: font, textAlign: "left", width: "100%",
                boxShadow: c.shadow, transition: "transform 0.15s, box-shadow 0.15s", minHeight: 44,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.13)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = c.shadow; }}
              aria-label={`View ${animal.name}'s profile`}
            >
              <img
                src={imgSrc}
                alt={animal.name}
                style={{ width: cardImg, height: cardImg, borderRadius: 8, objectFit: "cover", border: `1px solid ${c.cardBorder}`, flexShrink: 0 }}
                onError={(e) => { e.target.src = PLACEHOLDER_HOME; }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: handlerColor, flexShrink: 0, boxShadow: `0 0 0 2px ${handlerColor}33` }} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {highlight(animal.name)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: c.textSecondary }}>
                  {highlight(animal.species)}{animal.breed ? <> · {highlight(animal.breed)}</> : ""} · {highlight(animal.location)}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                color: isHold ? "#c0392b" : c.statusResolved,
                backgroundColor: isHold ? "#fdecea" : `${c.statusResolved}15`,
                border: `1px solid ${isHold ? "#e74c3c30" : `${c.statusResolved}30`}`,
                textTransform: "capitalize",
              }}>
                {animal.status}
              </span>
              <Icons.arrowRight size={16} color={c.warmGray} />
            </button>
          );
        })}
      </div>

    </main>
  );
}

export default function App() {
  const [user] = useState({ displayName: "Staff", role: "staff", email: "", department: "" });
  const [animals, setAnimals] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  // Persist dark mode preference across page reloads and navigation
  const toggleDarkMode = (val) => {
    localStorage.setItem("darkMode", val);
    setDarkMode(val);
  };
  const [locationError, setLocationError] = useState(null);
  const c = darkMode ? themes.dark : themes.light;

  // Read pet type and location from URL query params (set by QR code on kennel)
  // Also support direct pet ID links: ?petId=12345
  const urlParams = new URLSearchParams(window.location.search);
  const urlPetId = urlParams.get("petId");
  const petType = urlParams.get("type");
  const kennelLocation = urlParams.get("location");

  const hasUrlParams = !!(urlPetId || (petType && kennelLocation));

  useEffect(() => {
    if (!hasUrlParams) return;
    // Direct pet ID link - skip location fetch and go straight to that pet
    if (urlPetId) {
      setSelectedPetId(urlPetId);
      return;
    }
    // QR code / location link - fetch pets at this kennel location from backend
    setLocationError(null);
    api.getPetsByLocation(petType, kennelLocation)
      .then((pets) => {
        setAnimals(pets);
        if (pets.length === 1) setSelectedPetId(pets[0].petId);
      })
      .catch((err) => {
        setLocationError(err.message);
      });
  }, [urlPetId, petType, kennelLocation]);

  const handleLogout = () => { setSelectedPetId(null); setAnimals([]); setLocationError(null); };

  // No URL params → show home screen with all animals
  if (!hasUrlParams && !selectedPetId) {
    return <HomeScreen user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={toggleDarkMode} c={c} />;
  }

  if (locationError) {
    return <ErrorScreen error={locationError} onLogout={handleLogout} c={c} />;
  }

  if (!selectedPetId && animals.length > 1) {
    return <AnimalSelection animals={animals} onSelect={setSelectedPetId} user={user} onLogout={handleLogout} onBack={() => { window.location.href = "/"; }} darkMode={darkMode} setDarkMode={toggleDarkMode} c={c} />;
  }

  if (selectedPetId) {
    return <Portal user={user} petId={selectedPetId} onLogout={handleLogout} onBack={animals.length > 1 ? () => setSelectedPetId(null) : () => setSelectedPetId(null)} darkMode={darkMode} setDarkMode={toggleDarkMode} />;
  }

  return (
    <div style={{ fontFamily: font, width: "100vw", minHeight: "100vh", backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 48, height: 48, border: `4px solid ${c.cardBorder}`, borderTop: `4px solid ${c.headerGreen}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <div style={{ color: c.warmGray, fontSize: 15 }}>Loading animals...</div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
