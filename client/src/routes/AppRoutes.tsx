/**
 * Application routes
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Pages
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { Patients } from '../pages/Patients';
import { Appointments } from '../pages/Appointments';
import { Messages } from '../pages/Messages';
import { VideoVisit } from '../pages/VideoVisit';
import { HealthTopic } from '../pages/HealthTopic';
import { Reports } from '../pages/Reports';
import { Settings } from '../pages/Settings';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute requiredRole="doctor">
            <Patients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <Appointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video-visits/:appointmentId"
        element={
          <ProtectedRoute>
            <VideoVisit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn-more/:topic"
        element={<HealthTopic />}
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredRole="doctor">
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
