import React from 'react';

const Modal = ({ 
  id,
  isOpen, 
  onClose, 
  children, 
  className = '',
  closeOnClickOutside = true,
  ...props 
}) => {
  // Handle click outside
  const handleBackdropClick = (e) => {
    if (closeOnClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog 
      id={id} 
      className={`modal ${isOpen ? 'modal-open' : ''} ${className}`}
      onClick={handleBackdropClick}
      {...props}
    >
      <div className="modal-box">
        {children}
        <div className="modal-action">
          <form method="dialog">
            <button className="btn" onClick={onClose}>Close</button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

// Modal subcomponents
Modal.Header = ({ children, className = '', ...props }) => (
  <div className={`font-bold text-lg mb-4 ${className}`} {...props}>
    {children}
  </div>
);

Modal.Body = ({ children, className = '', ...props }) => (
  <div className={`py-4 ${className}`} {...props}>
    {children}
  </div>
);

Modal.Footer = ({ children, className = '', ...props }) => (
  <div className={`modal-action ${className}`} {...props}>
    {children}
  </div>
);

export default Modal; 