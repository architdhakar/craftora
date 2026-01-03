// ===== FILE 3: frontend/src/api/axios.js =====
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth APIs
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)

// Product APIs
export const getProducts = (params) => api.get('/products', { params })
export const getProduct = (id) => api.get(`/products/${id}`)
export const getCategories = () => api.get('/categories')
export const createProduct = (data) => api.post('/artisan/products', data)
export const updateProduct = (id, data) => api.put(`/artisan/products/${id}`, data)

// Order APIs
export const createOrder = (data) => api.post('/orders', data)
export const getUserOrders = () => api.get('/orders')
export const getOrderDetails = (id) => api.get(`/orders/${id}`)
export const getArtisanOrders = () => api.get('/artisan/orders')
export const updateOrderStatus = (id, status) => api.put(`/artisan/orders/${id}/status`, { status })
export const addProgressUpdate = (id, data) => api.post(`/artisan/orders/${id}/progress`, data)

// Artisan APIs
export const onboardArtisan = (data) => api.post('/artisan/onboard', data)
export const updateArtisanProfile = (data) => api.put('/artisan/profile', data)
export const getArtisanProfile = (id) => api.get(`/artisans/${id}`)

// Review APIs
export const createReview = (data) => api.post('/reviews', data)
export const getProductReviews = (productId) => api.get(`/products/${productId}/reviews`)

// AI APIs
export const generateProductStory = (data) => api.post('/ai/generate-story', data)
export const getConfidenceScore = (productId) => api.get(`/ai/confidence-score/${productId}`)
export const getDeliveryETA = (orderId) => api.get(`/ai/delivery-eta/${orderId}`)

// Admin APIs
export const getPendingArtisans = () => api.get('/admin/pending-artisans')
export const verifyArtisan = (id) => api.put(`/admin/artisans/${id}/verify`)
export const getPendingProducts = () => api.get('/admin/pending-products')
export const approveProduct = (id) => api.put(`/admin/products/${id}/approve`)
export const createCategory = (data) => api.post('/admin/categories', data)
export const getAnalytics = () => api.get('/admin/analytics')

export default api