import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, GraduationCap, Building2, Layers, BookOpen, Hash, CalendarDays, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../services/api";

export default function ProfilePage() {
  const { token, selectedRole } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest("/profile", selectedRole);
        if (active) setProfile(data);
      } catch (err) {
        if (active) setError(err.message || "Could not load profile.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => { active = false; };
  }, [selectedRole?.value]);

  if (loading) {
    return (
      <div className="page-shell">
        <header className="hero">
          <div>
            <p className="tag">UniLink</p>
            <h1>My Profile</h1>
            <p className="subtitle">Loading your profile...</p>
          </div>
        </header>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-shell">
        <header className="hero">
          <div>
            <p className="tag">UniLink</p>
            <h1>My Profile</h1>
            <p className="subtitle">{error || "Profile not available."}</p>
          </div>
        </header>
      </div>
    );
  }

  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "User";
  const initials = fullName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "U";
  const sp = profile.studentProfile;
  const tp = profile.teacherProfile;
  const roleLabels = (profile.roles || []).map((r) => r.label).join(", ") || "User";

  return (
    <div className="page-shell">
      <header className="hero profile-hero">
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <div className="profile-avatar-large">{initials}</div>
          <div>
            <p className="tag">UniLink</p>
            <h1>{fullName}</h1>
            <p className="subtitle">{roleLabels}</p>
          </div>
        </div>
      </header>

      <div className="profile-grid">
        {/* Personal Info Card */}
        <section className="card profile-card">
          <div className="card-header">
            <h3>Personal Information</h3>
          </div>
          <div className="profile-fields">
            <div className="profile-field">
              <User size={16} className="profile-field-icon" />
              <div>
                <small>Full Name</small>
                <p>{fullName}</p>
              </div>
            </div>
            <div className="profile-field">
              <Mail size={16} className="profile-field-icon" />
              <div>
                <small>Email</small>
                <p>{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="profile-field">
                <Hash size={16} className="profile-field-icon" />
                <div>
                  <small>Phone</small>
                  <p>{profile.phone}</p>
                </div>
              </div>
            )}
            <div className="profile-field">
              <Shield size={16} className="profile-field-icon" />
              <div>
                <small>Roles</small>
                <p>{roleLabels}</p>
              </div>
            </div>
            <div className="profile-field">
              <CalendarDays size={16} className="profile-field-icon" />
              <div>
                <small>Member Since</small>
                <p>{new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Student Profile Card */}
        {sp && (
          <section className="card profile-card">
            <div className="card-header">
              <h3>Academic Info</h3>
            </div>
            <div className="profile-fields">
              {sp.studentNumber && (
                <div className="profile-field">
                  <Hash size={16} className="profile-field-icon" />
                  <div>
                    <small>Student Number</small>
                    <p>{sp.studentNumber}</p>
                  </div>
                </div>
              )}
              <div className="profile-field">
                <Building2 size={16} className="profile-field-icon" />
                <div>
                  <small>Class Group</small>
                  <p>{sp.classGroup?.name} ({sp.classGroup?.code})</p>
                </div>
              </div>
              <div className="profile-field">
                <Layers size={16} className="profile-field-icon" />
                <div>
                  <small>Department</small>
                  <p>{sp.department?.name} ({sp.department?.code})</p>
                </div>
              </div>
              <div className="profile-field">
                <GraduationCap size={16} className="profile-field-icon" />
                <div>
                  <small>Level</small>
                  <p>{sp.level?.name} ({sp.level?.code})</p>
                </div>
              </div>
              {sp.enrollmentStatus && (
                <div className="profile-field">
                  <Shield size={16} className="profile-field-icon" />
                  <div>
                    <small>Enrollment Status</small>
                    <p>{sp.enrollmentStatus}</p>
                  </div>
                </div>
              )}
              {sp.programName && (
                <div className="profile-field">
                  <BookOpen size={16} className="profile-field-icon" />
                  <div>
                    <small>Program</small>
                    <p>{sp.programName}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Stats Card */}
        <section className="card profile-card">
          <div className="card-header">
            <h3>Quick Stats</h3>
          </div>
          <div className="profile-stats">
            <div className="profile-stat">
              <BookOpen size={20} />
              <h4>{profile.courseCount || 0}</h4>
              <small>Enrolled Courses</small>
            </div>
            <div className="profile-stat">
              <Shield size={20} />
              <h4>{(profile.roles || []).length}</h4>
              <small>Active Roles</small>
            </div>
          </div>
        </section>

        {/* Teacher Profile Card */}
        {tp && (
          <section className="card profile-card">
            <div className="card-header">
              <h3>Teacher Info</h3>
            </div>
            <div className="profile-fields">
              {tp.employeeCode && (
                <div className="profile-field">
                  <Hash size={16} className="profile-field-icon" />
                  <div>
                    <small>Employee Code</small>
                    <p>{tp.employeeCode}</p>
                  </div>
                </div>
              )}
              {tp.academicRank && (
                <div className="profile-field">
                  <GraduationCap size={16} className="profile-field-icon" />
                  <div>
                    <small>Academic Rank</small>
                    <p>{tp.academicRank}</p>
                  </div>
                </div>
              )}
              {tp.officeLocation && (
                <div className="profile-field">
                  <Building2 size={16} className="profile-field-icon" />
                  <div>
                    <small>Office</small>
                    <p>{tp.officeLocation}</p>
                  </div>
                </div>
              )}
              {tp.bio && (
                <div className="profile-field">
                  <User size={16} className="profile-field-icon" />
                  <div>
                    <small>Bio</small>
                    <p>{tp.bio}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
