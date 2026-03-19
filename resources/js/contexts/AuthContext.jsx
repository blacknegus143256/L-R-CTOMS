import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'ctoms_token';

function setAxiosToken(token) {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [shops, setShops] = useState([]);
    const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [loading, setLoading] = useState(!!token);
    const [profile, setProfile] = useState(null);

    const setToken = useCallback((newToken) => {
        setTokenState(newToken);
        if (newToken) {
            localStorage.setItem(TOKEN_KEY, newToken);
            setAxiosToken(newToken);
        } else {
            localStorage.removeItem(TOKEN_KEY);
            setAxiosToken(null);
            setUser(null);
            setShops([]);
            setProfile(null);
        }
    }, []);

    useEffect(() => {
        // Inertia provides user via page props.auth.user, no API fetch needed
        setLoading(false);
    }, []);


    const login = useCallback(async () => {
        // Inertia web auth handles login, no API call needed
    }, []);
    
    const register = useCallback(async () => {
        // Inertia web auth handles register, no API call needed
    }, []);


    const logout = useCallback(() => {
        setToken(null);
    }, [setToken]);


    const value = { user, shops, profile, token, loading, login, register, logout, setToken };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
