import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  format?: 'percent' | 'number'
}

export const AnimatedCounter = ({ value, format = 'number' }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplayValue(latest)
      },
    })
    return () => controls.stop()
  }, [value])

  const formatted = format === 'percent' 
    ? displayValue.toFixed(1) + '%'
    : Math.round(displayValue).toString()

  return <span>{formatted}</span>
}
