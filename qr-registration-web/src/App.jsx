import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StepTracker from './components/StepTracker';
import Step1PhoneOTP from './components/Step1PhoneOTP';
import Step2PersonalDetails from './components/Step2PersonalDetails';
import Step3SelectPlan from './components/Step3SelectPlan';
import Step4Payment from './components/Step4Payment';
import Step5SuccessPass from './components/Step5SuccessPass';
import CheckinPortal from './components/CheckinPortal';
import FeedbackPortal from './components/FeedbackPortal';
import ComplaintPortal from './components/ComplaintPortal';
import UniversalPortal from './components/UniversalPortal';

const STEPS = [
  { title: 'Account' },
  { title: 'Profile' },
  { title: 'Select Plan' },
  { title: 'Payment' },
  { title: 'Digital Pass' },
];

// Helper: extract base repo prefix (e.g. /Elite-Fitness or empty)
function getBaseRoutePath() {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname;
  if (path.toLowerCase().startsWith('/elite-fitness')) {
    return '/Elite-Fitness';
  }
  return '';
}

// Route detection: reads pathname/hash/search to resolve current view
function detectCurrentRoute() {
  if (typeof window === 'undefined') return 'qr';
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  // 1. Universal QR Landing Page - Highest Priority Check
  // Matches /qr, /qr/, ?qr, ?qr=1, &qr=1, #qr, ?p=/qr, ?p=%2fqr
  if (
    path.endsWith('/qr') || path.includes('/qr/') || path.endsWith('/qr.html') ||
    search.includes('qr=') || search.includes('?qr') || search.includes('&qr') ||
    hash.includes('qr') ||
    search.includes('p=%2fqr') || search.includes('p=/qr')
  ) {
    return 'qr';
  }

  // 2. Attendance / Check-in Portal
  if (
    path.endsWith('/checkin') || path.includes('/checkin/') ||
    path.endsWith('/attendance') || path.includes('/attendance/') ||
    search.includes('checkin') || hash.includes('checkin') ||
    search.includes('attendance') || hash.includes('attendance')
  ) {
    return 'checkin';
  }

  // 3. Feedback & Review Portal
  if (
    path.endsWith('/feedback') || path.includes('/feedback/') ||
    search.includes('feedback') || hash.includes('feedback')
  ) {
    return 'feedback';
  }

  // 4. Complaint & Support Portal
  if (
    path.endsWith('/complaint') || path.includes('/complaint/') ||
    search.includes('complaint') || hash.includes('complaint')
  ) {
    return 'complaint';
  }

  // 5. New Registration Stepper
  // ONLY triggered if explicitly targeted with /register, ?register=1, etc.
  if (
    path.endsWith('/register') || path.includes('/register/') ||
    search.includes('register=1') || search.includes('register=true') ||
    hash.includes('register') ||
    search.includes('p=%2fregister') || search.includes('p=/register')
  ) {
    return 'register';
  }

  // 6. DEFAULT FALLBACK: ALWAYS open Universal QR Landing Page
  // Ensures that root ('/', '/Elite-Fitness/', '/Elite-Fitness') or any general QR scan
  // opens the 4-service selection portal, NEVER directly jumping into registration!
  return 'qr';
}

export default function App() {
  const [route, setRoute] = useState(detectCurrentRoute);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
    date_of_birth: '',
    gender: 'MALE',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);

  // Listen for browser back/forward and hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(detectCurrentRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Navigate from Universal Portal to a specific service
  const handleNavigateToService = (serviceId) => {
    setRoute(serviceId);
    if (serviceId === 'register') setCurrentStep(1);

    // Update browser URL history for clean back-button navigation
    try {
      const base = getBaseRoutePath();
      const newPath = `${base}/${serviceId}`;
      window.history.pushState({ service: serviceId }, '', newPath);
    } catch (_) {}
  };

  // Navigate back to Universal Portal
  const handleBackToQr = () => {
    setRoute('qr');
    try {
      const base = getBaseRoutePath();
      const qrPath = `${base}/qr`;
      window.history.pushState({ service: 'qr' }, '', qrPath);
    } catch (_) {}
  };

  // ─── Route: Universal QR Landing Page ────────────────────────────────────────
  if (route === 'qr') {
    return <UniversalPortal onNavigate={handleNavigateToService} />;
  }

  // ─── Route: Feedback Portal ───────────────────────────────────────────────────
  if (route === 'feedback') {
    return (
      <FeedbackPortal
        onNavigateToRegister={() => handleNavigateToService('register')}
        onBack={handleBackToQr}
      />
    );
  }

  // ─── Route: Check-in / Attendance Portal ─────────────────────────────────────
  if (route === 'checkin') {
    return (
      <CheckinPortal
        onNavigateToRegister={() => handleNavigateToService('register')}
        onBack={handleBackToQr}
      />
    );
  }

  // ─── Route: Complaint & Support Portal ───────────────────────────────────────
  if (route === 'complaint') {
    return (
      <ComplaintPortal
        onBack={handleBackToQr}
      />
    );
  }

  // ─── Route: Registration Stepper Flow ────────────────────────────────────────
  const isCashPending = (registrationResult?.paymentMethod === 'CASH' || registrationResult?.paymentStatus === 'PENDING_CASH') && registrationResult?.isPassLocked;
  const currentSteps = [
    { title: 'Account' },
    { title: 'Profile' },
    { title: 'Select Plan' },
    { title: 'Payment' },
    { title: isCashPending ? 'Desk Token' : 'Digital Pass' },
  ];

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, currentSteps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handlePaymentSuccess = (result) => {
    setRegistrationResult(result);
    setCurrentStep(5);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '20px 16px 60px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Back to Universal Service Selection Page */}
        <button
          id="btn-back-to-services"
          onClick={handleBackToQr}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#F59E0B',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '14px',
            padding: '4px 0'
          }}
        >
          ← Back to All Services
        </button>

        <Header />

        <StepTracker currentStep={currentStep} steps={currentSteps} />

        {currentStep === 1 && (
          <Step1PhoneOTP
            formData={formData}
            setFormData={setFormData}
            onNext={nextStep}
          />
        )}

        {currentStep === 2 && (
          <Step2PersonalDetails
            formData={formData}
            setFormData={setFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}

        {currentStep === 3 && (
          <Step3SelectPlan
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}

        {currentStep === 4 && (
          <Step4Payment
            formData={formData}
            selectedPlan={selectedPlan}
            onSuccess={handlePaymentSuccess}
            onPrev={prevStep}
          />
        )}

        {currentStep === 5 && (
          <Step5SuccessPass
            registrationResult={registrationResult}
            formData={formData}
            selectedPlan={selectedPlan}
          />
        )}

        <footer style={{
          textAlign: 'center',
          marginTop: '40px',
          color: '#64748B',
          fontSize: '0.8rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '20px'
        }}>
          © {new Date().getFullYear()} Elite Fitness. All Rights Reserved. | Powered by Elite Fitness Management System
        </footer>
      </div>
    </div>
  );
}
