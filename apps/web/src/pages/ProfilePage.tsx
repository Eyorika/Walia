import { useState } from 'react';
import { User, Shield, Key, Bell, CreditCard, Check } from 'lucide-react';

export default function ProfilePage() {
  const [kycStatus, setKycStatus] = useState('not_submitted');
  const [success, setSuccess] = useState('');

  const handleKyc = (e: React.FormEvent) => {
    e.preventDefault();
    setKycStatus('pending');
    setSuccess('KYC documents uploaded successfully and are pending review');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-3xl font-display font-extrabold">Account Settings</h2>

      {success && (
        <div className="bg-brand-primary/20 border border-brand-primary/30 text-white p-4 rounded-xl flex items-center gap-3">
          <Check size={20} className="text-brand-primary shrink-0" />
          <p className="text-sm font-semibold">{success}</p>
        </div>
      )}

      {/* ─── Profile details ────────────────────────────────── */}
      <section className="glass-panel p-8 rounded-2xl border border-brand-border space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <User size={20} className="text-brand-primary" /> Personal Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-brand-muted font-bold uppercase">First Name</span>
            <input type="text" className="w-full bg-[#0D1117] border border-brand-border rounded-lg p-2.5 outline-none" defaultValue="Tariku" />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-brand-muted font-bold uppercase">Last Name</span>
            <input type="text" className="w-full bg-[#0D1117] border border-brand-border rounded-lg p-2.5 outline-none" defaultValue="Bekele" />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-brand-muted font-bold uppercase">Email Address</span>
            <input type="email" className="w-full bg-[#0D1117]/50 border border-brand-border rounded-lg p-2.5 outline-none text-brand-muted" defaultValue="tariku@domain.com" disabled />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-brand-muted font-bold uppercase">Phone Number</span>
            <input type="tel" className="w-full bg-[#0D1117]/50 border border-brand-border rounded-lg p-2.5 outline-none text-brand-muted" defaultValue="+251911223344" disabled />
          </div>
        </div>
      </section>

      {/* ─── KYC Identity Verification ──────────────────────── */}
      <section className="glass-panel p-8 rounded-2xl border border-brand-border space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Shield size={20} className="text-brand-accent" /> Identity Verification (KYC)
        </h3>
        <div className="flex justify-between items-center bg-[#0D1117] p-4 rounded-xl border border-brand-border">
          <div>
            <span className="block text-sm font-semibold">Verification Status</span>
            <span className="text-xs text-brand-muted">Submit ID to increase withdrawal limit to 100k Birr</span>
          </div>
          <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
            kycStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {kycStatus.replace('_', ' ')}
          </span>
        </div>

        {kycStatus === 'not_submitted' && (
          <form onSubmit={handleKyc} className="space-y-4 pt-2">
            <div className="space-y-1">
              <span className="text-xs text-brand-muted font-bold">Document Type</span>
              <select className="w-full bg-[#0D1117] border border-brand-border rounded-lg p-2.5 outline-none">
                <option>National ID / Kebele ID</option>
                <option>Passport</option>
                <option>Driver's License</option>
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-brand-muted font-bold">Upload Copy</span>
              <input type="file" className="w-full bg-[#0D1117] border border-brand-border rounded-lg p-2.5 outline-none text-sm text-brand-muted" required />
            </div>
            <button type="submit" className="gold-gradient text-black font-extrabold px-6 py-2.5 rounded-lg text-sm transition">
              Submit Documents
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
