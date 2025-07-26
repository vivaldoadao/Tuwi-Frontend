import type React from "react"
import { cn } from "@/lib/utils"

interface SectionProps {
  children: React.ReactNode
  className?: string
  background?: "white" | "gray" | "brand"
  padding?: "sm" | "md" | "lg"
}

const backgroundClasses = {
  white: "bg-white",
  gray: "bg-gray-100",
  brand: "bg-brand-background"
}

const paddingClasses = {
  sm: "py-8 md:py-12",
  md: "py-12 md:py-20", 
  lg: "py-16 md:py-24"
}

export function Section({ 
  children, 
  className,
  background = "white",
  padding = "md"
}: SectionProps) {
  return (
    <section className={cn(
      backgroundClasses[background],
      paddingClasses[padding],
      background === "brand" && "text-white",
      className
    )}>
      <div className="container px-4 md:px-6">
        {children}
      </div>
    </section>
  )
}