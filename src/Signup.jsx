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
        setMessage({ text: 'Account created successfully! You can now login.', type: 'success' });
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
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-4">
      {/* Top Navigation Bar */}
      <header className="w-full max-w-md mb-6 flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">DoParking</h1>
        </div>
        <button type="button" className="p-2 text-outline hover:bg-surface-container-low rounded-full transition-colors cursor-pointer">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </header>

      {/* Registration Card */}
      <main className="w-full max-w-md bg-surface-container-lowest rounded-[1.5rem] shadow-[0px_12px_32px_rgba(74,64,224,0.06)] p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar z-10 block">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">Create Your Account</h2>
          <p className="text-on-surface-variant text-sm">Join the network for seamless city parking</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSignup}>
          {message.text && (
            <div className={`p-3 rounded text-sm ${message.type === 'error' ? 'bg-error/10 text-error' : 'bg-green-100 text-green-700'}`}>
                {message.text}
            </div>
          )}
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Full Name</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">person</span>
              <input name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary transition-all placeholder:text-outline/60 text-on-surface text-sm" placeholder="Enter your full name" type="text"/>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Phone Number</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">phone</span>
                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary transition-all placeholder:text-outline/60 text-on-surface text-sm" placeholder="+91 00000 00000" type="tel"/>
              </div>
            </div>
            
            {/* Vehicle Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Vehicle Type</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors" data-icon="directions_car">directions_car</span>
                <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full pl-12 pr-10 py-3.5 bg-surface-container-low border border-outline-variant/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary appearance-none transition-all text-on-surface text-sm">
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="EV / Hybrid">EV / Hybrid</option>
                  <option value="Motorbike">Motorbike</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>
          
          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Email Address</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">mail</span>
              <input name="email" value={formData.email} onChange={handleChange} required className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary transition-all placeholder:text-outline/60 text-on-surface text-sm" placeholder="name@example.com" type="email"/>
            </div>
          </div>
          
          {/* Vehicle Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Vehicle Number</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">license</span>
              <input name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary transition-all placeholder:text-outline/60 text-on-surface text-sm" placeholder="KA 01 AB 1234" type="text"/>
            </div>
          </div>
          
          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Password</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">lock</span>
                <input name="password" value={formData.password} onChange={handleChange} required className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface text-sm" placeholder="••••••••" type="password"/>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Confirm</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">lock_reset</span>
                <input name="confirm" value={formData.confirm} onChange={handleChange} required className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface text-sm" placeholder="••••••••" type="password"/>
              </div>
            </div>
          </div>
          
          {/* Verification Checkbox */}
          <div className="flex items-start gap-3 pt-2">
            <div className="flex items-center h-5">
              <input checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-5 h-5 rounded border-outline-variant/50 text-primary focus:ring-primary/20 cursor-pointer" id="verification" type="checkbox"/>
            </div>
            <label className="text-[12px] text-on-surface-variant leading-relaxed cursor-pointer" htmlFor="verification">
              I agree to allow vehicle verification and digital ticketing as per <span className="text-primary font-semibold">Terms of Service</span>.
            </label>
          </div>
          
          {/* Action Button */}
          <button disabled={loading} className="w-full mt-6 py-4 bg-gradient-to-r from-primary to-primary-dim text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100 cursor-pointer" type="submit">
            <span>{loading ? 'Registering...' : 'Register'}</span>
            {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
          </button>
        </form>
        
        {/* Footer */}
        <div className="text-center py-4 space-y-4">
          <p className="text-sm text-on-surface-variant">
            Already have an account? 
            <Link to="/" className="text-primary font-bold hover:underline ml-1">Login</Link>
          </p>
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">or secure join with</span>
            <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
          </div>
          <div className="flex justify-center gap-4">
            <button type="button" className="w-full flex items-center justify-center py-3 bg-surface border border-outline-variant/15 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer group">
              <img className="w-5 h-5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt="Google company logo icon" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWRjpBl9boJg-o9ueVXHpqmiVLiGPgH001VqCpO6cg_oHCVdDIeSDK9G1-w0y7yZ5TKNfkPO58Lxoy_uzNjyZ8gUenSennTAzka-izj-X61Dvy7aCoz1ZLhFbOxN1Dtw3UOraQqYymP5EuwMh8Sx-rDpk4lr5xawAByzN37tOVQgIXqHtPIptDqCKb7EkTnCVXdvJgFU7OdKLtGiKJ05ovHYeRkYEgBNdWvGK-sIcTSPT8zXVZLf-rMeW7T8SkZFeoG9ySJ8a7WqU"/>
            </button>
            <button type="button" className="w-full flex items-center justify-center py-3 bg-surface border border-outline-variant/15 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0" }}>fingerprint</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-6 w-[90%] max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-50 flex justify-around items-center py-3 rounded-full shadow-[0px_12px_32px_rgba(74,64,224,0.06)] border border-outline-variant/15">
        <Link to="/" className="text-slate-400 p-3 hover:scale-110 transition-transform">
          <span className="material-symbols-outlined">login</span>
        </Link>
        <div className="bg-indigo-100 text-indigo-800 rounded-full p-3 hover:scale-110 transition-transform cursor-pointer">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
        </div>
        <div className="text-slate-400 p-3 hover:scale-110 transition-transform cursor-pointer">
          <span className="material-symbols-outlined">help_outline</span>
        </div>
      </nav>

      {/* Map Background Aesthetic Element */}
      <div className="fixed inset-0 -z-10 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#4a40e0_0%,transparent_70%)]"></div>
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full border-outline-variant/10 border"></div>
      </div>
    </div>
  );
}
