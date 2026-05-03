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
import AdminPurchaseIntentsTab from "./AdminPurchaseIntentsTab";

export default function AdminPanel({ currentUser }) {
  const [adminTab, setAdminTab] = useState("users");
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
      <div className="min-h-dvh bg-slate-950 text-slate-300 p-8 font-medium">
        Admin paneli yükleniyor…
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-dvh bg-slate-950 text-white p-4 md:p-8 pb-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Admin Panel
          </h1>
          <p className="text-slate-400 text-sm md:text-base font-medium mt-2 max-w-xl leading-relaxed">
            Plus abonelikleri, kullanıcı kayıtları ve ödeme taleplerini buradan
            yönetin.
          </p>
        </header>

        <div
          className="mb-8 inline-flex w-full sm:w-auto rounded-2xl border border-slate-700/90 bg-slate-900/80 p-1 shadow-inner"
          role="tablist"
          aria-label="Admin bölümleri"
        >
          {[
            { id: "users", label: "Kullanıcılar" },
            { id: "payments", label: "Ödeme Talepleri" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={adminTab === t.id}
              onClick={() => setAdminTab(t.id)}
              className={`flex-1 sm:flex-none min-h-11 px-5 rounded-xl text-sm font-extrabold transition ${
                adminTab === t.id
                  ? "bg-slate-800 text-white shadow-md border border-slate-600/80"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {adminTab === "payments" ? (
          <AdminPurchaseIntentsTab
            currentUser={currentUser}
            onPremiumActivated={refreshUsers}
          />
        ) : null}

        {adminTab === "users" ? (
          <>
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ad, e-posta veya UID ile ara"
                className="w-full sm:max-w-md min-h-11 px-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-white text-sm font-medium placeholder:text-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50"
              />
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {[
                { id: "all", label: "Tümü" },
                { id: "plus", label: "Plus" },
                { id: "free", label: "Ücretsiz" },
                { id: "no-email", label: "E-posta yok" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`min-h-9 px-3.5 rounded-xl text-xs font-extrabold border transition ${
                    activeFilter === filter.id
                      ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-500 mb-5 font-medium leading-relaxed max-w-2xl">
              E-postası eksik görünen kayıtlar, kullanıcı tekrar giriş yaptığında
              güncellenebilir. Ödeme talebinden Plus verildiğinde niyet kaydındaki
              e-posta kullanıcıya aktarılır.
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
          </>
        ) : null}
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
