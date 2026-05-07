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
    
    setIsAdding(true);
    try {
      await adminService.addAdmin(newEmail, newRole);
      setNewEmail('');
      setNewRole('admin');
    } catch (error: any) {
      alert(error.message || 'Failed to add admin');
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
      alert(error.message || 'Error updating role');
    }
  };

  const handleRemove = async (email: string) => {
    if (window.confirm(`Are you sure you want to remove ${email}?`)) {
      try {
        await adminService.removeAdmin(email);
      } catch (error) {
        console.error('Error removing admin:', error);
      }
    }
  };

  if (loading) return (
    <div className="py-20 text-center">
      <div className="w-10 h-10 border-2 border-indigo border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-[10px] uppercase font-black tracking-widest text-ink/30">Loading Secure Records...</p>
    </div>
  );

  return (
    <div className="space-y-12">
      {/* Add Admin Form */}
      <section className="bg-cream/30 p-8 rounded-[30px] border border-gold/10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo text-white rounded-xl">
            <UserPlus size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo">Authorize New Artisan</h3>
            <p className="text-[10px] text-ink/40 uppercase tracking-tighter">Grant access to the collection dashboard</p>
          </div>
        </div>

        <form onSubmit={handleAddAdmin} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={16} />
            <input
              type="email"
              placeholder="artisan@anshicollection.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-white border border-gold/10 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-indigo transition-all font-sans font-medium"
              required
            />
          </div>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as any)}
            className="bg-white border border-gold/10 rounded-2xl px-4 py-4 text-sm outline-none focus:border-indigo transition-all font-sans font-medium"
          >
            <option value="admin">Artisan (Admin)</option>
            <option value="super_admin">Curator (Super Admin)</option>
          </select>
          <button
            type="submit"
            disabled={isAdding}
            className="wa-button !bg-indigo !py-4 px-8 rounded-2xl shadow-xl shadow-indigo/20 disabled:opacity-50 text-[10px] uppercase font-black"
          >
            {isAdding ? 'Adding...' : 'Grant Access'}
          </button>
        </form>
      </section>

      {/* Admin List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b luxury-border pb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo flex items-center gap-2">
            <BadgeCheck size={14} />
            Authorized Personnel
          </h3>
          <span className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">{admins.length} Logged</span>
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
                className={`p-6 rounded-3xl border bg-white flex items-center justify-between group transition-all ${
                  admin.status === 'disabled' ? 'opacity-60 grayscale' : 'hover:border-indigo/30 hover:shadow-xl'
                } ${admin.email?.toLowerCase() === 'sankalpsmn@gmail.com' ? 'border-gold/30 bg-gold/[0.02]' : 'border-gold/5'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    admin.email?.toLowerCase() === 'sankalpsmn@gmail.com' ? 'bg-gold text-white' : 'bg-cream text-indigo'
                  }`}>
                    {admin.role === 'super_admin' ? <ShieldCheck size={18} /> : <BadgeCheck size={18} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-ink tracking-tight flex items-center gap-2">
                      {admin.email}
                      {admin.email?.toLowerCase() === 'sankalpsmn@gmail.com' && (
                        <span className="text-[8px] bg-gold text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">System</span>
                      )}
                    </h4>
                    <p className="text-[10px] text-ink/30 uppercase font-black tracking-widest mt-0.5">
                      {admin.role === 'super_admin' ? 'Curator' : 'Artisan'} • {admin.status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0">
                  {admin.email?.toLowerCase() !== 'sankalpsmn@gmail.com' && (
                    <>
                      <button
                        onClick={() => handleToggleRole(admin)}
                        className="p-2 rounded-xl text-gold bg-gold/5 hover:bg-gold hover:text-white transition-all"
                        title={admin.role === 'super_admin' ? 'Demote to Artisan' : 'Promote to Curator'}
                      >
                        {admin.role === 'super_admin' ? <BadgeCheck size={16} /> : <ShieldCheck size={16} />}
                      </button>
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        className={`p-2 rounded-xl transition-all ${
                          admin.status === 'active' 
                            ? 'text-indigo bg-indigo/5 hover:bg-indigo hover:text-white' 
                            : 'text-rose bg-rose/5 hover:bg-rose hover:text-white'
                        }`}
                        title={admin.status === 'active' ? 'Disable Access' : 'Enable Access'}
                      >
                        {admin.status === 'active' ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                      </button>
                      <button
                        onClick={() => handleRemove(admin.email)}
                        className="p-2 text-ink/20 hover:text-rose hover:bg-rose/5 rounded-xl transition-all"
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
