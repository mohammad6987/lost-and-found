import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./TopBar.css";

function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const name = JSON.parse(sessionStorage.getItem("user_data")).name;
  const displayName = name || "کاربر";

  return (
    <div className="topbar-user" ref={menuRef}>
      <button
        className="topbar-user__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="topbar-user__avatar">👤</span>
        <span className="topbar-user__name">{displayName}</span>
        <span className={`topbar-user__arrow ${isOpen ? "open" : ""}`}>
          ▼
        </span>
      </button>

      {isOpen ? (
        <div className="topbar-user__dropdown" role="menu">
          <div className="topbar-user__header">
            <span className="topbar-user__email">{user?.email || "کاربر"}</span>
          </div>
          <div className="topbar-user__divider" />
          <Link
            to="/profile"
            className="topbar-user__item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <span className="topbar-user__icon">👤</span>
            پروفایل من
          </Link>
          <button
            className="topbar-user__item topbar-user__logout"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              logout();
              navigate("/");
            }}
          >
            <span className="topbar-user__icon">🚪</span>
            خروج از حساب
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function TopBar() {
  const { isLoggedIn } = useAuth();

  return (
    <header className="app-topbar" dir="rtl">
      <div className="app-topbar__content">
        <Link to="/" className="app-topbar__brand">
          <span className="app-topbar__brand-icon">🎓</span>
          <span className="app-topbar__brand-text">شریف گم‌شده</span>
        </Link>
        <nav className="app-topbar__nav">
          <Link to="/map" className="app-topbar__link">
            نقشه
          </Link>
          <Link to="/bot" className="app-topbar__link">
            چت‌بات
          </Link>
          {isLoggedIn ? (
            <UserMenu />
          ) : (
            <>
              <Link to="/signup" className="app-topbar__link">
                ثبت‌نام
              </Link>
              <Link to="/login" className="app-topbar__link app-topbar__link--cta">
                ورود
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
