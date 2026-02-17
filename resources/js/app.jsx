import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import './bootstrap';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardIndex from './pages/dashboard/DashboardIndex';
import ServicesPage from './pages/dashboard/ServicesPage';
import CustomersPage from './pages/dashboard/CustomersPage';
import OrdersPage from './pages/dashboard/OrdersPage';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="shop/:id" element={<Shop />} />
                    </Route>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardIndex />} />
                        <Route path="shop/:shopId/services" element={<ServicesPage />} />
                        <Route path="shop/:shopId/customers" element={<CustomersPage />} />
                        <Route path="shop/:shopId/orders" element={<OrdersPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);
