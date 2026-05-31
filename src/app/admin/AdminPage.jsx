import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../services/api";
import { userHasRole } from "../../utils/roles";

const ROLES = ["STUDENT", "TEACHER", "COORDINATOR", "ADMIN"];

export default function AdminPage() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [users,   setUsers]   = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error,   setError]   = useState("");
  const [errorCourses, setErrorCourses] = useState("");
  const [departments, setDepartments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classGroups, setClassGroups] = useState([]);
  const [classLoading, setClassLoading] = useState(true);
  const [classError, setClassError] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", phone: "", status: "" });
  const [editError, setEditError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  // Form state for creating a new user
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", role: "STUDENT"
  });
  const [formError,   setFormError]   = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Form state for creating a class group
  const [classForm, setClassForm] = useState({
    code: "",
    name: "",
    departmentId: "",
    levelId: "",
    coordinatorUserId: ""
  });
  const [classFormError, setClassFormError] = useState("");
  const [classFormSuccess, setClassFormSuccess] = useState("");

  // Form state for creating a course
  const [courseForm, setCourseForm] = useState({
    code: "",
    title: "",
    description: "",
    classGroupId: "",
    isCourseChatEnabled: true,
    teacherUserId: ""
  });
  const [courseFormError, setCourseFormError] = useState("");
  const [courseFormSuccess, setCourseFormSuccess] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) navigate("/login");
  }, [isAdmin]);

  // Load all users when the page opens
  useEffect(() => {
    fetchUsers();
  }, []);

  // Load all courses when the page opens
  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchClassMetadata();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const data = await apiRequest("/admin/users");
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourses() {
    try {
      setLoadingCourses(true);
      const data = await apiRequest("/admin/courses");
      setCourses(data);
    } catch (err) {
      setErrorCourses(err.message);
    } finally {
      setLoadingCourses(false);
    }
  }

  async function fetchClassMetadata() {
    try {
      setClassLoading(true);
      setClassError("");
      const [departmentsData, levelsData, classGroupsData] = await Promise.all([
        apiRequest("/admin/departments"),
        apiRequest("/admin/levels"),
        apiRequest("/admin/class-groups")
      ]);
      setDepartments(departmentsData || []);
      setLevels(levelsData || []);
      setClassGroups(classGroupsData || []);
    } catch (err) {
      setClassError(err.message || "Failed to load class metadata");
    } finally {
      setClassLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await apiRequest(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      // Update the list locally without refetching
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );
    } catch (err) {
      alert("Failed to update role: " + err.message);
    }
  }

  async function handleDelete(userId) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiRequest(`/admin/users/${userId}`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    }
  }

  function startEdit(user) {
    setEditError("");
    setEditingUserId(user.id);
    setEditForm({ firstName: user.first_name || "", lastName: user.last_name || "", email: user.email || "", phone: user.phone || "", status: user.status || "ACTIVE" });
    setShowEditModal(true);
  }

  function cancelEdit() {
    setEditingUserId(null);
    setEditForm({ firstName: "", lastName: "", email: "", phone: "", status: "" });
    setShowEditModal(false);
  }

  async function saveEdit(userId) {
    setEditError("");
    try {
      const updated = await apiRequest(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(editForm)
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
      cancelEdit();
    } catch (err) {
      setEditError(err.message || "Failed to update user");
    }
  }

  async function handleAssignCourse(userId, courseId) {
    if (!courseId) return;
    try {
      await apiRequest(`/admin/users/${userId}/courses`, {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
      alert("Course assigned successfully!");
      fetchUsers(); // Refresh to show updated state if necessary
    } catch (err) {
      alert("Failed to assign course: " + err.message);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    try {
      await apiRequest("/admin/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setFormSuccess("User created successfully!");
      setForm({ firstName: "", lastName: "", email: "", password: "", role: "STUDENT" });
      fetchUsers(); // Refresh the list
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleCreateClassGroup(e) {
    e.preventDefault();
    setClassFormError("");
    setClassFormSuccess("");

    try {
      await apiRequest("/admin/class-groups", {
        method: "POST",
        body: JSON.stringify({
          code: classForm.code,
          name: classForm.name,
          departmentId: classForm.departmentId,
          levelId: classForm.levelId,
          coordinatorUserId: classForm.coordinatorUserId || null
        })
      });

      setClassFormSuccess("Class group created successfully!");
      setClassForm({
        code: "",
        name: "",
        departmentId: "",
        levelId: "",
        coordinatorUserId: ""
      });
      fetchClassMetadata();
    } catch (err) {
      setClassFormError(err.message || "Failed to create class group");
    }
  }

  async function handleCreateCourse(e) {
    e.preventDefault();
    setCourseFormError("");
    setCourseFormSuccess("");

    try {
      await apiRequest("/admin/courses", {
        method: "POST",
        body: JSON.stringify({
          code: courseForm.code,
          title: courseForm.title,
          description: courseForm.description,
          classGroupId: courseForm.classGroupId,
          isCourseChatEnabled: courseForm.isCourseChatEnabled,
          teacherUserId: courseForm.teacherUserId || null
        })
      });

      setCourseFormSuccess("Course created successfully!");
      setCourseForm({
        code: "",
        title: "",
        description: "",
        classGroupId: "",
        isCourseChatEnabled: true,
        teacherUserId: ""
      });
      fetchCourses();
    } catch (err) {
      setCourseFormError(err.message || "Failed to create course");
    }
  }

  const coordinators = users.filter((u) => userHasRole(u, "COORDINATOR"));
  const teachers = users.filter((u) => userHasRole(u, "TEACHER"));

  return (
    <div className="page-shell admin-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1>Administration</h1>
          <p className="subtitle">Manage accounts, roles, and access across your university platform.</p>
          <small className="subtitle">Logged in as {user?.email}</small>
        </div>
        
      </header>

      <section className="card">
        <div className="card-header">
          <h3>Create User</h3>
          <span>Directory management</span>
        </div>

        {formError ? <p className="error-banner">{formError}</p> : null}
        {formSuccess ? <p className="success-banner">{formSuccess}</p> : null}

        <form onSubmit={handleCreateUser} className="admin-form-grid">
          {[
            { label: "First Name", key: "firstName", type: "text" },
            { label: "Last Name", key: "lastName", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Password", key: "password", type: "password" }
          ].map(({ label, key, type }) => (
            <label key={key}>
              {label}
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                required
              />
            </label>
          ))}

          <label>
            Role
            <select
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <button className="primary-btn" type="submit">Create User</button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Create Class Group</h3>
          <span>Academic structure</span>
        </div>

        {classFormError ? <p className="error-banner">{classFormError}</p> : null}
        {classFormSuccess ? <p className="success-banner">{classFormSuccess}</p> : null}

        <form onSubmit={handleCreateClassGroup} className="admin-form-grid">
          <label>
            Code
            <input
              type="text"
              value={classForm.code}
              onChange={(e) => setClassForm((prev) => ({ ...prev, code: e.target.value }))}
              required
            />
          </label>

          <label>
            Name
            <input
              type="text"
              value={classForm.name}
              onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </label>

          <label>
            Department
            <select
              value={classForm.departmentId}
              onChange={(e) => setClassForm((prev) => ({ ...prev, departmentId: e.target.value }))}
              required
            >
              <option value="">Select department...</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.code} - {dep.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Level
            <select
              value={classForm.levelId}
              onChange={(e) => setClassForm((prev) => ({ ...prev, levelId: e.target.value }))}
              required
            >
              <option value="">Select level...</option>
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.code} - {lvl.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Coordinator (optional)
            <select
              value={classForm.coordinatorUserId}
              onChange={(e) => setClassForm((prev) => ({ ...prev, coordinatorUserId: e.target.value }))}
            >
              <option value="">No coordinator</option>
              {coordinators.map((coord) => (
                <option key={coord.id} value={coord.id}>
                  {coord.first_name} {coord.last_name} ({coord.email})
                </option>
              ))}
            </select>
          </label>

          <button className="primary-btn" type="submit">Create Class Group</button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Create Course</h3>
          <span>Course catalog</span>
        </div>

        {courseFormError ? <p className="error-banner">{courseFormError}</p> : null}
        {courseFormSuccess ? <p className="success-banner">{courseFormSuccess}</p> : null}

        <form onSubmit={handleCreateCourse} className="admin-form-grid">
          <label>
            Code
            <input
              type="text"
              value={courseForm.code}
              onChange={(e) => setCourseForm((prev) => ({ ...prev, code: e.target.value }))}
              required
            />
          </label>

          <label>
            Title
            <input
              type="text"
              value={courseForm.title}
              onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </label>

          <label>
            Description
            <input
              type="text"
              value={courseForm.description}
              onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>

          <label>
            Class Group
            <select
              value={courseForm.classGroupId}
              onChange={(e) => setCourseForm((prev) => ({ ...prev, classGroupId: e.target.value }))}
              required
            >
              <option value="">Select class group...</option>
              {classGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.code} - {group.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Teacher (optional)
            <select
              value={courseForm.teacherUserId}
              onChange={(e) => setCourseForm((prev) => ({ ...prev, teacherUserId: e.target.value }))}
            >
              <option value="">No teacher assigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name} ({teacher.email})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Course chat enabled</span>
            <input
              type="checkbox"
              checked={courseForm.isCourseChatEnabled}
              onChange={(e) => setCourseForm((prev) => ({ ...prev, isCourseChatEnabled: e.target.checked }))}
            />
          </label>

          <button className="primary-btn" type="submit">Create Course</button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Class Groups</h3>
          <span>{classGroups.length} groups</span>
        </div>

        {classLoading ? <p className="subtitle">Loading class groups...</p> : null}
        {classError ? <p className="error-banner">{classError}</p> : null}

        {!classLoading && !classError ? (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Level</th>
                  <th>Coordinator</th>
                </tr>
              </thead>
              <tbody>
                {classGroups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.code}</td>
                    <td>{group.name}</td>
                    <td>{group.departmentCode}</td>
                    <td>{group.levelCode}</td>
                    <td>{group.coordinatorName || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="card">
        <div className="card-header">
          <h3>User Accounts</h3>
          <span>{users.length} accounts</span>
        </div>

        {loading ? <p className="subtitle">Loading users...</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}

        {!loading && !error ? (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Assign Course</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.role || "STUDENT"}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={u.status === "ACTIVE" ? "status-badge active" : "status-badge"}>
                        {u.status || "ACTIVE"}
                      </span>
                    </td>
                    <td>
                      <select
                        className="admin-select"
                        value=""
                        onChange={(e) => handleAssignCourse(u.id, e.target.value)}
                      >
                        <option value="" disabled>Assign course...</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.title}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="link" onClick={() => startEdit(u)}>Edit</button>
                      <button className="link-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      {showEditModal && editingUserId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,6,23,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) cancelEdit(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="m-0 mb-3">Edit User</h3>
            <div className="grid grid-cols-2 gap-3">
              <label>
                First Name
                <input value={editForm.firstName} onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))} />
              </label>
              <label>
                Last Name
                <input value={editForm.lastName} onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))} />
              </label>
              <label className="col-span-2">
                Email
                <input type="email" value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} />
              </label>
              <label>
                Phone
                <input value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} />
              </label>
              <label>
                Status
                <select value={editForm.status} onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
            </div>

            {editError ? <p className="error-banner">{editError}</p> : null}

            <div className="flex gap-2 justify-end mt-4">
              <button onClick={cancelEdit} className="py-2 px-3 rounded-md">Cancel</button>
              <button onClick={() => saveEdit(editingUserId)} className="py-2 px-3 rounded-md primary-btn">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
