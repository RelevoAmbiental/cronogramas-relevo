import React from "react";
import "./modal.css";

export default function Modal({ open, onClose, children, title }) {
  if (!open) return null;

  return (
    <div className="relevo-modal-overlay" onClick={onClose}>
      <div
        className="relevo-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relevo-modal-header">
          <h2>{title}</h2>
          <button className="relevo-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="relevo-modal-body">{children}</div>
      </div>
    </div>
  );
}
