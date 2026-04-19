import { PLACEHOLDER_CAT, PLACEHOLDER_DOG } from "./constants.js";
import {
  stripHtml,
  computeDisplayAge,
  computeAgeFromBirthdate,
  parseLocationFromSummary,
} from "./utils.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API SERVICE LAYER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * All frontend API calls go through this `api` object. Each method connects to
 * the Express backend running on port 3000 (proxied via package.json).
 */

// Module-level auth token — set on login, cleared on logout.
// Lets all api methods attach the Bearer header without prop drilling.
let _authToken = null;
let _onAccountExpired = null;

export const authH = () =>
  _authToken ? { Authorization: `Bearer ${_authToken}` } : {};

export function applyToken(token) {
  _authToken = token;
}

export function clearToken() {
  _authToken = null;
}

export function setOnAccountExpired(callback) {
  _onAccountExpired = callback;
}

function handleApiError(res, data) {
  if (res.status === 401) {
    if (_onAccountExpired) _onAccountExpired(data?.error || "Unauthorized");
    throw new Error(data?.error || "Unauthorized");
  }
  throw new Error(data?.error || "API request failed");
}

export const noteDataCache = new Map();

export const mockPets = [
  {
    petId: "12345678910",
    name: "Fluffly",
    species: "Cat",
    location: "Cat W:5",
    arn: "736727",
    status: "available",
    imageUrl: PLACEHOLDER_CAT,
    handlerLevel: "green",
  },
  {
    petId: "12345678912",
    name: "Whiskers",
    species: "Cat",
    location: "Cat W:5",
    arn: "736729",
    status: "available",
    imageUrl: PLACEHOLDER_CAT,
    handlerLevel: "pink",
  },
  {
    petId: "12345678913",
    name: "Mittens",
    species: "Cat",
    location: "Cat W:5",
    arn: "736730",
    status: "available",
    imageUrl: PLACEHOLDER_CAT,
    handlerLevel: "yellow",
  },
];

// Transform backend observer note shape ({ id, title, content, author, petId, timestamp })
// into frontend shape ({ id, petId, case, by, status, type, body, createdAt })
export const transformObserverNote = (note, index) => ({
  id: note.id || Date.now() + index,
  petId: String(note.petId),
  case: note.title || note.case || "General Observation",
  by: note.author || note.by || "Unknown",
  status: note.status || "Raised",
  type: note.type || "medical",
  body: note.content || note.body || "",
  createdAt: note.timestamp || note.createdAt || new Date().toISOString(),
});

const sortByNewestFirst = (notes) =>
  [...notes].sort((a, b) => {
    const tA = new Date(a?.createdAt || 0).getTime() || 0;
    const tB = new Date(b?.createdAt || 0).getTime() || 0;
    return tB - tA;
  });

export const api = {
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
          imageUrl:
            p.image ||
            (p.species === "Cat" ? PLACEHOLDER_CAT : PLACEHOLDER_DOG),
          summary: p.summary || "",
          arn: p.rescueId || "N/A",
          handlerLevel: (p.otherNames || "green").toLowerCase(),
          status: p.status || "Unknown",
          breed: p.breed || "",
          age: p.birthdate
            ? computeAgeFromBirthdate(p.birthdate)
            : computeDisplayAge(
                plainDesc,
                p.createdDate,
                p.receivedDate,
                p.generalAge,
                p.species,
              ),
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
    const res = await fetch(
      `/api/location/${petType}/${encodeURIComponent(location)}${refresh ? "?refresh=true" : ""}`,
      { headers: authH() },
    );
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
        imageUrl:
          pet.image || (petType === "cat" ? PLACEHOLDER_CAT : PLACEHOLDER_DOG),
        summary: pet.summary || "",
        status: pet.status || "Unknown",
      }));
    }
    throw new Error("No animals found at this location");
  },

  // REAL — connected to GET /api/pets/:petId/observer-notes
  getNotes: async (petId) => {
    try {
      const res = await fetch(`/api/pets/${petId}/observer-notes`, {
        headers: authH(),
      });
      if (!res.ok) throw new Error("Failed to fetch notes");
      const data = await res.json();
      if (data.success && Array.isArray(data.observerNotes)) {
        return sortByNewestFirst(data.observerNotes.map(transformObserverNote));
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

  // REAL — connected to DELETE /api/observer-notes/:id
  deleteNote: async (noteId) => {
    try {
      await fetch(`/api/observer-notes/${noteId}`, {
        method: "DELETE",
        headers: authH(),
      });
    } catch (err) {
      console.warn("deleteNote failed", err);
    }
  },

  // REAL — connected to DELETE /api/behavior-notes/:id
  deleteBehaviorNote: async (noteId) => {
    try {
      await fetch(`/api/behavior-notes/${noteId}`, {
        method: "DELETE",
        headers: authH(),
      });
    } catch (err) {
      console.warn("deleteBehaviorNote failed", err);
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
          status: note.status,
        }),
      });
      if (!res.ok) throw new Error("Failed to create note");
      const data = await res.json();
      if (data.success && data.observerNote && data.observerNote.id != null) {
        return transformObserverNote(
          { ...data.observerNote, status: note.status },
          0,
        );
      }
      throw new Error("Failed to create observer note");
    } catch (err) {
      console.warn("createNote failed", err);
      throw err;
    }
  },

  // REAL — connected to GET /api/pets/:petId/behavior-notes
  getBehaviorNotes: async (petId) => {
    try {
      const res = await fetch(`/api/pets/${petId}/behavior-notes`, {
        headers: authH(),
      });
      if (!res.ok) throw new Error("Failed to fetch behavior notes");
      const data = await res.json();
      if (data.success && Array.isArray(data.behaviorNotes)) {
        return sortByNewestFirst(
          data.behaviorNotes.map((note, i) => ({
            id: note.id || Date.now() + i,
            petId: String(note.petId),
            case: note.title || note.case || "Behavior Observation",
            by: note.author || "Unknown",
            body: note.content || "",
            createdAt: note.timestamp || new Date().toISOString(),
          })),
        );
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
      if (data.success && data.behaviorNote && data.behaviorNote.id != null) {
        return {
          id: data.behaviorNote.id,
          petId: String(data.behaviorNote.petId),
          case: data.behaviorNote.title || note.case,
          by: data.behaviorNote.author || note.by,
          body: data.behaviorNote.content || note.body,
          createdAt: data.behaviorNote.timestamp || new Date().toISOString(),
        };
      }
      throw new Error("Failed to create behavior note");
    } catch (err) {
      console.warn("createBehaviorNote failed", err);
      throw err;
    }
  },

  // REAL — connected to POST /api/search (NLP keyword search on observer notes)
  searchNotes: async (query, petId) => {
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
        body: JSON.stringify({
          query,
          petId: petId ? parseInt(petId, 10) : undefined,
          maxResults: 20,
        }),
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
  getSummary: async (petId, prompt) => {
    try {
      const res = await fetch(`/api/pets/${petId}/behavior-notes/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
        body: JSON.stringify({
          prompt: prompt || "Summarize the note data in 2-5 concise sentences",
        }),
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
      const res = await fetch(`/api/animals/all?page=${page}&limit=${limit}`, {
        headers: authH(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        handleApiError(res, data);
      }
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

  getAllAnimalsAllPages: async (limit = 400) => {
    const first = await api.getAllAnimals(1, limit);
    if (!first) return null;

    const totalPages = first.totalPages || 1;
    if (totalPages <= 1) return first.animals || [];

    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        api.getAllAnimals(i + 2, limit),
      ),
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
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  },

  refreshToken: async () => {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) handleApiError(res, data);
    return data.accessToken;
  },

  changePassword: async (token, currentPassword, newPassword) => {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Password change failed");
    return data;
  },

  getUsers: async (token) => {
    const res = await fetch("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch users");
    return data.users || [];
  },

  createUser: async (token, userData) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create user");
    return data.user;
  },

  updateUser: async (token, userId, updates) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update user");
    return data.user;
  },

  deleteUser: async (token, userId) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete user");
    }
  },

  resetUserPassword: async (token, userId, newPassword) => {
    const res = await fetch(`/api/users/${userId}/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reset password");
    return data;
  },

  batchCreateUsers: async (token, csvText) => {
    const res = await fetch("/api/users/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ csv: csvText }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Batch create failed");
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
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch activity logs");
    return data;
  },
};

// Helper used only internally in api.js — not exported since it's inlined above
function parseWeightFromDesc(desc) {
  if (!desc) return null;
  const m = desc.match(/(\d+)\s*(?:pounds?|lbs?)/i);
  return m ? `${m[1]} lbs` : null;
}
