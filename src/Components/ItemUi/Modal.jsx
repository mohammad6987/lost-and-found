import React from "react";
import { UI_TEXT } from "./textFormat";
import { THEME } from "../../pages/Item/itemTheme";

export default function Modal({ title, onClose, children }) {
  return (
    <div
      dir="rtl"
      className="item-modal"
      style={{
        ...UI_TEXT.page.style,
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.38)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 24px",
        zIndex: 1100,
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        className="card shadow"
        style={{
          width: "100%",
          maxWidth: 980,
          maxHeight: "calc(100vh - 32px)",
          borderColor: THEME.border,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header bg-white d-flex align-items-center justify-content-between">
          <strong>{title}</strong>
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
}
