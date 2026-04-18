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
import { findSimilarNotes } from "./utils/noteSearcher.js";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

const noteDataCache = new Map();

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
  refresh: ({ size = 20, color = "#1a1a1a", spinning = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={spinning ? { animation: "spin 0.8s linear infinite" } : {}}>
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  lock: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  eye: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  shield: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  trash: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  key: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7.5" cy="15.5" r="5.5" /><path d="M21 2l-9.6 9.6" /><path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  ),
  xMark: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  check: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  users: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  clipboardList: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  ),
  calendar: ({ size = 20, color = "#1a1a1a" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
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

const GENERAL_AGE_RANGES = {
  dog:  { Baby: "< 1y", Young: "1–3y", Adult: "3–8y",  Senior: "8y+"  },
  cat:  { Baby: "< 1y", Young: "1–3y", Adult: "3–10y", Senior: "10y+" },
  default: { Baby: "< 1y", Young: "1–3y", Adult: "3–9y", Senior: "9y+" },
};

// Compute display age as "Xy Zm/o" from description age + listing date
// Parses "X year(s) old" from description, then adds months elapsed since reference date
// Prefers receivedDate (when shelter assessed the animal) over createdDate
function computeDisplayAge(desc, createdDate, receivedDate, generalAge, species) {
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
  if (generalAge) {
    const speciesKey = (species || "").toLowerCase();
    const table = GENERAL_AGE_RANGES[speciesKey] || GENERAL_AGE_RANGES.default;
    const range = table[generalAge];
    return range ? `${generalAge} (${range})` : generalAge;
  }
  return "Unknown";
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

// Module-level auth token — set on login, cleared on logout.
// Lets all api methods attach the Bearer header without prop drilling.
let _authToken = null;
const authH = () => _authToken ? { "Authorization": `Bearer ${_authToken}` } : {};

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
      const res = await fetch(`/api/pets/${petId}`, { headers: authH() });
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
          age: p.birthdate ? computeAgeFromBirthdate(p.birthdate) : computeDisplayAge(plainDesc, p.createdDate, p.receivedDate, p.generalAge, p.species),
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
  getPetsByLocation: async (petType, location, refresh = false) => {
    if (!petType || !location) {
      throw new Error("Invalid location parameters");
    }
    const res = await fetch(`/api/location/${petType}/${encodeURIComponent(location)}${refresh ? "?refresh=true" : ""}`, { headers: authH() });
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
      const res = await fetch(`/api/pets/${petId}/observer-notes`, { headers: authH() });
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

  // REAL — connected to PATCH /api/observer-notes/:id/status
  updateNote: async (noteId, status) => {
    try {
      const res = await fetch(`/api/observer-notes/${noteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authH() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update note");
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.warn("updateNote failed", err);
      return false;
    }
  },

  // REAL — connected to POST /api/observer-notes
  createNote: async (note) => {
    try {
      const res = await fetch("/api/observer-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
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
      const res = await fetch(`/api/pets/${petId}/behavior-notes`, { headers: authH() });
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
        headers: { "Content-Type": "application/json", ...authH() },
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
        headers: { "Content-Type": "application/json", ...authH() },
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
        headers: { "Content-Type": "application/json", ...authH() },
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

  getAllAnimals: async (page = 1, limit = 50) => {
    try {
      const res = await fetch(`/api/animals/all?page=${page}&limit=${limit}`, { headers: authH() });
      if (!res.ok) throw new Error("Failed to fetch animals");
      const data = await res.json();
      if (data.success && Array.isArray(data.animals)) {
        return {
          animals: data.animals,
          page: data.page || page,
          limit: data.limit || limit,
          total: data.total || data.animals.length,
          totalPages: data.totalPages || 1,
        };
      }
      throw new Error("Invalid response");
    } catch (err) {
      console.error("getAllAnimals error:", err);
      return null;
    }
  },

  getAllAnimalsAllPages: async (limit = 200) => {
    const first = await api.getAllAnimals(1, limit);
    if (!first) return null;

    const totalPages = first.totalPages || 1;
    if (totalPages <= 1) return first.animals || [];

    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => api.getAllAnimals(i + 2, limit))
    );

    const merged = [...(first.animals || [])];
    rest.forEach((pageResult) => {
      if (pageResult && Array.isArray(pageResult.animals)) {
        merged.push(...pageResult.animals);
      }
    });

    return merged;
  },

  login: async (username, password) => {
    let res;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw new Error("Cannot reach server. Make sure the backend is running.");
    }
    const data = await res.json().catch(() => {
      throw new Error("Cannot reach server. Make sure the backend is running.");
    });
    if (!res.ok) throw new Error(data.error || "Invalid username or password");
    return data;
  },

  logout: async (token) => {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
    }).catch(() => {});
  },

  refreshToken: async () => {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error("Session expired");
    return data.accessToken;
  },

  changePassword: async (token, currentPassword, newPassword) => {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Password change failed");
    return data;
  },

  getUsers: async (token) => {
    const res = await fetch("/api/users", {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch users");
    return data.users || [];
  },

  createUser: async (token, userData) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create user");
    return data.user;
  },

  updateUser: async (token, userId, updates) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update user");
    return data.user;
  },

  deleteUser: async (token, userId) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete user");
    }
  },

  resetUserPassword: async (token, userId, newPassword) => {
    const res = await fetch(`/api/users/${userId}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reset password");
    return data;
  },

  getActivityLogs: async (token, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.tags) params.set("tags", filters.tags);
    if (filters.actor) params.set("actor", filters.actor);
    if (filters.action) params.set("action", filters.action);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("limit", String(filters.limit || 25));
    params.set("page", String(filters.page || 1));
    const res = await fetch(`/api/activity?${params.toString()}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch activity logs");
    return data;
  },
};

// Decode JWT payload (client-side only, no verification)
function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

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
function AnimalSelection({ animals, onSelect, user, token, onLogout, onBack, darkMode, setDarkMode, c, onRefresh, refreshing = false, onChangePassword }) {
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
          <UserDropdown user={user} onLogout={onLogout} token={token} c={c} compact={!isDesktop} onChangePassword={onChangePassword} />
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ fontSize: isDesktop ? 26 : 20, fontWeight: 700, color: c.textPrimary, margin: 0 }}>
              Select an Animal: <span style={{ color: c.headerGreen }}>{location}</span>
            </h2>
            {onRefresh && (
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button
                  onClick={onRefresh}
                  disabled={refreshing}
                  style={{
                    background: "none", border: `1px solid ${c.cardBorder}`,
                    cursor: refreshing ? "default" : "pointer", padding: isDesktop ? "8px 14px" : "7px 10px",
                    borderRadius: 8, display: "flex", alignItems: "center", gap: 6,
                    minHeight: 40, minWidth: 40, transition: "all 0.15s",
                    color: c.textSecondary, fontSize: 13, fontFamily: font, fontWeight: 500,
                    opacity: refreshing ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { setShowRefreshTip(true); if (!refreshing) e.currentTarget.style.backgroundColor = c.inputBg; }}
                  onMouseLeave={(e) => { setShowRefreshTip(false); e.currentTarget.style.backgroundColor = "transparent"; }}
                  onFocus={() => setShowRefreshTip(true)}
                  onBlur={() => setShowRefreshTip(false)}
                  aria-label="Refresh animal list"
                >
                  <Icons.refresh size={isDesktop ? 16 : 15} color={c.textSecondary} spinning={refreshing} />
                  {isDesktop && <span>{refreshing ? "Refreshing…" : "Refresh"}</span>}
                </button>
                {showRefreshTip && (
                  <div role="tooltip" style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    backgroundColor: c.textPrimary, color: c.bg,
                    fontSize: 12, fontWeight: 500, lineHeight: 1.4,
                    padding: "6px 10px", borderRadius: 6, whiteSpace: "nowrap",
                    pointerEvents: "none", zIndex: 100,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  }}>
                    {refreshing ? "Refreshing…" : "Click to refresh to get the most up-to-date list of animals at this location."}
                    <div style={{
                      position: "absolute", bottom: "100%", right: 12,
                      borderWidth: "0 5px 5px", borderStyle: "solid",
                      borderColor: `transparent transparent ${c.textPrimary} transparent`,
                    }} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

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
function UserDropdown({ user, onLogout, token, c, compact = false, onChangePassword, deviceUsername, onChangeDeviceUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const isAdmin = user?.role === "admin";
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";
  const canManageUsers = isStaffOrAdmin;
  const currentPath = window.location.search;
  const isDevice = user?.role === "device";

  const deviceDisplayName = isDevice
    ? (user?.username || "").replace(/^device_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  const navItem = (label, icon, href, isCurrent) => (
    <button
      role="menuitem"
      onClick={() => { setOpen(false); window.location.href = href; }}
      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", fontSize: 13, color: isCurrent ? c.headerGreen : c.textSecondary, background: isCurrent ? c.tabActiveBg : "none", border: "none", cursor: "pointer", fontFamily: font, fontWeight: isCurrent ? 600 : 400, padding: "8px 10px", borderRadius: 8, textAlign: "left", minHeight: 36 }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: compact ? 0 : 6, fontSize: 14, color: c.textSecondary, background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: font, minHeight: 44 }} aria-label="User menu" aria-expanded={open}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: c.cardBorder, display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.user size={16} color={c.textSecondary} /></div>
        {!compact && isDevice ? (
          <span style={{ fontWeight: 500 }}>
            {deviceUsername || "—"}
            {deviceDisplayName && <span style={{ fontWeight: 400, color: c.warmGray }}> · {deviceDisplayName}</span>}
          </span>
        ) : (
          !compact && <span style={{ fontWeight: 500 }}>{user?.displayName || user?.username || "User"}</span>
        )}
        {!compact && <Icons.chevron size={14} color={c.warmGray} down={!open} />}
      </button>
      {open && (
        <div role="menu" style={{ position: "absolute", top: 44, left: 0, backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: 12, minWidth: 230, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", fontFamily: font }}>
          <div style={{ padding: "4px 10px 10px" }}>
            {isDevice ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>{deviceUsername || "No name set"}</div>
                <div style={{ fontSize: 12, color: c.warmGray, marginTop: 2 }}>Device: {deviceDisplayName}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>{user?.displayName || user?.username}</div>
                <div style={{ fontSize: 12, color: c.warmGray, marginTop: 2, textTransform: "capitalize" }}>{user?.role}</div>
              </>
            )}
          </div>
          <div style={{ borderTop: `1px solid ${c.cardBorder}`, paddingTop: 6, marginBottom: 6 }}>
            {navItem("All Animals", <Icons.arrowRight size={14} color={c.warmGray} />, "/", !currentPath || currentPath === "?")}
            {navItem("Kennel Locations", <Icons.qrCode size={14} color={c.warmGray} />, "/?view=locations", currentPath.includes("view=locations"))}
            {isStaffOrAdmin && navItem("Activity Log", <Icons.clipboardList size={14} color={c.warmGray} />, "/?view=activity", currentPath.includes("view=activity"))}
            {isAdmin && navItem("User Management", <Icons.users size={14} color={c.warmGray} />, "/?view=users", currentPath.includes("view=users"))}
          </div>
          <div style={{ borderTop: `1px solid ${c.cardBorder}`, paddingTop: 6 }}>
            {isDevice && onChangeDeviceUser && (
              <button role="menuitem" onClick={() => { setOpen(false); onChangeDeviceUser(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", fontSize: 13, color: c.textSecondary, background: "none", border: "none", cursor: "pointer", fontFamily: font, padding: "8px 10px", borderRadius: 8, textAlign: "left", minHeight: 36 }}>
                <Icons.user size={14} color={c.warmGray} />
                Change Name
              </button>
            )}
            {!isDevice && onChangePassword && (
              <button role="menuitem" onClick={() => { setOpen(false); onChangePassword(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", fontSize: 13, color: c.textSecondary, background: "none", border: "none", cursor: "pointer", fontFamily: font, padding: "8px 10px", borderRadius: 8, textAlign: "left", minHeight: 36 }}>
                <Icons.lock size={14} color={c.warmGray} />
                Change Password
              </button>
            )}
            <button role="menuitem" onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", fontSize: 13, color: c.brickRed, background: "none", border: "none", cursor: "pointer", fontFamily: font, fontWeight: 500, padding: "8px 10px", borderRadius: 8, textAlign: "left", minHeight: 36 }}>
              <Icons.arrowRight size={14} color={c.brickRed} />
              Sign Out
            </button>
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
  const canEditStatus = userRole === "admin" || userRole === "staff";
  const handleSave = () => { onSave({ ...note, body, case: caseName, ...(canEditStatus ? { status } : {}) }); onClose(); };
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
        {canEditStatus && (
          <>
            <label style={labelStyle}>Status</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["Raised", "Resolved"].map((s) => {
                const isActive = status === s;
                const col = s === "Raised" ? c.statusRaised : c.statusResolved;
                return (
                  <button key={s} onClick={() => setStatus(s)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${isActive ? col : c.inputBorder}`, backgroundColor: isActive ? `${col}18` : "transparent", color: isActive ? col : c.warmGray, fontSize: 13, fontWeight: isActive ? 700 : 400, cursor: "pointer", fontFamily: font, textTransform: "uppercase", letterSpacing: "0.5px", transition: "all 0.15s ease" }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </>
        )}
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
function CreateBehaviorNoteModal({ petId, userName, onClose, onSubmit, existingNotes = [], c }) {
  const [caseName, setCaseName] = useState("");
  const [body, setBody] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [similarNotes, setSimilarNotes] = useState([]);
  const searchTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const { width } = useResponsive();
  const isDesktop = width >= 768;

  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const runSimilarSearch = (caseVal, bodyVal) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const query = `${caseVal} ${bodyVal}`.trim();
    if (!query) { setSimilarNotes([]); return; }
    searchTimerRef.current = setTimeout(() => {
      const mapped = existingNotes.map((n) => ({
        id: n.id, petId: n.petId, title: n.case, content: n.body,
        author: n.by, timestamp: new Date(n.createdAt),
      }));
      const results = findSimilarNotes(query, mapped, { maxResults: 20 });
      setSimilarNotes(results.map((r) => {
        const orig = existingNotes.find((n) => n.id === r.observerNote.id);
        return { ...orig, highlightedBody: r.highlightedContent, highlightedCase: r.highlightedTitle };
      }));
    }, 300);
  };

  const toggleSpeech = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) { alert("Speech recognition not supported."); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR(); r.continuous = true; r.interimResults = true;
    r.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setBody(t); runSimilarSearch(caseName, t); };
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
  const buttons = (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <button style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: "transparent", color: c.textSecondary, fontSize: 15, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={onClose}>Cancel</button>
      <button style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={handleSubmit}>Submit</button>
    </div>
  );

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose} role="dialog" aria-modal="true" aria-label="New behavior note">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 24, width: "100%", maxWidth: isDesktop && similarNotes.length > 0 ? 860 : 420, maxHeight: "85vh", display: "flex", flexDirection: isDesktop ? "row" : "column", gap: isDesktop ? 24 : 0, alignItems: "stretch", overflow: isDesktop ? "hidden" : "auto", fontFamily: font }} onClick={(e) => e.stopPropagation()}>
        {/* Form */}
        <div style={{ flex: "0 0 360px", minHeight: 0, overflowY: isDesktop ? "auto" : "visible" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: c.textPrimary }}>New Behavior Note</h2>
          <label style={labelStyle}>Case Title</label>
          <input style={fieldStyle} placeholder="e.g. Socialization Progress" value={caseName} onChange={(e) => { setCaseName(e.target.value); runSimilarSearch(e.target.value, body); }} aria-label="Case title" />
          <label style={labelStyle}>
            Observation Notes
            <button style={{ width: 34, height: 34, marginLeft: 8, verticalAlign: "middle", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", backgroundColor: isListening ? c.brickRed : c.inputBg, transition: "background-color 0.2s ease" }} onClick={toggleSpeech} aria-label={isListening ? "Stop speech to text" : "Start speech to text"}>
              <Icons.microphone size={16} color={isListening ? "#fff" : c.textPrimary} />
            </button>
          </label>
          <textarea style={{ ...fieldStyle, minHeight: 100, resize: "vertical" }} placeholder="Describe your observation..." value={body} onChange={(e) => { setBody(e.target.value); runSimilarSearch(caseName, e.target.value); }} aria-label="Observation notes" />
          {buttons}
          {!isDesktop && similarNotes.length > 0 && <div style={{ marginTop: 16 }}><SimilarNotesPreview similarNotes={similarNotes} c={c} /></div>}
        </div>
        {/* Desktop side panel */}
        {isDesktop && similarNotes.length > 0 && (
          <div style={{ width: 320, flexShrink: 0, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "flex-start", borderLeft: `1px solid ${c.cardBorder}`, paddingLeft: 24, overflow: "hidden" }}>
            <SimilarNotesPreview similarNotes={similarNotes} c={c} fullHeight />
          </div>
        )}
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

// ─── Similar Notes Preview (shared) ─────────────────────────────────────────
function SimilarNotesPreview({ similarNotes, c, fullHeight = false }) {
  if (!similarNotes || similarNotes.length === 0) return null;
  const hlStyle = `background-color:#FFEB3B;color:#1a1a1a;font-weight:700;border-radius:2px;padding:0 2px;`;
  const injectStyle = (html) => (html || "").replace(/<b>/g, `<b style="${hlStyle}">`);
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: fullHeight ? "100%" : "auto" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: c.warmGray, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
        Similar existing notes ({similarNotes.length})
      </div>
      <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, minHeight: 0, ...(fullHeight ? { flex: 1, maxHeight: "60vh", height: "100%" } : { maxHeight: 200 }) }}>
        {similarNotes.map((n) => (
          <div key={n.id} style={{ backgroundColor: c.inputBg, borderRadius: 8, padding: "8px 10px", border: `1px solid ${c.cardBorder}`, flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 2 }}
              dangerouslySetInnerHTML={{ __html: injectStyle(n.highlightedCase || n.case) }} />
            <div style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.45, whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "break-word" }}
              dangerouslySetInnerHTML={{ __html: injectStyle(n.highlightedBody || n.body) }} />
            <div style={{ fontSize: 11, color: c.warmGray, marginTop: 4 }}>{n.by} · {formatTimestamp(n.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Create Medical Note Modal ───────────────────────────────────────────────
function CreateNoteModal({ petId, userName, userRole, onClose, onSubmit, existingNotes = [], c }) {
  const [caseName, setCaseName] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("Raised");
  const [isListening, setIsListening] = useState(false);
  const [similarNotes, setSimilarNotes] = useState([]);
  const searchTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const canSetStatus = userRole === "medical";
  const { width } = useResponsive();
  const isDesktop = width >= 768;

  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const runSimilarSearch = (caseVal, bodyVal) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const query = `${caseVal} ${bodyVal}`.trim();
    if (!query) { setSimilarNotes([]); return; }
    searchTimerRef.current = setTimeout(() => {
      const mapped = existingNotes.map((n) => ({
        id: n.id, petId: n.petId, title: n.case, content: n.body,
        author: n.by, timestamp: new Date(n.createdAt),
      }));
      const results = findSimilarNotes(query, mapped, { maxResults: 20 });
      setSimilarNotes(results.map((r) => {
        const orig = existingNotes.find((n) => n.id === r.observerNote.id);
        return { ...orig, highlightedBody: r.highlightedContent, highlightedCase: r.highlightedTitle };
      }));
    }, 300);
  };

  const toggleSpeech = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) { alert("Speech recognition not supported."); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR(); r.continuous = true; r.interimResults = true;
    r.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setBody(t); runSimilarSearch(caseName, t); };
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
  const buttons = (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <button style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: "transparent", color: c.textSecondary, fontSize: 15, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={onClose}>Cancel</button>
      <button style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: font, minHeight: 44, transition: "background-color 0.2s ease" }} onClick={handleSubmit}>Submit</button>
    </div>
  );

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose} role="dialog" aria-modal="true" aria-label="New medical observation">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 24, width: "100%", maxWidth: isDesktop && similarNotes.length > 0 ? 860 : 420, maxHeight: "85vh", display: "flex", flexDirection: isDesktop ? "row" : "column", gap: isDesktop ? 24 : 0, alignItems: "stretch", overflow: isDesktop ? "hidden" : "auto", fontFamily: font }} onClick={(e) => e.stopPropagation()}>
        {/* Form */}
        <div style={{ flex: "0 0 360px", minHeight: 0, overflowY: isDesktop ? "auto" : "visible" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: c.textPrimary }}>New Medical Observation</h2>
          <label style={labelStyle}>Case Title</label>
          <input style={fieldStyle} placeholder="e.g. Limp On Right Leg" value={caseName} onChange={(e) => { setCaseName(e.target.value); runSimilarSearch(e.target.value, body); }} aria-label="Case title" />
          {canSetStatus && (<><label style={labelStyle}>Status</label><select style={fieldStyle} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="Raised">Raised</option><option value="Resolved">Resolved</option></select></>)}
          <label style={labelStyle}>
            Observation Notes
            <button style={{ width: 34, height: 34, marginLeft: 8, verticalAlign: "middle", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", backgroundColor: isListening ? c.brickRed : c.inputBg, transition: "background-color 0.2s ease" }} onClick={toggleSpeech} aria-label={isListening ? "Stop speech to text" : "Start speech to text"}>
              <Icons.microphone size={16} color={isListening ? "#fff" : c.textPrimary} />
            </button>
          </label>
          <textarea style={{ ...fieldStyle, minHeight: 100, resize: "vertical" }} placeholder="Describe your observation..." value={body} onChange={(e) => { setBody(e.target.value); runSimilarSearch(caseName, e.target.value); }} aria-label="Observation notes" />
          {buttons}
          {!isDesktop && similarNotes.length > 0 && <div style={{ marginTop: 16 }}><SimilarNotesPreview similarNotes={similarNotes} c={c} /></div>}
        </div>
        {/* Desktop side panel */}
        {isDesktop && similarNotes.length > 0 && (
          <div style={{ width: 320, flexShrink: 0, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "flex-start", borderLeft: `1px solid ${c.cardBorder}`, paddingLeft: 24, overflow: "hidden" }}>
            <SimilarNotesPreview similarNotes={similarNotes} c={c} fullHeight />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Medical Note Card ───────────────────────────────────────────────────────
function MedicalNoteCard({ note, currentUser, userRole, onEdit, c, searchQuery }) {
  const isOwner = note.by === currentUser;
  const canEdit = userRole === "admin" || userRole === "staff" || isOwner;
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
            color: (note.status || "").toUpperCase() === "RAISED" ? c.statusRaised : c.statusResolved,
            backgroundColor: (note.status || "").toUpperCase() === "RAISED" ? `${c.statusRaised}18` : `${c.statusResolved}18`,
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
  const canEdit = userRole === "admin" || userRole === "staff" || isOwner;
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
      </div>
      
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
  user, token, pet, notes: _notes, behaviorNotes: _behaviorNotes,
  filteredNotes, filteredBehaviorNotes,
  activeTab, setActiveTab,
  searchQuery, handleMedicalSearch,
  behaviorSearchQuery, handleBehaviorSearch,
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
  onBack, onLogout, onChangePassword,
  darkMode, setDarkMode,
  deviceUsername, onChangeDeviceUser,
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
          <UserDropdown user={user} onLogout={onLogout} token={token} c={c} onChangePassword={onChangePassword || (() => {})} deviceUsername={deviceUsername} onChangeDeviceUser={onChangeDeviceUser} />
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
                    onChange={(e) => handleBehaviorSearch(e.target.value)}
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
      {showCreateModal && <CreateNoteModal petId={pet.petId} userName={deviceUsername || user.displayName} userRole={user.role} onClose={() => setShowCreateModal(false)} onSubmit={handleNoteCreated} existingNotes={_notes} c={c} />}
      {editingNote && <EditNoteModal note={editingNote} userRole={user.role} onClose={() => setEditingNote(null)} onSave={handleNoteEdited} c={c} />}
      {showCreateBehaviorModal && <CreateBehaviorNoteModal petId={pet.petId} userName={deviceUsername || user.displayName} onClose={() => setShowCreateBehaviorModal(false)} onSubmit={handleBehaviorNoteCreated} existingNotes={_behaviorNotes} c={c} />}
      {editingBehaviorNote && <EditBehaviorNoteModal note={editingBehaviorNote} onClose={() => setEditingBehaviorNote(null)} onSave={handleBehaviorNoteEdited} c={c} />}
    </main>
  );
}

// ─── Main Portal ─────────────────────────────────────────────────────────────
// The main animal detail view with tabs: Summary (AI), Medical Observations, Behavior Notes.
// Medical search uses backend NLP-powered search with keyword highlighting.
// Behavior search uses client-side filtering with text highlighting.

// ─── Device Username Prompt ───────────────────────────────────────────────────
function DeviceUsernamePrompt({ c, onConfirm }) {
  const [name, setName] = useState("");
  const focusTrapRef = useFocusTrap(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim());
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }} role="dialog" aria-modal="true" aria-label="Enter your name">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 32, width: "100%", maxWidth: 360, fontFamily: font, boxShadow: "0 16px 48px rgba(0,0,0,0.25)", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: c.tabActiveBg, border: `2px solid ${c.headerGreen}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Icons.user size={24} color={c.headerGreen} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: c.textPrimary, marginBottom: 6 }}>Who are you?</h2>
        <p style={{ fontSize: 14, color: c.warmGray, marginBottom: 20 }}>Enter your name so notes are attributed correctly. This will be saved on this device.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg, color: c.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: font, marginBottom: 16 }}
            aria-label="Your name"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 15, fontWeight: 600, cursor: name.trim() ? "pointer" : "not-allowed", opacity: name.trim() ? 1 : 0.6, fontFamily: font, minHeight: 48 }}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

const DEVICE_USER_COOKIE = "oas_device_user";
function getDeviceUserCookie() {
  const entry = document.cookie.split("; ").find((r) => r.startsWith(`${DEVICE_USER_COOKIE}=`));
  return entry ? decodeURIComponent(entry.split("=")[1]) : "";
}
function setDeviceUserCookie(name) {
  document.cookie = `${DEVICE_USER_COOKIE}=${encodeURIComponent(name)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function Portal({ user, token, petId, onLogout, onBack, darkMode, setDarkMode, onChangePassword }) {
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

  const isDevice = user?.role === "device";
  const [deviceUsername, setDeviceUsername] = useState(() => isDevice ? getDeviceUserCookie() : "");
  const [showDevicePrompt, setShowDevicePrompt] = useState(() => isDevice && !getDeviceUserCookie());
  
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

  const handleNoteCreated = (n) => setNotes((prev) => [n, ...prev]);
  const handleNoteEdited = async (n) => {
    setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
    if (n.status) await api.updateNote(n.id, n.status);
  };
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

  const filteredNotes = searchQuery.trim()
    ? (searchResults ?? notes)
    : notes;

  const filteredBehaviorNotes = behaviorSearchQuery.trim()
    ? (behaviorSearchResults ?? behaviorNotes)
    : behaviorNotes;

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

  const devicePromptModal = showDevicePrompt && (
    <DeviceUsernamePrompt
      c={c}
      onConfirm={(name) => {
        setDeviceUserCookie(name);
        setDeviceUsername(name);
        setShowDevicePrompt(false);
      }}
    />
  );

  // Desktop/iPad two-column layout (width >= 768px)
  if (r.width >= 768) {
    return <>
      <DesktopPortal
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
        editingNote={editingNote} setEditingNote={setEditingNote}
        editingBehaviorNote={editingBehaviorNote} setEditingBehaviorNote={setEditingBehaviorNote}
        handleNoteCreated={handleNoteCreated} handleNoteEdited={handleNoteEdited}
        handleBehaviorNoteCreated={handleBehaviorNoteCreated} handleBehaviorNoteEdited={handleBehaviorNoteEdited}
        onBack={onBack} onLogout={onLogout} onChangePassword={onChangePassword}
        darkMode={darkMode} setDarkMode={setDarkMode}
        deviceUsername={deviceUsername} onChangeDeviceUser={() => setShowDevicePrompt(true)}
        c={c} r={r}
      />
      {devicePromptModal}
    </>;
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
          <UserDropdown user={user} onLogout={onLogout} token={token} c={c} onChangePassword={onChangePassword} deviceUsername={deviceUsername} onChangeDeviceUser={() => setShowDevicePrompt(true)} />
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
                handleBehaviorSearch("");
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
                  placeholder="Search behavior notes..." value={behaviorSearchQuery} onChange={(e) => handleBehaviorSearch(e.target.value)} aria-label="Search behavior notes" />
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

      {showCreateModal && <CreateNoteModal petId={pet.petId} userName={deviceUsername || user.displayName} userRole={user.role} onClose={() => setShowCreateModal(false)} onSubmit={handleNoteCreated} existingNotes={notes} c={c} />}
      {editingNote && <EditNoteModal note={editingNote} userRole={user.role} onClose={() => setEditingNote(null)} onSave={handleNoteEdited} c={c} />}
      {showCreateBehaviorModal && <CreateBehaviorNoteModal petId={pet.petId} userName={deviceUsername || user.displayName} onClose={() => setShowCreateBehaviorModal(false)} onSubmit={handleBehaviorNoteCreated} existingNotes={behaviorNotes} c={c} />}
      {editingBehaviorNote && <EditBehaviorNoteModal note={editingBehaviorNote} onClose={() => setEditingBehaviorNote(null)} onSave={handleBehaviorNoteEdited} c={c} />}
      {showQR && <QRCodeModal pet={pet} onClose={() => setShowQR(false)} c={c} />}
      {devicePromptModal}
    </main>
  );
}

// ─── App Root ────────────────────────────────────────────────────────────────
// URL params drive the QR code flow: ?type=cat&location=holding-4:0
// Each kennel has a QR code that encodes petType + location in the URL.
const PLACEHOLDER_HOME = "/DogSHADOW.png";

// ─── Home Screen ─────────────────────────────────────────────────────────────
function HomeScreen({ user, token, onLogout, darkMode, setDarkMode, c, onChangePassword }) {
  const r = useResponsive();
  const initialPageParam = Number(new URLSearchParams(window.location.search).get("page") || "1");
  const initialPage = Number.isFinite(initialPageParam) && initialPageParam > 0 ? Math.floor(initialPageParam) : 1;
  const [animals, setAnimals] = useState(null);
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
  }, [page]);

  // Client-side filter: apply search query across all returned animals
  const filtered = animals
    ? animals.filter((a) => {
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
    <main style={{ fontFamily: font, minHeight: "100vh", backgroundColor: c.bg, paddingBottom: 48 }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg }}>
        <div style={{ flex: 1 }}>
          <UserDropdown user={user} onLogout={onLogout} token={token} c={c} onChangePassword={onChangePassword} />
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
              {searchQuery.trim()
                ? `${filtered.length} matches on this page`
                : `${totalAnimals} animals · page ${page} of ${totalPages}`}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, color: c.textSecondary, margin: "0 0 16px" }}>All animals currently at Oakland Animal Services</p>

        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => { window.location.href = "/?view=locations"; }}
            style={{
              minHeight: 40,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${c.cardBorder}`,
              backgroundColor: c.cardBg,
              color: c.textPrimary,
              cursor: "pointer",
              fontFamily: font,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            View Kennel Locations
          </button>
        </div>

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
                  window.location.href = `/?petId=${animal.id}&page=${page}`;
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

      {animals && !loadError && totalPages > 1 && (
        <div style={{ maxWidth: isDesktop ? 1200 : 700, margin: "14px auto 0", padding: isDesktop ? "0 28px" : "0 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              minHeight: 40,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${c.cardBorder}`,
              backgroundColor: page <= 1 ? c.inputBg : c.cardBg,
              color: page <= 1 ? c.warmGray : c.textPrimary,
              cursor: page <= 1 ? "not-allowed" : "pointer",
              fontFamily: font,
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: 14, color: c.textSecondary, minWidth: 110, textAlign: "center" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              minHeight: 40,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${c.cardBorder}`,
              backgroundColor: page >= totalPages ? c.inputBg : c.cardBg,
              color: page >= totalPages ? c.warmGray : c.textPrimary,
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              fontFamily: font,
            }}
          >
            Next
          </button>
        </div>
      )}

    </main>
  );
}

function LocationsPage({ user, token, onLogout, darkMode, setDarkMode, c, onChangePassword }) {
  const r = useResponsive();
  const [locations, setLocations] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [selectedKennels, setSelectedKennels] = useState([]);
  const [qrSizePx, setQrSizePx] = useState(180);
  const [paperSize, setPaperSize] = useState("letter");
  const [includeLocationText, setIncludeLocationText] = useState(true);
  const [includeAnimalTypeText, setIncludeAnimalTypeText] = useState(true);
  const [centerAllQrs, setCenterAllQrs] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewQrMap, setPreviewQrMap] = useState({});

  useEffect(() => {
    setLoadError(false);
    api.getAllAnimalsAllPages().then((animals) => {
      if (!animals) {
        setLoadError(true);
        setLocations([]);
        return;
      }

      const map = new Map();
      animals.forEach((a) => {
        const species = (a.species || "").toLowerCase();
        const originalLocation = (a.location || "").trim();
        if (!species || !originalLocation) return;

        const normalized = originalLocation
          .replace(new RegExp(`^${a.species}\\s+`, "i"), "")
          .trim()
          .toLowerCase();

        if (!normalized || normalized === "unknown" || normalized === "in foster") return;

        const key = `${species}|${normalized}`;
        const curr = map.get(key);
        if (curr) {
          curr.count += 1;
        } else {
          map.set(key, {
            species,
            location: normalized,
            label: `${species.toUpperCase()} ${normalized.toUpperCase()}`,
            count: 1,
          });
        }
      });

      const sorted = Array.from(map.values()).sort((x, y) => {
        if (x.species !== y.species) return x.species.localeCompare(y.species);
        return x.location.localeCompare(y.location);
      });

      const speciesOptions = Array.from(new Set(sorted.map((s) => s.species))).sort();
      setLocations(sorted);
      setSelectedSpecies(speciesOptions);
      setSelectedKennels(sorted.map((s) => `${s.species}|${s.location}`));
    });
  }, []);

  const isDesktop = r.width >= 768;
  const speciesOptions = locations ? Array.from(new Set(locations.map((s) => s.species))).sort() : [];
  const speciesFilterSet = new Set(selectedSpecies);
  const visibleLocations = locations
    ? locations.filter((loc) => selectedSpecies.length === 0 || speciesFilterSet.has(loc.species))
    : [];
  const visibleKeys = visibleLocations.map((loc) => `${loc.species}|${loc.location}`);
  const selectedKennelSet = new Set(selectedKennels);
  const selectedExportLocations = visibleLocations.filter((loc) =>
    selectedKennelSet.has(`${loc.species}|${loc.location}`)
  );

  const computePdfLayout = () => {
    const qrWidth = Math.max(96, Math.min(512, Number(qrSizePx) || 180));
    const qrSizePt = Math.round(qrWidth * 0.75);
    const size = paperSize === "a4" ? "a4" : "letter";
    const sizeProbe = new jsPDF({ orientation: "portrait", unit: "pt", format: size });
    const pageWidth = sizeProbe.internal.pageSize.getWidth();
    const pageHeight = sizeProbe.internal.pageSize.getHeight();
    const margin = 32;
    const gutter = 16;
    const labelHeight = includeLocationText ? 28 : 0;
    const cellHeight = qrSizePt + labelHeight + 16;
    const cols = Math.max(1, Math.floor((pageWidth - margin * 2 + gutter) / (qrSizePt + gutter)));
    const rowsPerPage = Math.max(1, Math.floor((pageHeight - margin * 2) / cellHeight));
    const itemsPerPage = Math.max(1, cols * rowsPerPage);

    return {
      format: size,
      qrSizePt,
      pageWidth,
      pageHeight,
      margin,
      gutter,
      labelHeight,
      cellHeight,
      cols,
      rowsPerPage,
      itemsPerPage,
    };
  };

  const getRowStartX = (layout, itemsOnPage, row) => {
    const usedBeforeRow = row * layout.cols;
    const rowItems = Math.max(0, Math.min(layout.cols, itemsOnPage - usedBeforeRow));
    const rowWidth = rowItems > 0 ? rowItems * layout.qrSizePt + (rowItems - 1) * layout.gutter : 0;
    const usableWidth = layout.pageWidth - 2 * layout.margin;
    return centerAllQrs
      ? layout.margin + Math.max(0, (usableWidth - rowWidth) / 2)
      : layout.margin;
  };

  const getPageStartY = (layout, itemsOnPage) => {
    const rowsUsed = Math.max(1, Math.ceil(itemsOnPage / layout.cols));
    const lastRowContentHeight = layout.qrSizePt + (layout.labelHeight > 0 ? 12 : 0);
    const blockHeight = (rowsUsed - 1) * layout.cellHeight + lastRowContentHeight;
    const usableHeight = layout.pageHeight - 2 * layout.margin;
    return centerAllQrs
      ? layout.margin + Math.max(0, (usableHeight - blockHeight) / 2)
      : layout.margin;
  };

  const previewLayout = computePdfLayout();
  const previewItems = selectedExportLocations.slice(0, previewLayout.itemsPerPage);
  const totalPdfPages = Math.max(1, Math.ceil(selectedExportLocations.length / previewLayout.itemsPerPage));

  useEffect(() => {
    let canceled = false;

    const generatePreviewQrs = async () => {
      if (previewItems.length === 0) {
        if (!canceled) setPreviewQrMap({});
        return;
      }

      const entries = await Promise.all(
        previewItems.map(async (loc) => {
          const key = `${loc.species}|${loc.location}`;
          try {
            const previewPayload = `${window.location.origin}/?type=${encodeURIComponent(loc.species)}&location=${encodeURIComponent(loc.location)}`;
            const url = await QRCode.toDataURL(previewPayload, { width: 256, margin: 1 });
            return [key, url];
          } catch {
            return [key, ""];
          }
        })
      );

      if (!canceled) {
        setPreviewQrMap(Object.fromEntries(entries));
      }
    };

    generatePreviewQrs();
    return () => {
      canceled = true;
    };
  }, [
    selectedExportLocations.map((loc) => `${loc.species}|${loc.location}`).join(";"),
    previewLayout.itemsPerPage,
    includeLocationText,
    paperSize,
    qrSizePx,
  ]);

  const toggleSpecies = (species) => {
    setSelectedSpecies((prev) =>
      prev.includes(species) ? prev.filter((s) => s !== species) : [...prev, species]
    );
  };

  const selectAllVisibleKennels = () => {
    setSelectedKennels((prev) => Array.from(new Set([...prev, ...visibleKeys])));
  };

  const clearVisibleKennels = () => {
    const visibleSet = new Set(visibleKeys);
    setSelectedKennels((prev) => prev.filter((k) => !visibleSet.has(k)));
  };

  const toggleKennel = (key) => {
    setSelectedKennels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const exportSelectedToPdf = async () => {
    if (!locations || locations.length === 0 || selectedKennels.length === 0 || exportingPdf) return;

    const selectedSet = new Set(selectedKennels);
    const toExport = visibleLocations.filter((loc) => selectedSet.has(`${loc.species}|${loc.location}`));
    if (toExport.length === 0) return;

    setExportingPdf(true);
    try {
      const baseUrl = window.location.origin;
      const layout = computePdfLayout();
      const qrWidth = Math.max(96, Math.min(512, Number(qrSizePx) || 180));
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: layout.format });

      let currentPage = 0;

      doc.setFontSize(12);
      doc.text("Oakland Animal Services Kennel QR Codes", layout.margin, 20);

      for (let i = 0; i < toExport.length; i++) {
        const loc = toExport[i];
        const key = `${loc.species}|${loc.location}`;
        const targetUrl = `${baseUrl}/?type=${encodeURIComponent(loc.species)}&location=${encodeURIComponent(loc.location)}`;
        const qrDataUrl = await QRCode.toDataURL(targetUrl, { width: qrWidth, margin: 1 });

        const pageIndex = Math.floor(i / layout.itemsPerPage);
        const indexInPage = i % layout.itemsPerPage;
        const row = Math.floor(indexInPage / layout.cols);
        const col = indexInPage % layout.cols;
        const itemsOnPage = Math.min(layout.itemsPerPage, toExport.length - pageIndex * layout.itemsPerPage);

        while (currentPage < pageIndex) {
          doc.addPage();
          currentPage += 1;
        }

        const rowStartX = getRowStartX(layout, itemsOnPage, row);
        const drawX = rowStartX + col * (layout.qrSizePt + layout.gutter);
        const pageStartY = getPageStartY(layout, itemsOnPage);
        const y = pageStartY + row * layout.cellHeight;
        doc.addImage(qrDataUrl, "PNG", drawX, y, layout.qrSizePt, layout.qrSizePt);

        if (includeLocationText) {
          const label = includeAnimalTypeText
            ? `${loc.species.toUpperCase()} ${loc.location.toUpperCase()}`
            : loc.location.toUpperCase();
          doc.setFontSize(9);
          doc.text(label, drawX + layout.qrSizePt / 2, y + layout.qrSizePt + 12, {
            align: "center",
            maxWidth: layout.qrSizePt,
          });
        }

        if (!selectedSet.has(key)) continue;
      }

      const datePart = new Date().toISOString().slice(0, 10);
      doc.save(`kennel-qr-codes-${datePart}.pdf`);
    } catch (err) {
      console.error("Failed to export locations PDF", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <main style={{ fontFamily: font, minHeight: "100vh", backgroundColor: c.bg, paddingBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg }}>
        <div style={{ flex: 1 }}>
          <UserDropdown user={user} onLogout={onLogout} token={token} c={c} onChangePassword={onChangePassword} />
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: isDesktop ? 26 : 22, fontWeight: 700, color: c.textPrimary, margin: 0 }}>Kennel Locations</h2>
            <p style={{ fontSize: 14, color: c.textSecondary, margin: "6px 0 0" }}>Generated from all current animals</p>
          </div>
          <button
            onClick={() => { window.location.href = "/"; }}
            style={{
              minHeight: 40,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${c.cardBorder}`,
              backgroundColor: c.cardBg,
              color: c.textPrimary,
              cursor: "pointer",
              fontFamily: font,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Back To Home
          </button>
        </div>

        {locations && !loadError && locations.length > 0 && (
          <div style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.textPrimary, marginBottom: 10 }}>Export Locations To PDF</div>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "minmax(0, 1fr) 300px" : "1fr", gap: 14, alignItems: "start" }}>
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  {speciesOptions.map((species) => {
                    const on = selectedSpecies.includes(species);
                    return (
                      <button
                        key={species}
                        onClick={() => toggleSpecies(species)}
                        style={{
                          minHeight: 34,
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: `1px solid ${on ? c.headerGreen : c.cardBorder}`,
                          backgroundColor: on ? `${c.headerGreen}20` : c.cardBg,
                          color: c.textPrimary,
                          cursor: "pointer",
                          fontFamily: font,
                          fontSize: 12,
                          textTransform: "capitalize",
                        }}
                      >
                        {species}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr", gap: 10, marginBottom: 10 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: c.textSecondary }}>
                    QR Size (px)
                    <input
                      type="number"
                      min={96}
                      max={512}
                      step={8}
                      value={qrSizePx}
                      onChange={(e) => setQrSizePx(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1px solid ${c.inputBorder}`,
                        backgroundColor: c.inputBg,
                        color: c.textPrimary,
                        fontFamily: font,
                        boxSizing: "border-box",
                      }}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: c.textSecondary }}>
                    Paper Size
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1px solid ${c.inputBorder}`,
                        backgroundColor: c.inputBg,
                        color: c.textPrimary,
                        fontFamily: font,
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="letter">Letter (8.5 x 11 in)</option>
                      <option value="a4">A4 (210 x 297 mm)</option>
                    </select>
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: c.textSecondary }}>
                      <input type="checkbox" checked={includeLocationText} onChange={(e) => setIncludeLocationText(e.target.checked)} />
                      Add location text below QR
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: c.textSecondary }}>
                      <input type="checkbox" checked={includeAnimalTypeText} onChange={(e) => setIncludeAnimalTypeText(e.target.checked)} disabled={!includeLocationText} />
                      Include animal type in label
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: c.textSecondary }}>
                      <input type="checkbox" checked={centerAllQrs} onChange={(e) => setCenterAllQrs(e.target.checked)} />
                      Center all QR codes
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <button
                    onClick={selectAllVisibleKennels}
                    style={{
                      minHeight: 34,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: `1px solid ${c.cardBorder}`,
                      backgroundColor: c.cardBg,
                      color: c.textPrimary,
                      cursor: "pointer",
                      fontFamily: font,
                      fontSize: 12,
                    }}
                  >
                    Select Visible Kennels
                  </button>
                  <button
                    onClick={clearVisibleKennels}
                    style={{
                      minHeight: 34,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: `1px solid ${c.cardBorder}`,
                      backgroundColor: c.cardBg,
                      color: c.textPrimary,
                      cursor: "pointer",
                      fontFamily: font,
                      fontSize: 12,
                    }}
                  >
                    Clear Visible Kennels
                  </button>
                  <button
                    onClick={exportSelectedToPdf}
                    disabled={exportingPdf || selectedExportLocations.length === 0}
                    style={{
                      minHeight: 34,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "none",
                      backgroundColor: c.headerGreen,
                      color: "#fff",
                      cursor: exportingPdf || selectedExportLocations.length === 0 ? "not-allowed" : "pointer",
                      opacity: exportingPdf || selectedExportLocations.length === 0 ? 0.65 : 1,
                      fontFamily: font,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {exportingPdf ? "Exporting..." : `Export ${selectedExportLocations.length} To PDF`}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: c.warmGray }}>
                  Select which kennels to include, then export QR labels to a printable PDF.
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 8 }}>
                  PDF Preview (page 1 of {totalPdfPages}): {previewLayout.format.toUpperCase()} · {previewLayout.cols} cols x {previewLayout.rowsPerPage} rows
                </div>

                <button
                  onClick={() => setPreviewExpanded(true)}
                  disabled={previewItems.length === 0}
                  style={{
                    width: "100%",
                    padding: 0,
                    background: "none",
                    border: "none",
                    cursor: previewItems.length === 0 ? "not-allowed" : "zoom-in",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: `${previewLayout.pageWidth} / ${previewLayout.pageHeight}`,
                      backgroundColor: "#fff",
                      border: `1px solid ${c.cardBorder}`,
                      borderRadius: 8,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {previewItems.map((loc, i) => {
                      const col = i % previewLayout.cols;
                      const row = Math.floor(i / previewLayout.cols);
                      const scale = 300 / previewLayout.pageWidth;
                      const rowStartX = getRowStartX(previewLayout, previewItems.length, row);
                      const pageStartY = getPageStartY(previewLayout, previewItems.length);
                      const x = (rowStartX + col * (previewLayout.qrSizePt + previewLayout.gutter)) * scale;
                      const y = (pageStartY + row * previewLayout.cellHeight) * scale;
                      const qrPx = previewLayout.qrSizePt * scale;
                      const key = `${loc.species}|${loc.location}`;
                      const label = includeAnimalTypeText
                        ? `${loc.species.toUpperCase()} ${loc.location.toUpperCase()}`
                        : loc.location.toUpperCase();

                      return (
                        <div key={key} style={{ position: "absolute", left: x, top: y, width: qrPx, textAlign: "center" }}>
                          {previewQrMap[key] ? (
                            <img src={previewQrMap[key]} alt="Preview QR" style={{ width: qrPx, height: qrPx, display: "block" }} />
                          ) : (
                            <div style={{ width: qrPx, height: qrPx, backgroundColor: "#efefef", border: "1px solid #ddd" }} />
                          )}
                          {includeLocationText && (
                            <div
                              style={{
                                fontSize: Math.max(6, Math.round(9 * scale)),
                                color: "#111",
                                lineHeight: 1.2,
                                marginTop: 2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {label}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </button>

                <div style={{ fontSize: 11, color: c.warmGray, marginTop: 6 }}>
                  Click preview to enlarge.
                </div>
              </div>
            </div>
          </div>
        )}

        {previewExpanded && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.65)",
              zIndex: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setPreviewExpanded(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: c.cardBg,
                borderRadius: 12,
                padding: 14,
                border: `1px solid ${c.cardBorder}`,
                width: "min(92vw, 880px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.textPrimary }}>
                  PDF Preview (page 1)
                </div>
                <button
                  onClick={() => setPreviewExpanded(false)}
                  style={{
                    minHeight: 32,
                    padding: "4px 10px",
                    borderRadius: 8,
                    border: `1px solid ${c.cardBorder}`,
                    backgroundColor: c.cardBg,
                    color: c.textPrimary,
                    cursor: "pointer",
                    fontFamily: font,
                    fontSize: 12,
                  }}
                >
                  Close
                </button>
              </div>

              <div
                style={{
                  width: "100%",
                  maxHeight: "76vh",
                  overflow: "auto",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "min(86vw, 760px)",
                    aspectRatio: `${previewLayout.pageWidth} / ${previewLayout.pageHeight}`,
                    backgroundColor: "#fff",
                    border: `1px solid ${c.cardBorder}`,
                    borderRadius: 8,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {previewItems.map((loc, i) => {
                    const col = i % previewLayout.cols;
                    const row = Math.floor(i / previewLayout.cols);
                    const scale = Math.min(86 * window.innerWidth / 100, 760) / previewLayout.pageWidth;
                    const rowStartX = getRowStartX(previewLayout, previewItems.length, row);
                    const pageStartY = getPageStartY(previewLayout, previewItems.length);
                    const x = (rowStartX + col * (previewLayout.qrSizePt + previewLayout.gutter)) * scale;
                    const y = (pageStartY + row * previewLayout.cellHeight) * scale;
                    const qrPx = previewLayout.qrSizePt * scale;
                    const key = `${loc.species}|${loc.location}`;
                    const label = includeAnimalTypeText
                      ? `${loc.species.toUpperCase()} ${loc.location.toUpperCase()}`
                      : loc.location.toUpperCase();

                    return (
                      <div key={key} style={{ position: "absolute", left: x, top: y, width: qrPx, textAlign: "center" }}>
                        {previewQrMap[key] ? (
                          <img src={previewQrMap[key]} alt="Preview QR" style={{ width: qrPx, height: qrPx, display: "block" }} />
                        ) : (
                          <div style={{ width: qrPx, height: qrPx, backgroundColor: "#efefef", border: "1px solid #ddd" }} />
                        )}
                        {includeLocationText && (
                          <div
                            style={{
                              fontSize: Math.max(8, Math.round(9 * scale)),
                              color: "#111",
                              lineHeight: 1.2,
                              marginTop: 2,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {locations === null && (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr", gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ padding: 14, backgroundColor: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}` }}>
                <Skeleton width="40%" height={14} />
                <div style={{ height: 6 }} />
                <Skeleton width="60%" height={12} />
              </div>
            ))}
          </div>
        )}

        {loadError && (
          <div style={{ textAlign: "center", padding: 48, color: c.warmGray, fontSize: 15, backgroundColor: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}` }}>
            Could not load locations. Please try again.
          </div>
        )}

        {locations && !loadError && locations.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, color: c.warmGray, fontSize: 15, backgroundColor: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}` }}>
            No kennel locations available right now.
          </div>
        )}

        {locations && !loadError && visibleLocations.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr", gap: 10 }}>
            {visibleLocations.map((loc) => (
              <div
                key={`${loc.species}|${loc.location}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  backgroundColor: c.cardBg,
                  borderRadius: 12,
                  border: `1px solid ${c.cardBorder}`,
                  textAlign: "left",
                  fontFamily: font,
                  boxShadow: c.shadow,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedKennelSet.has(`${loc.species}|${loc.location}`)}
                  onChange={() => toggleKennel(`${loc.species}|${loc.location}`)}
                  aria-label={`Select ${loc.label}`}
                />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c.textPrimary }}>{loc.label}</div>
                  <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>{loc.count} animals currently in this location</div>
                </div>
                <button
                  onClick={() => {
                    window.location.href = `/?type=${encodeURIComponent(loc.species)}&location=${encodeURIComponent(loc.location)}`;
                  }}
                  style={{
                    minHeight: 34,
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: `1px solid ${c.cardBorder}`,
                    backgroundColor: c.cardBg,
                    color: c.textPrimary,
                    cursor: "pointer",
                    fontFamily: font,
                    fontSize: 12,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Open
                  <Icons.arrowRight size={14} color={c.warmGray} />
                </button>
              </div>
            ))}
          </div>
        )}

        {locations && !loadError && locations.length > 0 && visibleLocations.length === 0 && (
          <div style={{ textAlign: "center", padding: 24, color: c.warmGray, fontSize: 14, backgroundColor: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}` }}>
            No kennels match the selected animal types.
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ darkMode, setDarkMode, onLogin, c }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const r = useResponsive();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.login(username.trim(), password);
      onLogin(data.accessToken);
    } catch (err) {
      setError(err.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px 12px 42px", borderRadius: 10,
    border: `1px solid ${error ? "#BE3A2B" : c.inputBorder}`, backgroundColor: c.inputBg,
    color: c.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box",
    fontFamily: font, transition: "border-color 0.15s",
  };

  return (
    <main style={{ fontFamily: font, minHeight: "100vh", backgroundColor: c.bg, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg }}>
        <div style={{ width: 40 }} />
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" style={{ height: 36, objectFit: "contain" }} />
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{ background: "none", border: `1px solid ${c.cardBorder}`, cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 40, minWidth: 40 }}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color={c.textSecondary} />}
        </button>
      </div>

      {/* Login card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: r.padding }}>
        <div style={{ width: "100%", maxWidth: 380, backgroundColor: c.cardBg, borderRadius: 16, padding: 32, border: `1px solid ${c.cardBorder}`, boxShadow: c.shadow }}>
          {/* Icon */}
          <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: c.tabActiveBg, border: `2px solid ${c.headerGreen}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Icons.shield size={26} color={c.headerGreen} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c.textPrimary, textAlign: "center", marginBottom: 6 }}>Staff Login</h1>
          <p style={{ fontSize: 14, color: c.warmGray, textAlign: "center", marginBottom: 24 }}>Oakland Animal Services Portal</p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>Username</label>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Icons.user size={16} color={c.warmGray} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                style={inputStyle}
                aria-label="Username"
              />
            </div>

            {/* Password */}
            <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>Password</label>
            <div style={{ position: "relative", marginBottom: 20 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Icons.lock size={16} color={c.warmGray} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 44 }}
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Icons.eyeOff size={16} color={c.warmGray} /> : <Icons.eye size={16} color={c.warmGray} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 16 }} role="alert">
                <Icons.alertCircle size={16} color="#BE3A2B" />
                <span style={{ fontSize: 13, color: "#BE3A2B", fontWeight: 500 }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 15, fontWeight: 600, cursor: loading || !username.trim() || !password ? "not-allowed" : "pointer", opacity: loading || !username.trim() || !password ? 0.65 : 1, fontFamily: font, minHeight: 44, transition: "opacity 0.15s" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p style={{ fontSize: 12, color: c.warmGray, textAlign: "center", marginTop: 20 }}>
            Locked out? Contact your administrator.
          </p>
        </div>
      </div>
    </main>
  );
}

// ─── Forced Password Change Screen ───────────────────────────────────────────
function ForcePasswordChangeScreen({ user, token, onPasswordChanged, onLogout, darkMode, setDarkMode, c }) {
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showTemp, setShowTemp] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const r = useResponsive();

  const mismatch = confirm && newPassword !== confirm;
  const tooShort = newPassword && newPassword.length < 8;
  const canSubmit = tempPassword && newPassword.length >= 8 && newPassword === confirm && !loading;

  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await api.changePassword(token, tempPassword, newPassword);
      // Old token is now invalid — clear session and force fresh login
      _authToken = null;
      sessionStorage.removeItem("oas_token");
      setDone(true);
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: "100%", padding: "12px 14px 12px 42px", borderRadius: 10,
    border: `1px solid ${hasError ? "#BE3A2B" : c.inputBorder}`, backgroundColor: c.inputBg,
    color: c.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box",
    fontFamily: font, paddingRight: 44,
  });

  return (
    <main style={{ fontFamily: font, minHeight: "100vh", backgroundColor: c.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg }}>
        <div style={{ width: 40 }} />
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" style={{ height: 36, objectFit: "contain" }} />
        <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: `1px solid ${c.cardBorder}`, cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 40, minWidth: 40 }} aria-label="Toggle dark mode">
          {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color={c.textSecondary} />}
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: r.padding }}>
        <div style={{ width: "100%", maxWidth: 420, backgroundColor: c.cardBg, borderRadius: 16, padding: 32, border: `1px solid ${c.cardBorder}`, boxShadow: c.shadow }}>

          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#f0fdf4", border: "2px solid #4CAF50", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Icons.check size={28} color="#4CAF50" />
              </div>
              <h1 style={{ fontSize: 21, fontWeight: 700, color: c.textPrimary, marginBottom: 10 }}>Password Set!</h1>
              <p style={{ fontSize: 14, color: c.warmGray, marginBottom: 24 }}>Your password has been updated. Please sign in with your new password.</p>
              <button onClick={() => { onLogout(); }} style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: font, minHeight: 44 }}>
                Go to Sign In
              </button>
            </div>
          ) : (<>

          <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#fff8e1", border: "2px solid #FFC107", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Icons.key size={26} color="#FFC107" />
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: c.textPrimary, textAlign: "center", marginBottom: 6 }}>Set Your Password</h1>
          <p style={{ fontSize: 14, color: c.warmGray, textAlign: "center", marginBottom: 20 }}>
            Hi <strong>{user?.username}</strong>! Enter the temporary password you were given, then choose a new one.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>Temporary Password</label>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Icons.lock size={16} color={c.warmGray} />
              </div>
              <input type={showTemp ? "text" : "password"} value={tempPassword} onChange={(e) => { setTempPassword(e.target.value); setError(""); }} placeholder="Your temporary password" autoFocus style={inputStyle(false)} aria-label="Temporary password" autoComplete="current-password" />
              <button type="button" onClick={() => setShowTemp(!showTemp)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }} aria-label={showTemp ? "Hide" : "Show"}>
                {showTemp ? <Icons.eyeOff size={16} color={c.warmGray} /> : <Icons.eye size={16} color={c.warmGray} />}
              </button>
            </div>

            <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>New Password <span style={{ color: c.warmGray, fontWeight: 400 }}>(min 8 characters)</span></label>
            <div style={{ position: "relative", marginBottom: 4 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Icons.lock size={16} color={c.warmGray} />
              </div>
              <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }} placeholder="New password" style={inputStyle(tooShort)} aria-label="New password" autoComplete="new-password" />
              <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }} aria-label={showNew ? "Hide" : "Show"}>
                {showNew ? <Icons.eyeOff size={16} color={c.warmGray} /> : <Icons.eye size={16} color={c.warmGray} />}
              </button>
            </div>
            {tooShort && <div style={{ fontSize: 12, color: "#BE3A2B", marginBottom: 10 }}>Must be at least 8 characters</div>}

            <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, marginTop: 12, display: "block" }}>Confirm New Password</label>
            <div style={{ position: "relative", marginBottom: 4 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Icons.lock size={16} color={c.warmGray} />
              </div>
              <input type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} placeholder="Confirm new password" style={inputStyle(mismatch)} aria-label="Confirm password" autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }} aria-label={showConfirm ? "Hide" : "Show"}>
                {showConfirm ? <Icons.eyeOff size={16} color={c.warmGray} /> : <Icons.eye size={16} color={c.warmGray} />}
              </button>
            </div>
            {mismatch && <div style={{ fontSize: 12, color: "#BE3A2B", marginBottom: 10 }}>Passwords do not match</div>}

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 16, marginTop: 8 }} role="alert">
                <Icons.alertCircle size={16} color="#BE3A2B" />
                <span style={{ fontSize: 13, color: "#BE3A2B" }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={!canSubmit} style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 15, fontWeight: 600, cursor: !canSubmit ? "not-allowed" : "pointer", opacity: !canSubmit ? 0.65 : 1, fontFamily: font, minHeight: 44, marginTop: 8 }}>
              {loading ? "Saving…" : "Set Password & Continue"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: c.warmGray, fontFamily: font }}>Sign out</button>
          </div>
          </>)}
        </div>
      </div>
    </main>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ token, onClose, c }) {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const mismatch = confirm && newPwd !== confirm;
  const tooShort = newPwd && newPwd.length < 8;
  const canSubmit = current && newPwd.length >= 8 && newPwd === confirm && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await api.changePassword(token, current, newPwd);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = { width: "100%", padding: "11px 14px 11px 42px", borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg, color: c.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: font, paddingRight: 44 };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Change password">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 28, width: "100%", maxWidth: 360, fontFamily: font, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: "#f0fdf4", border: "2px solid #4CAF50", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Icons.check size={24} color="#4CAF50" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: c.textPrimary, marginBottom: 8 }}>Password Changed</h2>
            <p style={{ fontSize: 14, color: c.warmGray, marginBottom: 20 }}>Your password has been updated. Please sign in again.</p>
            <button onClick={onClose} style={{ padding: "10px 28px", borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: font, minHeight: 44 }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: c.textPrimary, margin: 0 }}>Change Password</h2>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }} aria-label="Close"><Icons.xMark size={20} color={c.warmGray} /></button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>Current Password</label>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Icons.lock size={15} color={c.warmGray} /></div>
                <input type={showCurrent ? "text" : "password"} value={current} onChange={(e) => { setCurrent(e.target.value); setError(""); }} placeholder="Current password" style={fieldStyle} autoFocus autoComplete="current-password" aria-label="Current password" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }} aria-label={showCurrent ? "Hide" : "Show"}>
                  {showCurrent ? <Icons.eyeOff size={15} color={c.warmGray} /> : <Icons.eye size={15} color={c.warmGray} />}
                </button>
              </div>

              <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>New Password</label>
              <div style={{ position: "relative", marginBottom: 4 }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Icons.lock size={15} color={c.warmGray} /></div>
                <input type={showNew ? "text" : "password"} value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setError(""); }} placeholder="New password (min 8 chars)" style={{ ...fieldStyle, border: `1px solid ${tooShort ? "#BE3A2B" : c.inputBorder}` }} autoComplete="new-password" aria-label="New password" />
                <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }} aria-label={showNew ? "Hide" : "Show"}>
                  {showNew ? <Icons.eyeOff size={15} color={c.warmGray} /> : <Icons.eye size={15} color={c.warmGray} />}
                </button>
              </div>
              {tooShort && <div style={{ fontSize: 12, color: "#BE3A2B", marginBottom: 8 }}>At least 8 characters required</div>}

              <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, marginTop: 10, display: "block" }}>Confirm New Password</label>
              <div style={{ marginBottom: 4 }}>
                <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} placeholder="Confirm new password" style={{ ...fieldStyle, paddingLeft: 14, border: `1px solid ${mismatch ? "#BE3A2B" : c.inputBorder}` }} autoComplete="new-password" aria-label="Confirm new password" />
              </div>
              {mismatch && <div style={{ fontSize: 12, color: "#BE3A2B", marginBottom: 8 }}>Passwords do not match</div>}

              {error && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "9px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 14, marginTop: 6 }} role="alert">
                  <Icons.alertCircle size={15} color="#BE3A2B" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 13, color: "#BE3A2B" }}>
                    {error.toLowerCase().includes("environment") || error.toLowerCase().includes("admin")
                      ? <>The <strong>admin</strong> password is set via the server's <code>.env</code> file (<code>ADMIN_PASS</code>) and cannot be changed here. Update it there and restart the server.</>
                      : error}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: "transparent", color: c.textSecondary, fontSize: 14, cursor: "pointer", fontFamily: font, minHeight: 44 }}>Cancel</button>
                <button type="submit" disabled={!canSubmit} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 14, fontWeight: 600, cursor: !canSubmit ? "not-allowed" : "pointer", opacity: !canSubmit ? 0.65 : 1, fontFamily: font, minHeight: 44 }}>
                  {loading ? "Saving…" : "Change Password"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Activity Log Screen ──────────────────────────────────────────────────────
function ActivityLogScreen({ user, token, onLogout, darkMode, setDarkMode, c }) {
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
      setPage(pg);
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
    const t = tagColors[tag] || { bg: c.inputBg, text: c.warmGray, label: tag };
    return (
      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, backgroundColor: t.bg, color: t.text, whiteSpace: "nowrap" }}>
        {t.label}
      </span>
    );
  };

  return (
    <main style={{ fontFamily: font, minHeight: "100vh", backgroundColor: c.bg, paddingBottom: 48 }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg }}>
        <div style={{ flex: 1 }}>
          <UserDropdown user={user} onLogout={onLogout} token={token} c={c} onChangePassword={() => setShowChangePassword(true)} />
        </div>
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" style={{ height: 36, objectFit: "contain" }} />
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: `1px solid ${c.cardBorder}`, cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center", minHeight: 40, minWidth: 40 }} aria-label="Toggle dark mode">
            {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color={c.textSecondary} />}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: isDesktop ? 1100 : 700, margin: "0 auto", padding: isDesktop ? "24px 28px 0" : "20px 16px 0" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <button onClick={() => { window.location.href = "/"; }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }} aria-label="Back to home">
            <Icons.back size={20} color={c.warmGray} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icons.clipboardList size={22} color={c.headerGreen} />
            <h2 style={{ fontSize: isDesktop ? 24 : 20, fontWeight: 700, color: c.textPrimary, margin: 0 }}>Activity Log</h2>
          </div>
        </div>
        <p style={{ fontSize: 14, color: c.textSecondary, margin: "0 0 20px 34px" }}>
          {isAdmin ? "All system activity including auth events" : "Behavior and medical note activity"}
        </p>

        {/* Filters card */}
        <div style={{ backgroundColor: c.cardBg, borderRadius: 12, padding: isDesktop ? "18px 20px" : "14px 16px", border: `1px solid ${c.cardBorder}`, marginBottom: 16, boxShadow: c.shadow }}>
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr 1fr 1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
            {[
              { label: "Actor (username)", val: filterActor, set: setFilterActor, placeholder: "Filter by user…" },
              { label: "Action", val: filterAction, set: setFilterAction, placeholder: "e.g. USER_CREATED" },
              { label: "From date", val: filterFrom, set: setFilterFrom, type: "date" },
              { label: "To date", val: filterTo, set: setFilterTo, type: "date" },
            ].map(({ label, val, set, placeholder, type = "text" }) => (
              <div key={label}>
                <label style={{ fontSize: 12, color: c.warmGray, marginBottom: 4, display: "block" }}>{label}</label>
                <input type={type} value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg, color: c.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: font }} />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: c.warmGray, fontWeight: 500 }}>Show:</span>
            {[
              { key: "behavior", label: "Behavior Notes", val: showBehavior, set: setShowBehavior },
              { key: "observer", label: "Medical Notes", val: showObserver, set: setShowObserver },
              ...(isAdmin ? [{ key: "auth", label: "Auth Events", val: showAuth, set: setShowAuth }] : []),
            ].map(({ key, label, val, set }) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: c.textPrimary, cursor: "pointer" }}>
                <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} style={{ cursor: "pointer" }} />
                {label}
              </label>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => fetchLogs(1)} disabled={loading} style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1, fontFamily: font, minHeight: 36 }}>
              {loading ? "Loading…" : "Apply Filters"}
            </button>
            <button onClick={() => { setFilterActor(""); setFilterAction(""); setFilterFrom(""); setFilterTo(""); setShowBehavior(true); setShowObserver(true); setShowAuth(true); }} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg, color: c.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: font, minHeight: 36 }}>
              Clear
            </button>
          </div>
        </div>

        {/* Results count */}
        {logs !== null && !loading && (
          <div style={{ fontSize: 13, color: c.warmGray, marginBottom: 10 }}>
            {loadError ? "" : `${totalCount} event${totalCount !== 1 ? "s" : ""} · page ${page} of ${totalPages}`}
          </div>
        )}

        {/* Error */}
        {loadError && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 16 }}>
            <Icons.alertCircle size={16} color="#BE3A2B" />
            <span style={{ fontSize: 14, color: "#BE3A2B" }}>{loadError}</span>
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={60} borderRadius={10} />
            ))}
          </div>
        )}

        {/* Log rows */}
        {!loading && logs && logs.length === 0 && !loadError && (
          <div style={{ textAlign: "center", padding: 40, color: c.warmGray, fontSize: 14, backgroundColor: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}` }}>
            No activity logs found for the selected filters.
          </div>
        )}

        {!loading && logs && logs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {logs.map((log) => {
              const isExpanded = expandedLog === log.logId;
              const hasData = log.jsonData && Object.keys(log.jsonData).length > 0;
              return (
                <div key={log.logId} style={{ backgroundColor: c.cardBg, borderRadius: 10, border: `1px solid ${c.cardBorder}`, boxShadow: c.shadow, overflow: "hidden" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: hasData ? "pointer" : "default", flexWrap: "nowrap" }}
                    onClick={() => hasData && setExpandedLog(isExpanded ? null : log.logId)}
                  >
                    <div style={{ flex: "0 0 auto" }}>{tagBadge(log.tag)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, whiteSpace: isDesktop ? "nowrap" : "normal", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.action}
                      </div>
                      <div style={{ fontSize: 12, color: c.warmGray, marginTop: 1 }}>
                        by <strong>{log.actor}</strong> · {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                    {log.jsonData?.petId && (
                      <button
                        onClick={(e) => { e.stopPropagation(); window.location.href = `/?petId=${log.jsonData.petId}`; }}
                        style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: `1px solid ${c.cardBorder}`, backgroundColor: c.inputBg, color: c.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: font, whiteSpace: "nowrap" }}
                      >
                        <Icons.arrowRight size={12} color={c.warmGray} />
                        View Pet
                      </button>
                    )}
                    {hasData && (
                      <div style={{ flex: "0 0 auto" }}>
                        <Icons.chevron size={14} color={c.warmGray} down={!isExpanded} />
                      </div>
                    )}
                  </div>
                  {isExpanded && hasData && (
                    <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${c.cardBorder}` }}>
                      <pre style={{ fontSize: 12, color: c.textSecondary, backgroundColor: c.inputBg, borderRadius: 8, padding: "10px 12px", margin: "10px 0 0", overflow: "auto", maxHeight: 200, fontFamily: "monospace" }}>
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
        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24 }}>
            <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg, color: page <= 1 ? c.warmGray : c.textPrimary, cursor: page <= 1 ? "not-allowed" : "pointer", fontFamily: font, fontSize: 13, minHeight: 36 }}>Previous</button>
            <span style={{ fontSize: 13, color: c.warmGray, padding: "0 8px" }}>Page {page} of {totalPages}</span>
            <button onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg, color: page >= totalPages ? c.warmGray : c.textPrimary, cursor: page >= totalPages ? "not-allowed" : "pointer", fontFamily: font, fontSize: 13, minHeight: 36 }}>Next</button>
          </div>
        )}
      </div>

      {showChangePassword && <ChangePasswordModal token={token} onClose={() => setShowChangePassword(false)} c={c} />}
    </main>
  );
}

// ─── User Management Screen ───────────────────────────────────────────────────
function UserManagementScreen({ user, token, onLogout, darkMode, setDarkMode, c }) {
  const r = useResponsive();
  const isDesktop = r.width >= 768;
  const isAdmin = user?.role === "admin";

  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("volunteer");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(null);
  const [showEditExpiry, setShowEditExpiry] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState("");

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

  const filteredUsers = (users || []).filter((u) => {
    if (u.role !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.username?.toLowerCase().includes(q) || u.deviceName?.toLowerCase().includes(q);
  });

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: "Expired", color: "#BE3A2B", bg: "#fef2f2" };
    if (diffDays <= 7) return { label: `Expires in ${diffDays}d`, color: "#e65100", bg: "#fff3e0" };
    return { label: `Expires ${exp.toLocaleDateString()}`, color: "#2d7a24", bg: "#f0fdf4" };
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

  return (
    <main style={{ fontFamily: font, minHeight: "100vh", backgroundColor: c.bg, paddingBottom: 48 }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg }}>
        <div style={{ flex: 1 }}>
          <UserDropdown user={user} onLogout={onLogout} token={token} c={c} onChangePassword={() => setShowChangePassword(true)} />
        </div>
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" style={{ height: 36, objectFit: "contain" }} />
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: `1px solid ${c.cardBorder}`, cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center", minHeight: 40, minWidth: 40 }} aria-label="Toggle dark mode">
            {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color={c.textSecondary} />}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: isDesktop ? 1000 : 700, margin: "0 auto", padding: isDesktop ? "24px 28px 0" : "20px 16px 0" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <button onClick={() => { window.location.href = "/"; }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }} aria-label="Back">
            <Icons.back size={20} color={c.warmGray} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icons.users size={22} color={c.headerGreen} />
            <h2 style={{ fontSize: isDesktop ? 24 : 20, fontWeight: 700, color: c.textPrimary, margin: 0 }}>User Management</h2>
          </div>
        </div>
        <p style={{ fontSize: 14, color: c.textSecondary, margin: "0 0 20px 34px" }}>
          {isAdmin ? "Manage all user accounts" : "Manage volunteer accounts"}
        </p>

        {/* Tabs + actions row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 4, backgroundColor: c.inputBg, borderRadius: 10, padding: 4 }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{ padding: "7px 16px", borderRadius: 8, border: "none", backgroundColor: activeTab === t.key ? c.cardBg : "transparent", color: activeTab === t.key ? c.textPrimary : c.warmGray, fontSize: 13, fontWeight: activeTab === t.key ? 600 : 400, cursor: "pointer", fontFamily: font, boxShadow: activeTab === t.key ? c.shadow : "none", transition: "all 0.15s" }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {activeTab !== "admin" && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font, minHeight: 36 }}
            >
              <Icons.plus size={15} />
              New {activeTab === "volunteer" ? "Volunteer" : activeTab === "staff" ? "Staff" : "Device"}
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icons.search size={15} color={c.warmGray} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}s…`}
            style={{ width: "100%", padding: "9px 14px 9px 36px", borderRadius: 8, border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg, color: c.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: font }}
          />
        </div>

        {actionError && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 14 }} role="alert">
            <Icons.alertCircle size={15} color="#BE3A2B" />
            <span style={{ fontSize: 13, color: "#BE3A2B" }}>{actionError}</span>
          </div>
        )}

        {loadError && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 16 }}>
            <Icons.alertCircle size={16} color="#BE3A2B" />
            <span style={{ fontSize: 14, color: "#BE3A2B" }}>{loadError}</span>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={64} borderRadius={10} />)}
          </div>
        )}

        {/* Admin tab — env-var account, read-only */}
        {activeTab === "admin" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", backgroundColor: c.cardBg, borderRadius: 10, border: `1px solid ${c.cardBorder}`, boxShadow: c.shadow }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: c.tabActiveBg, border: `2px solid ${c.headerGreen}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icons.shield size={16} color={c.headerGreen} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary }}>admin <span style={{ fontSize: 11, fontWeight: 400, color: c.warmGray }}>(env account)</span></div>
                <div style={{ fontSize: 12, color: c.warmGray, marginTop: 2 }}>Password managed via <code>ADMIN_PASS</code> in server .env — cannot be reset here</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, backgroundColor: c.tabActiveBg, color: c.headerGreen, flexShrink: 0 }}>System Admin</span>
            </div>
            <div style={{ fontSize: 13, color: c.warmGray, padding: "10px 14px", backgroundColor: c.inputBg, borderRadius: 8, border: `1px solid ${c.cardBorder}` }}>
              To change the admin password, update <code>ADMIN_PASS</code> in the server <code>.env</code> file and restart the backend.
            </div>
          </div>
        )}

        {activeTab !== "admin" && !loading && !loadError && filteredUsers.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: c.warmGray, fontSize: 14, backgroundColor: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}` }}>
            No {activeTab} accounts found.
          </div>
        )}

        {!loading && activeTab !== "admin" && filteredUsers.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredUsers.map((u) => {
              const expStatus = getExpiryStatus(u.expiresAt);
              return (
                <div key={u.userId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", backgroundColor: c.cardBg, borderRadius: 10, border: `1px solid ${c.cardBorder}`, boxShadow: c.shadow, flexWrap: isDesktop ? "nowrap" : "wrap" }}>
                  {/* Avatar */}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: c.inputBg, border: `1px solid ${c.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icons.user size={16} color={c.warmGray} />
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary }}>{u.username}</div>
                    <div style={{ fontSize: 12, color: c.warmGray, marginTop: 1 }}>
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
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {u.role === "volunteer" && (
                      <button
                        onClick={() => { setActionError(""); setShowEditExpiry(u); }}
                        title="Edit expiry"
                        style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: c.textSecondary, fontFamily: font, minHeight: 32 }}
                      >
                        <Icons.calendar size={13} color={c.warmGray} />
                        {isDesktop && "Expiry"}
                      </button>
                    )}
                    <button
                      onClick={() => setShowResetModal(u)}
                      title="Reset password"
                      style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: c.textSecondary, fontFamily: font, minHeight: 32 }}
                    >
                      <Icons.key size={13} color={c.warmGray} />
                      {isDesktop && "Reset"}
                    </button>
                    <button
                      onClick={() => { setActionError(""); setShowDeleteConfirm(u); }}
                      title="Delete user"
                      style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#BE3A2B", fontFamily: font, minHeight: 32 }}
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
          c={c}
        />
      )}

      {/* Edit Expiry Modal */}
      {showEditExpiry && (
        <EditExpiryModal
          token={token}
          targetUser={showEditExpiry}
          onClose={() => setShowEditExpiry(null)}
          onSaved={() => { setShowEditExpiry(null); fetchUsers(); }}
          c={c}
        />
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <ResetPasswordModal
          token={token}
          targetUser={showResetModal}
          onClose={() => setShowResetModal(null)}
          onReset={() => setShowResetModal(null)}
          c={c}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={() => setShowDeleteConfirm(null)} role="dialog" aria-modal="true">
          <div style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 28, maxWidth: 340, width: "100%", fontFamily: font, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#fef2f2", border: "2px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Icons.trash size={22} color="#BE3A2B" />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: c.textPrimary, textAlign: "center", marginBottom: 8 }}>Delete Account</h2>
            <p style={{ fontSize: 14, color: c.warmGray, textAlign: "center", marginBottom: 20 }}>
              Delete <strong>{showDeleteConfirm.username}</strong>? This cannot be undone.
            </p>
            {actionError && <div style={{ fontSize: 13, color: "#BE3A2B", textAlign: "center", marginBottom: 12 }}>{actionError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: "transparent", color: c.textSecondary, fontSize: 14, cursor: "pointer", fontFamily: font, minHeight: 44 }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", backgroundColor: "#BE3A2B", color: "#fff", fontSize: 14, fontWeight: 600, cursor: deleteLoading ? "not-allowed" : "pointer", opacity: deleteLoading ? 0.65 : 1, fontFamily: font, minHeight: 44 }}>
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && <ChangePasswordModal token={token} onClose={() => setShowChangePassword(false)} c={c} />}
    </main>
  );
}

// ─── Edit Expiry Modal ────────────────────────────────────────────────────────
function EditExpiryModal({ token, targetUser, onClose, onSaved, c }) {
  const [expiryDate, setExpiryDate] = useState(
    targetUser.expiresAt ? new Date(targetUser.expiresAt).toISOString().split("T")[0] : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.updateUser(token, targetUser.userId, { expiresAt: expiryDate || null });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg, color: c.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: font };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose} role="dialog" aria-modal="true">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 28, width: "100%", maxWidth: 360, fontFamily: font, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: c.textPrimary, margin: 0 }}>Edit Expiry — {targetUser.username}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} aria-label="Close"><Icons.xMark size={20} color={c.warmGray} /></button>
        </div>
        <form onSubmit={handleSave} noValidate>
          {targetUser.expiresAt ? (
            <div style={{ fontSize: 13, color: c.warmGray, marginBottom: 14, padding: "8px 12px", backgroundColor: c.inputBg, borderRadius: 8, border: `1px solid ${c.cardBorder}` }}>
              Currently expires: <strong style={{ color: c.textPrimary }}>{new Date(targetUser.expiresAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</strong>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: c.warmGray, marginBottom: 14, padding: "8px 12px", backgroundColor: c.inputBg, borderRadius: 8, border: `1px solid ${c.cardBorder}` }}>
              No expiry set — account does not expire.
            </div>
          )}
          <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>New Expiry Date <span style={{ fontWeight: 400 }}>(leave blank to remove)</span></label>
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} style={{ ...fieldStyle, marginBottom: 16 }} autoFocus aria-label="Expiry date" />
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 14 }} role="alert">
              <Icons.alertCircle size={15} color="#BE3A2B" />
              <span style={{ fontSize: 13, color: "#BE3A2B" }}>{error}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: "transparent", color: c.textSecondary, fontSize: 14, cursor: "pointer", fontFamily: font, minHeight: 44 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1, fontFamily: font, minHeight: 44 }}>
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function generateDevicePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ─── Create User Modal ────────────────────────────────────────────────────────
function CreateUserModal({ token, isAdmin, defaultRole, onClose, onCreated, c }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(defaultRole || "volunteer");
  const [expiryDate, setExpiryDate] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(() => generateDevicePassword());
  const [copiedPwd, setCopiedPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const isDevice = role === "device";
  const autoUsername = isDevice ? `device_${deviceName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}` : username.trim();
  const canSubmit = (isDevice ? deviceName.trim() : (username.trim() && password.length >= 8)) && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await api.createUser(token, {
        username: autoUsername,
        password: isDevice ? generatedPassword : password,
        role,
        ...(role === "volunteer" && expiryDate ? { expiresAt: expiryDate } : {}),
        ...(role === "device" && deviceName ? { deviceName: deviceName.trim() } : {}),
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg, color: c.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: font };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose} role="dialog" aria-modal="true">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 28, width: "100%", maxWidth: 380, fontFamily: font, boxShadow: "0 16px 48px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: c.textPrimary, margin: 0 }}>Create Account</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} aria-label="Close"><Icons.xMark size={20} color={c.warmGray} /></button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {isAdmin && (
            <>
              <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...fieldStyle, marginBottom: 14 }} aria-label="Role">
                <option value="volunteer">Volunteer</option>
                <option value="staff">Staff</option>
                <option value="device">Device</option>
              </select>
            </>
          )}

          {isDevice ? (
            <>
              <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>Device Name</label>
              <input type="text" value={deviceName} onChange={(e) => { setDeviceName(e.target.value); setError(""); }} placeholder="e.g. Kiosk-1" style={{ ...fieldStyle, marginBottom: 14 }} autoFocus autoComplete="off" aria-label="Device name" />
              {deviceName.trim() && (
                <div style={{ fontSize: 12, color: c.warmGray, marginTop: -10, marginBottom: 14 }}>
                  Login username: <strong>{`device_${deviceName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`}</strong>
                </div>
              )}
            </>
          ) : (
            <>
              <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>Username</label>
              <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} placeholder="Username" style={{ ...fieldStyle, marginBottom: 14 }} autoFocus autoComplete="off" aria-label="Username" />
            </>
          )}

          {isDevice ? (
            <>
              <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>Auto-generated Password <span style={{ fontWeight: 400 }}>(copy before closing)</span></label>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <input type="text" readOnly value={generatedPassword} style={{ ...fieldStyle, paddingRight: 70, backgroundColor: c.inputBg, color: c.textPrimary, fontFamily: "monospace", letterSpacing: 1 }} aria-label="Generated password" />
                <button type="button" onClick={() => { navigator.clipboard.writeText(generatedPassword); setCopiedPwd(true); setTimeout(() => setCopiedPwd(false), 2000); }} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: `1px solid ${c.cardBorder}`, cursor: "pointer", padding: "3px 8px", borderRadius: 6, fontSize: 11, color: copiedPwd ? c.headerGreen : c.textSecondary, fontFamily: font }}>
                  {copiedPwd ? "Copied!" : "Copy"}
                </button>
              </div>
            </>
          ) : (
            <>
              <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>Temporary Password</label>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Min 8 characters" style={{ ...fieldStyle, paddingRight: 40 }} autoComplete="new-password" aria-label="Password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }} aria-label={showPassword ? "Hide" : "Show"}>
                  {showPassword ? <Icons.eyeOff size={15} color={c.warmGray} /> : <Icons.eye size={15} color={c.warmGray} />}
                </button>
              </div>
              {password && password.length < 8 && <div style={{ fontSize: 12, color: "#BE3A2B", marginTop: -10, marginBottom: 10 }}>At least 8 characters</div>}
            </>
          )}

          {role === "volunteer" && (
            <>
              <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>Expiry Date <span style={{ color: c.warmGray, fontWeight: 400 }}>(optional)</span></label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} style={{ ...fieldStyle, marginBottom: 14 }} aria-label="Expiry date" />
            </>
          )}

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 14 }} role="alert">
              <Icons.alertCircle size={15} color="#BE3A2B" />
              <span style={{ fontSize: 13, color: "#BE3A2B" }}>{error}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: "transparent", color: c.textSecondary, fontSize: 14, cursor: "pointer", fontFamily: font, minHeight: 44 }}>Cancel</button>
            <button type="submit" disabled={!canSubmit} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 14, fontWeight: 600, cursor: !canSubmit ? "not-allowed" : "pointer", opacity: !canSubmit ? 0.65 : 1, fontFamily: font, minHeight: 44 }}>
              {loading ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ token, targetUser, onClose, onReset, c }) {
  const [newPwd, setNewPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const canSubmit = newPwd.length >= 8 && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await api.resetUserPassword(token, targetUser.userId, newPwd);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${c.inputBorder}`, backgroundColor: c.inputBg, color: c.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: font, paddingRight: 40 };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose} role="dialog" aria-modal="true">
      <div ref={focusTrapRef} style={{ backgroundColor: c.cardBg, borderRadius: 16, padding: 28, width: "100%", maxWidth: 340, fontFamily: font, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#f0fdf4", border: "2px solid #4CAF50", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Icons.check size={22} color="#4CAF50" />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: c.textPrimary, marginBottom: 8 }}>Password Reset</h2>
            <p style={{ fontSize: 14, color: c.warmGray, marginBottom: 20 }}>
              <strong>{targetUser.username}</strong>'s password has been reset. They will need to sign in with the new password.
            </p>
            <button onClick={onClose} style={{ padding: "10px 28px", borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: font, minHeight: 44 }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: c.textPrimary, margin: 0 }}>Reset Password</h2>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} aria-label="Close"><Icons.xMark size={20} color={c.warmGray} /></button>
            </div>
            <p style={{ fontSize: 13, color: c.warmGray, marginBottom: 16 }}>Set a new temporary password for <strong>{targetUser.username}</strong>.</p>
            <form onSubmit={handleSubmit} noValidate>
              <label style={{ fontSize: 13, color: c.warmGray, marginBottom: 4, display: "block" }}>New Password</label>
              <div style={{ position: "relative", marginBottom: 4 }}>
                <input type={showPwd ? "text" : "password"} value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setError(""); }} placeholder="Min 8 characters" style={fieldStyle} autoFocus autoComplete="new-password" aria-label="New password" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }} aria-label={showPwd ? "Hide" : "Show"}>
                  {showPwd ? <Icons.eyeOff size={15} color={c.warmGray} /> : <Icons.eye size={15} color={c.warmGray} />}
                </button>
              </div>
              {newPwd && newPwd.length < 8 && <div style={{ fontSize: 12, color: "#BE3A2B", marginBottom: 10 }}>At least 8 characters</div>}

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 12, marginTop: 6 }} role="alert">
                  <Icons.alertCircle size={15} color="#BE3A2B" />
                  <span style={{ fontSize: 13, color: "#BE3A2B" }}>{error}</span>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${c.inputBorder}`, backgroundColor: "transparent", color: c.textSecondary, fontSize: 14, cursor: "pointer", fontFamily: font, minHeight: 44 }}>Cancel</button>
                <button type="submit" disabled={!canSubmit} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", backgroundColor: c.headerGreen, color: "#fff", fontSize: 14, fontWeight: 600, cursor: !canSubmit ? "not-allowed" : "pointer", opacity: !canSubmit ? 0.65 : 1, fontFamily: font, minHeight: 44 }}>
                  {loading ? "Resetting…" : "Reset Password"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [animals, setAnimals] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  const toggleDarkMode = (val) => {
    localStorage.setItem("darkMode", val);
    setDarkMode(val);
  };
  const [locationError, setLocationError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const c = darkMode ? themes.dark : themes.light;

  const applyToken = (token) => {
    const payload = decodeJwt(token);
    _authToken = token;
    sessionStorage.setItem("oas_token", token);
    setAccessToken(token);
    setCurrentUser({
      userId: payload?.userId,
      username: payload?.username,
      displayName: payload?.username || "User",
      role: payload?.role || "staff",
      email: "",
      department: "",
    });
    setMustChangePassword(!!payload?.mustChangePassword);
    setSessionLoading(false);
  };

  const handleLogin = (token) => applyToken(token);

  // On mount: restore session instantly from sessionStorage, then try a
  // background cookie-based refresh to get a fresh token (handles expiry).
  useEffect(() => {
    const stored = sessionStorage.getItem("oas_token");
    const payload = stored ? decodeJwt(stored) : null;
    const isExpired = payload ? payload.exp * 1000 < Date.now() : true;

    if (stored && !isExpired) {
      // Token still valid — use it immediately, no flicker
      applyToken(stored);
      setSessionLoading(false);
      // Refresh in background so we get a fresh token before it expires
      api.refreshToken().then(applyToken).catch(() => {});
    } else {
      // Token missing or expired — try cookie-based refresh
      api.refreshToken()
        .then((token) => applyToken(token))
        .catch(() => { sessionStorage.removeItem("oas_token"); })
        .finally(() => setSessionLoading(false));
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (accessToken) await api.logout(accessToken);
    _authToken = null;
    sessionStorage.removeItem("oas_token");
    setAccessToken(null);
    setCurrentUser(null);
    setMustChangePassword(false);
    setSelectedPetId(null);
    setAnimals([]);
    setLocationError(null);
    window.history.replaceState({}, "", "/");
  }, [accessToken]);

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
  };

  // URL params
  const urlParams = new URLSearchParams(window.location.search);
  const urlPetId = urlParams.get("petId");
  const petType = urlParams.get("type");
  const kennelLocation = urlParams.get("location");
  const view = urlParams.get("view");
  const homePageParam = Number(urlParams.get("page") || "1");
  const homePage = Number.isFinite(homePageParam) && homePageParam > 0 ? Math.floor(homePageParam) : 1;
  const hasUrlParams = !!(urlPetId || (petType && kennelLocation));

  useEffect(() => {
    if (!accessToken || !hasUrlParams) return;
    if (urlPetId) { setSelectedPetId(urlPetId); return; }
    setLocationError(null);
    api.getPetsByLocation(petType, kennelLocation)
      .then((pets) => { setAnimals(pets); if (pets.length === 1) setSelectedPetId(pets[0].petId); })
      .catch((err) => { setLocationError(err.message); });
  }, [accessToken, urlPetId, petType, kennelLocation]);

  const handleRefresh = () => {
    if (!petType || !kennelLocation || refreshing) return;
    setRefreshing(true);
    api.getPetsByLocation(petType, kennelLocation, true)
      .then((pets) => { setAnimals(pets); })
      .catch((err) => { setLocationError(err.message); })
      .finally(() => { setRefreshing(false); });
  };

  // ── Session restore loading ──
  if (sessionLoading) {
    return (
      <div style={{ fontFamily: font, width: "100vw", minHeight: "100vh", backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 48, height: 48, border: `4px solid ${c.cardBorder}`, borderTop: `4px solid ${c.headerGreen}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Auth gates ──
  if (!accessToken) {
    return <LoginScreen darkMode={darkMode} setDarkMode={toggleDarkMode} onLogin={handleLogin} c={c} />;
  }

  if (mustChangePassword) {
    return <ForcePasswordChangeScreen user={currentUser} token={accessToken} onPasswordChanged={handlePasswordChanged} onLogout={handleLogout} darkMode={darkMode} setDarkMode={toggleDarkMode} c={c} />;
  }

  // ── New views ──
  if (view === "activity") {
    return (
      <>
        <ActivityLogScreen user={currentUser} token={accessToken} onLogout={handleLogout} darkMode={darkMode} setDarkMode={toggleDarkMode} c={c} />
        {showChangePassword && <ChangePasswordModal token={accessToken} onClose={() => setShowChangePassword(false)} c={c} />}
      </>
    );
  }

  if (view === "users" && currentUser?.role === "admin") {
    return (
      <>
        <UserManagementScreen user={currentUser} token={accessToken} onLogout={handleLogout} darkMode={darkMode} setDarkMode={toggleDarkMode} c={c} />
        {showChangePassword && <ChangePasswordModal token={accessToken} onClose={() => setShowChangePassword(false)} c={c} />}
      </>
    );
  }

  // ── Existing views ──
  if (view === "locations") {
    return (
      <>
        <LocationsPage user={currentUser} token={accessToken} onLogout={handleLogout} darkMode={darkMode} setDarkMode={toggleDarkMode} c={c} onChangePassword={() => setShowChangePassword(true)} />
        {showChangePassword && <ChangePasswordModal token={accessToken} onClose={() => setShowChangePassword(false)} c={c} />}
      </>
    );
  }

  if (!hasUrlParams && !selectedPetId) {
    return (
      <>
        <HomeScreen user={currentUser} token={accessToken} onLogout={handleLogout} darkMode={darkMode} setDarkMode={toggleDarkMode} c={c} onChangePassword={() => setShowChangePassword(true)} />
        {showChangePassword && <ChangePasswordModal token={accessToken} onClose={() => setShowChangePassword(false)} c={c} />}
      </>
    );
  }

  if (locationError) {
    return <ErrorScreen error={locationError} onLogout={handleLogout} c={c} />;
  }

  if (!selectedPetId && animals.length > 1) {
    return <AnimalSelection animals={animals} onSelect={setSelectedPetId} user={currentUser} token={accessToken} onLogout={handleLogout} onBack={() => { window.location.href = "/"; }} darkMode={darkMode} setDarkMode={toggleDarkMode} c={c} onRefresh={handleRefresh} refreshing={refreshing} onChangePassword={() => setShowChangePassword(true)} />;
  }

  if (selectedPetId) {
    return <Portal user={currentUser} token={accessToken} petId={selectedPetId} onLogout={handleLogout} onBack={animals.length > 1 ? () => setSelectedPetId(null) : () => { window.location.href = homePage > 1 ? `/?page=${homePage}` : "/"; }} darkMode={darkMode} setDarkMode={toggleDarkMode} onChangePassword={() => setShowChangePassword(true)} />;
  }

  return (
    <div style={{ fontFamily: font, width: "100vw", minHeight: "100vh", backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 48, height: 48, border: `4px solid ${c.cardBorder}`, borderTop: `4px solid ${c.headerGreen}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <div style={{ color: c.warmGray, fontSize: 15 }}>Loading animals...</div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
