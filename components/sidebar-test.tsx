"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

export function SidebarTest() {
  const { state, open, toggleSidebar, isMobile } = useSidebar()
  
  React.useEffect(() => {
    console.log('SidebarTest - state:', state, 'open:', open, 'isMobile:', isMobile)
  }, [state, open, isMobile])

  return (
    <div className="p-4 border border-blue-500 bg-blue-50 m-2">
      <h3 className="font-bold mb-2">Sidebar Test Component</h3>
      <p>State: {state}</p>
      <p>Open: {String(open)}</p>
      <p>Is Mobile: {String(isMobile)}</p>
      <Button onClick={toggleSidebar} className="mt-2">
        Manual Toggle
      </Button>
    </div>
  )
}