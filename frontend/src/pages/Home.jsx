
// ==================== FILE 2: frontend/src/pages/Home.jsx - COMPLETE REDESIGN ====================
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, getCategories } from '../api/axios'
import ProductCard from '../components/ProductCard'
import { Search, Filter, X, Sparkles, TrendingUp } from 'lucide-react'

export default function Home({ user }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    min_price: '',
    max_price: '',
    craft_type: '',
    region: '',
    sort: ''
  })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, filters.sort])

  const fetchCategories = async () => {
    try {
      const response = await getCategories()
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch categories', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = {
        ...filters,
        category: selectedCategory
      }
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key]
        }
      })
      const response = await getProducts(params)
      setProducts(response.data || [])
    } catch (error) {
      console.error('Failed to fetch products', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchProducts()
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      min_price: '',
      max_price: '',
      craft_type: '',
      region: '',
      sort: ''
    })
    setSelectedCategory(null)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 flex items-center justify-center">
              <Sparkles className="mr-3" size={48} />
              Discover Authentic Handmade Crafts
            </h1>
            <p className="text-xl mb-8 text-orange-100">
              Connect with verified artisans and support traditional craftsmanship
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-4 text-gray-400" size={24} />
                <input
                  type="text"
                  placeholder="Search for handmade products, artisans, or craft types..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-14 pr-32 py-4 rounded-full text-gray-800 text-lg focus:outline-none focus:ring-4 focus:ring-orange-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bg-orange-600 text-white px-8 py-2 rounded-full hover:bg-orange-700 transition font-semibold"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar - Categories */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md sticky top-20">
              <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-red-600 rounded-t-lg">
                <h2 className="text-xl font-bold text-white">Categories</h2>
              </div>
              <div className="p-2 max-h-[600px] overflow-y-auto">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition ${
                    selectedCategory === null
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="font-medium">All Products</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition ${
                      selectedCategory === cat.slug
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
              
              {/* Quick Actions */}
              {user?.role === 'artisan' && (
                <div className="p-4 border-t">
                  <Link
                    to="/artisan/dashboard"
                    className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    My Dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Filters Bar */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <Filter size={20} className="mr-2" />
                  Filters & Sorting
                </h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  {showFilters ? 'Hide' : 'Show'} Advanced Filters
                </button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.min_price}
                      onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹)</label>
                    <input
                      type="number"
                      placeholder="10000"
                      value={filters.max_price}
                      onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Craft Type</label>
                    <input
                      type="text"
                      placeholder="e.g., Pottery"
                      value={filters.craft_type}
                      onChange={(e) => setFilters({ ...filters, craft_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <input
                      type="text"
                      placeholder="e.g., Rajasthan"
                      value={filters.region}
                      onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Sort By:</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Trust Score (Default)</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={fetchProducts}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition font-medium"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium flex items-center"
                  >
                    <X size={18} className="mr-1" />
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
                <p className="mt-4 text-gray-600 text-lg">Loading amazing handmade products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg shadow-md">
                <TrendingUp size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
                <button
                  onClick={clearFilters}
                  className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-gray-600">
                  Found <span className="font-bold text-orange-600">{products.length}</span> handmade products
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}