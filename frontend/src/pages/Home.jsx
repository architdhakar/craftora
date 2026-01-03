// frontend/src/pages/Home.jsx - FULLY RESPONSIVE VERSION
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, getCategories } from '../api/axios'
import ProductCard from '../components/ProductCard'
import { Search, Filter, X, Sparkles, TrendingUp, Menu, ChevronDown } from 'lucide-react'

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
  const [showMobileCategories, setShowMobileCategories] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

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
    setShowMobileFilters(false)
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

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug)
    setShowMobileCategories(false)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl md:text-5xl font-bold mb-2 md:mb-4 flex items-center justify-center flex-wrap">
              <Sparkles className="mr-2 md:mr-3" size={32} />
              <span className="text-center">Discover Authentic Handmade Crafts</span>
            </h1>
            <p className="text-sm md:text-xl mb-4 md:mb-8 text-orange-100 px-4">
              Connect with verified artisans and support traditional craftsmanship
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto px-4">
              <div className="relative">
                <Search className="absolute left-3 md:left-4 top-3 md:top-4 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search handmade products..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 md:pl-14 pr-20 md:pr-32 py-3 md:py-4 rounded-full text-gray-800 text-sm md:text-lg focus:outline-none focus:ring-4 focus:ring-orange-300"
                />
                <button
                  type="submit"
                  className="absolute right-1 md:right-2 top-1.5 md:top-2 bg-orange-600 text-white px-4 md:px-8 py-1.5 md:py-2 rounded-full hover:bg-orange-700 transition font-semibold text-sm md:text-base"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-8">
        {/* Mobile Category & Filter Buttons */}
        <div className="lg:hidden mb-4 flex gap-2">
          <button
            onClick={() => setShowMobileCategories(!showMobileCategories)}
            className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium flex items-center justify-center"
          >
            <Menu size={20} className="mr-2" />
            Categories
          </button>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium flex items-center justify-center"
          >
            <Filter size={20} className="mr-2" />
            Filters
          </button>
        </div>

        {/* Mobile Categories Dropdown */}
        {showMobileCategories && (
          <div className="lg:hidden mb-4 bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
            <button
              onClick={() => handleCategorySelect(null)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 ${
                selectedCategory === null
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 ${
                  selectedCategory === cat.slug
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Mobile Filters */}
        {showMobileFilters && (
          <div className="lg:hidden mb-4 bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-bold text-lg mb-4">Filters</h3>
            
            <div className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Trust Score (Default)</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSearch}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition font-medium"
                >
                  Apply
                </button>
                <button
                  onClick={clearFilters}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 md:gap-6">
          {/* Desktop Sidebar - Hidden on mobile */}
          <div className="hidden lg:block w-64 flex-shrink-0">
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
          <div className="flex-1 min-w-0">
            {/* Desktop Filters Bar - Hidden on mobile */}
            <div className="hidden lg:block bg-white rounded-lg shadow-md p-4 mb-6">
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

              <div className="flex items-center justify-between flex-wrap gap-4">
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

            {/* Sort Dropdown for Mobile - Always visible */}
            <div className="lg:hidden mb-4 bg-white rounded-lg shadow-md p-3">
              <select
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Sort: Trust Score (Default)</option>
                <option value="rating">Sort: Highest Rated</option>
                <option value="price_asc">Sort: Price Low to High</option>
                <option value="price_desc">Sort: Price High to Low</option>
                <option value="newest">Sort: Newest First</option>
              </select>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="text-center py-12 md:py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-4 border-orange-500"></div>
                <p className="mt-4 text-gray-600 text-sm md:text-lg">Loading amazing products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 md:py-20 bg-white rounded-lg shadow-md">
                <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6 px-4">Try adjusting your filters or search terms</p>
                <button
                  onClick={clearFilters}
                  className="bg-orange-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg hover:bg-orange-700 transition font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-gray-600 text-sm md:text-base px-2">
                  Found <span className="font-bold text-orange-600">{products.length}</span> handmade products
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
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
