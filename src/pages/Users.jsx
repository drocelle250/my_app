import { useEffect, useState } from "react";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

const ROLES = ["admin", "manager", "staff"];

const roleBadge = (role) => {
  const colors = {
    admin:   "bg-red-100 text-red-700",
    manager: "bg-blue-100 text-blue-700",
    staff:   "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[role]}`}>
      {role}
    </span>
  );
};

export default function Users() {
  const { state } = useInventory();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New user form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" });
  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch {
      setError("Access denied or failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      const res = await API.post("/auth/register", form);
      // Add new user to list
      setUsers([res.data.user, ...users]);
      setForm({ name: "", email: "", password: "", role: "staff" });
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Failed to create user");
    } finally {
      setFormLoading(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      const res = await API.put(`/users/${id}/role`, { role });
      setUsers(users.map((u) => (u.id === res.data.id ? res.data : u)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await API.delete(`/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  if (state.user?.role !== "admin") return (
    <div className="p-6 text-center text-red-500 text-xl">Access denied. Admins only.</div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(""); }}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New User</h2>
          {formError && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-3">{formError}</div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text" required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} required minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min 6 characters"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={formLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                {formLoading ? "Creating..." : "Create User"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading users...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">{roleBadge(u.role)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="border rounded px-2 py-1 text-xs focus:outline-none"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {u.id !== state.user?.id && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-red-600 hover:underline text-sm ml-2"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3 text-sm text-gray-400">Total users: {users.length}</p>
    </div>
  );
}
