import { useState } from 'react';
import { supabase } from './supabase';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    vehicleType: 'Sedan',
    email: '',
    vehicleNumber: '',
    password: '',
    confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setMessage({ text: 'You must agree to the Terms of Service.', type: 'error' });
      return;
    }
    if (formData.password !== formData.confirm) {
        setMessage({ text: 'Passwords do not match.', type: 'error' });
        return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
            data: {
                full_name: formData.fullName,
                phone: formData.phone,
                vehicle_type: formData.vehicleType,
                vehicle_number: formData.vehicleNumber
            }
        }
      });

      if (error) {
        setMessage({ text: error.message, type: 'error' });
      } else {
        setMessage({ text: 'Account created successfully! Redirecting to login...', type: 'success' });
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8F9FE] dark:bg-slate-950 text-on-surface min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden">
      
      {/* Top Header */}
      <header className="w-full max-w-[500px] mb-8 flex justify-between items-center px-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl font-black">local_parking</span>
          </div>
          <span className="text-xl font-extrabold text-[#4a40e0] tracking-tight">DoParking</span>
        </div>
        <Link to="/" className="text-xs font-bold text-[#4a40e0] hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">login</span>
          Back to Login
        </Link>
      </header>

      {/* Registration Card */}
      <main className="w-full max-w-[500px] bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/40 shadow-[0px_15px_40px_rgba(74,64,224,0.05)] p-6 sm:p-10 flex flex-col gap-6 relative z-10">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-[#2B3674] dark:text-slate-200 tracking-tight">Create Your Account</h2>
          <p className="text-slate-400 text-xs font-semibold">Join the network for seamless city parking</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSignup}>
          {message.text && (
            <div className={`p-3 rounded-xl text-xs font-bold ${
              message.type === 'error' 
                ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-900/10' 
                : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-105/20'
            }`}>
                {message.text}
            </div>
          )}
          
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#4a40e0] transition-colors text-lg">person</span>
              <input 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleChange} 
                required 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a40e0]/20 focus:border-[#4a40e0]/30 transition-all placeholder:text-slate-400 text-on-surface text-sm" 
                placeholder="Enter your full name" 
                type="text"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#4a40e0] transition-colors text-lg">phone</span>
                <input 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a40e0]/20 focus:border-[#4a40e0]/30 transition-all placeholder:text-slate-400 text-on-surface text-sm" 
                  placeholder="+91 98765 43210" 
                  type="tel"
                />
              </div>
            </div>
            
            {/* Vehicle Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Vehicle Type</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#4a40e0] transition-colors text-lg">directions_car</span>
                <select 
                  name="vehicleType" 
                  value={formData.vehicleType} 
                  onChange={handleChange} 
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a40e0]/20 focus:border-[#4a40e0]/30 appearance-none transition-all text-on-surface text-sm font-bold cursor-pointer"
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="EV / Hybrid">EV / Hybrid</option>
                  <option value="Motorbike">Motorbike</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none text-lg">expand_more</span>
              </div>
            </div>
          </div>
          
          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#4a40e0] transition-colors text-lg">mail</span>
              <input 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a40e0]/20 focus:border-[#4a40e0]/30 transition-all placeholder:text-slate-400 text-on-surface text-sm" 
                placeholder="name@example.com" 
                type="email"
              />
            </div>
          </div>
          
          {/* Vehicle Number */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Vehicle Number</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#4a40e0] transition-colors text-lg">badge</span>
              <input 
                name="vehicleNumber" 
                value={formData.vehicleNumber} 
                onChange={handleChange} 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a40e0]/20 focus:border-[#4a40e0]/30 transition-all placeholder:text-slate-400 text-on-surface text-sm font-mono uppercase" 
                placeholder="MH12 AB 1234" 
                type="text"
              />
            </div>
          </div>
          
          {/* Password Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Password</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#4a40e0] transition-colors text-lg">lock</span>
                <input 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a40e0]/20 focus:border-[#4a40e0]/30 transition-all text-on-surface text-sm" 
                  placeholder="••••••••" 
                  type="password"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-1">Confirm</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#4a40e0] transition-colors text-lg">lock_reset</span>
                <input 
                  name="confirm" 
                  value={formData.confirm} 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a40e0]/20 focus:border-[#4a40e0]/30 transition-all text-on-surface text-sm" 
                  placeholder="••••••••" 
                  type="password"
                />
              </div>
            </div>
          </div>
          
          {/* Verification Checkbox */}
          <div className="flex items-start gap-3 pt-2">
            <div className="flex items-center h-5">
              <input 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)} 
                className="w-4 h-4 rounded border-slate-300 text-[#4a40e0] focus:ring-[#4a40e0]/20 cursor-pointer" 
                id="verification" 
                type="checkbox"
              />
            </div>
            <label className="text-[11px] text-slate-400 font-semibold leading-normal cursor-pointer select-none" htmlFor="verification">
              I agree to allow vehicle verification and digital ticketing as per <span className="text-[#4a40e0] hover:underline cursor-pointer">Terms of Service</span>.
            </label>
          </div>
          
          {/* Action Button */}
          <button 
            disabled={loading} 
            className="w-full mt-4 py-4 bg-[#4a40e0] hover:bg-[#3b32b3] disabled:bg-indigo-300 text-white font-extrabold rounded-xl shadow-lg shadow-[#4a40e0]/10 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider" 
            type="submit"
          >
            <span>{loading ? 'Registering...' : 'Register Account'}</span>
            {!loading && <span className="material-symbols-outlined text-base">arrow_forward</span>}
          </button>
        </form>
        
        {/* Footer */}
        <div className="text-center py-2 space-y-4">
          <p className="text-xs text-slate-400 font-bold">
            Already have an account? 
            <Link to="/" className="text-[#4a40e0] hover:underline ml-1">Login</Link>
          </p>
        </div>
      </main>

      {/* Decorative Grid Background Element */}
      <div className="fixed inset-0 -z-10 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#4a40e0_0%,transparent_70%)]"></div>
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full border-slate-100 border"></div>
      </div>
    </div>
  );
}
