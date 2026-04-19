// ─── Shared Constants ─────────────────────────────────────────────────────────

export const PLACEHOLDER_CAT = "/DogSHADOW.png";
export const PLACEHOLDER_DOG = "/DogSHADOW.png";

export const HANDLER_LEVEL_COLORS = {
  green: "#4CAF50",
  yellow: "#FFC107",
  blue: "#2196F3",
  pink: "#E91E63",
};

export const CURRENT_STATUSES = new Set(["available", "foster"]);

export const NOTES_PER_PAGE = 5;

export const GENERAL_AGE_RANGES = {
  dog:  { Baby: "< 1y", Young: "1–3y", Adult: "3–8y",  Senior: "8y+"  },
  cat:  { Baby: "< 1y", Young: "1–3y", Adult: "3–10y", Senior: "10y+" },
  default: { Baby: "< 1y", Young: "1–3y", Adult: "3–9y", Senior: "9y+" },
};

export function isCurrentAnimal(pet) {
  const s = (pet.status || "").toLowerCase().trim();
  if (!s || s === "unknown") return true;
  return CURRENT_STATUSES.has(s);
}

