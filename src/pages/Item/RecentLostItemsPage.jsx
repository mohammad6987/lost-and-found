import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UI_TEXT } from "../../Components/ItemUi/textFormat";
import { THEME } from "./itemTheme";
import Modal from "../../Components/ItemUi/Modal";
import PreviewLine from "../../Components/ItemUi/PreviewLine";
import { CURRENT_USER, MOCK_ITEMS } from "../../mock/mockItems";
import "./ItemPages.css";

const CATEGORY_LABELS = {
  phones: "موبایل",
  handbags: "کیف دستی",
  wallets: "کیف پول",
  keys: "کلید",
  id_cards: "کارت شناسایی / دانشجویی",
  laptops: "لپ‌تاپ",
  other: "سایر",
};

function EditIcon({ onClick }) {
  return (
    <button
      type="button"
      className="btn btn-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title="ویرایش"
      style={{
        border: `1px solid ${THEME.border}`,
        color: THEME.primary,
      }}
    >
      ✎
    </button>
  );
}

function fmt(tsIso) {
  try {
    return new Date(tsIso).toLocaleString();
  } catch {
    return tsIso;
  }
}

export default function RecentLostItemsPage() {
  const nav = useNavigate();
  const [selected, setSelected] = useState(null);

  const lostItems = useMemo(() => {
    return MOCK_ITEMS
      .filter((x) => x.type === "lost")
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, []);

  function openItem(item) {
    setSelected(item);
  }

  function closeModal() {
    setSelected(null);
  }

  function goEdit(item) {
    nav(`/items/${item.id}/edit`, { state: { item } });
  }

  function goChat(item) {
    nav(`/chat/${item.relatedProfile}`, { state: { itemId: item.id } });
  }

  return (
    <div
      {...UI_TEXT.page}
      className="item-page item-page--list"
      style={{ ...UI_TEXT.page.style, color: THEME.text }}
    >
      <div className="py-4 px-3 item-page__content">
        <div className="mx-auto" style={{ width: "100%", maxWidth: 900 }}>
          <header className="text-center mb-4">
            <h1 className="h3 mb-2">اشیای گمشده اخیر</h1>
            <div className="text-muted">
              روی هر ردیف کلیک کنید تا جزئیات را ببینید.
            </div>
          </header>

          <div className="card shadow-sm" style={{ borderColor: THEME.border }}>
            <div className="card-body p-0">
              {lostItems.length === 0 ? (
                <div className="p-4 text-center text-muted">موردی وجود ندارد.</div>
              ) : (
                <div className="list-group list-group-flush">
                  {lostItems.map((item) => {
                    const isOwner = item.relatedProfile === CURRENT_USER;
                    return (
                      <button
                        key={item.id}
                        className="list-group-item list-group-item-action"
                        onClick={() => openItem(item)}
                        style={{ ...UI_TEXT.page.style }}
                      >
                        <div className="d-flex align-items-center justify-content-between gap-3">
                          <div className="d-flex flex-column align-items-start">
                            <div style={{ fontWeight: 700 }}>
                              {item.name || "—"}
                            </div>
                            <div className="text-muted" style={{ fontSize: "0.92rem" }}>
                              {fmt(item.createdAt)}
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="badge"
                              style={{
                                background: THEME.primarySoft,
                                color: THEME.primary,
                                border: `1px solid ${THEME.border}`,
                              }}
                            >
                              گمشده
                            </span>

                            {isOwner ? (
                              <EditIcon onClick={() => goEdit(item)} />
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
              )}
            </div>
<div
  className="d-flex justify-content-center py-3"
  style={{ borderTop: `1px solid ${THEME.border}` }}
>
  <button
    className="btn px-4"
    style={{
      backgroundColor: THEME.primary,
      borderColor: THEME.primary,
      color: "#fff",
      minWidth: 220,
    }}
    onClick={() => nav("/add")}
  >
    + افزودن شیء جدید
  </button>
</div>

          </div>

          {selected ? (
            <Modal title="جزئیات شیء" onClose={closeModal}>
              <div className="border-top" />
              <PreviewLine label="نوع" value={selected.type === "lost" ? "گمشده" : "پیداشده"} />
              <div className="border-top" />
              <PreviewLine label="نام" value={selected.name || "—"} />
              <div className="border-top" />
              <PreviewLine label="دسته‌بندی" value={CATEGORY_LABELS[selected.category] || "—"} />
              <div className="border-top" />
              <PreviewLine label="پروفایل مرتبط" value={selected.relatedProfile || "—"} />
              <div className="border-top" />
              <PreviewLine label="زمان ثبت" value={<span {...UI_TEXT.ltrInline}>{fmt(selected.createdAt)}</span>} />
              <div className="border-top" />
              <PreviewLine label="مکان" value="به‌زودی (قابلیت نقشه)" />
              <div className="border-top" />
              <PreviewLine label="توضیحات" value={selected.notes?.trim() ? selected.notes : "—"} />

              <div className="d-flex justify-content-center gap-2 mt-3">
                {selected.relatedProfile === CURRENT_USER ? (
                  <button
                    className="btn px-4"
                    style={{
                      backgroundColor: THEME.primary,
                      borderColor: THEME.primary,
                      color: "#fff",
                    }}
                    onClick={() => goEdit(selected)}
                  >
                    ویرایش شیء
                  </button>
                ) : (
                  <button
                    className="btn px-4"
                    style={{
                      backgroundColor: THEME.primary,
                      borderColor: THEME.primary,
                      color: "#fff",
                    }}
                    onClick={() => goChat(selected)}
                  >
                    تماس با صاحب شیء
                  </button>
                )}

                {selected.relatedProfile === CURRENT_USER ? (
                  <button className="btn btn-outline-secondary px-4" disabled>
                    شما صاحب این شیء هستید
                  </button>
                ) : (
                  <button className="btn btn-outline-secondary px-4" onClick={closeModal}>
                    بستن
                  </button>
                )}
                
              </div>
            </Modal>
          ) : null}
        </div>
      </div>
    </div>
  );
}
