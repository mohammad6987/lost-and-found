import { Link } from "react-router-dom";
import "./AppFooter.css";

export default function AppFooter() {
  return (
    <footer className="app-footer" dir="rtl">
      <div className="app-footer__content">
        <div className="app-footer__brand">
          <span>🎓</span> سامانه گم‌شده و پیداشده دانشگاه شریف
        </div>
        <nav className="app-footer__nav">
          <Link to="/map">نقشه</Link>
          <Link to="/terms">قوانین</Link>
          <Link to="/about">درباره ما</Link>
          <Link to="/contact">تماس</Link>
        </nav>
        <p className="app-footer__copy">© ۱۴۰۴ - دانشگاه صنعتی شریف</p>
      </div>
    </footer>
  );
}
