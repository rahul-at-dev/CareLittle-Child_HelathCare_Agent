import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { PrivacyTermsPage } from './pages/PrivacyTermsPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ChildHubPage } from './pages/ChildHubPage';
import { GrowthPage } from './pages/GrowthPage';
import { DevelopmentPage } from './pages/DevelopmentPage';
import { NutritionPage } from './pages/NutritionPage';
import { SafetyCheckPage } from './pages/SafetyCheckPage';
import { ChatPage } from './pages/ChatPage';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZWxlZ2FudC1jYW1lbC0zMDExLmNsZXJrLmFjY291bnRzLmRldiQ';

export const App: React.FC = () => {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/privacy-terms" element={<PrivacyTermsPage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          
          {/* Phase 2 Core Health Record Routes */}
          <Route path="/child/:childId" element={<ChildHubPage />} />
          <Route path="/child/:childId/growth" element={<GrowthPage />} />
          <Route path="/child/:childId/development" element={<DevelopmentPage />} />
          <Route path="/child/:childId/nutrition" element={<NutritionPage />} />

          {/* Phase 3 Deterministic Safety Route */}
          <Route path="/child/:childId/safety" element={<SafetyCheckPage />} />

          {/* Phase 4 AI Symptom Chat Routes */}
          <Route path="/child/:childId/chat" element={<ChatPage />} />
          <Route path="/child/:childId/chat/:sessionId" element={<ChatPage />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
};

export default App;

