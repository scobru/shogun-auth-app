import React from "react";

const Modal = ({
  id,
  isOpen,
  onClose,
  children,
  className = "",
  closeOnClickOutside = true,
  responsive = true,
  ...props
}) => {
  // Handle click outside
  const handleBackdropClick = (e) => {
    if (closeOnClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <dialog
      id={id}
      className={`modal ${isOpen ? "modal-open" : ""} ${responsive ? "p-4 sm:p-6" : ""} ${className}`}
      onClick={handleBackdropClick}
      {...props}
    >
      <div
        className={`modal-box ${responsive ? "w-full max-w-md sm:max-w-lg lg:max-w-xl" : ""}`}
      >
        {children}
        <div className="modal-action">
          <form method="dialog">
            <button
              className="btn btn-sm sm:btn-md"
              onClick={onClose}
              aria-label="Close modal"
            >
              Close
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

// Modal subcomponents
Modal.Header = ({ children, className = "", responsive = true, ...props }) => (
  <div
    className={`font-bold ${responsive ? "text-lg sm:text-xl" : "text-lg"} mb-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);

Modal.Body = ({ children, className = "", responsive = true, ...props }) => (
  <div
    className={`py-4 ${responsive ? "text-sm sm:text-base" : ""} ${className}`}
    {...props}
  >
    {children}
  </div>
);

Modal.Footer = ({ children, className = "", responsive = true, ...props }) => (
  <div
    className={`modal-action ${responsive ? "flex-col sm:flex-row gap-2 sm:gap-4" : ""} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Modal;
