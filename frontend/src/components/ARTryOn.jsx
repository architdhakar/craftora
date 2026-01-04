import { useState, useRef, useEffect } from 'react'
import { Camera, X, RotateCw, Download, Sparkles } from 'lucide-react'

export default function ARTryOn({ show, onClose, product }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const [stream, setStream] = useState(null)
    const [isCapturing, setIsCapturing] = useState(false)
    const [capturedImage, setCapturedImage] = useState(null)
    const [arMode, setArMode] = useState('jewelry') // jewelry, textile, pottery

    useEffect(() => {
        if (show) {
            startCamera()
        } else {
            stopCamera()
        }

        return () => stopCamera()
    }, [show])

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 1280, height: 720 },
                audio: false
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (error) {
            console.error('Camera access denied', error)
            alert('Please allow camera access to use AR Try-On')
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
    }

    const captureImage = async () => {
        const video = videoRef.current
        const canvas = canvasRef.current

        if (video && canvas) {
            const context = canvas.getContext('2d')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            // Draw video frame (Mirrored)
            context.save();
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            context.restore();

            // Get URL safely
            const imgUrl = getProductImage();
            console.log("📸 Attempting to overlay image:", imgUrl);

            // Prepare the overlay image
            const loadImage = async (url) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous"; // Important for external images
                    img.src = url;
                    img.onload = () => resolve(img);
                    img.onerror = (e) => reject(e);
                });
            };

            try {
                // Try to load the image directly first
                let img;
                try {
                    img = await loadImage(imgUrl);
                } catch (directLoadError) {
                    console.warn("Direct load failed, trying fetch blob...");
                    // Fallback: Fetch as blob (Bypasses some CORS issues)
                    const response = await fetch(imgUrl);
                    const blob = await response.blob();
                    const objectURL = URL.createObjectURL(blob);
                    img = await loadImage(objectURL);
                }

                // Draw Overlay
                const overlayPosition = getOverlayPosition(canvas.width, canvas.height);
                context.globalAlpha = 0.9;
                context.drawImage(
                    img,
                    overlayPosition.x,
                    overlayPosition.y,
                    overlayPosition.width,
                    overlayPosition.height
                );
                context.globalAlpha = 1.0;

            } catch (error) {
                console.error("❌ Could not load AR overlay:", error);
                // We continue anyway so the user at least gets their photo
            }

            // Add Watermark
            context.font = 'bold 24px Arial';
            context.fillStyle = 'rgba(255, 255, 255, 0.9)';
            context.shadowColor = "black";
            context.shadowBlur = 4;
            context.fillText('KalaSetu AR Try-On', 20, canvas.height - 20);

            // Save final result
            setCapturedImage(canvas.toDataURL('image/png'));
            setIsCapturing(false);
        }
    }

    const getProductImage = () => {
        // Safety check: if product is missing
        if (!product || !product.image_urls) {
            console.warn("Product or image_urls missing, using placeholder.");
            return 'https://via.placeholder.com/200';
        }

        const rawData = product.image_urls;

        // Case A: It's already a JavaScript Array (e.g., ["url1", "url2"])
        if (Array.isArray(rawData)) {
            return rawData[0] || 'https://via.placeholder.com/200';
        }

        // Case B: It is a String
        if (typeof rawData === 'string') {
            // 1. If it starts with 'http' or '/', it's a RAW URL. Don't parse it!
            if (rawData.startsWith('http') || rawData.startsWith('/')) {
                // Fix for localhost relative paths if needed
                if (rawData.startsWith('/')) {
                    return `http://localhost:8080${rawData}`;
                }
                return rawData;
            }

            // 2. If it starts with '[', it's likely a JSON string. Parse it.
            if (rawData.trim().startsWith('[')) {
                try {
                    const parsed = JSON.parse(rawData);
                    return parsed[0] || 'https://via.placeholder.com/200';
                } catch (e) {
                    console.error("Failed to parse image JSON:", e);
                }
            }
        }

        // Fallback
        return 'https://via.placeholder.com/200';
    }

    const getOverlayPosition = (canvasWidth, canvasHeight) => {
        // Different positions for different product types
        const positions = {
            jewelry: {
                x: canvasWidth * 0.3,
                y: canvasHeight * 0.4,
                width: canvasWidth * 0.4,
                height: canvasHeight * 0.2
            },
            textile: {
                x: canvasWidth * 0.2,
                y: canvasHeight * 0.3,
                width: canvasWidth * 0.6,
                height: canvasHeight * 0.5
            },
            pottery: {
                x: canvasWidth * 0.6,
                y: canvasHeight * 0.6,
                width: canvasWidth * 0.3,
                height: canvasHeight * 0.3
            }
        }
        return positions[arMode] || positions.jewelry
    }

    const downloadImage = () => {
        const link = document.createElement('a')
        link.download = `kalasetu-ar-tryon-${Date.now()}.png`
        link.href = capturedImage
        link.click()
    }

    const retake = () => {
        setCapturedImage(null)
        setIsCapturing(false)
    }

    if (!show) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold flex items-center">
                        <Sparkles className="mr-2 text-purple-600" size={28} />
                        AR Try-On Experience
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                        <Camera className="inline mr-2" size={16} />
                        See how this product looks on you! Position yourself in the camera and click capture.
                    </p>
                </div>

                {!capturedImage ? (
                    <div className="relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full rounded-xl bg-black"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* AR Mode Selector */}
                        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-2 flex gap-2">
                            <button
                                onClick={() => setArMode('jewelry')}
                                className={`px-3 py-1 rounded ${arMode === 'jewelry' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
                            >
                                Jewelry
                            </button>
                            <button
                                onClick={() => setArMode('textile')}
                                className={`px-3 py-1 rounded ${arMode === 'textile' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
                            >
                                Textile
                            </button>
                            <button
                                onClick={() => setArMode('pottery')}
                                className={`px-3 py-1 rounded ${arMode === 'pottery' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
                            >
                                Decor
                            </button>
                        </div>

                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={() => {
                                    setIsCapturing(true)
                                    setTimeout(captureImage, 100)
                                }}
                                disabled={isCapturing}
                                className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-700 transition flex items-center disabled:opacity-50"
                            >
                                <Camera className="mr-2" size={20} />
                                {isCapturing ? 'Capturing...' : 'Capture Photo'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <img
                            src={capturedImage}
                            alt="AR Try-On Result"
                            className="w-full rounded-xl mb-4"
                        />
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={retake}
                                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 transition flex items-center"
                            >
                                <RotateCw className="mr-2" size={20} />
                                Retake
                            </button>
                            <button
                                onClick={downloadImage}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center"
                            >
                                <Download className="mr-2" size={20} />
                                Download
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-4 bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-blue-800">
                        💡 Tip: Adjust lighting for best results. The product will overlay based on the mode selected.
                    </p>
                </div>
            </div>
        </div>
    )
}
