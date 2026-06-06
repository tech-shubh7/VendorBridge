import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * Modal Component
 *
 * An accessible modal dialog rendered in a portal.
 * Closes on overlay click and Escape key press.
 *
 * Props:
 *   isOpen    - Controls visibility
 *   onClose   - Callback to close the modal
 *   title     - Modal header title (optional)
 *   size      - "sm" | "md" | "lg" | "xl"
 *   children  - Modal body content
 */
const Modal = ({ isOpen, onClose, title, size = "md", children }) => {
    // Close on Escape key
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Escape" && isOpen) onClose();
        },
        [isOpen, onClose]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const sizes = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-2xl",
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal panel */}
            <div
                className={`
                    relative z-10 w-full ${sizes[size]}
                    bg-white rounded-xl shadow-xl
                    animate-[fadeInScale_0.2s_ease]
                `}
            >
                {title && (
                    <div className="flex items-center justify-between p-5 border-b border-gray-200">
                        <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
                            aria-label="Close modal"
                        >
                            ✕
                        </button>
                    </div>
                )}
                <div className="p-5">{children}</div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
