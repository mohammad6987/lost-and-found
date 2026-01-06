import React from "react";
import { UI_TEXT } from "./textFormat";
import { THEME } from "../../pages/Item/itemTheme";

export default function Modal({ title, onClose, children }) {
  return (
    <div
      dir="rtl"
      style={{
        ...UI_TEXT.page.style,
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        className="card shadow"
        style={{
          width: "100%",
          maxWidth: 760,
          borderColor: THEME.border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header bg-white d-flex align-items-center justify-content-between">
          <strong>{title}</strong>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            بستن
          </button>
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
}
