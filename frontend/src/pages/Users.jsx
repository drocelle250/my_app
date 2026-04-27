import React, { useEffect, useState } from "react";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

const ROLES = ["admin", "manager", "staff"];

const roleBadge = (role) => {
  const colors = {
    admin:   "bg-red-100 text-red-700 border border-red-200",
    manager: "bg-blue-100 text-blue-700 border border-blue-200",
    staff:   "bg-gray-100 text-gray-600 border border-gray-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[role] || colors.staff}`}>
      {role}
    </span>
  );
};

export default function Users() {
  const { state } = useInventory();
  const isAdmin = state.user?.role === "admin";

  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [saving, setSaving]     = useState(null); // id of user being saved
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess]   = useState("");

  // Add user form
  const [form, setForm]           = useState({ name: "", email: "", password: "", role: "staff" });
  const [showPass, setShowPass]   = useState(false);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch {
      setError("Failed to load users. Admin access required.");
    } finally {
      setLoading(false);
    }
  };

  // Admin creates a new user with a chosen role
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (form.password.length < 6) return setFormError("Password must be at least 6 characters");
    setFormLoading(true);
    try {
      // Register then immediately set the role
      const res = await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      const newUser = res.data.user;
      // If role is not staff, update it
      if (form.role !== "staff") {
        const updated = await API.put(`/users/${newUser.id}/role`, { role: form.role });
        setUsers([updated.data, ...users]);
      } else {
        setUsers([newUser, ...users]);
      }
      setForm({ name: "", email: "", password: "", role: "staff" });
      setShowForm(false);
      flash("✅ User created successfully!");
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Failed to create user"
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Admin changes a user's role
  const handleRoleChange = async (id, role) => {
    setSaving(id);
    try {
      const res = await API.put(`/users/${id}/role`, { role });
      setUsers(users.map((u) => (u.id === res.data.id ? res.data : u)));
      flash("✅ Role updated!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    } finally {
      setSaving(null);
    }
  };

  // Admin deletes a user
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await API.delete(`/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
      flash("✅ User deleted.");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  // Non-admins see access denied
  if (!isAdmin) return (
    <div className="p-10 text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h2 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h2>
      <p className="text-gray-500">Only admins can manage users.</p>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Add users and control their access roles</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(""); }}
          className="bg-violet-600 text-white px-5 py-2 rounded-lg hover:bg-violet-700 font-medium"
        >
          {showForm ? "✕ Cancel" : "+ Add User"}
        </button>
      </div>

      {/* Success flash */}
      {success && (
        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      {/* ── Add User Form ── */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 border border-violet-100">
          <h2 className="text-lg font-semibold mb-1">Create New User</h2>
          <p className="text-sm text-gray-500 mb-4">Set the role immediately — no need to wait for approval.</p>

          {formError && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} required minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Admin = full access · Manager = edit products · Staff = view only
              </p>
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit" disabled={formLoading}
                className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 font-medium disabled:opacity-50"
              >
                {formLoading ? "Creating..." : "Create User"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(""); }}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Users Table ── */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading users...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 border-b">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Current Role</th>
                <th className="px-4 py-3">Change Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">No users found</td>
                </tr>
              ) : users.map((u, i) => (
                <tr key={u.id} className={`border-t hover:bg-gray-50 ${u.id === state.user?.id ? "bg-violet-50" : ""}`}>
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {u.name}
                    {u.id === state.user?.id && (
                      <span className="ml-2 text-xs text-violet-500 font-normal">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">{roleBadge(u.role)}</td>
                  <td className="px-4 py-3">
                    {u.id !== state.user?.id ? (
                      <select
                        value={u.role}
                        disabled={saving === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Cannot change own role</span>
                    )}
                    {saving === u.id && (
                      <span className="ml-2 text-xs text-violet-500">Saving...</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== state.user?.id ? (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 flex justify-between text-sm text-gray-400">
        <span>Total users: <strong>{users.length}</strong></span>
        <span className="text-xs">
          🔴 Admin &nbsp;|&nbsp; 🔵 Manager &nbsp;|&nbsp; ⚪ Staff
        </span>
      </div>
    </div>
  );
}
