import axios from 'axios';
export const API = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: `${API}/api`, withCredentials: true });
export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';
export default api;
