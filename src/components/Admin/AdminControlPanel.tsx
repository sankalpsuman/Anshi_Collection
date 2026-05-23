import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, UserMinus, ShieldCheck, ShieldAlert, Trash2, Mail, BadgeCheck, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Admin } from '../../types';

export default function AdminControlPanel() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'super_admin' | 'admin'>('admin');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [removeConfirmEmail, setRemoveConfirmEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = adminService.subscribeToAdmins(
      (data) => {
        setAdmins(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching admins:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setErrorMsg(null);
    setIsAdding(true);
    try {
      await adminService.addAdmin(newEmail, newRole);
      setNewEmail('');
      setNewRole('admin');
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to add admin');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (admin: Admin) => {
    const nextStatus = admin.status === 'active' ? 'disabled' : 'active';
    try {
      await adminService.updateAdminStatus(admin.email, nextStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleToggleRole = async (admin: Admin) => {
    const nextRole = admin.role === 'super_admin' ? 'admin' : 'super_admin';
    try {
      await adminService.updateAdminRole(admin.email, nextRole);
    } catch (error: any) {
      setErrorMsg(error.message || 'Error updating role');
    }
  };

  const handleRemoveClick = (email: string) => {
    setRemoveConfirmEmail(email);
  };

  const confirmRemove = async () => {
    if (!removeConfirmEmail) return;
    try {
      await adminService.removeAdmin(removeConfirmEmail);
    } catch (error: any) {
      console.error('Error removing admin:', error);
      setErrorMsg(error.message || 'Error removing admin');
    } finally {
      setRemoveConfirmEmail(null);
    }
  };

  if (loading) return (
    <div className="py-20 text-center">
      <div className="w-10 h-10 border-2 border-indigo dark:border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-[10px] uppercase font-black tracking-widest text-ink/30 dark:text-dark-muted">Loading Secure Records...</p>
    </div>
  );

  return (
    <div className="space-y-12">
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose/10 border border-rose/20 text-rose text-xs font-bold rounded-2xl flex justify-between items-center"
        >
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-rose/10 rounded-lg cursor-pointer transition-all">
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* Confirmation Dialog Overlay */}
      <AnimatePresence>
        {removeConfirmEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRemoveConfirmEmail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-theme-bg p-8 rounded-[32px] border border-theme-border shadow-luxury max-w-sm w-full text-center space-y-6 z-10"
            >
              <Trash2 className="mx-auto text-rose animate-pulse" size={40} />
              <div className="space-y-2">
                <h4 className="font-serif text-xl font-bold text-theme-text-primary">Revoke Access</h4>
                <p className="text-xs text-theme-text-secondary leading-relaxed">
                  Are you sure you want to completely remove <strong className="break-all">{removeConfirmEmail}</strong> from authorized personnel? They will lose access immediately.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRemoveConfirmEmail(null)}
                  className="flex-1 py-3 border border-theme-border rounded-xl text-[10px] uppercase tracking-widest font-black text-theme-text-secondary cursor-pointer hover:bg-theme-surface"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemove}
                  className="flex-1 py-3 bg-rose text-white rounded-xl text-[10px] uppercase tracking-widest font-black cursor-pointer hover:opacity-90"
                >
                  Revoke
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Admin Form */}
      <section className="bg-theme-surface border border-theme-border shadow-luxury p-8 rounded-[30px] transition-all">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-theme-primary text-theme-primary-text rounded-xl">
            <UserPlus size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-theme-primary">Authorize New Artisan</h3>
            <p className="text-[10px] text-theme-text-muted uppercase tracking-tighter">Grant access to the collection dashboard</p>
          </div>
        </div>

        <form onSubmit={handleAddAdmin} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted/40" size={16} />
            <input
              type="email"
              placeholder="artisan@anshicollection.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-theme-surface border border-theme-border rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/20 transition-all font-sans font-medium text-theme-text-primary"
              required
            />
          </div>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as any)}
            className="bg-theme-surface border border-theme-border rounded-2xl px-4 py-4 text-sm outline-none focus:border-theme-primary transition-all font-sans font-medium text-theme-text-primary"
          >
            <option value="admin" className="text-theme-text-primary bg-theme-surface">Artisan (Admin)</option>
            <option value="super_admin" className="text-theme-text-primary bg-theme-surface">Curator (Super Admin)</option>
          </select>
          <button
            type="submit"
            disabled={isAdding}
            className="wa-button !bg-theme-primary !text-theme-primary-text !py-4 px-8 rounded-2xl shadow-xl hover:opacity-90 transition-all text-[10px] uppercase font-black cursor-pointer"
          >
            {isAdding ? 'Adding...' : 'Grant Access'}
          </button>
        </form>
      </section>

      {/* Admin List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-theme-border pb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-theme-primary flex items-center gap-2">
            <BadgeCheck size={14} />
            Authorized Personnel
          </h3>
          <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest">{admins.length} Logged</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {admins.map((admin) => (
              <motion.div
                key={admin.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-3xl border flex items-center justify-between group transition-all ${
                  admin.status === 'disabled' ? 'opacity-60 grayscale' : 'hover:border-theme-primary/30 hover:shadow-luxury'
                } ${admin.email?.toLowerCase() === 'sankalpsmn@gmail.com' ? 'border-theme-accent/40 bg-theme-accent/[0.03]' : 'border-theme-border bg-theme-surface'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    admin.email?.toLowerCase() === 'sankalpsmn@gmail.com' ? 'bg-theme-primary text-theme-primary-text' : 'bg-theme-surface text-theme-accent border border-theme-border/80'
                  }`}>
                    {admin.role === 'super_admin' ? <ShieldCheck size={18} /> : <BadgeCheck size={18} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-theme-text-primary tracking-tight flex items-center gap-2">
                      {admin.email}
                      {admin.email?.toLowerCase() === 'sankalpsmn@gmail.com' && (
                        <span className="text-[8px] bg-theme-primary text-theme-primary-text px-1.5 py-0.5 rounded-full uppercase tracking-tighter">System</span>
                      )}
                    </h4>
                    <p className="text-[10px] text-theme-text-secondary uppercase font-black tracking-widest mt-0.5">
                      {admin.role === 'super_admin' ? 'Curator' : 'Artisan'} • {admin.status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0">
                  {admin.email?.toLowerCase() !== 'sankalpsmn@gmail.com' && (
                    <>
                      <button
                        onClick={() => handleToggleRole(admin)}
                        className="p-2 rounded-xl text-theme-accent bg-theme-accent/5 hover:bg-theme-accent hover:text-theme-accent-text transition-all cursor-pointer"
                        title={admin.role === 'super_admin' ? 'Demote to Artisan' : 'Promote to Curator'}
                      >
                        {admin.role === 'super_admin' ? <BadgeCheck size={16} /> : <ShieldCheck size={16} />}
                      </button>
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          admin.status === 'active' 
                            ? 'text-theme-primary bg-theme-primary/5 hover:bg-theme-primary hover:text-theme-primary-text' 
                            : 'text-rose bg-rose/5 hover:bg-rose hover:text-white'
                        }`}
                        title={admin.status === 'active' ? 'Disable Access' : 'Enable Access'}
                      >
                        {admin.status === 'active' ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                      </button>
                      <button
                        onClick={() => handleRemoveClick(admin.email)}
                        className="p-2 text-theme-text-muted hover:text-rose hover:bg-rose/5 rounded-xl transition-all cursor-pointer"
                        title="Remove Permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
