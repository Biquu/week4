"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut
} from "@/components/ui/dropdown-menu"

// ContextMenu bileşeni, shadcn/ui'nin DropdownMenu bileşenini kullanır
export const ContextMenu = ({ children, trigger, ...props }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isOpen, setIsOpen] = React.useState(false)

  const handleContextMenu = React.useCallback((e) => {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
    setIsOpen(true)
  }, [])

  // Dışarı tıklandığında menu kapatılır
  React.useEffect(() => {
    const handleClickOutside = () => setIsOpen(false)
    if (isOpen) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div onContextMenu={handleContextMenu} style={{ position: "relative" }} {...props}>
      {children}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <span style={{ position: "fixed", left: position.x, top: position.y, height: 0, width: 0 }}></span>
        </DropdownMenuTrigger>
        {trigger}
      </DropdownMenu>
    </div>
  )
}

export const ContextMenuContent = DropdownMenuContent
export const ContextMenuItem = DropdownMenuItem
export const ContextMenuSeparator = DropdownMenuSeparator
export const ContextMenuShortcut = DropdownMenuShortcut