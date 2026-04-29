import React from "react";
import AdminUserRow from "./AdminUserRow";

export default function AdminUserTable({ users, onOpenGrant, onOpenNote }) {
  return (
    <div className="overflow-auto rounded-2xl border border-slate-800 bg-slate-900/40">
      <table className="w-full min-w-[980px]">
        <thead className="bg-slate-900">
          <tr className="text-left">
            <th className="px-3 py-3 text-[11px] uppercase tracking-wider text-slate-400">Ad</th>
            <th className="px-3 py-3 text-[11px] uppercase tracking-wider text-slate-400">Email</th>
            <th className="px-3 py-3 text-[11px] uppercase tracking-wider text-slate-400">UID</th>
            <th className="px-3 py-3 text-[11px] uppercase tracking-wider text-slate-400">Durum</th>
            <th className="px-3 py-3 text-[11px] uppercase tracking-wider text-slate-400">Bitis</th>
            <th className="px-3 py-3 text-[11px] uppercase tracking-wider text-slate-400">Kaynak</th>
            <th className="px-3 py-3 text-[11px] uppercase tracking-wider text-slate-400 text-right">Aksiyon</th>
          </tr>
        </thead>
        <tbody>
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
              <td className="px-3 py-6 text-slate-500 text-sm" colSpan={7}>
                Kullanici bulunamadi.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
