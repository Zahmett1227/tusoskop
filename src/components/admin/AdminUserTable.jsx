import React from "react";
import AdminUserRow from "./AdminUserRow";

export default function AdminUserTable({ users, onOpenGrant, onOpenNote }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-800/90 bg-slate-900/35 shadow-xl shadow-black/20">
      <table className="w-full min-w-[920px] text-left">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/95">
            <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Ad
            </th>
            <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Email
            </th>
            <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
              UID
            </th>
            <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Durum
            </th>
            <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Bitiş
            </th>
            <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Kaynak
            </th>
            <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400 text-right">
              Aksiyon
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/90">
          {users.map((item) => (
            <AdminUserRow
              key={item.id}
              user={item}
              onOpenGrant={onOpenGrant}
              onOpenNote={onOpenNote}
            />
          ))}
          {users.length === 0 && (
            <tr>
              <td className="px-4 py-10 text-slate-500 text-sm font-medium text-center" colSpan={7}>
                Kullanıcı bulunamadı.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
