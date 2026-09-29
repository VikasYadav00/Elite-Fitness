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

// Route detection: reads pathname/hash/search to resolve current view
function detectCurrentRoute() {
  if (typeof window === 'undefined') return 'qr';
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  // Explicit sub-routes
  if (path.includes('/register') || search.includes('register') || hash.includes('/register')) {
    return 'register';
  }
  if (search.includes('feedback') || hash.includes('feedback') || path.includes('/feedback')) {
    return 'feedback';
  }
  if (
    search.includes('checkin') || hash.includes('checkin') || path.includes('/checkin') ||
    search.includes('attendance') || hash.includes('attendance') || path.includes('/attendance')
  ) {
    return 'checkin';
  }
  if (search.includes('complaint') || hash.includes('complaint') || path.includes('/complaint')) {
    return 'complaint';
  }
  // Default to Universal QR landing page for /qr or root /
  return 'qr';
}

export default function App() {
  const [route, setRoute] = useState(detectCurrentRoute);
  // 'from' tracks which page the user came from (for back navigation)
  const [from, setFrom] = useState(null);
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
      setFrom(null);
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
    setFrom('qr'); // remember we came from QR
    setRoute(serviceId);
    // Reset registration step when navigating fresh
    if (serviceId === 'register') setCurrentStep(1);
  };

  // Navigate back to Universal Portal
  const handleBackToQr = () => {
    setRoute('qr');
    setFrom(null);
  };

  // ─── Route: Universal QR Landing Page ────────────────────────────────────────
  if (route === 'qr') {
    return <UniversalPortal onNavigate={handleNavigateToService} />;
  }

  // ─── Route: Feedback Portal ───────────────────────────────────────────────────
  if (route === 'feedback') {
    return (
      <FeedbackPortal
        onNavigateToRegister={() => from === 'qr' ? handleBackToQr() : setRoute('register')}
        onBack={from === 'qr' ? handleBackToQr : null}
      />
    );
  }

  // ─── Route: Check-in / Attendance Portal ─────────────────────────────────────
  if (route === 'checkin') {
    return (
      <CheckinPortal
        onNavigateToRegister={() => from === 'qr' ? handleBackToQr() : setRoute('register')}
        onBack={from === 'qr' ? handleBackToQr : null}
      />
    );
  }

  // ─── Route: Complaint & Support Portal ───────────────────────────────────────
  if (route === 'complaint') {
    return (
      <ComplaintPortal
        onBack={from === 'qr' ? handleBackToQr : null}
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
        {/* Back to QR Portal link (only if came from QR) */}
        {from === 'qr' && (
          <button
            onClick={handleBackToQr}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '10px',
              padding: '0'
            }}
          >
            ← Back to Services
          </button>
        )}

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
