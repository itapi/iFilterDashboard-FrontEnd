import React, { useRef, useEffect } from 'react'
import { useGlobalState } from '../contexts/GlobalStateContext'
import { X } from 'lucide-react'

// Import modal layouts here
import { ExampleFormLayout } from './Modal/layouts/ExampleFormLayout'
import { InfoLayout } from './Modal/layouts/InfoLayout'
import { AdminFormLayout } from './Modal/layouts/AdminFormLayout'
import { SimpleTextLayout } from './Modal/layouts/SimpleTextLayout'
import { DeleteConfirmLayout } from './Modal/layouts/DeleteConfirmLayout'
import { ConfirmActionLayout } from './Modal/layouts/ConfirmActionLayout'
import { TicketDialogLayout } from './Modal/layouts/TicketDialogLayout'
import { CategoryAppsLayout } from './Modal/layouts/CategoryAppsLayout'
import { CustomPlanAppsLayout } from './Modal/layouts/CustomPlanAppsLayout'
import { ManageCategoriesLayout } from './Modal/layouts/ManageCategoriesLayout'
import { EditPlanLayout } from './Modal/layouts/EditPlanLayout'
import { WatermarkEditorLayout } from './Modal/layouts/WatermarkEditorLayout'
import { BroadcastMessageLayout } from './Modal/layouts/BroadcastMessageLayout'
import { FirmwareDetailsLayout } from './Modal/layouts/FirmwareDetailsLayout'
import { DomainPolicyFormLayout } from './Modal/layouts/DomainPolicyFormLayout'
import { ReviewRejectLayout } from './Modal/layouts/ReviewRejectLayout'
import WebInquiryResponseLayout from './Modal/layouts/WebInquiryResponseLayout'
import { SendCommandLayout } from './Modal/layouts/SendCommandLayout'
import { UploadFirmwareLayout } from './Modal/layouts/UploadFirmwareLayout'
import { ContactFormLayout } from './Modal/layouts/ContactFormLayout'
import { TemplateFormLayout } from './Modal/layouts/TemplateFormLayout'
import { VcfImportLayout } from './Modal/layouts/VcfImportLayout'
import { DistributionTaskFormLayout } from './Modal/layouts/DistributionTaskFormLayout'
import { SendContactMailLayout } from './Modal/layouts/SendContactMailLayout'
import { SendResellerMailLayout } from './Modal/layouts/SendResellerMailLayout'

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
      deleteConfirm: {
        component: <DeleteConfirmLayout data={modal.data} />,
        showFooter: true,
      },

      confirmAction: {
        component: <ConfirmActionLayout data={modal.data} />,
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

      broadcastMessage: {
        component: <BroadcastMessageLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
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

      manageCategories: {
        component: <ManageCategoriesLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      editPlan: {
        component: <EditPlanLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      watermarkEditor: {
        component: <WatermarkEditorLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
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


    

      

      // Remote command form
      sendCommand: {
        component: <SendCommandLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      // Firmware details layout
      firmwareDetails: {
        component: <FirmwareDetailsLayout data={modal.data} />,
        showFooter: true,
      },

      // Upload stock firmware from notification
      uploadFirmware: {
        component: <UploadFirmwareLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: false,
        hasRef: true,
      },

      // SafeBrowser domain policy form
      domainPolicyForm: {
        component: <DomainPolicyFormLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      // Web inquiry email response
      webInquiryResponse: {
        component: <WebInquiryResponseLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      // Review request reject with notes
      reviewReject: {
        component: <ReviewRejectLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      contactForm: {
        component: <ContactFormLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      templateForm: {
        component: <TemplateFormLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      vcfImport: {
        component: <VcfImportLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      distributionTaskForm: {
        component: <DistributionTaskFormLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      sendContactMail: {
        component: <SendContactMailLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      sendResellerMail: {
        component: <SendResellerMailLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
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
              style={{
                position: 'absolute',
                inset: 0,
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                background: isTopModal ? 'rgba(30,33,36,0.55)' : 'rgba(30,33,36,0.25)',
                animation: 'ifModalFadeIn 300ms ease-out',
              }}
            />

            {/* Modal Content */}
            <div
              className={`relative w-full ${getSizeClasses(modal.size)}`}
              style={{
                maxHeight: '90vh',
                background: '#ffffff',
                borderRadius: '28px',
                boxShadow: '0 25px 60px rgba(30,33,36,0.2)',
                border: '1px solid rgba(237,240,242,0.8)',
                overflow: 'hidden',
                transform: isTopModal ? 'scale(1)' : 'scale(0.97)',
                opacity: isTopModal ? 1 : 0.95,
                transition: 'transform 0.3s, opacity 0.3s',
                zIndex: zIndex + 1,
                animation: 'ifModalSlideIn 300ms cubic-bezier(0.34,1.1,0.64,1)',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={modal.title ? `modal-title-${modal.id}` : undefined}
            >
              {/* Header */}
              {modal.title && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '22px 28px',
                  borderBottom: '1px solid #f0f2f5',
                }}>
                  <h2
                    id={`modal-title-${modal.id}`}
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: '#1e2124',
                      margin: 0,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'Assistant, sans-serif',
                    }}
                  >
                    {modal.title}
                  </h2>
                  {isTopModal && (
                    <button
                      onClick={() => handleCloseModal(modal)}
                      aria-label="סגור"
                      style={{
                        flexShrink: 0,
                        marginRight: '12px',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        transition: 'background 0.15s, color 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5'; e.currentTarget.style.color = '#31353a' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
                {currentLayout.component}
              </div>

              {/* Footer */}
              {showFooter && isTopModal && (
                <div style={{
                  padding: '18px 28px',
                  borderTop: '1px solid #f0f2f5',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}>
                  {modal.showCancelButton && (
                    <button
                      onClick={() => handleCloseModal(modal)}
                      style={{
                        padding: '9px 22px',
                        border: '1.5px solid #e0e3e6',
                        background: 'transparent',
                        color: '#31353a',
                        borderRadius: '50px',
                        fontFamily: 'Assistant, sans-serif',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f6f8f9'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {modal.cancelText || 'ביטול'}
                    </button>
                  )}
                  {modal.showConfirmButton && (
                    <button
                      onClick={() => handleConfirm(modal)}
                      style={{
                        padding: '9px 24px',
                        background: '#31353a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50px',
                        fontFamily: 'Assistant, sans-serif',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(49,53,58,0.2)',
                        transition: 'background 0.15s, transform 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#1e2124'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#31353a'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      {modal.confirmText || 'אישור'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes ifModalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ifModalSlideIn {
          from { opacity: 0; transform: scale(0.93) translateY(-12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}

export default GlobalModal
