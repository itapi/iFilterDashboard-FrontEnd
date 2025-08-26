import React, { createContext, useContext, useState } from 'react'

const ModalContext = createContext()

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    title: '',
    content: null,
    props: {},
    onConfirm: null,
    onCancel: null,
    size: 'lg'
  })

  const openModal = ({ type, title, content, props = {}, onConfirm, onCancel, size = 'lg' }) => {
    setModalState({
      isOpen: true,
      type,
      title,
      content,
      props,
      onConfirm,
      onCancel,
      size
    })
  }

  const closeModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }))
    
    // Clear modal after animation
    setTimeout(() => {
      setModalState({
        isOpen: false,
        type: null,
        title: '',
        content: null,
        props: {},
        onConfirm: null,
        onCancel: null,
        size: 'lg'
      })
    }, 300)
  }

  const openConfirmModal = ({ title, message, onConfirm, onCancel, confirmText = 'אישור', cancelText = 'ביטול', variant = 'danger' }) => {
    openModal({
      type: 'confirm',
      title,
      content: message,
      props: { confirmText, cancelText, variant },
      onConfirm: () => {
        onConfirm?.()
        closeModal()
      },
      onCancel: () => {
        onCancel?.()
        closeModal()
      }
    })
  }

  return (
    <ModalContext.Provider value={{
      modalState,
      openModal,
      closeModal,
      openConfirmModal
    }}>
      {children}
    </ModalContext.Provider>
  )
}