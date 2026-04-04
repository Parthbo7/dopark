import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ActiveBooking from "./ActiveBooking";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/ticket" element={<Ticket />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/history" element={<History />} />
        <Route path="/my-cards" element={<MyCards />} />
        <Route path="/active-booking" element={<ActiveBooking />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/slots" element={<AdminSlots />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
