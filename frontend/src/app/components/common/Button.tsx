interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Button({ 
  children, 
  className = '', 
  onClick,
  type = 'button',
  ...props 
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-black text-white px-6 py-2 rounded-full hover:opacity-80 transition-opacity ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}