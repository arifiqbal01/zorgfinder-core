import React, { useEffect } from "react";

const Modal = ({ title, children, onClose }) => {
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const sidebarWidth = document.body.classList.contains("folded") ? 60 : 160;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm">
      {/* PANEL */}
      <div
        className="
          absolute
          top-[32px]
          right-0
          bottom-0
          bg-white
          shadow-xl
          overflow-hidden
          animate-slideInFast

          w-full
          lg:w-[calc(100vw-var(--wp-sidebar))]
        "
        style={{ "--wp-sidebar": `${sidebarWidth}px` }}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 md:px-10 py-4 md:py-5 border-b bg-white sticky top-0 z-20">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-800">{title}</h3>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl md:text-4xl leading-none"
          >
            ×
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="overflow-y-auto h-[calc(100vh-32px)] pb-16 md:pb-20">
          <div
            className="
              mx-auto
              px-4 sm:px-6 md:px-10
              py-6 md:py-10
              max-w-full
              sm:max-w-3xl
              md:max-w-4xl
              lg:max-w-5xl
            "
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
