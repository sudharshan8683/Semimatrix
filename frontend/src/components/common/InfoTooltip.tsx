import React, { useState } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  content: string
  title?: string
  className?: string
  iconSize?: number
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  content, 
  title, 
  className = '',
  iconSize = 14
}) => {
  const [open, setOpen] = useState(false)

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
        className="text-text-muted hover:text-brand transition-colors p-0.5 focus:outline-none"
        aria-label="More information"
      >
        <Info size={iconSize} />
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs text-slate-200 pointer-events-none transition-all">
          {title && <div className="font-bold text-white mb-1 border-b border-slate-800 pb-1">{title}</div>}
          <div className="leading-relaxed text-slate-300 font-normal">{content}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  )
}
