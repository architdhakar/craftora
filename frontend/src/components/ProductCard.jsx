import { Link } from 'react-router-dom'
import { Star, Clock, Award, MapPin } from 'lucide-react'

export default function ProductCard({ product }) {
  // ✅ SAFELY HANDLE image_urls
  let imageUrls = []

  try {
    if (Array.isArray(product.image_urls)) {
      imageUrls = product.image_urls
    } else if (typeof product.image_urls === 'string') {
      imageUrls = product.image_urls.startsWith('http')
        ? [product.image_urls]
        : JSON.parse(product.image_urls)
    }
  } catch (e) {
    imageUrls = []
  }

  const mainImage =
    imageUrls[0] || 'https://via.placeholder.com/300x300?text=No+Image'

  return (
    <Link to={`/product/${product.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
        
        {/* Product Image */}
        <div className="relative overflow-hidden bg-gray-100 aspect-square">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {Number(product.confidence_score) > 80 && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
              <Award size={14} className="mr-1" />
              Verified
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 text-lg mb-2 line-clamp-2 group-hover:text-[#ff5000] transition">
            {product.name}
          </h3>

          {/* Artisan Info */}
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin size={14} className="mr-1" />
            <span className="line-clamp-1">
              {product.artisan?.business_name || 'Unknown Artisan'}
            </span>

            {product.artisan?.is_verified && (
              <span className="ml-2 text-blue-600 text-xs">✓ Verified</span>
            )}
          </div>

          {/* Rating */}
          {Number(product.rating) > 0 && (
            <div className="flex items-center mb-2">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="ml-1 text-sm font-medium text-gray-700">
                {Number(product.rating).toFixed(1)}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                ({product.review_count || 0} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-2xl font-bold text-[#ff5000]">
              ₹{Number(product.price).toFixed(0)}
            </span>

            {product.crafting_time && (
              <div className="flex items-center text-xs text-gray-600">
                <Clock size={14} className="mr-1" />
                <span>{Math.ceil(Number(product.crafting_time) / 24)}d craft</span>
              </div>
            )}
          </div>

          {/* Trust Score */}
          {Number(product.confidence_score) > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Trust Score</span>
                <span className="font-semibold text-green-600">
                  {Number(product.confidence_score).toFixed(0)}%
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{
                    width: `${Number(product.confidence_score)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
