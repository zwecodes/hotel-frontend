"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { uploadImage } from "@/lib/cloudinary";
import toast from "react-hot-toast";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────
function SectionCard({ title, subtitle, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#1a56db]">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Input Field ───────────────────────────────────────────
function InputField({ label, type = "text", value, onChange, placeholder, disabled, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-all"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, login, token } = useAuth();
  const fileInputRef = useRef(null);

  const [profile,   setProfile]   = useState(null);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);

  // Profile form
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [savingPw,   setSavingPw]   = useState(false);
  const [showPw,     setShowPw]     = useState(false);

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.replace("/auth/login"); return; }
    fetchProfile();
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/users/profile");
      if (res.data.success) {
        const data = res.data.data;
        setProfile(data);
        setStats(data.stats);
        setName(data.name);
        setEmail(data.email);
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await api.put("/api/users/profile", { name: name.trim(), email: email.trim() });
      if (res.data.success) {
        toast.success("Profile updated!");
        setProfile(prev => ({ ...prev, ...res.data.data }));
        // Update AuthContext so navbar reflects changes
        login(res.data.data, token);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) {
      toast.error("All password fields are required");
      return;
    }
    if (newPw.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingPw(true);
    try {
      const res = await api.put("/api/users/profile/password", {
        current_password: currentPw,
        new_password: newPw,
      });
      if (res.data.success) {
        toast.success("Password changed successfully!");
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      const res = await api.put("/api/users/profile/avatar", { avatar_url: url });
      if (res.data.success) {
        toast.success("Avatar updated!");
        setProfile(prev => ({ ...prev, avatar_url: url }));
        // Update AuthContext so navbar shows new avatar
        login({ ...user, avatar_url: url }, token);
      }
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const profileChanged = profile && (name !== profile.name || email !== profile.email);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#1a56db] h-48" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-12">
          <div className="animate-pulse space-y-6">
            <div className="flex items-end gap-6">
              <div className="w-32 h-32 rounded-2xl bg-blue-300 flex-shrink-0" />
              <div className="pb-4 space-y-2">
                <div className="h-6 bg-blue-200 rounded w-48" />
                <div className="h-4 bg-blue-100 rounded w-32" />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100" />)}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="h-64 bg-white rounded-2xl border border-gray-100" />
              <div className="h-64 bg-white rounded-2xl border border-gray-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  const memberDays = Math.floor((Date.now() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#1a56db] via-[#1e429f] to-[#1e3a8a] h-52 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }}/>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"/>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-28 pb-16 relative z-10">

        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 mb-8">

          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div
              onClick={handleAvatarClick}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-xl overflow-hidden cursor-pointer bg-gradient-to-br from-[#1a56db] to-[#1e3a8a] flex items-center justify-center relative"
            >
              {uploadingAvatar ? (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                </div>
              ) : profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover"/>
              ) : (
                <span className="text-3xl font-bold text-white">{initials}</span>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-6 h-6 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <p className="text-white text-xs mt-1 font-medium">Change</p>
                </div>
              </div>
            </div>

            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"/>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
          </div>

          {/* Name + meta */}
          <div className="pb-1 flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.name}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                profile.role === "admin"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-[#1a56db]"
              }`}>
                {profile.role === "admin" ? "Admin" : "Member"}
              </span>
            </div>
            <p className="text-gray-500 text-sm">{profile.email}</p>
            <p className="text-gray-400 text-xs mt-1">
              Member for {memberDays} day{memberDays !== 1 ? "s" : ""} · Joined {formatDate(profile.created_at)}
            </p>
          </div>

          {/* Quick action */}
          <a href="/my-bookings"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a56db] text-white text-sm font-semibold rounded-xl hover:bg-[#1e429f] transition-colors shadow-md flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            My Bookings
          </a>
        </div>

        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Bookings"
              value={stats.total || 0}
              color="bg-blue-50"
              icon={<svg className="w-6 h-6 text-[#1a56db]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
            />
            <StatCard
              label="Confirmed Stays"
              value={stats.confirmed || 0}
              color="bg-green-50"
              icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            />
            <StatCard
              label="Pending Payments"
              value={stats.pending || 0}
              color="bg-yellow-50"
              icon={<svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            />
            <StatCard
              label="Total Spent"
              value={`฿${Number(stats.total_spent || 0).toLocaleString()}`}
              color="bg-purple-50"
              icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>}
            />
          </div>
        )}

        {/* Forms grid */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Personal info */}
          <SectionCard
            title="Personal Information"
            subtitle="Update your name and email address"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
          >
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <InputField
                label="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
              />
              <InputField
                label="Email Address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <InputField
                label="Account Role"
                value={profile.role === "admin" ? "Administrator" : "Member"}
                disabled
                hint="Role cannot be changed"
              />
              <InputField
                label="Member Since"
                value={formatDate(profile.created_at)}
                disabled
              />
              <button
                type="submit"
                disabled={savingProfile || !profileChanged}
                className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  profileChanged
                    ? "bg-[#1a56db] text-white hover:bg-[#1e429f] shadow-md"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {savingProfile ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Saving...
                  </span>
                ) : profileChanged ? "Save Changes" : "No Changes"}
              </button>
            </form>
          </SectionCard>

          {/* Change password */}
          <SectionCard
            title="Change Password"
            subtitle="Keep your account secure with a strong password"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>}
          >
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="relative">
                <InputField
                  label="Current Password"
                  type={showPw ? "text" : "password"}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <InputField
                label="New Password"
                type={showPw ? "text" : "password"}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="At least 6 characters"
                hint={newPw.length > 0 && newPw.length < 6 ? "Too short — minimum 6 characters" : ""}
              />
              <InputField
                label="Confirm New Password"
                type={showPw ? "text" : "password"}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                hint={confirmPw && newPw !== confirmPw ? "Passwords do not match" : confirmPw && newPw === confirmPw ? "✓ Passwords match" : ""}
              />

              {/* Show/hide toggle */}
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <div
                  onClick={() => setShowPw(v => !v)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${showPw ? "bg-[#1a56db]" : "bg-gray-200"}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${showPw ? "translate-x-4" : "translate-x-0.5"}`}/>
                </div>
                <span className="text-xs text-gray-500">Show passwords</span>
              </label>

              {/* Password strength */}
              {newPw.length > 0 && (
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        newPw.length >= i * 3
                          ? i <= 1 ? "bg-red-400"
                          : i <= 2 ? "bg-yellow-400"
                          : i <= 3 ? "bg-blue-400"
                          : "bg-green-400"
                          : "bg-gray-100"
                      }`}/>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {newPw.length < 6 ? "Weak" : newPw.length < 9 ? "Fair" : newPw.length < 12 ? "Good" : "Strong"} password
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={savingPw || !currentPw || !newPw || !confirmPw}
                className="w-full py-2.5 bg-[#1a56db] text-white text-sm font-semibold rounded-xl hover:bg-[#1e429f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {savingPw ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Changing Password...
                  </span>
                ) : "Change Password"}
              </button>
            </form>
          </SectionCard>

          {/* Avatar section */}
          <SectionCard
            title="Profile Photo"
            subtitle="Upload a photo to personalize your account"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
          >
            <div className="flex items-center gap-6">
              <div
                onClick={handleAvatarClick}
                className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-[#1a56db] to-[#1e3a8a] flex items-center justify-center cursor-pointer relative group flex-shrink-0 border-2 border-gray-100"
              >
                {uploadingAvatar ? (
                  <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                ) : profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
                ) : (
                  <span className="text-xl font-bold text-white">{initials}</span>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-1">Upload a new photo</p>
                <p className="text-xs text-gray-400 mb-3">JPG, PNG or GIF · Max 5MB</p>
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 border border-[#1a56db] text-[#1a56db] text-sm font-semibold rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
                >
                  {uploadingAvatar ? "Uploading..." : "Choose Photo"}
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Account info card */}
          <SectionCard
            title="Account Overview"
            subtitle="Your account details at a glance"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
          >
            <div className="space-y-3">
              {[
                { label: "Account ID", value: `#${profile.id}` },
                { label: "Member Since", value: formatDate(profile.created_at) },
                { label: "Account Type", value: profile.role === "admin" ? "Administrator" : "Standard Member" },
                { label: "Booking Rate", value: stats?.total > 0 ? `${Math.round((stats.confirmed / stats.total) * 100)}% confirmed` : "No bookings yet" },
                { label: "Cancelled", value: `${stats?.cancelled || 0} booking${stats?.cancelled !== 1 ? "s" : ""}` },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{item.label}</span>
                  <span className="text-sm font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}