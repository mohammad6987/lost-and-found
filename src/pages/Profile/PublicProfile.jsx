import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUserProfileById } from "../../services/api";
import "./PublicProfile.css";

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getUserProfileById(id);
        if (!mounted) return;

        setProfile({
          id: data.user_id,
          name: data.user_name,
          department: data.department,
          bio: data.bio,
          avatar: data.profile_pic,
          contact: data.preferred_contact_method,
          isPublic: data.is_public,
        });
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "خطا در دریافت پروفایل.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

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
          <p style={{ color: "#dc2626" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
  <div className="profile-container public-profile">
    
    {/* Top Bar */}
    <div className="profile-topbar">
      <Link to="/" className="back-btn">
        ← بازگشت
      </Link>
    </div>

    {/* Page Title */}
    <div className="profile-page-title">
      <h1>پروفایل عمومی</h1>
    </div>

    <main className="profile-main">
      
      {/* Main Card */}
      <section className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {profile?.avatar ? (
              <img src={profile.avatar} alt={profile.name} />
            ) : (
              <div className="generated-avatar">
                {profile?.name
                  ? profile.name.charAt(0).toUpperCase()
                  : "U"}
              </div>
            )}
          </div>

          <div className="profile-info">
            <h2>{profile?.name || "کاربر"}</h2>
            <p className="profile-subtitle">
              {profile?.isPublic
                ? "پروفایل عمومی"
                : "پروفایل خصوصی"}
            </p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-label">دانشکده</div>
            <div className="stat-value">
              {profile?.department || "نامشخص"}
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-label">روش ارتباط ترجیحی</div>
            <div className="stat-value">
              {profile?.contact || "نامشخص"}
            </div>
          </div>
        </div>
      </section>

      {/* Bio Card */}
      <section className="info-card">
        <h3>بیوگرافی</h3>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">توضیحات</div>
            <div className="info-value">
              {profile?.bio || "—"}
            </div>
          </div>
        </div>
      </section>

    </main>
  </div>
);
}