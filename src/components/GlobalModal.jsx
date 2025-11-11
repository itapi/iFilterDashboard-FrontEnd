import React, { useRef } from 'react'
import { useGlobalState } from '../contexts/GlobalStateContext'
import { Modal } from './Modal/Modal'
import ConfirmModal from './Modal/ConfirmModal'

// Import modal layouts here
import { ExampleFormLayout } from './Modal/layouts/ExampleFormLayout'
import { InfoLayout } from './Modal/layouts/InfoLayout'

const GlobalModal = () => {
  const { state, closeModal } = useGlobalState()
  const { modalStack } = state

  // Create refs for components that need form submission
  const layoutRefs = useRef({})

  if (!modalStack || modalStack.length === 0) return null

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

      exampleForm: {
        component: <ExampleFormLayout ref={getLayoutRef(modal.id)} data={modal.data} />,
        showFooter: true,
        hasRef: true,
      },

      info: {
        component: <InfoLayout data={modal.data} />,
        showFooter: true,
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
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex }}
          >
            {/* Backdrop - only interactive for top modal */}
            <div
              className={`absolute inset-0 bg-black transition-opacity duration-200 ${
                isTopModal ? 'bg-opacity-50' : 'bg-opacity-25'
              }`}
              onClick={isTopModal && modal.closeOnBackdropClick ? () => handleCloseModal(modal) : undefined}
            />

            {/* Modal Content Wrapper */}
            <div
              className={`relative transform transition-all duration-200 ${
                !isTopModal ? 'opacity-95 scale-95' : ''
              }`}
              style={{ zIndex: zIndex + 1 }}
            >
              <Modal
                isOpen={true}
                onClose={() => handleCloseModal(modal)}
                title={modal.title}
                size={modal.size}
                showCloseButton={isTopModal}
                closeOnBackdropClick={false} // We handle this in the outer backdrop
                closeOnEscape={isTopModal && modal.closeOnEscape}
                footer={
                  showFooter ? (
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                      {modal.showCancelButton && (
                        <button
                          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                          onClick={() => handleCloseModal(modal)}
                        >
                          {modal.cancelText || 'ביטול'}
                        </button>
                      )}
                      {modal.showConfirmButton && (
                        <button
                          className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                          onClick={() => handleConfirm(modal)}
                        >
                          {modal.confirmText || 'אישור'}
                        </button>
                      )}
                    </div>
                  ) : null
                }
              >
                {currentLayout.component}
              </Modal>
            </div>
          </div>
        )
      })}
    </>
  )
}

export default GlobalModal
