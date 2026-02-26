import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, getUserData, clearAuth, setUserData } from "../../services/auth";
import {
  getUserProfile,
  getCurrentUser,
  getItemCountsMe,
  updateUserProfile,
  updateUserEmail,
} from "../../services/api";
import { notifySuccess } from "../../services/notify";
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
  const [editForm, setEditForm] = useState({
    userName: "",
    phoneNumber: "",
    department: "",
    preferredContact: "email",
    bio: "",
    isPublic: true,
    socialLinks: "",
    profilePicFile: null,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

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
        let baseProfile = null;
        if (cachedProfile) {
          // Use cached profile data
          const profileData = JSON.parse(cachedProfile);
          baseProfile = profileData;
          setUserProfile(profileData);
          setIsLoading(false);
        }

        if (!baseProfile) {
          // Fetch from API if no cache
          const profileData = await getUserProfile();
          const currentUserData = await getCurrentUser();
          const storedUser = sessionStorage.getItem("user_data");
          const storedEmail = storedUser ? JSON.parse(storedUser)?.email : "";

          // Transform API data to match component needs
          baseProfile = {
            name: profileData?.user_name || currentUserData?.username || "کاربر",
            email: storedEmail || currentUserData?.email || "نامشخص",
            phoneNumber: profileData?.phone_number || "-",
            department: profileData?.department || "نامشخص",
            preferredContact: profileData?.preferred_contact_method || "email",
            socialMedia: profileData?.social_media_links || {},
            profilePic: profileData?.profile_pic || null,
            bio: profileData?.bio || "",
            isPublic: profileData?.is_public ?? true,
            itemsReported: 0,
            itemsFound: 0,
            joinedDate: "نامشخص",
          };
        }

        const counts = await getItemCountsMe().catch(() => null);
        const enrichedProfile = {
          ...baseProfile,
          itemsReported:
            counts?.lost_reported ?? baseProfile?.itemsReported ?? 0,
          itemsFound:
            counts?.found_reported ?? baseProfile?.itemsFound ?? 0,
        };

        // Cache the profile data in localStorage
        localStorage.setItem("userProfileCache", JSON.stringify(enrichedProfile));

        setUserProfile(enrichedProfile);

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
          bio: "",
          isPublic: true,
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
    notifySuccess("با موفقیت خارج شدید.");
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
      const counts = await getItemCountsMe().catch(() => null);

      // Transform API data to match component needs
      const transformedProfile = {
        name: profileData?.user_name || currentUserData?.username || "کاربر",
        email: currentUserData?.email || "نامشخص",
        phoneNumber: profileData?.phone_number || "-",
        department: profileData?.department || "نامشخص",
        preferredContact: profileData?.preferred_contact_method || "email",
        socialMedia: profileData?.social_media_links || {},
        profilePic: profileData?.profile_pic || null,
        bio: profileData?.bio || "",
        isPublic: profileData?.is_public ?? true,
        itemsReported: counts?.lost_reported ?? 0,
        itemsFound: counts?.found_reported ?? 0,
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

  useEffect(() => {
    if (!userProfile) return;
    setEditForm({
      userName: userProfile.name || "",
      phoneNumber: userProfile.phoneNumber === "-" ? "" : userProfile.phoneNumber || "",
      department: userProfile.department === "نامشخص" ? "" : userProfile.department || "",
      preferredContact: userProfile.preferredContact || "email",
      bio: userProfile.bio || "",
      isPublic: userProfile.isPublic ?? true,
      socialLinks: JSON.stringify(userProfile.socialMedia || {}, null, 2),
      profilePicFile: null,
    });
  }, [userProfile]);

  const handleSaveProfile = async () => {
    setProfileError("");
    setProfileSuccess("");
    setSavingProfile(true);
    try {
      const basePhone =
        userProfile?.phoneNumber === "-" ? "" : userProfile?.phoneNumber || "";
      const baseDepartment =
        userProfile?.department === "نامشخص" ? "" : userProfile?.department || "";
      let socialMediaLinks = undefined;
      if (editForm.socialLinks && editForm.socialLinks.trim()) {
        try {
          socialMediaLinks = JSON.parse(editForm.socialLinks);
        } catch {
          throw new Error("فرمت شبکه‌های اجتماعی باید JSON معتبر باشد.");
        }
      } else if (editForm.socialLinks === "") {
        socialMediaLinks = {};
      }

      const payload = {};
      const nextUserName = editForm.userName.trim();
      const nextPhone = editForm.phoneNumber.trim();
      const nextDepartment = editForm.department.trim();
      const nextBio = editForm.bio.trim();
      if (nextUserName !== (userProfile?.name || "")) payload.user_name = nextUserName;
      if (nextPhone !== basePhone) payload.phone_number = nextPhone;
      if (nextDepartment !== baseDepartment) payload.department = nextDepartment;
      if (editForm.preferredContact && editForm.preferredContact !== userProfile?.preferredContact) {
        payload.preferred_contact_method = editForm.preferredContact;
      }
      if (nextBio !== (userProfile?.bio || "")) payload.bio = nextBio;
      if ((userProfile?.isPublic ?? true) !== editForm.isPublic) {
        payload.is_public = editForm.isPublic;
      }
      const baseSocial = userProfile?.socialMedia || {};
      if (socialMediaLinks !== undefined) {
        if (JSON.stringify(socialMediaLinks) !== JSON.stringify(baseSocial)) {
          payload.social_media_links = socialMediaLinks;
        }
      }

      if (!editForm.profilePicFile && Object.keys(payload).length === 0) {
        setProfileSuccess("تغییری برای ذخیره وجود ندارد.");
        notifySuccess("تغییری برای ذخیره وجود ندارد.");
        return;
      }

      let requestBody = payload;
      if (editForm.profilePicFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined) return;
          if (value === null) {
            formData.append(key, "");
          } else if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });
        formData.append("profile_pic", editForm.profilePicFile);
        requestBody = formData;
      }

      await updateUserProfile(requestBody);
      await handleRefreshProfile();
      setProfileSuccess("پروفایل با موفقیت به‌روزرسانی شد.");
      notifySuccess("پروفایل با موفقیت به‌روزرسانی شد.");
    } catch (err) {
      setProfileError(err?.message || "خطا در به‌روزرسانی پروفایل.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateEmail = async () => {
    setEmailError("");
    setEmailSuccess("");
    if (!emailForm.newEmail.trim() || !emailForm.currentPassword) {
      setEmailError("ایمیل جدید و رمز عبور فعلی را وارد کنید.");
      return;
    }
    setSavingEmail(true);
    try {
      await updateUserEmail({
        new_email: emailForm.newEmail.trim(),
        current_password: emailForm.currentPassword,
      });
      const existing = getUserData();
      setUserData({
        user_id: existing?.user_id,
        email: emailForm.newEmail.trim(),
        name: existing?.name || userProfile?.name,
      });
      setUserProfile((prev) => {
        if (!prev) return prev;
        const next = { ...prev, email: emailForm.newEmail.trim() };
        localStorage.setItem("userProfileCache", JSON.stringify(next));
        return next;
      });
      setEmailForm({ newEmail: "", currentPassword: "" });
      setEmailSuccess("ایمیل با موفقیت به‌روزرسانی شد.");
      notifySuccess("ایمیل با موفقیت به‌روزرسانی شد.");
    } catch (err) {
      setEmailError(err?.message || "خطا در به‌روزرسانی ایمیل.");
    } finally {
      setSavingEmail(false);
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
            {userProfile?.profilePic ? (
              <img src={userProfile.profilePic} alt={userProfile.name} />
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

              <details className="profile-dropdown">
                <summary className="profile-dropdown__summary">
                  ویرایش پروفایل
                </summary>
                <div className="profile-dropdown__content">
                  {profileError ? (
                    <div className="profile-form__error">{profileError}</div>
                  ) : null}
                  {profileSuccess ? (
                    <div className="profile-form__success">{profileSuccess}</div>
                  ) : null}
                  <div className="profile-form">
                    <label className="profile-form__field">
                      <span>نام کاربری</span>
                      <input
                        type="text"
                        value={editForm.userName}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, userName: e.target.value }))
                        }
                      />
                    </label>
                    <label className="profile-form__field">
                      <span>شماره تلفن</span>
                      <input
                        type="text"
                        value={editForm.phoneNumber}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                        }
                      />
                    </label>
                    <label className="profile-form__field">
                      <span>دانشکده</span>
                      <input
                        type="text"
                        value={editForm.department}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, department: e.target.value }))
                        }
                      />
                    </label>
                    <label className="profile-form__field">
                      <span>روش تماس ترجیحی</span>
                      <select
                        value={editForm.preferredContact}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, preferredContact: e.target.value }))
                        }
                      >
                        <option value="email">ایمیل</option>
                        <option value="phone">تلفن</option>
                        <option value="social">شبکه اجتماعی</option>
                      </select>
                    </label>
                    <label className="profile-form__field profile-form__field--full">
                      <span>بیوگرافی</span>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                        }
                        rows={3}
                      />
                    </label>
                    <label className="profile-form__field profile-form__field--full">
                      <span>لینک‌های شبکه‌های اجتماعی (JSON)</span>
                      <textarea
                        value={editForm.socialLinks}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, socialLinks: e.target.value }))
                        }
                        rows={3}
                        placeholder='{"telegram":"@id","instagram":"@id"}'
                      />
                    </label>
                    <label className="profile-form__field profile-form__field--full">
                      <span>عکس پروفایل</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            profilePicFile: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </label>
                    <label className="profile-form__field profile-form__checkbox">
                      <input
                        type="checkbox"
                        checked={editForm.isPublic}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, isPublic: e.target.checked }))
                        }
                      />
                      <span>پروفایل عمومی باشد</span>
                    </label>
                  </div>
                  <div className="profile-form__actions">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setEditForm((prev) => ({
                          ...prev,
                          profilePicFile: null,
                        }));
                        setProfileError("");
                        setProfileSuccess("");
                      }}
                      disabled={savingProfile}
                    >
                      بازنشانی انتخاب عکس
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary profile-dropdown__primary"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </button>
                  </div>
                </div>
              </details>

              <details className="profile-dropdown">
                <summary className="profile-dropdown__summary">
                  تغییر ایمیل
                </summary>
                <div className="profile-dropdown__content">
                  {emailError ? (
                    <div className="profile-form__error">{emailError}</div>
                  ) : null}
                  {emailSuccess ? (
                    <div className="profile-form__success">{emailSuccess}</div>
                  ) : null}
                  <div className="profile-form">
                    <label className="profile-form__field">
                      <span>ایمیل جدید</span>
                      <input
                        type="email"
                        value={emailForm.newEmail}
                        onChange={(e) =>
                          setEmailForm((prev) => ({ ...prev, newEmail: e.target.value }))
                        }
                      />
                    </label>
                    <label className="profile-form__field">
                      <span>رمز عبور فعلی</span>
                      <input
                        type="password"
                        value={emailForm.currentPassword}
                        onChange={(e) =>
                          setEmailForm((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <div className="profile-form__actions">
                    <button
                      type="button"
                      className="btn btn-primary profile-dropdown__primary"
                      onClick={handleUpdateEmail}
                      disabled={savingEmail}
                    >
                      {savingEmail ? "در حال ثبت..." : "به‌روزرسانی ایمیل"}
                    </button>
                  </div>
                </div>
              </details>

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
