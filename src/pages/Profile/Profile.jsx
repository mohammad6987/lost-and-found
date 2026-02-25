import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, getUserData, clearAuth } from "../../services/auth";
import { getUserProfile, getCurrentUser } from "../../services/api";
import "./Profile.css";

// Mock user data - TODO: Replace with actual API call
const MOCK_USER_PROFILE = {
  name: "علی محمدی",
  email: "ali.mohammadi@sharif.edu",
  studentId: "99101234",
  department: "مهندسی کامپیوتر",
  joinedDate: "1403/08/15",
  itemsReported: 5,
  itemsFound: 3,
  avatar: null,
};

// Mock user items - TODO: Replace with actual API call
const MOCK_USER_ITEMS = [
  {
    id: 1,
    name: "کیف لپتاپ مشکی",
    type: "lost",
    status: "active",
    date: "1404/10/01",
    location: "کتابخانه مرکزی",
  },
  {
    id: 2,
    name: "فلش مموری ۱۶ گیگ",
    type: "found",
    status: "resolved",
    date: "1404/09/25",
    location: "سلف دانشجویی",
  },
  {
    id: 3,
    name: "عینک طبی",
    type: "lost",
    status: "active",
    date: "1404/09/20",
    location: "دانشکده برق",
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userItems, setUserItems] = useState([]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        // Check if profile data exists in localStorage cache
        const cachedProfile = localStorage.getItem("userProfileCache");
        
        if (cachedProfile) {
          // Use cached profile data
          const profileData = JSON.parse(cachedProfile);
          setUserProfile(profileData);
          setIsLoading(false);
          return;
        }

        // Fetch from API if no cache
        const profileData = await getUserProfile();
        const currentUserData = await getCurrentUser();
        const email = JSON.parse(sessionStorage.getItem("user_data")).email;

        // Transform API data to match component needs
        const transformedProfile = {
          name: profileData?.user_name || currentUserData?.username || "کاربر",
          email: email || "نامشخص",
          phoneNumber: profileData?.phone_number || "-",
          department: profileData?.department || "نامشخص",
          preferredContact: profileData?.preferred_contact_method || "email",
          socialMedia: profileData?.social_media_links || {},
          profilePic: profileData?.profile_pic || null,
          itemsReported: 0,
          itemsFound: 0,
          joinedDate: "نامشخص",
        };

        // Cache the profile data in localStorage
        localStorage.setItem("userProfileCache", JSON.stringify(transformedProfile));

        setUserProfile(transformedProfile);

        // Simulate loading state completion
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Error loading profile data:", error);
        // Keep form functional even if API fails
        const fallbackProfile = {
          name: "کاربر",
          email: getUserData()?.email || "نامشخص",
          phoneNumber: "-",
          department: "نامشخص",
          preferredContact: "email",
          socialMedia: {},
          profilePic: null,
          itemsReported: 0,
          itemsFound: 0,
          joinedDate: "نامشخص",
        };
        
        // Cache even the fallback data
        localStorage.setItem("userProfileCache", JSON.stringify(fallbackProfile));
        setUserProfile(fallbackProfile);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleLogout = () => {
    // Clear cached profile data on logout
    localStorage.removeItem("userProfileCache");
    clearAuth();
    navigate("/login");
  };

  const handleRefreshProfile = async () => {
    setIsRefreshing(true);
    try {
      // Clear cache to force API fetch
      localStorage.removeItem("userProfileCache");

      // Fetch fresh data from API
      const profileData = await getUserProfile();
      const currentUserData = await getCurrentUser();

      // Transform API data to match component needs
      const transformedProfile = {
        name: profileData?.user_name || currentUserData?.username || "کاربر",
        email: currentUserData?.email || "نامشخص",
        phoneNumber: profileData?.phone_number || "-",
        department: profileData?.department || "نامشخص",
        preferredContact: profileData?.preferred_contact_method || "email",
        socialMedia: profileData?.social_media_links || {},
        profilePic: profileData?.profile_pic || null,
        itemsReported: 0,
        itemsFound: 0,
        joinedDate: "نامشخص",
      };

      // Cache the new profile data
      localStorage.setItem("userProfileCache", JSON.stringify(transformedProfile));
      setUserProfile(transformedProfile);
    } catch (error) {
      console.error("Error refreshing profile:", error);
      alert("خطا در به‌روزرسانی پروفایل. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="loading-spinner" />
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <div className="header-content">
          <Link to="/" className="back-btn">
            <span>→</span>
            بازگشت
          </Link>
          <h1>پروفایل کاربری</h1>
          <button
            className="refresh-btn"
            onClick={handleRefreshProfile}
            disabled={isRefreshing}
            title="به‌روزرسانی پروفایل"
          >
            {isRefreshing ? "⏳" : "🔄"}
          </button>
        </div>
      </header>

      <main className="profile-main">
        {/* Profile Card */}
        <section className="profile-card">
          <div className="profile-avatar">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt={userProfile.name} />
            ) : (
              <span className="avatar-placeholder">👤</span>
            )}
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{userProfile?.name}</h2>
            <p className="profile-email" dir="ltr">{userProfile?.email}</p>
            <div className="profile-badges">
              <span className="badge badge-blue">
                🏫 {userProfile?.department}
              </span>
              <span className="badge badge-gray">
                📱 {userProfile?.phoneNumber}
              </span>
            </div>
          </div>
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-number">{userProfile?.itemsReported || 0}</span>
              <span className="stat-text">گزارش شده</span>
            </div>
            <div className="profile-stat">
              <span className="stat-number">{userProfile?.itemsFound || 0}</span>
              <span className="stat-text">پیدا شده</span>
            </div>
            <div className="profile-stat">
              <span className="stat-number">
                {userProfile?.preferredContact === "email" ? "📧" : "📱"}
              </span>
              <span className="stat-text">روش تماس: {userProfile?.preferredContact}</span>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            اطلاعات حساب
          </button>
          <button
            className={`tab-btn ${activeTab === "items" ? "active" : ""}`}
            onClick={() => setActiveTab("items")}
          >
            اشیاء من
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "info" && (
            <section className="info-section">
              <div className="info-card">
                <h3>اطلاعات شخصی</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">نام کاربری</span>
                    <span className="info-value">{userProfile?.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">ایمیل</span>
                    <span className="info-value" dir="ltr">{userProfile?.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">شماره تلفن</span>
                    <span className="info-value" dir="ltr">{userProfile?.phoneNumber}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">دانشکده</span>
                    <span className="info-value">{userProfile?.department}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">روش تماس ترجیحی</span>
                    <span className="info-value">
                      {userProfile?.preferredContact === "email" ? "📧 ایمیل" : "📱 تلفن"}
                    </span>
                  </div>
                  {userProfile?.socialMedia && Object.keys(userProfile.socialMedia).length > 0 && (
                    <div className="info-item">
                      <span className="info-label">شبکه‌های اجتماعی</span>
                      <span className="info-value">
                        {Object.keys(userProfile.socialMedia).join(", ") || "ندارد"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="info-card">
                <h3>عملیات حساب</h3>
                <div className="actions-list">
                  <Link to="/change-password" className="action-item">
                    <span className="action-icon">🔑</span>
                    <span className="action-text">تغییر رمز عبور</span>
                    <span className="action-arrow">←</span>
                  </Link>
                  <button className="action-item logout" onClick={handleLogout}>
                    <span className="action-icon">🚪</span>
                    <span className="action-text">خروج از حساب</span>
                    <span className="action-arrow">←</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === "items" && (
            <section className="items-section">
              {userItems.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📦</span>
                  <h3>هنوز شیئی ثبت نکرده‌اید</h3>
                  <p>اولین شیء گم‌شده یا پیداشده خود را ثبت کنید</p>
                  <Link to="/items/new" className="btn btn-primary">
                    ثبت شیء جدید
                  </Link>
                </div>
              ) : (
                <div className="items-list">
                  {userItems.map((item) => (
                    <Link key={item.id} to={`/items/${item.id}`} className="item-card">
                      <div className={`item-type ${item.type}`}>
                        {item.type === "LOST" ? "🔴 گم‌شده" : "🟢 پیداشده"}
                      </div>
                      <div className="item-details">
                        <h4 className="item-name">{item.name}</h4>
                        <p className="item-meta">
                          <span>📍 {item.location}</span>
                          <span>📅 {item.date}</span>
                        </p>
                      </div>
                      <div className={`item-status ${item.status}`}>
                        {item.status === "active" ? "فعال" : "حل شده"}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
