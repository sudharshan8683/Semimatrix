export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black font-black text-xs font-mono select-none ${className}`}>
      SM
    </div>
  );
};
