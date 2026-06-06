import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabase";
import MainLayout from "./MainLayout";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import Booking from "./Booking";
import Confirmation from "./Confirmation";
import Ticket from "./Ticket";
import Notifications from "./Notifications";
import History from "./History";
import MyCards from "./MyCards";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminSlots from "./AdminSlots";
import AdminAnalytics from "./AdminAnalytics";
import AdminSecurity from "./AdminSecurity";
import ActiveBooking from "./ActiveBooking";
import MapView from "./MapView";

function App() {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const ensureGuestSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCheckingAuth(false);
          return;
        }

        // Generate or retrieve guest credentials unique to this browser
        let guestEmail = localStorage.getItem('doparking_guest_email');
        let guestPassword = localStorage.getItem('doparking_guest_password');
        if (!guestEmail) {
          const randomId = Math.random().toString(36).substring(2, 11);
          guestEmail = `guest_${randomId}@doparking.com`;
          guestPassword = `pass_${randomId}_secure`;
          localStorage.setItem('doparking_guest_email', guestEmail);
          localStorage.setItem('doparking_guest_password', guestPassword);
        }

        // Try signing in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: guestEmail,
          password: guestPassword,
        });

        if (signInError) {
          // If login fails (first-time guest), sign up the guest
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: guestEmail,
            password: guestPassword,
            options: {
              data: {
                full_name: "Guest User",
                phone: "+91 9876543210",
                vehicle_type: "4_wheeler",
                vehicle_number: "MH12 GP 9999"
              }
            }
          });

          if (signUpError) {
            console.error("Auto-signup failed:", signUpError);
          }
        }
      } catch (err) {
        console.error("Error during guest auto-login:", err);
      } finally {
        setCheckingAuth(false);
      }
    };

    ensureGuestSession();
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#4a40e0]">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 rounded-full border-4 border-white/30 border-t-white mx-auto"></div>
          <p className="text-white font-bold tracking-wide">Initializing your demo parking session...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/slots" element={<AdminSlots />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/security" element={<AdminSecurity />} />

        {/* Consumer-facing routes wrapped in MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/ticket" element={<Ticket />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/history" element={<History />} />
          <Route path="/my-cards" element={<MyCards />} />
          <Route path="/active-booking" element={<ActiveBooking />} />
          <Route path="/map" element={<MapView />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


