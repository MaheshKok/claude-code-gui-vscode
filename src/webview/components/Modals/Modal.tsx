import React, { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: "sm" | "md" | "lg" | "xl";
    showCloseButton?: boolean;
    closeOnBackdrop?: boolean;
    className?: string;
}

const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    width = "md",
    showCloseButton = true,
    closeOnBackdrop = true,
    className = "",
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        },
        [onClose],
    );

    const handleBackdropClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (closeOnBackdrop && event.target === event.currentTarget) {
                onClose();
            }
        },
        [closeOnBackdrop, onClose],
    );

    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            document.addEventListener("keydown", handleKeyDown);
            modalRef.current?.focus();
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
            previousActiveElement.current?.focus();
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className={`
          relative w-full ${widthClasses[width]}
          glass-panel border-white/10 shadow-2xl
          rounded-xl
          animate-slide-up
          text-white
          ${className}
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <h2
                        id="modal-title"
                        className="text-lg font-medium text-white/90 tracking-tight"
                    >
                        {title}
                    </h2>

                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors modal-close-btn"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-5 max-h-[70vh] overflow-y-auto custom-scrollbar">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
