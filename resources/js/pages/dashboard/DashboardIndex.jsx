import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardIndex() {
    const { shops } = useAuth();
    const firstId = shops[0]?.id;
    if (firstId) return <Navigate to={`/dashboard/shop/${firstId}/services`} replace />;
    return null; // layout will show "no shop" message
}
