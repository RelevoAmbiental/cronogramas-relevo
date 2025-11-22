import React from "react";
import "./modal.css"; // criaremos o CSS abaixo

export default function Modal({ open, onClose, children, title }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
