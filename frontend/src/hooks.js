import { useState, useEffect, useRef } from "react";

// ─── Focus Trap Hook for Modals (WCAG 2.1 AA) ─────────────────────────────────
export function useFocusTrap(isOpen) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = container.querySelectorAll(focusableSelectors);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when modal opens
    const timeoutId = setTimeout(() => firstElement?.focus(), 50);

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

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

    container.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return containerRef;
}

// ─── Escape Key Hook for Modals ───────────────────────────────────────────────
export function useEscapeKey(onClose, isOpen) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isOpen]);
}

// ─── Responsive Hook ─────────────────────────────────────────────────────────
export function useResponsive() {
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
