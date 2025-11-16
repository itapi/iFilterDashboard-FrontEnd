import React, { useRef, useEffect } from 'react'
import { useGlobalState } from '../contexts/GlobalStateContext'
import { X } from 'lucide-react'
import ConfirmModal from './Modal/ConfirmModal'

// Import modal layouts here
import { ExampleFormLayout } from './Modal/layouts/ExampleFormLayout'
import { InfoLayout } from './Modal/layouts/InfoLayout'
import { AdminFormLayout } from './Modal/layouts/AdminFormLayout'
import { SimpleTextLayout } from './Modal/layouts/SimpleTextLayout'
import { DeleteConfirmLayout } from './Modal/layouts/DeleteConfirmLayout'
import { TicketDialogLayout } from './Modal/layouts/TicketDialogLayout'
import { CategoryAppsLayout } from './Modal/layouts/CategoryAppsLayout'
import { CustomPlanAppsLayout } from './Modal/layouts/CustomPlanAppsLayout'

const GlobalModal = () => {
  const { state, closeModal } = useGlobalState()
  const { modalStack } = state

  // Create refs for components that need form submission
  const layoutRefs = useRef({})

  // Handle escape key for top modal
  useEffect(() => {
    if (!modalStack || modalStack.length === 0) return

    const topModal = modalStack[modalStack.length - 1]
    if (!topModal.closeOnEscape) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal(topModal)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [modalStack])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (modalStack && modalStack.length > 0) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [modalStack?.length])

  // Early return AFTER all hooks
  if (!modalStack || modalStack.length === 0) return null

  // Get size classes for modal width
  const getSizeClasses = (size) => {
    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      '2xl': 'max-w-6xl',
      full: 'max-w-[95vw]'
    }
    return sizes[size] || sizes.lg
  }

  // Modal layout registry - add your custom layouts here
  const getModalLayout = (modal) => {
    // Helper to get or create ref for this modal
    const getLayoutRef = (modalId) => {
      if (!layoutRefs.current[modalId]) {
        layoutRefs.current[modalId] = React.createRef()
      }
      return layoutRefs.current[modalId]
    }

    const layouts = {
      // Confirmation modals
      confirm: {
        component: (
          <ConfirmModal
            message={modal.content}
            onConfirm={modal.onConfirm}
            onCancel={modal.onCancel}
            confirmText={modal.confirmText}
            cancelText={modal.cancelText}
            variant={modal.variant}
          />
        ),
        showFooter: false, // ConfirmModal has its own footer
      },

      deleteConfirm: {
        component: <DeleteConfirmLayout data={modal.data} />,
        showFooter: true,
      },

      // Form layouts
      exampleForm: {
        component: <ExampleFormLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      adminForm: {
        component: <AdminFormLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      categoryApps: {
        component: <CategoryAppsLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: false, // CategoryAppsLayout has its own footer
        hasRef: true,
      },

      customPlanApps: {
        component: <CustomPlanAppsLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: false, // CustomPlanAppsLayout has its own footer
        hasRef: true,
      },

      // Dialog layouts
      ticketDialog: {
        component: <TicketDialogLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: false, // TicketDialog handles its own footer
        hasRef: true,
      },

      // Information layouts
      info: {
        component: <InfoLayout data={modal.data} />,
        showFooter: true,
      },

      simpleText: {
        component: <SimpleTextLayout data={modal.data} />,
        showFooter: true,
      },

      // Custom layout for passing React components directly
      custom: {
        component: modal.content,
        showFooter: false, // Custom components handle their own buttons
      },

      // Add your custom layouts here
      // Example:
      // customPlanApps: {
      //   component: <CustomPlanAppsLayout data={modal.data} />,
      //   showFooter: true,
      // },

      default: {
        component: <div className="p-6">{modal.content || 'תוכן ברירת המחדל'}</div>,
        showFooter: true,
      },
    }

    


    return layouts[modal.layout] || layouts.default
  }

  const handleCloseModal = (modal) => {
    // If onClose function exists in modal data, execute it before closing
    if (modal.onClose && typeof modal.onClose === 'function') {
      modal.onClose()
    }
    closeModal()
  }

  const handleBackdropClick = (e, modal) => {
    // Only close if clicking outside the modal content (on backdrop or wrapper)
    if (modal.closeOnBackdropClick && !e.target.closest('[role="dialog"]')) {
      handleCloseModal(modal)
    }
  }

  const handleConfirm = (modal) => {
    // Check if there's a ref with submitForm method
    const layoutRef = layoutRefs.current[modal.id]
    if (layoutRef?.current?.submitForm) {
      layoutRef.current.submitForm()
      return // Don't close modal here, let the form handle it
    }

    // Handle modals with custom onConfirm
    if (typeof modal.onConfirm === 'function') {
      modal.onConfirm()
    }
  }

  return (
    <>
      {/* Render all modals in the stack */}
      {modalStack.map((modal, index) => {
        const isTopModal = index === modalStack.length - 1
        const zIndex = 1000 + index * 10
        const currentLayout = getModalLayout(modal)
        const showFooter = currentLayout.showFooter && (modal.showConfirmButton || modal.showCancelButton)

        return (
          <div
            key={modal.id}
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex }}
            onClick={isTopModal ? (e) => handleBackdropClick(e, modal) : undefined}
          >
            {/* Backdrop */}
            <div
              className={`absolute inset-0 backdrop-blur-sm transition-all duration-300 ${
                isTopModal ? 'bg-black/40' : 'bg-black/20'
              }`}
              style={{
                animation: 'fadeIn 300ms ease-out'
              }}
            />

            {/* Modal Content */}
            <div
              className={`relative w-full ${getSizeClasses(modal.size)} max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 ${
                !isTopModal ? 'opacity-95 scale-95' : ''
              }`}
              style={{
                zIndex: zIndex + 1,
                animation: 'modalSlideIn 300ms ease-out'
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={modal.title ? `modal-title-${modal.id}` : undefined}
            >
              {/* Header */}
              {modal.title && (
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                  <h2
                    id={`modal-title-${modal.id}`}
                    className="text-xl font-bold text-gray-900 flex-1 truncate"
                  >
                    {modal.title}
                  </h2>
                  {isTopModal && (
                    <button
                      onClick={() => handleCloseModal(modal)}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      aria-label="סגור"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight: 'calc(90vh - 140px)' }}
              >
                {currentLayout.component}
              </div>

              {/* Footer */}
              {showFooter && isTopModal && (
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                    {modal.showCancelButton && (
                      <button
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        onClick={() => handleCloseModal(modal)}
                      >
                        {modal.cancelText || 'ביטול'}
                      </button>
                    )}
                    {modal.showConfirmButton && (
                      <button
                        className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        onClick={() => handleConfirm(modal)}
                      >
                        {modal.confirmText || 'אישור'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  )
}

export default GlobalModal
