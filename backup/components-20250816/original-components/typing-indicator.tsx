"use client"

import { useEffect, useState } from 'react'

interface TypingIndicatorProps {
  userName?: string
  className?: string
}

export default function TypingIndicator({ 
  userName = "Alguém", 
  className = "" 
}: TypingIndicatorProps) {
  const [dotCount, setDotCount] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(prev => prev === 3 ? 1 : prev + 1)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`flex items-center gap-2 px-4 py-2 ${className}`}>
      <div className="flex items-center gap-1">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-xs text-gray-600">{userName[0]?.toUpperCase()}</span>
        </div>
        <div className="bg-gray-100 rounded-2xl px-3 py-2 max-w-xs">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">{userName} está digitando</span>
            <div className="flex gap-1 ml-1">
              {[1, 2, 3].map((dot) => (
                <div
                  key={dot}
                  className={`
                    w-1 h-1 rounded-full bg-gray-400 transition-opacity duration-300
                    ${dot <= dotCount ? 'opacity-100' : 'opacity-30'}
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}