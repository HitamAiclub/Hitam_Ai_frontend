import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { testFirebaseConnection } from "./firebase.js";

import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import ParticleBackground from "./components/particles/ParticaleBackground.jsx";
import HomePage from "./pages/HomePage.jsx";
import EventsPage from "./pages/EventsPage.jsx";
import UpcomingActivities from "./pages/UpcomingActivities.jsx";
import FormPage from "./pages/FormPage.jsx";
import JoinClub from "./pages/JoinClub.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminHome from "./pages/admin/AdminHome.jsx";
import CommitteeMembers from "./pages/admin/CommitteeMembers.jsx";
import FormSubmissions from "./pages/admin/FormSubmissions.jsx";
import ActivityAnalyticsPage from "./pages/admin/ActivityAnalyticsPage.jsx";
import FormResponseAnalytics from "./pages/admin/FormResponseAnalytics.jsx";
import CommunityMembers from "./pages/admin/CommunityMembers.jsx";
import MediaManagement from "./pages/admin/MediaManagement.jsx";
import HighlightsManager from "./pages/admin/HighlightsManager.jsx";
import FormListPage from "./pages/admin/FormListPage.jsx";
import FormEditPage from "./pages/admin/FormEditPage.jsx";
import ActivityFormEditPage from "./pages/admin/ActivityFormEditPage.jsx";
import ActivityRegistrationPage from "./pages/ActivityRegistrationPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Simple Error Boundary Component
class SimpleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SimpleErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 border-2 border-red-500 rounded-lg m-4">
          <h2 className="text-2xl font-bold mb-4">Something went wrong.</h2>
          <details className="whitespace-pre-wrap" open>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    testFirebaseConnection();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200 relative border-none outline-none">


          <ParticleBackground />
          <Navbar />

          <main className="relative z-20 flex-grow border-none outline-none">
            <SimpleErrorBoundary>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/upcoming" element={<UpcomingActivities />} />
                <Route path="/form/:formId" element={<FormPage />} />
                <Route
                  path="/upcoming-test"
                  element={
                    <div className="min-h-screen pt-16 flex items-center justify-center">
                      <h1 className="text-4xl">Upcoming Test Page Works!</h1>
                    </div>
                  }
                />
                <Route path="/join" element={<JoinClub />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminHome />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/committee"
                  element={
                    <ProtectedRoute>
                      <CommitteeMembers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/submissions"
                  element={
                    <ProtectedRoute>
                      <FormSubmissions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/activity-analytics/:activityId"
                  element={
                    <ProtectedRoute>
                      <ActivityAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/form-analytics/:activityId"
                  element={
                    <ProtectedRoute>
                      <FormResponseAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/form-submissions"
                  element={
                    <ProtectedRoute>
                      <FormSubmissions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/community"
                  element={
                    <ProtectedRoute>
                      <CommunityMembers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/media"
                  element={
                    <ProtectedRoute>
                      <MediaManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/highlights"
                  element={
                    <ProtectedRoute>
                      <HighlightsManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upcoming/forms"
                  element={
                    <ProtectedRoute>
                      <FormListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upcoming/forms/new"
                  element={
                    <ProtectedRoute>
                      <FormEditPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upcoming/forms/:id"
                  element={
                    <ProtectedRoute>
                      <FormEditPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upcoming/activities/:id/form"
                  element={
                    <ProtectedRoute>
                      <ActivityFormEditPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upcoming/activities/:id/payment"
                  element={
                    <ProtectedRoute>
                      <ActivityFormEditPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upcoming/activities/:id/register"
                  element={<ActivityRegistrationPage />}
                />
              </Routes>
            </SimpleErrorBoundary>
          </main>

          <footer className="relative z-10">
            <Footer />
          </footer>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
