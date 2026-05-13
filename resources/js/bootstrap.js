import axios from 'axios';
window.axios = axios;

// Configure API base URL from environment
const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
window.axios.defaults.baseURL = apiUrl;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
}

// Log API URL in development
if (import.meta.env.DEV) {
    console.log('API Base URL:', apiUrl);
}
