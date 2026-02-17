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
        }
    }, []);

    useEffect(() => {
        if (token) {
            setAxiosToken(token);
            axios.get('/api/user')
                .then((res) => {
                    setUser(res.data.user);
                    setShops(res.data.shops || []);
                })
                .catch(() => setToken(null))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token, setToken]);

    const login = useCallback(async (email, password) => {
        const { data } = await axios.post('/api/login', { email, password });
        setToken(data.token);
        return data;
    }, [setToken]);

    const register = useCallback(async (name, email, password, password_confirmation) => {
        const { data } = await axios.post('/api/register', { name, email, password, password_confirmation });
        setToken(data.token);
        setUser(data.user);
        setShops([]);
        return data;
    }, [setToken]);

    const logout = useCallback(async () => {
        try {
            await axios.post('/api/logout');
        } catch (_) {}
        setToken(null);
    }, [setToken]);

    const value = { user, shops, token, loading, login, register, logout, setToken };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
