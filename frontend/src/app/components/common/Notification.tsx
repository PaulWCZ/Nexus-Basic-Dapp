'use client'

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

export function Notification({ message, type }: NotificationProps) {
  return (
    <div className="fixed bottom-8 left-1/2 md:left-auto md:right-8 transform -translate-x-1/2 md:translate-x-0 z-50">
      <div 
        className={`
          px-6 py-3 rounded-full shadow-lg backdrop-blur-sm
          flex items-center justify-center min-w-[300px]
          transition-all duration-300 ease-in-out
          ${type === 'success' 
            ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
            : type === 'error'
            ? 'bg-red-500/10 text-red-600 border border-red-500/20'
            : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
          }
        `}
      >
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}