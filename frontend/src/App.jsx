import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import Home from './pages/Home';
import PatientLogin from './pages/PatientLogin';
import DoctorLogin from './pages/DoctorLogin';
import PatientSignup from './pages/PatientSignup';
import DoctorSignup from './pages/DoctorSignup';

// Auth Components
import ProtectedRoute from './components/ProtectedRoute';

// Patient Dashboard
import PatientHome from './pages/patient/PatientHome';
import PatientTest from './pages/patient/PatientTest';
import PatientSchedule from './pages/patient/PatientSchedule';
import PatientNotifications from './pages/patient/PatientNotifications';
import PatientResults from './pages/patient/PatientResults';

// Doctor Dashboard
import DoctorOverview from './pages/doctor/DoctorOverview';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorPatientDetail from './pages/doctor/DoctorPatientDetail';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import DoctorCompletions from './pages/doctor/DoctorCompletions';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />

        {/* Separate Auth Routes */}
        <Route path="/login/patient" element={<PatientLogin />} />
        <Route path="/login/doctor" element={<DoctorLogin />} />
        <Route path="/signup/patient" element={<PatientSignup />} />
        <Route path="/signup/doctor" element={<DoctorSignup />} />

        {/* Patient Dashboard (Auth Protected) */}
        <Route path="/patient" element={<ProtectedRoute role="patient"><PatientHome /></ProtectedRoute>} />
        <Route path="/patient/test" element={<ProtectedRoute role="patient"><PatientTest /></ProtectedRoute>} />
        <Route path="/patient/schedule" element={<ProtectedRoute role="patient"><PatientSchedule /></ProtectedRoute>} />
        <Route path="/patient/notifications" element={<ProtectedRoute role="patient"><PatientNotifications /></ProtectedRoute>} />
        <Route path="/patient/results" element={<ProtectedRoute role="patient"><PatientResults /></ProtectedRoute>} />

        {/* Doctor Dashboard (Auth Protected) */}
        <Route path="/doctor" element={<ProtectedRoute role="doctor"><DoctorOverview /></ProtectedRoute>} />
        <Route path="/doctor/patients" element={<ProtectedRoute role="doctor"><DoctorPatients /></ProtectedRoute>} />
        <Route path="/doctor/patient/:id" element={<ProtectedRoute role="doctor"><DoctorPatientDetail /></ProtectedRoute>} />
        <Route path="/doctor/schedule" element={<ProtectedRoute role="doctor"><DoctorSchedule /></ProtectedRoute>} />
        <Route path="/doctor/completions" element={<ProtectedRoute role="doctor"><DoctorCompletions /></ProtectedRoute>} />

        {/* Legacy/Redirects */}
        <Route path="/login" element={<Navigate to="/login/patient" replace />} />
        <Route path="/signup" element={<Navigate to="/signup/patient" replace />} />
        <Route path="/audio" element={<Navigate to="/patient/test" replace />} />
        <Route path="/quiz" element={<Navigate to="/patient/test" replace />} />
        <Route path="/result" element={<Navigate to="/patient/results" replace />} />

        {/* Catch-all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
