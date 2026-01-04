import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Type, Palette, Maximize2, Save, RotateCcw } from 'lucide-react'
import { useGlobalState } from '../../../contexts/GlobalStateContext'
import apiClient from '../../../utils/api'
import watermarkBase from '../../../assets/watermark.png'

/**
 * Watermark Editor Layout
 *
 * Allows users to add text overlay on the base watermark image
 * with customizable size and color
 *
 * Usage:
 * openModal({
 *   layout: 'watermarkEditor',
 *   title: 'עריכת לוגו קהילה',
 *   data: {
 *     communityId: 'xxx',
 *     onSave: (newWatermarkUrl) => { ... }
 *   }
 * })
 */
export const WatermarkEditorLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const canvasRef = useRef(null)
  const [text, setText] = useState('')
  const [fontSize, setFontSize] = useState(48)
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [textPosition, setTextPosition] = useState({ x: 0.5, y: 0.5 }) // Relative position (0-1)
  const [isDragging, setIsDragging] = useState(false)
  const baseImage = useRef(null)

  // Load base watermark image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      baseImage.current = img
      setImageLoaded(true)
      drawCanvas()
    }
    img.onerror = () => {
      toast.error('שגיאה בטעינת תמונת הבסיס')
    }
    img.src = watermarkBase
  }, [])

  // Redraw canvas whenever text, fontSize, textColor, or position changes
  useEffect(() => {
    if (imageLoaded) {
      drawCanvas()
    }
  }, [text, fontSize, textColor, textPosition, imageLoaded])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !baseImage.current) return

    const ctx = canvas.getContext('2d')
    const img = baseImage.current

    // Set canvas size to match image
    canvas.width = img.width
    canvas.height = img.height

    // Draw base image
    ctx.drawImage(img, 0, 0)

    // Draw text overlay if text exists
    if (text.trim()) {
      ctx.font = `bold ${fontSize}px Arial`
      ctx.fillStyle = textColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Add text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      // Draw text at the dragged position (relative 0-1 converted to canvas coordinates)
      const x = textPosition.x * canvas.width
      const y = textPosition.y * canvas.height
      ctx.fillText(text, x, y)
    }
  }

  // Mouse event handlers for dragging text
  const handleMouseDown = (e) => {
    if (!text.trim()) return
    setIsDragging(true)
    updateTextPosition(e)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    updateTextPosition(e)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const updateTextPosition = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Convert to relative position (0-1)
    setTextPosition({
      x: Math.max(0, Math.min(1, x / canvas.width)),
      y: Math.max(0, Math.min(1, y / canvas.height))
    })
  }

  // Expose submitForm method to parent
  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      await handleSubmit()
    }
  }))

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('נא להזין טקסט')
      return
    }

    if (!data?.communityId) {
      toast.error('מזהה קהילה חסר')
      return
    }

    try {
      setIsSubmitting(true)

      // Convert canvas to base64
      const canvas = canvasRef.current
      const base64Image = canvas.toDataURL('image/png')

      // Upload watermark via upload endpoint
      const response = await apiClient.uploadWatermark(data.communityId, base64Image)

      if (response.success) {
        toast.success('הלוגו עודכן בהצלחה')

        // Call the callback with the new watermark URL
        if (data?.onSave) {
          data.onSave(response.watermark_url)
        }

        closeModal()
      } else {
        throw new Error(response.error || 'Failed to upload watermark')
      }
    } catch (error) {
      console.error('Error saving watermark:', error)
      toast.error('שגיאה בשמירת הלוגו')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="space-y-6">
        {/* Canvas Preview */}
        <div className="flex justify-center">
          <div className="relative bg-gray-100 rounded-xl p-4 border-2 border-gray-200">
            {!imageLoaded && (
              <div className="flex items-center justify-center w-64 h-64">
                <div className="text-gray-400">טוען תמונה...</div>
              </div>
            )}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`max-w-full h-auto rounded-lg shadow-lg ${!imageLoaded ? 'hidden' : ''} ${text.trim() ? 'cursor-move' : ''}`}
              style={{ maxHeight: '400px' }}
            />
          </div>
        </div>

        {/* Text Input */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Type className="w-4 h-4" />
            טקסט
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="הכנס טקסט להצגה על הלוגו..."
            disabled={isSubmitting}
            maxLength={50}
          />
          <p className="text-xs text-gray-500 mt-1">{text.length}/50 תווים</p>
        </div>

        {/* Reset Position Button */}
        {text.trim() && (
          <div className="flex justify-center">
            <button
              onClick={() => setTextPosition({ x: 0.5, y: 0.5 })}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <RotateCcw className="w-4 h-4" />
              <span>מרכז טקסט</span>
            </button>
          </div>
        )}

        {/* Controls Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Font Size */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Maximize2 className="w-4 h-4" />
              גודל טקסט
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="20"
                max="100"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1"
                disabled={isSubmitting}
              />
              <span className="text-sm font-medium text-gray-600 w-12 text-center">
                {fontSize}px
              </span>
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4" />
              צבע טקסט
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-10 w-full rounded-lg cursor-pointer border border-gray-300"
                disabled={isSubmitting}
              />
              <span className="text-xs font-mono text-gray-600 w-20">
                {textColor.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            {text.trim()
              ? '💡 גרור את הטקסט על התמונה כדי למקם אותו במיקום הרצוי. ניתן גם להתאים את הגודל והצבע.'
              : 'הטקסט יוצג על הלוגו. ניתן להתאים את הגודל, הצבע והמיקום לפי הצורך.'}
          </p>
        </div>
      </div>
    </div>
  )
})

WatermarkEditorLayout.displayName = 'WatermarkEditorLayout'
