import { useState } from 'react';
import { Send, CheckCircle, HelpCircle } from 'lucide-react';

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('Ticket created successfully. A support agent will reply shortly.');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-3xl font-display font-extrabold flex items-center gap-2">
        <HelpCircle size={28} className="text-brand-primary" /> Customer Support
      </h2>

      {success && (
        <div className="bg-brand-primary/20 border border-brand-primary/30 text-white p-4 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} className="text-brand-primary shrink-0" />
          <p className="text-sm font-semibold">{success}</p>
        </div>
      )}

      {/* ─── Ticket Submission Form ──────────────────────────── */}
      <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl border border-brand-border space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">Subject / Issue Summary</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-[#0D1117] border border-brand-border rounded-xl py-3 px-4 focus:border-brand-primary focus:outline-none"
            placeholder="e.g. Telebirr deposit not reflected"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">Describe your issue in detail</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full bg-[#0D1117] border border-brand-border rounded-xl py-3 px-4 focus:border-brand-primary focus:outline-none"
            placeholder="Please include payment reference or ticket details..."
            required
          />
        </div>

        <button type="submit" className="w-full green-gradient text-black font-extrabold py-4 rounded-xl text-lg hover:opacity-95 transition flex items-center justify-center gap-2">
          <Send size={18} /> Open Ticket
        </button>
      </form>
    </div>
  );
}
