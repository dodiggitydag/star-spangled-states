import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: 'info' | 'success' | 'error';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, type = 'info' }) => {
  if (!isOpen) return null;

  let headerColor = 'bg-patriotic-blue';
  if (type === 'success') headerColor = 'bg-green-500';
  if (type === 'error') headerColor = 'bg-patriotic-red';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-bounce-in">
        <div className={`${headerColor} p-4 flex justify-between items-center`}>
          <h2 className="text-white text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1 w-8 h-8 flex items-center justify-center font-bold">
            X
          </button>
        </div>
        <div className="p-6 text-center">
          {children}
        </div>
        <div className="p-4 bg-gray-50 flex justify-center">
          <button
            onClick={onClose}
            className="bg-patriotic-blue text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-blue-700 transition"
          >
            Okay!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;