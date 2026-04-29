import React, { useEffect, useMemo, useState } from "react";
import {
  addAdminNote,
  getAdminUserList,
  grantPremium,
  isCurrentUserAdmin,
  revokePremium,
} from "../../services/adminService";
import AdminUserTable from "./AdminUserTable";
import AdminGrantModal from "./AdminGrantModal";
import AdminNoteModal from "./AdminNoteModal";

export default function AdminPanel({ currentUser }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  const refreshUsers = async () => {
    const list = await getAdminUserList();
    setUsers(list);
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const ok = await isCurrentUserAdmin(currentUser?.uid);
        if (!active) return;
        setIsAdmin(ok);
        if (ok) {
          await refreshUsers();
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [currentUser?.uid]);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    const bySearch = users.filter((item) => {
      const name = String(item.displayName || "").toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const uid = String(item.uid || item.id || "").toLowerCase();
      return !search || name.includes(search) || email.includes(search) || uid.includes(search);
    });

    if (activeFilter === "plus") {
      return bySearch.filter(
        (item) => item.plan === "plus" && item.premiumStatus === "active"
      );
    }
    if (activeFilter === "free") {
      return bySearch.filter(
        (item) => item.plan !== "plus" || item.premiumStatus !== "active"
      );
    }
    if (activeFilter === "no-email") {
      return bySearch.filter((item) => !item.email);
    }
    return bySearch;
  }, [users, query, activeFilter]);

  const handleGrant = async ({ days, reason }) => {
    if (!selectedUser) return;
    await grantPremium({
      adminUid: currentUser.uid,
      adminEmail: currentUser.email || null,
      targetUid: selectedUser.id,
      days,
      reason,
    });
    await refreshUsers();
    setGrantModalOpen(false);
    setSelectedUser(null);
  };

  const handleRevoke = async ({ reason }) => {
    if (!selectedUser) return;
    await revokePremium({
      adminUid: currentUser.uid,
      adminEmail: currentUser.email || null,
      targetUid: selectedUser.id,
      reason,
    });
    await refreshUsers();
    setGrantModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveNote = async (note) => {
    if (!selectedUser) return;
    await addAdminNote({
      adminUid: currentUser.uid,
      adminEmail: currentUser.email || null,
      targetUid: selectedUser.id,
      note,
    });
    await refreshUsers();
    setNoteModalOpen(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-950 text-slate-300 p-8">
        Admin paneli yukleniyor...
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-dvh bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-black">Admin Panel</h2>
          <p className="text-slate-400 text-sm mt-1">
            Premium ve kullanici yonetimi
          </p>
        </div>

        <div className="mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ad, email veya uid ile ara"
            className="w-full md:w-96 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { id: "all", label: "Tumu" },
            { id: "plus", label: "Plus" },
            { id: "free", label: "Free" },
            { id: "no-email", label: "Email yok" },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                activeFilter === filter.id
                  ? "bg-cyan-300 text-slate-950 border-cyan-200"
                  : "bg-slate-900 text-slate-300 border-slate-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Email bilgisi olmayan eski kayitlar, kullanici tekrar giris yaptiginda guncellenir.
        </p>

        <AdminUserTable
          users={filteredUsers}
          onOpenGrant={(user) => {
            setSelectedUser(user);
            setGrantModalOpen(true);
          }}
          onOpenNote={(user) => {
            setSelectedUser(user);
            setNoteModalOpen(true);
          }}
        />
      </div>

      <AdminGrantModal
        user={selectedUser}
        isOpen={grantModalOpen}
        onClose={() => {
          setGrantModalOpen(false);
          setSelectedUser(null);
        }}
        onGrant={handleGrant}
        onRevoke={handleRevoke}
      />

      <AdminNoteModal
        user={selectedUser}
        isOpen={noteModalOpen}
        onClose={() => {
          setNoteModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveNote}
      />
    </div>
  );
}
