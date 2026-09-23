import React, { useState } from 'react';
import Header from './components/Header';
import StepTracker from './components/StepTracker';
import Step1PhoneOTP from './components/Step1PhoneOTP';
import Step2PersonalDetails from './components/Step2PersonalDetails';
import Step3SelectPlan from './components/Step3SelectPlan';
import Step4Payment from './components/Step4Payment';
import Step5SuccessPass from './components/Step5SuccessPass';
import CheckinPortal from './components/CheckinPortal';
import FeedbackPortal from './components/FeedbackPortal';

const STEPS = [
  { title: 'Account' },
  { title: 'Profile' },
  { title: 'Select Plan' },
  { title: 'Payment' },
  { title: 'Digital Pass' },
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: 'MALE',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);

  // Check if scanning feedback QR via Google Lens / phone camera
  const isFeedback = typeof window !== 'undefined' && (
    window.location.search.toLowerCase().includes('feedback') ||
    window.location.hash.toLowerCase().includes('feedback') ||
    window.location.pathname.toLowerCase().includes('feedback')
  );

  if (isFeedback) {
    return <FeedbackPortal />;
  }

  // Check if scanning table attendance QR
  const isCheckin = typeof window !== 'undefined' && (
    window.location.search.toLowerCase().includes('checkin') ||
    window.location.hash.toLowerCase().includes('checkin') ||
    window.location.pathname.toLowerCase().includes('checkin') ||
    window.location.search.toLowerCase().includes('attendance') ||
    window.location.hash.toLowerCase().includes('attendance')
  );

  if (isCheckin) {
    return <CheckinPortal />;
  }

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handlePaymentSuccess = (result) => {
    setRegistrationResult(result);
    setCurrentStep(5);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '20px 16px 60px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Header />

        <StepTracker currentStep={currentStep} steps={STEPS} />

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
