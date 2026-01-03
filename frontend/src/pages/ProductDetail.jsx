// frontend/src/pages/ProductDetail.jsx - COMPLETE VERSION
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProduct, createOrder, getProductReviews, getConfidenceScore, createReview, getProducts } from '../api/axios'
import { Star, MapPin, Clock, Award, ShoppingCart, TrendingUp, Package, Heart, Share2, AlertCircle } from 'lucide-react'

export default function ProductDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [similarProducts, setSimilarProducts] = useState([])
  const [confidenceData, setConfidenceData] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [orderModal, setOrderModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [shippingAddress, setShippingAddress] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    media_urls: '[]'
  })

  useEffect(() => {
    fetchProduct()
    fetchReviews()
    fetchConfidenceScore()
  }, [id])

  useEffect(() => {
    if (product) {
      fetchSimilarProducts()
      checkIfCanReview()
    }
  }, [product, user])

  const fetchProduct = async () => {
    
    try {
      const response = await getProduct(id)
      
      setProduct(response.data)
    } catch (error) {
      console.error('Failed to fetch product', error)
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await getProductReviews(id)
      setReviews(response.data || [])
    } catch (error) {
      console.error('Failed to fetch reviews', error)
      setReviews([]) // Set empty array on error
    }
  }

  const fetchConfidenceScore = async () => {
    try {
      const response = await getConfidenceScore(id)
      setConfidenceData(response.data)
    } catch (error) {
      console.error('Failed to fetch confidence score', error)
      setConfidenceData(null)
    }
  }

  const fetchSimilarProducts = async () => {
    try {
      const response = await getProducts({ category: product.category_name?.toLowerCase() })
      const similar = (response.data || []).filter(p => p.id !== product.id).slice(0, 4)
      setSimilarProducts(similar)
    } catch (error) {
      console.error('Failed to fetch similar products', error)
      setSimilarProducts([])
    }
  }

  const checkIfCanReview = async () => {
    // Check if user has delivered order for this product
    if (!user) {
      setCanReview(false)
      return
    }
    // In real implementation, check if user has delivered order
    // For now, just check if logged in and not the artisan
    setCanReview(user.role === 'buyer')
  }

  const handleBuyNow = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    setOrderModal(true)
  }

  const proceedToPayment = () => {
    if (!shippingAddress.trim()) {
      alert('Please enter shipping address')
      return
    }
    setOrderModal(false)
    setPaymentModal(true)
  }

  const handlePayment = async () => {
    setProcessingPayment(true)

    // Simulate payment processing (90% success rate)
    await new Promise(resolve => setTimeout(resolve, 2000))

    const paymentSuccess = Math.random() < 0.9 // 90% success rate

    if (paymentSuccess) {
      try {
        const orderData = {
          product_id: parseInt(id),
          quantity: quantity,
          shipping_address: shippingAddress
        }
        const response = await createOrder(orderData)
        setProcessingPayment(false)
        setPaymentModal(false)
        alert('🎉 Payment Successful! Your order has been placed.')
        navigate(`/orders/${response.data.id}`)
      } catch (error) {
        setProcessingPayment(false)
        alert('Order placement failed. Payment will be refunded.')
      }
    } else {
      setProcessingPayment(false)
      alert('❌ Payment Failed! Please try again.')
    }
  }

  const handleLike = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    setIsLiked(!isLiked)
    // In real app, save to backend
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/auth')
      return
    }

    try {
      await createReview({
        product_id: parseInt(id),
        order_id: 0, // In real app, link to actual order
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        media_urls: reviewForm.media_urls
      })
      alert('✅ Review submitted successfully!')
      setReviewModal(false)
      setReviewForm({ rating: 5, comment: '', media_urls: '[]' })
      fetchReviews()
      fetchProduct()
    } catch (error) {
      alert('Failed to submit review: ' + (error.response?.data?.error || error.message))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ff5000]"></div>
      </div>
    )
  }

  if (!product) return <div className="text-center py-12">Product not found</div>

  // Safe parsing of image URLs with error handling

  let images = ['https://via.placeholder.com/600x600?text=No+Image'];

  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    images = product.image_urls;
  } else if (
    typeof product.image_urls === 'string' &&
    product.image_urls.startsWith('http')
  ) {
    images = [product.image_urls];
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-4">
          <Link to="/" className="hover:text-[#ff5000]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-64 sm:h-96 lg:h-[500px] object-cover"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 ${selectedImage === idx ? 'border-[#ff5000]' : 'border-gray-200'
                    }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
                {product.review_count > 10 && (
                  <span className="inline-block bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
                    ⭐ BEST SELLER
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleLike}
                  className={`p-2 rounded-full transition ${isLiked ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                    }`}
                >
                  <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {/* Artisan Info */}
            <div className="flex items-center space-x-3 mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                {product.artisan.business_name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{product.artisan.business_name}</p>
                <p className="text-xs sm:text-sm text-gray-600 flex items-center flex-wrap">
                  <MapPin size={14} className="mr-1" />
                  {product.artisan.region} • {product.artisan.craft_type}
                  {product.artisan.is_verified && (
                    <span className="ml-2 text-blue-600 text-xs">✓ Verified</span>
                  )}
                </p>
              </div>
            </div>

            {/* Rating */}
            {product.rating > 0 && (
              <div className="flex items-center mb-4 flex-wrap gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      className={star <= product.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-gray-700 font-medium">{product.rating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({product.review_count} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <div className="text-3xl sm:text-4xl font-bold text-[#ff5000] mb-2">₹{product.price.toFixed(2)}</div>

              {/* Price Breakdown */}
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 space-y-2">
                <p className="font-semibold text-gray-800 mb-2">Fair Price Breakdown</p>
                <div className="flex justify-between text-sm">
                  <span>Materials</span>
                  <span>₹{product.material_cost}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Artisan Labor</span>
                  <span>₹{product.labor_cost}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Platform Fee</span>
                  <span>₹{product.platform_fee}</span>
                </div>
              </div>
            </div>

            {/* Stock & Crafting Time */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Package className="mx-auto mb-1 text-gray-600" size={20} />
                <p className="text-xs text-gray-600">Stock</p>
                <p className="font-bold text-gray-800">{product.stock} units</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Clock className="mx-auto mb-1 text-gray-600" size={20} />
                <p className="text-xs text-gray-600">Crafting Time</p>
                <p className="font-bold text-gray-800">{Math.ceil(product.crafting_time / 24)} days</p>
              </div>
            </div>

            {/* Confidence Score */}
            {confidenceData && (
              <div className="bg-green-50 rounded-lg p-3 sm:p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800 flex items-center text-sm sm:text-base">
                    <Award size={20} className="mr-2 text-green-600" />
                    Handmade Confidence Score
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-green-600">{confidenceData.score.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{ width: `${confidenceData.score}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>✓ Artisan Verified: {confidenceData.factors.artisan_verified ? 'Yes' : 'No'}</p>
                  <p>✓ Completion Rate: {confidenceData.factors.completion_rate.toFixed(0)}%</p>
                  <p>✓ Average Rating: {confidenceData.factors.avg_rating.toFixed(1)}/5</p>
                </div>
              </div>
            )}

            {/* Order Section */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, product.stock))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {product.stock} available
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 bg-[#ff5000] text-white py-3 sm:py-4 rounded-lg font-semibold hover:bg-[#e64800] transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={20} />
                  <span>Buy Now</span>
                </button>
                {canReview && (
                  <button
                    onClick={() => setReviewModal(true)}
                    className="px-4 sm:px-6 py-3 sm:py-4 border-2 border-[#ff5000] text-[#ff5000] rounded-lg font-semibold hover:bg-orange-50 transition"
                  >
                    Write Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Story & Description */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-md p-4 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Description</h2>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {product.ai_story && (
              <div className="bg-white rounded-2xl shadow-md p-4 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Product Story</h2>
                <p className="text-gray-700 leading-relaxed">{product.ai_story}</p>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl shadow-md p-4 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Customer Reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div>
                          <p className="font-semibold text-gray-800">{review.user_name}</p>
                          <div className="flex items-center mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Similar Products Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 sticky top-20">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Similar Products</h3>
              {similarProducts.length === 0 ? (
                <p className="text-gray-500 text-sm">No similar products found</p>
              ) : (
                <div className="space-y-4">
                  {similarProducts.map((similar) => {
                    let simImage = 'https://via.placeholder.com/150'
                    try {
                      if (similar.image_urls && typeof similar.image_urls === 'string') {
                        const parsed = similar.image_urls
                        simImage = parsed
                      } else if (Array.isArray(similar.image_urls) && similar.image_urls.length > 0) {
                        simImage = similar.image_urls[0]
                      } else if (typeof similar.image_urls === 'string' && similar.image_urls.startsWith('http')) {
                        simImage = similar.image_urls
                        console.log(simImage)

                      }
                    } catch (e) {
                      console.error('Error parsing similar product image:', e)
                    }

                    return (
                      <Link
                        key={similar.id}
                        to={`/product/${similar.id}`}
                        className="flex gap-3 hover:bg-gray-50 p-2 rounded-lg transition"
                      >
                        <img
                          src={simImage}
                          alt={similar.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150'
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm line-clamp-2">{similar.name}</p>
                          <p className="text-[#ff5000] font-bold text-sm mt-1">₹{similar.price.toFixed(0)}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Modal */}
      {orderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Confirm Order</h2>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Product:</span> {product.name}
              </p>
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Quantity:</span> {quantity}
              </p>
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">Total:</span> ₹{(product.price * quantity).toFixed(2)}
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Shipping Address *</label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5000]"
                placeholder="Enter your complete shipping address..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setOrderModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={proceedToPayment}
                className="flex-1 bg-[#ff5000] text-white py-3 rounded-lg font-semibold hover:bg-[#e64800] transition"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Payment</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>₹{(product.price * quantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Shipping:</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-[#ff5000]">₹{(product.price * quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <AlertCircle size={16} className="inline mr-1" />
                Demo Payment Mode (90% success rate)
              </p>
            </div>

            <button
              onClick={handlePayment}
              disabled={processingPayment}
              className="w-full bg-[#ff5000] text-white py-4 rounded-lg font-semibold hover:bg-[#e64800] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingPayment ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </span>
              ) : (
                'Pay Now'
              )}
            </button>
            <button
              onClick={() => setPaymentModal(false)}
              disabled={processingPayment}
              className="w-full mt-3 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Write a Review</h2>
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        size={32}
                        className={star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Your Review</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows="4"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5000]"
                  placeholder="Share your experience with this product..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#ff5000] text-white py-3 rounded-lg font-semibold hover:bg-[#e64800] transition"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}