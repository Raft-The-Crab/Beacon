import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use((config: any) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
        if (error.response?.status === 401) {
            // Optional: Clear token and redirect if 401 comes from a protected route
            // But avoid loop if checking session
            if (!window.location.pathname.includes('/login')) {
                // localStorage.removeItem('token')
                // window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)
