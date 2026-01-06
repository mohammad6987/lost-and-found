import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { UI_TEXT } from "../../Components/ItemUi/textFormat";
import { THEME } from "./itemTheme";
import { CURRENT_USER } from "../../mock/mockItems";

export default function ChatPage() {
  const { username } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const itemId = loc.state?.itemId;

  return (
    <div {...UI_TEXT.page} style={{ ...UI_TEXT.page.style, color: THEME.text }}>
      <div className="py-4 px-3">
        <div className="mx-auto" style={{ width: "100%", maxWidth: 860 }}>
          <header className="text-center mb-4">
            <h1 className="h3 mb-2">گفتگو</h1>
            <div className="text-muted">
              شما ({CURRENT_USER}) ↔ {username} {itemId ? `• برای آیتم ${itemId}` : ""}
            </div>
          </header>

          <div className="card shadow-sm" style={{ borderColor: THEME.border }}>
            <div className="card-body text-center text-muted">
              این فقط یک صفحه‌ی تست است. بعداً به سیستم چت واقعی وصل می‌شود.
            </div>
          </div>

          <div className="d-flex justify-content-center mt-3">
            <button className="btn btn-outline-secondary px-4" onClick={() => nav("/items")}>
              بازگشت به لیست
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
