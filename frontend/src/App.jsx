import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import Home from './pages/Home';
import PatientLogin from './pages/PatientLogin';
import DoctorLogin from './pages/DoctorLogin';
import PatientSignup from './pages/PatientSignup';
import DoctorSignup from './pages/DoctorSignup';
import CaretakerLogin from './pages/CaretakerLogin';
import CaretakerSignup from './pages/CaretakerSignup';

// Auth Components
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './context/LanguageContext';


// Patient Dashboard
import PatientHome from './pages/patient/PatientHome';
import PatientTest from './pages/patient/PatientTest';
import PatientSchedule from './pages/patient/PatientSchedule';
import PatientNotifications from './pages/patient/PatientNotifications';
import MOCATest from './pages/patient/MOCATest';
import AICompanion from './pages/patient/AICompanion';
import Diary from './pages/patient/Diary';
import Games from './pages/patient/Games';
import SoulConnect from './pages/patient/SoulConnect';
import PatientProfile from './pages/patient/PatientProfile';


// Doctor Dashboard
import DoctorOverview from './pages/doctor/DoctorOverview';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorPatientDetail from './pages/doctor/DoctorPatientDetail';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import DoctorDiaryReports from './pages/doctor/DoctorDiaryReports';
import DoctorScreeningReports from './pages/doctor/DoctorScreeningReports';

// Caretaker Dashboard
import CaretakerOverview from './pages/caretaker/CaretakerOverview';
import CaretakerSeniors from './pages/caretaker/CaretakerSeniors';
import CaretakerSeniorDetail from './pages/caretaker/CaretakerSeniorDetail';
import CaretakerSchedule from './pages/caretaker/CaretakerSchedule';
import CaretakerDiaryReports from './pages/caretaker/CaretakerDiaryReports';
import CaretakerScreeningReports from './pages/caretaker/CaretakerScreeningReports';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />

        {/* Auth Routes */}
        <Route path="/login/patient" element={<PatientLogin />} />
        <Route path="/login/doctor" element={<DoctorLogin />} />
        <Route path="/login/caretaker" element={<CaretakerLogin />} />
        <Route path="/signup/patient" element={<PatientSignup />} />
        <Route path="/signup/doctor" element={<DoctorSignup />} />
        <Route path="/signup/caretaker" element={<CaretakerSignup />} />

        {/* Patient Dashboard — wrapped in LanguageProvider for i18n */}
        <Route path="/patient" element={<LanguageProvider><ProtectedRoute role="patient"><PatientHome /></ProtectedRoute></LanguageProvider>} />
        <Route path="/patient/home" element={<LanguageProvider><ProtectedRoute role="patient"><PatientHome /></ProtectedRoute></LanguageProvider>} />
        <Route path="/patient/schedule" element={<LanguageProvider><ProtectedRoute role="patient"><PatientSchedule /></ProtectedRoute></LanguageProvider>} />
        <Route path="/patient/test" element={<LanguageProvider><ProtectedRoute role="patient"><PatientTest /></ProtectedRoute></LanguageProvider>} />
        <Route path="/patient/moca" element={<LanguageProvider><ProtectedRoute role="patient"><MOCATest /></ProtectedRoute></LanguageProvider>} />
        <Route path="/patient/companion" element={<LanguageProvider><ProtectedRoute role="patient"><AICompanion /></ProtectedRoute></LanguageProvider>} />
        <Route path="/patient/diary" element={<LanguageProvider><ProtectedRoute role="patient"><Diary /></ProtectedRoute></LanguageProvider>} />
        <Route path="/patient/games" element={<LanguageProvider><ProtectedRoute role="patient"><Games /></ProtectedRoute></LanguageProvider>} />
        <Route path="/patient/soul-connect" element={<LanguageProvider><ProtectedRoute role="patient"><SoulConnect /></ProtectedRoute></LanguageProvider>} />
        <Route path="/patient/notifications" element={<LanguageProvider><ProtectedRoute role="patient"><PatientNotifications /></ProtectedRoute></LanguageProvider>} />
        <Route path="/patient/profile" element={<LanguageProvider><ProtectedRoute role="patient"><PatientProfile /></ProtectedRoute></LanguageProvider>} />


        {/* Doctor Dashboard */}
        <Route path="/doctor" element={<ProtectedRoute role="doctor"><DoctorOverview /></ProtectedRoute>} />
        <Route path="/doctor/patients" element={<ProtectedRoute role="doctor"><DoctorPatients /></ProtectedRoute>} />
        <Route path="/doctor/patient/:id" element={<ProtectedRoute role="doctor"><DoctorPatientDetail /></ProtectedRoute>} />
        <Route path="/doctor/schedule" element={<ProtectedRoute role="doctor"><DoctorSchedule /></ProtectedRoute>} />
        <Route path="/doctor/screening-reports" element={<ProtectedRoute role="doctor"><DoctorScreeningReports /></ProtectedRoute>} />
        <Route path="/doctor/diary-reports" element={<ProtectedRoute role="doctor"><DoctorDiaryReports /></ProtectedRoute>} />

        {/* Caretaker Dashboard */}
        <Route path="/caretaker" element={<ProtectedRoute role="caretaker"><CaretakerOverview /></ProtectedRoute>} />
        <Route path="/caretaker/seniors" element={<ProtectedRoute role="caretaker"><CaretakerSeniors /></ProtectedRoute>} />
        <Route path="/caretaker/senior/:id" element={<ProtectedRoute role="caretaker"><CaretakerSeniorDetail /></ProtectedRoute>} />
        <Route path="/caretaker/schedule" element={<ProtectedRoute role="caretaker"><CaretakerSchedule /></ProtectedRoute>} />
        <Route path="/caretaker/screening-reports" element={<ProtectedRoute role="caretaker"><CaretakerScreeningReports /></ProtectedRoute>} />
        <Route path="/caretaker/diary-reports" element={<ProtectedRoute role="caretaker"><CaretakerDiaryReports /></ProtectedRoute>} />

        {/* Redirects */}
        <Route path="/login" element={<Navigate to="/login/patient" replace />} />
        <Route path="/signup" element={<Navigate to="/signup/patient" replace />} />
        <Route path="/audio" element={<Navigate to="/patient/test" replace />} />
        <Route path="/quiz" element={<Navigate to="/patient/test" replace />} />
        <Route path="/result" element={<Navigate to="/patient/results" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
