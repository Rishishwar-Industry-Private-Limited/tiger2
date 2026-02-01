import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Badge from './pages/BadgeGenerator'
import TopNav from './components/TopNav'
import { AuthProvider, useAuth } from './services/auth'

const ProtectedRoute: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App(){
  return (
    <AuthProvider>
      <TopNav />
      <div className="max-w-[1440px] mx-auto p-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/badge" element={<ProtectedRoute><Badge /></ProtectedRoute>} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
