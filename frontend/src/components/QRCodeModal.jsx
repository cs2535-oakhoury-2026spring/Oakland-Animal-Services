import { useFocusTrap, useEscapeKey } from "../hooks.js";
import Icons from "../Icons.jsx";
import './QRCodeModal.css';

// ─── QR Code Modal ───────────────────────────────────────────────────────────
export default function QRCodeModal({ pet, onClose }) {
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  return (
    <div
      className="qr-modal__overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="QR code"
    >
      <div
        ref={focusTrapRef}
        className="qr-modal__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="qr-modal__title">Scan QR Code</h2>
        <div className="qr-modal__image-box">
          <div className="qr-modal__image-inner">
            <Icons.qrCode size={80} color="var(--clr-text-primary)" />
            <div className="qr-modal__placeholder-label">QR Placeholder</div>
          </div>
        </div>
        <div className="qr-modal__description">
          Scan to open <strong>{pet.name}</strong>'s profile
        </div>
        <button className="qr-modal__close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
