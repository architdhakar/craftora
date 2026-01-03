// ==================== 2. FIX: Artisan Onboarding Loop ====================
// frontend/src/pages/ArtisanOnboarding.jsx - FIXED

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { onboardArtisan } from '../api/axios'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function ArtisanOnboarding({ setUser }) {
  const [formData, setFormData] = useState({
    business_name: '',
    craft_type: '',
    region: '',
    bio: '',
    verification_docs: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingStatus, setCheckingStatus] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if already onboarded
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      // If already artisan role, they might be onboarded
      if (user.role === 'artisan') {
        // Redirect to dashboard
        navigate('/artisan/dashboard')
      }
    } catch (e) {
      console.error('Error checking status:', e)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await onboardArtisan(formData)
      
      // Update user role in localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      user.role = 'artisan'
      localStorage.setItem('user', JSON.stringify(user))
      
      // Update parent state
      if (setUser) {
        setUser(user)
      }
      
      alert('✅ Artisan profile created! Redirecting to dashboard...')
      
      // Force reload to ensure state is updated
      setTimeout(() => {
        window.location.href = '/artisan/dashboard'
      }, 1000)
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message
      if (errorMsg.includes('already')) {
        // Already registered, just redirect
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        user.role = 'artisan'
        localStorage.setItem('user', JSON.stringify(user))
        if (setUser) setUser(user)
        window.location.href = '/artisan/dashboard'
      } else {
        setError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ff5000]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-orange-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, Artisan!</h1>
          <p className="text-gray-600">
            Complete your profile to start selling your handmade creations
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-start">
            <AlertCircle className="text-red-500 mr-3 flex-shrink-0" size={24} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Business Name *</label>
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              placeholder="e.g., Artisan Ceramics"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Craft Type *</label>
              <input
                type="text"
                placeholder="e.g., Pottery, Weaving"
                value={formData.craft_type}
                onChange={(e) => setFormData({ ...formData, craft_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Region *</label>
              <input
                type="text"
                placeholder="e.g., Rajasthan, Kerala"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Bio / About Your Craft *</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows="4"
              placeholder="Tell us about your craft and heritage..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Verification Documents URL</label>
            <input
              type="text"
              placeholder="Link to ID proof, craft samples, certificates etc."
              value={formData.verification_docs}
              onChange={(e) => setFormData({ ...formData, verification_docs: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload documents to cloud storage and paste the link here
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </form>
      </div>
    </div>
  )
}