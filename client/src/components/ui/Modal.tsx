import {
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
}: ModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEsc, handleClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (
      closeOnOverlayClick &&
      e.target === overlayRef.current &&
      !contentRef.current?.contains(e.target as Node)
    ) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-[var(--color-text-primary)]/40 backdrop-blur-sm
        transition-opacity duration-150
        ${isClosing ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <div
        ref={contentRef}
        className={`
          w-full ${sizeClasses[size]} bg-[var(--color-card)] rounded-[16px] shadow-2xl
          transform transition-all duration-150
          ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
        `}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
            <div className="flex-1 pr-4">
              {title && (
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export interface ConfirmModalProps extends Omit<ModalProps, 'children' | 'footer'> {
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  confirmVariant?: 'primary' | 'danger';
  isConfirming?: boolean;
}

export function ConfirmModal({
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  confirmVariant = 'primary',
  isConfirming = false,
  ...props
}: ConfirmModalProps) {
  return (
    <Modal
      {...props}
      footer={
        <>
          <Button variant="ghost" onClick={props.onClose} disabled={isConfirming}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={isConfirming}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-[var(--color-text-primary)]">
        您确定要执行此操作吗？此操作无法撤销。
      </p>
    </Modal>
  );
}
