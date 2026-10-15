export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <rect width="100" height="100" fill="white" rx="20" />
      <path d="M 60 40 L 40 40 L 60 20 Z M 60 60 L 60 40 L 80 60 Z M 40 60 L 60 60 L 40 80 Z M 40 40 L 40 60 L 20 40 Z" fill="black" />
    </svg>
  );
};
