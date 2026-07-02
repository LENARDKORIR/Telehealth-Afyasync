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
import { Prescriptions } from '../pages/Prescriptions';
import { Records } from '../pages/Records';
import { Intake } from '../pages/Intake';
import { Emergency } from '../pages/Emergency';
import { HealthTopic } from '../pages/HealthTopic';
import { Reports } from '../pages/Reports';
import { Settings } from '../pages/Settings';
import { CarePlans } from '../pages/CarePlans';

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
        path="/prescriptions"
        element={
          <ProtectedRoute>
            <Prescriptions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/records"
        element={
          <ProtectedRoute>
            <Records />
          </ProtectedRoute>
        }
      />
      <Route
        path="/intake"
        element={
          <ProtectedRoute>
            <Intake />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emergency"
        element={
          <ProtectedRoute>
            <Emergency />
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
        path="/care-plans"
        element={
          <ProtectedRoute>
            <CarePlans />
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
