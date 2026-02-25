import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchProductsAsItems } from "../../services/products";
import { getItemCounts } from "../../services/api";
import "./Home.css";

// Category config
const CATEGORIES = {
  electronics: { label: "الکترونیک", icon: "💻", color: "#2563eb" },
  documents: { label: "مدارک", icon: "📄", color: "#16a34a" },
  clothing: { label: "پوشاک", icon: "👕", color: "#db2777" },
  other: { label: "سایر", icon: "📦", color: "#f59e0b" },
};

async function fetchRecentItems() {
  const items = await fetchProductsAsItems({ page: 0, size: 4, useCache: false });
  return items
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      location: item.locationText,
      timestamp: item.timestamp,
    }));
}

async function fetchStats() {
  const response = await getItemCounts();
  const data = response?.data || {};
  return {
    todayItems: data.today_reported || 0,
    totalItems: data.all_reported || 0,
    resolvedItems: data.returned || 0,
  };
}

/* ========== Item Card Component ========== */
function ItemCard({ item }) {
  const category = CATEGORIES[item.category] || CATEGORIES.other;
  const formattedDate = new Date(item.timestamp).toLocaleDateString("fa-IR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      to={`/items/${item.id}`}
      state={{ item }}
      className="home-item-card"
    >
      <div className="item-icon" style={{ backgroundColor: category.color }}>
        {category.icon}
      </div>
      <div className="item-content">
        <span className="item-category" style={{ color: category.color }}>
          {category.label}
        </span>
        <h4 className="item-name">{item.name}</h4>
        <p className="item-location">
          <span>📍</span> {item.location}
        </p>
        <p className="item-time">{formattedDate}</p>
      </div>
    </Link>
  );
}

/* ========== Skeleton Card ========== */
function SkeletonCard() {
  return (
    <div className="home-item-card skeleton">
      <div className="item-icon skeleton-icon" />
      <div className="item-content">
        <div className="skeleton-line short" />
        <div className="skeleton-line" />
        <div className="skeleton-line medium" />
      </div>
    </div>
  );
}

/* ========== Main Home Component ========== */
export default function Home() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetchRecentItems()
      .then(setItems)
      .finally(() => setLoadingItems(false));

    fetchStats()
      .then(setStats)
      .finally(() => setLoadingStats(false));
  }, []);

  return (
    <div className="home-container">
      <main className="home-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-card">
            <div className="hero-badge">🔍 سامانه گم‌شده و پیداشده</div>
            <h1 className="hero-title">
              شریف <span className="highlight">گم‌شده و پیداشده</span>
            </h1>
            <p className="hero-subtitle">
              شیء گم‌شده‌ای پیدا کردید؟ یا چیزی گم کرده‌اید؟
              <br />
              با کمک نقشه تعاملی، اشیاء گم‌شده را ثبت و جستجو کنید.
            </p>
            <div className="hero-actions">
              <Link to="/map" className="btn btn-primary">
                <span>🗺️</span> مشاهده نقشه
              </Link>
              {!isLoggedIn && (
                <Link to="/signup" className="btn btn-secondary">
                  <span>👤</span> ثبت‌نام
                </Link>
              )}
              {isLoggedIn && (
                <Link to="/add" className="btn btn-secondary">
                  <span>📝</span> ثبت شیء جدید
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">📦</div>
              <div className="stat-info">
                {loadingStats ? (
                  <div className="stat-skeleton" />
                ) : (
                  <span className="stat-value">
                    {stats?.todayItems?.toLocaleString("fa-IR") || "۰"}
                  </span>
                )}
                <span className="stat-label">اشیاء امروز</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">📊</div>
              <div className="stat-info">
                {loadingStats ? (
                  <div className="stat-skeleton" />
                ) : (
                  <span className="stat-value">
                    {stats?.totalItems?.toLocaleString("fa-IR") || "۰"}
                  </span>
                )}
                <span className="stat-label">کل ثبت‌شده</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon pink">✅</div>
              <div className="stat-info">
                {loadingStats ? (
                  <div className="stat-skeleton" />
                ) : (
                  <span className="stat-value">
                    {stats?.resolvedItems?.toLocaleString("fa-IR") || "۰"}
                  </span>
                )}
                <span className="stat-label">بازگردانده‌شده</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="actions-section">
          <h2 className="section-title">دسترسی سریع</h2>
          <div className="actions-grid">
            <Link to="/map" className="action-card">
              <span className="action-icon">🗺️</span>
              <h3>جستجو در نقشه</h3>
              <p>اشیاء گم‌شده را روی نقشه ببینید</p>
            </Link>
            <Link to="/add" className="action-card">
              <span className="action-icon">📝</span>
              <h3>ثبت شیء پیداشده</h3>
              <p>شیء پیدا کردید؟ اینجا ثبت کنید</p>
            </Link>
            <Link to="/items" className="action-card">
              <span className="action-icon">📋</span>
              <h3>مرور همه اشیاء</h3>
              <p>لیست کامل اشیاء ثبت‌شده</p>
            </Link>
          </div>
        </section>

        {/* Recent Items */}
        <section className="recent-section">
          <div className="section-header">
            <h2 className="section-title">آخرین اشیاء</h2>
            <Link to="/items" className="view-all">
              مشاهده همه ←
            </Link>
          </div>
          <div className="items-grid">
            {loadingItems
              ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
              : items.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        </section>
      </main>
    </div>
  );
}
