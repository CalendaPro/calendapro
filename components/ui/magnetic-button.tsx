"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const magneticButtonVariants = cva(
  "group/magnetic-button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:scale-[1.02]",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground hover:scale-[1.02] aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-[1.02] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground hover:scale-[1.02] aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:scale-[1.02] focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline hover:scale-[1.02]",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface MagneticButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof magneticButtonVariants> {
  asChild?: boolean
  magneticStrength?: number
}

function MagneticButton({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  magneticStrength = 0.3,
  children,
  ...props
}: MagneticButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const Comp = asChild ? Slot.Root : "button"

  // Motion values for magnetic effect
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring physics for smooth movement
  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  // Scale for hover effect
  const scale = useMotionValue(1)
  const springScale = useSpring(scale, { damping: 20, stiffness: 300 })

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate distance from center
      const distanceX = e.clientX - centerX
      const distanceY = e.clientY - centerY

      // Apply magnetic effect (move toward cursor)
      x.set(distanceX * magneticStrength)
      y.set(distanceY * magneticStrength)
    },
    [magneticStrength, x, y]
  )

  const handleMouseLeave = React.useCallback(() => {
    // Reset to center when mouse leaves
    x.set(0)
    y.set(0)
    scale.set(1)
  }, [x, y, scale])

  const handleMouseEnter = React.useCallback(() => {
    // Slight scale up on hover (2% swell effect)
    scale.set(1.02)
  }, [scale])

  return (
    <motion.div
      style={{
        x: springX,
        y: springY,
        scale: springScale,
        display: "inline-flex",
      }}
    >
      <Comp
        ref={ref}
        data-slot="magnetic-button"
        data-variant={variant}
        data-size={size}
        className={cn(magneticButtonVariants({ variant, size, className }))}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        {...props}
      >
        {children}
      </Comp>
    </motion.div>
  )
}

export { MagneticButton, magneticButtonVariants }
