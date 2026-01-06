import React from "react";
import { UI_TEXT } from "./textFormat";

export default function FieldBlock({
  title,
  icon = null,
  htmlFor = undefined,
  hint = null,
  error = null,
  children,
}) {
  return (
    <div className="mb-3">
      <div
        className="d-flex align-items-center gap-2"
        style={{
          ...UI_TEXT.page.style,
          justifyContent: "flex-start", 
        }}
      >
        {}
        {icon ? <span className="d-inline-flex">{icon}</span> : null}

        {}
        {htmlFor ? (
          <label
            htmlFor={htmlFor}
            className="form-label m-0"
            style={{ fontWeight: 700 }}
          >
            {title}
          </label>
        ) : (
          <div className="form-label m-0" style={{ fontWeight: 700 }}>
            {title}
          </div>
        )}
      </div>

      <div className="mt-2">{children}</div>

      {}
      {hint && !error ? (
        <div className="form-text text-end">{hint}</div>
      ) : null}

      {}
      {error ? (
        <div className="text-danger small text-end mt-1">{error}</div>
      ) : null}
    </div>
  );
}
