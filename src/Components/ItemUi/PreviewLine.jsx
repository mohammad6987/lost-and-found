import React from "react";
import { UI_TEXT } from "./textFormat";

export default function PreviewLine({ label, value }) {
  return (
    <div
      className="py-2"
      style={{
        ...UI_TEXT.page.style,
        display: "flex",
        alignItems: "baseline",
        justifyContent: "flex-start", // RTL => سمت راست
        gap: 10,
      }}
    >
      <span style={{ fontWeight: 700 }}>{label}:</span>
      <span className="text-muted" style={{ fontSize: "0.92rem", fontWeight: 400 }}>
        {value}
      </span>
    </div>
  );
}
