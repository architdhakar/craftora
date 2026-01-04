import { useState, useEffect } from 'react'
import { Video, X, Loader, Phone, Bell } from 'lucide-react'
import { JitsiMeeting } from '@jitsi/react-sdk'
import api from '../api/axios'

export default function VideoCallModal({ show, onClose, product, artisan, user }) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [callRequest, setCallRequest] = useState(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [callStatus, setCallStatus] = useState('idle') // idle, requesting, pending, accepted, rejected

  useEffect(() => {
    let interval
    if (callStatus === 'pending' && callRequest) {
      // Poll for artisan acceptance
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/video-call/${callRequest.id}/status`)
          if (response.data.status === 'accepted') {
            setCallStatus('accepted')
            setIsCallActive(true)
            clearInterval(interval)
          }
        } catch (error) {
          console.error('Failed to check call status', error)
        }
      }, 3000) // Check every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [callStatus, callRequest])

  const handleRequestCall = async () => {
    setIsRequesting(true)
    setCallStatus('requesting')

    try {
      const response = await api.post('/video-call/request', {
        product_id: product.id,
        artisan_id: artisan.id
      })

      setCallRequest(response.data)
      setCallStatus('pending')
    } catch (error) {
      alert('Failed to request call: ' + (error.response?.data?.error || 'Unknown error'))
      setCallStatus('idle')
    } finally {
      setIsRequesting(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center">
            <Video className="mr-2" size={28} />
            Live with {artisan.business_name}
          </h2>
          <button
            onClick={() => {
              onClose()
              setIsCallActive(false)
              setCallStatus('idle')
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden relative">
          {callStatus === 'idle' && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Video size={64} className="text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Connect with the Artisan</h3>
              <p className="text-gray-600 mb-4">
                Start a live video call to see the crafting process, ask questions, and get personalized recommendations!
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 max-w-md">
                <p className="text-sm text-orange-800">
                  <Bell className="inline mr-2" size={16} />
                  The artisan will be notified. Once they accept, the call will start automatically.
                </p>
              </div>
              <button
                onClick={handleRequestCall}
                disabled={isRequesting}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center disabled:opacity-50"
              >
                <Phone className="mr-2" size={20} />
                {isRequesting ? 'Requesting...' : 'Request Video Call'}
              </button>
            </div>
          )}

          {callStatus === 'pending' && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Loader size={64} className="text-blue-600 mb-4 animate-spin" />
              <h3 className="text-xl font-bold mb-2">Waiting for Artisan...</h3>
              <p className="text-gray-600 mb-4">
                We've notified <strong>{artisan.business_name}</strong>. They'll join shortly!
              </p>
              <div className="bg-blue-50 rounded-lg p-4 max-w-md">
                <p className="text-sm text-blue-800">
                  ⏰ This usually takes 1-2 minutes. The call will start automatically when they accept.
                </p>
              </div>
            </div>
          )}

          {callStatus === 'accepted' && isCallActive && (
            <JitsiMeeting
              roomName={callRequest.room_name}
              configOverwrite={{
                startWithAudioMuted: true,
                disableThirdPartyRequests: true,
                prejoinPageEnabled: false,
              }}
              interfaceConfigOverwrite={{
                TOOLBAR_BUTTONS: [
                  'microphone', 'camera', 'closedcaptions', 'desktop',
                  'fullscreen', 'fodeviceselection', 'hangup',
                  'chat', 'raisehand', 'videoquality', 'tileview'
                ],
              }}
              userInfo={{
                displayName: user?.name || 'Customer'
              }}
              getIFrameRef={(iframeRef) => {
                if (iframeRef) {
                  iframeRef.style.height = '100%'
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}