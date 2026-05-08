import { useEffect, useState } from "react";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

const ROLES = ["admin", "manager", "staff"];

const ROLE_STYLE = {
  admin:   "bg-red-100 text-red-700 border border-red-200",
  manager: "bg-blue-100 text-blue-700 border border-blue-200",
  staff:   "bg-gray-100 text-gray-600 border border-gray-200",
};

const ROLE_DESC = {
  admin:   "Full access — manage everything",
  manager: "Edit products, stock, orders",
  staff:   "View only",
};

function RoleBadge({ role }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_STYLE[role] || ROLE_STYLE.staff}`}>
      {role}
    </span>
  );
}

export default function Users() {
  const { state } = useInventory();
  const currentUser = state.user;
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [saving, setSaving]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [flash, setFlash]         = useState({ msg: "", type: "success" });

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

  const showFlash = (msg, type = "success") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash({ msg: "", type: "success" }), 3500);
  };

  // Count admins for UI warnings
  const adminCount = users.filter((u) => u.role === "admin").length;

  // Can this user's role be changed?
  const canChangeRole = (u) => {
    if (u.id === currentUser?.id) return false; // cannot change own role
    return true;
  };

  // Which roles are available for a given user
  const availableRoles = (u) => {
    // If target is the last admin, cannot demote them
    if (u.role === "admin" && adminCount <= 1) {
      return ["admin"]; // locked — only admin option
    }
    return ROLES;
  };

  // Can this user be deleted?
  const canDelete = (u) => {
    if (u.id === currentUser?.id) return false;
    if (u.role === "admin" && adminCount <= 1) return false;
    return true;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (form.password.length < 6) return setFormError("Password must be at least 6 characters");
    setFormLoading(true);
    try {
      const res = await API.post("/auth/register", {
        name: form.name, email: form.email, password: form.password,
      });
      const newUser = res.data.user;
      if (form.role !== "staff") {
        const updated = await API.put(`/users/${newUser.id}/role`, { role: form.role });
        setUsers([updated.data, ...users]);
      } else {
        setUsers([newUser, ...users]);
      }
      setForm({ name: "", email: "", password: "", role: "staff" });
      setShowForm(false);
      showFlash("User created successfully!");
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Failed to create user");
    } finally {
      setFormLoading(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    setSaving(id);
    try {
      const res = await API.put(`/users/${id}/role`, { role });
      setUsers(users.map((u) => (u.id === res.data.id ? res.data : u)));
      showFlash("Role updated successfully!");
    } catch (err) {
      showFlash(err.response?.data?.message || "Failed to update role", "error");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await API.delete(`/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
      showFlash("User deleted.");
    } catch (err) {
      showFlash(err.response?.data?.message || "Delete failed", "error");
    }
  };

  if (!isAdmin) return (
    <div className="p-8 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
      <p className="text-gray-500 text-sm">Only admins can manage users.</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Add users and control their access roles</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setFormError(""); }}
          className="bg-violet-600 text-white px-4 py-2.5 rounded-xl hover:bg-violet-700 font-semibold text-sm transition self-start sm:self-auto">
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {/* Security info banner */}
      {adminCount <= 1 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-start gap-2">
          <span className="text-base flex-shrink-0">⚠️</span>
          <div>
            <strong>Only 1 admin exists.</strong> The last admin cannot be demoted or deleted.
            Promote another user to admin first before making changes.
          </div>
        </div>
      )}

      {/* Flash message */}
      {flash.msg && (
        <div className={`px-4 py-3 rounded-xl mb-4 text-sm border ${
          flash.type === "success"
            ? "bg-green-50 border-green-300 text-green-700"
            : "bg-red-50 border-red-300 text-red-700"
        }`}>
          {flash.msg}
        </div>
      )}

      {/* Add User Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6 mb-5 border border-violet-100">
          <h2 className="text-base sm:text-lg font-semibold mb-1">Create New User</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">Set the role immediately.</p>

          {formError && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2.5 rounded-xl mb-4 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input" placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} required minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pr-16" placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium hover:bg-gray-200">
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input">
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)} — {ROLE_DESC[r]}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={formLoading}
                className="bg-violet-600 text-white px-6 py-2.5 rounded-xl hover:bg-violet-700 font-semibold text-sm disabled:opacity-50 transition">
                {formLoading ? "Creating..." : "Create User"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFormError(""); }}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-200 text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading users...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600 border-b">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Change Role</th>
                  <th className="px-4 py-3 hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-10 text-gray-400">No users found</td></tr>
                ) : users.map((u, i) => {
                  const isMe = u.id === currentUser?.id;
                  const isLastAdmin = u.role === "admin" && adminCount <= 1;
                  return (
                    <tr key={u.id} className={`border-t hover:bg-gray-50 transition ${isMe ? "bg-violet-50" : ""}`}>
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{u.name}</div>
                        {isMe && <span className="text-xs text-violet-500">(you)</span>}
                        {isLastAdmin && <span className="text-xs text-amber-600 block">Last admin</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{u.email}</td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3">
                        {canChangeRole(u) ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              disabled={saving === u.id || isLastAdmin}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                            >
                              {availableRoles(u).map((r) => (
                                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                              ))}
                            </select>
                            {saving === u.id && (
                              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            )}
                            {isLastAdmin && (
                              <span className="text-xs text-amber-600">Locked</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            {isMe ? "Cannot change own role" : "Protected"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {canDelete(u) ? (
                          <button onClick={() => handleDelete(u.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline transition">
                            Delete
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">
                            {isMe ? "—" : isLastAdmin ? "Protected" : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex flex-col sm:flex-row sm:justify-between gap-1 text-sm text-gray-400">
        <span>Total: <strong>{users.length}</strong> users · <strong>{adminCount}</strong> admin{adminCount !== 1 ? "s" : ""}</span>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Admin</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Manager</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Staff</span>
        </div>
      </div>
    </div>
  );
}
