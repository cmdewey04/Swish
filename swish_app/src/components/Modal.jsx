import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, onClose, children }) {
  // Close on Esc
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Use mousedown so the click doesn't "fall through" after unmount
  const handleBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] grid place-items-center transitions-colors ${
        open ? "visible bg-black/20" : "invisible"
      }`}
      onClick={onClose}
      onMouseDown={handleBackdropMouseDown}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-600 dark:bg-gray-900 rounded-xl shadow p-6"
        onMouseDown={(e) => e.stopPropagation()} // keep clicks inside
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
