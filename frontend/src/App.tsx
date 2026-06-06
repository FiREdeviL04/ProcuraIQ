import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import ActivityLogs from './pages/ActivityLogs'
import ExportsPage from './pages/Exports'
import Dashboard from './pages/Dashboard'
import Vendors from './pages/Vendors'
import RFQs from './pages/RFQs'
import Quotations from './pages/Quotations'
import Approvals from './pages/Approvals'
import PurchaseOrders from './pages/PurchaseOrders'
import Invoices from './pages/Invoices'
import Reports from './pages/Reports'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        element={(
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        )}
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/rfqs" element={<RFQs />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/activity-logs" element={<ActivityLogs />} />
        <Route path="/exports" element={<ExportsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
