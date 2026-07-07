import { useState } from 'react';
import { Search, UserCheck, ShieldAlert, Edit } from 'lucide-react';

const MOCK_USERS = [
  { id: '1', username: 'tariku_b', email: 'tariku@domain.com', phone: '0911223344', role: 'customer', status: 'active', kyc: 'approved' },
  { id: '2', username: 'kalkidan_g', email: 'kalki@domain.com', phone: '0911556677', role: 'customer', status: 'active', kyc: 'pending' },
  { id: '3', username: 'seife_a', email: 'seife@domain.com', phone: '0911889900', role: 'agent', status: 'suspended', kyc: 'not_submitted' },
];

export default function UserManagement() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');

  const filtered = users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const toggleStatus = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'active' ? 'suspended' : 'active' };
      }
      return u;
    }));
  };

  const approveKyc = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        return { ...u, kyc: 'approved' };
      }
      return u;
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-display font-extrabold">User Accounts</h2>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 text-brand-muted" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#161B22] border border-brand-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-brand-primary"
          placeholder="Search by username or email..."
        />
      </div>

      {/* Users Data Table */}
      <div className="glass-panel rounded-2xl border border-brand-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#161B22] border-b border-brand-border text-xs uppercase text-brand-muted font-bold">
              <th className="p-4">User</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">KYC State</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border text-sm">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-[#161B22]/40 transition">
                <td className="p-4">
                  <div className="font-bold">{user.username}</div>
                  <div className="text-xs text-brand-muted">{user.id}</div>
                </td>
                <td className="p-4 font-mono">
                  <div>{user.email}</div>
                  <div className="text-xs text-brand-muted">{user.phone}</div>
                </td>
                <td className="p-4">
                  <span className="text-xs uppercase bg-[#21262D] px-2 py-0.5 rounded font-mono font-bold tracking-wider">{user.role}</span>
                </td>
                <td className="p-4">
                  <span className={`text-xs font-bold ${user.status === 'active' ? 'text-brand-primary' : 'text-red-400'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    user.kyc === 'approved' ? 'bg-brand-primary/20 text-brand-primary' : user.kyc === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {user.kyc.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {user.kyc === 'pending' && (
                    <button onClick={() => approveKyc(user.id)} className="bg-brand-primary text-black font-extrabold px-3 py-1.5 rounded-lg text-xs hover:opacity-90 transition">
                      Approve KYC
                    </button>
                  )}
                  <button onClick={() => toggleStatus(user.id)} className="bg-[#21262D] border border-brand-border hover:bg-[#30363D] px-3 py-1.5 rounded-lg text-xs transition">
                    {user.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
