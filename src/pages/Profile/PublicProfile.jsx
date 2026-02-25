import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUserProfileById } from "../../services/api";
import "./Profile.css";

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    getUserProfileById(id)
      .then((data) => {
        if (!mounted) return;
        const normalized = {
          name:
            data?.name ||
            data?.full_name ||
            data?.user_name ||
            data?.username ||
            data?.user?.username ||
            "کاربر",
          department: data?.department || "نامشخص",
          joinedDate: data?.created_at || data?.createdAt || "نامشخص",
          profilePic: data?.profile_pic || data?.avatar || null,
        };
        setProfile(normalized);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "خطا در دریافت پروفایل.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="profile-container public-profile">
        <div className="profile-loading">
          <div className="loading-spinner" />
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container public-profile">
        <div className="profile-loading">
          <p className="text-danger">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container public-profile">
      <header className="profile-header">
        <div className="header-content">
          <Link to="/" className="back-btn">
            <span>→</span>
            بازگشت
          </Link>
          <h1>پروفایل عمومی</h1>
          <span />
        </div>
      </header>

      <div className="profile-main">
        <section className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {profile?.profilePic ? (
                <img src={profile.profilePic} alt={profile.name} />
              ) : (
                <span className="avatar-placeholder">👤</span>
              )}
            </div>
            <div className="profile-info">
              <h2>{profile?.name || "کاربر"}</h2>
              <p className="profile-subtitle">پروفایل عمومی</p>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-label">دانشکده</span>
              <span className="stat-value">{profile?.department || "نامشخص"}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">عضویت</span>
              <span className="stat-value">{profile?.joinedDate || "نامشخص"}</span>
            </div>
          </div>
        </section>

        <section className="profile-card">
          <h3 className="section-title">اطلاعات عمومی</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">نام</span>
              <span className="info-value">{profile?.name || "—"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">دانشکده</span>
              <span className="info-value">{profile?.department || "—"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">تاریخ عضویت</span>
              <span className="info-value">{profile?.joinedDate || "—"}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
