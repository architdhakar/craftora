
// ==================== FILE 3: frontend/src/pages/AddProduct.jsx - FIXED ====================
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProduct, getCategories, generateProductStory } from '../api/axios'
import { Sparkles, Loader, AlertCircle } from 'lucide-react'

export default function AddProduct() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [generatingStory, setGeneratingStory] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    ai_story: '',
    price: '',
    material_cost: '',
    labor_cost: '',
    platform_fee: '',
    materials: '',
    crafting_time: '',
    image_urls: '[]',
    stock: ''
  })
  const [imageUrls, setImageUrls] = useState([''])

  useEffect(() => {
    fetchCategories()
    checkArtisanProfile()
  }, [])

  const checkArtisanProfile = async () => {
    // Check if user has completed artisan onboarding
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'artisan') {
      setError('Please complete artisan onboarding first')
      setTimeout(() => navigate('/artisan/onboard'), 2000)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await getCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories', error)
      setError('Failed to load categories')
    }
  }

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...imageUrls]
    newUrls[index] = value
    setImageUrls(newUrls)
    const validUrls = newUrls.filter(url => url.trim() !== '')
    setFormData({ ...formData, image_urls: JSON.stringify(validUrls) })
  }

  const addImageUrlField = () => {
    setImageUrls([...imageUrls, ''])
  }

  const removeImageUrlField = (index) => {
    const newUrls = imageUrls.filter((_, i) => i !== index)
    setImageUrls(newUrls.length > 0 ? newUrls : [''])
    const validUrls = newUrls.filter(url => url.trim() !== '')
    setFormData({ ...formData, image_urls: JSON.stringify(validUrls) })
  }

  const handleGenerateStory = async () => {
    if (!formData.name || !formData.materials) {
      setError('Please enter product name and materials first')
      return
    }

    setGeneratingStory(true)
    setError('')
    try {
      const response = await generateProductStory({
        name: formData.name,
        materials: formData.materials,
        craft_type: 'Traditional Craft',
        region: 'India'
      })
      
      setFormData({ ...formData, ai_story: response.data.story })
    } catch (error) {
      setError('Failed to generate story: ' + (error.response?.data?.error || error.message))
    } finally {
      setGeneratingStory(false)
    }
  }

  const calculatePlatformFee = (price) => {
    return (parseFloat(price) * 0.1).toFixed(2)
  }

  const handlePriceChange = (e) => {
    const price = e.target.value
    setFormData({
      ...formData,
      price: price,
      platform_fee: price ? calculatePlatformFee(price) : ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate
      if (!formData.category_id || !formData.name || !formData.price || !formData.stock) {
        throw new Error('Please fill all required fields')
      }

      const productData = {
        ...formData,
        category_id: parseInt(formData.category_id),
        price: parseFloat(formData.price),
        material_cost: parseFloat(formData.material_cost) || 0,
        labor_cost: parseFloat(formData.labor_cost) || 0,
        platform_fee: parseFloat(formData.platform_fee) || 0,
        crafting_time: parseInt(formData.crafting_time) || 24,
        stock: parseInt(formData.stock)
      }

      await createProduct(productData)
      alert('Product created successfully! Awaiting admin approval.')
      navigate('/artisan/dashboard')
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Add New Product</h1>
        <p className="text-gray-600 mb-8">List your handmade creation on KalaSetu</p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-start">
            <AlertCircle className="text-red-500 mr-3 flex-shrink-0" size={24} />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              placeholder="e.g., Hand-painted Ceramic Vase"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Category *</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              placeholder="Describe your product..."
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Materials Used *</label>
            <input
              type="text"
              placeholder="e.g., Clay, Natural colors, Cotton thread"
              value={formData.materials}
              onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* AI Story Generation */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-700 font-medium flex items-center">
                <Sparkles className="mr-2 text-purple-600" size={20} />
                AI-Generated Product Story
              </label>
              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={generatingStory}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center space-x-2 text-sm disabled:opacity-50"
              >
                {generatingStory ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Story</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={formData.ai_story}
              onChange={(e) => setFormData({ ...formData, ai_story: e.target.value })}
              rows="6"
              placeholder="Click 'Generate Story' to create an AI-powered product story..."
              className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Material Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.material_cost}
                onChange={(e) => setFormData({ ...formData, material_cost: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Labor Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.labor_cost}
                onChange={(e) => setFormData({ ...formData, labor_cost: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handlePriceChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Platform Fee (10% auto)</label>
              <input
                type="number"
                step="0.01"
                value={formData.platform_fee}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                placeholder="Auto-calculated"
              />
            </div>
          </div>

          {/* Inventory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Crafting Time (hours) *</label>
              <input
                type="number"
                value={formData.crafting_time}
                onChange={(e) => setFormData({ ...formData, crafting_time: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                placeholder="24"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Stock Quantity *</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                placeholder="1"
              />
            </div>
          </div>

          {/* Image URLs */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Product Images</label>
            <div className="space-y-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={url}
                    onChange={(e) => handleImageUrlChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageUrlField(index)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageUrlField}
                className="text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                + Add Another Image
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Upload images to cloud storage (Imgur, Cloudinary, etc.) and paste URLs here
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Product...' : 'Create Product & Submit for Approval'}
          </button>
        </form>
      </div>
    </div>
  )
}