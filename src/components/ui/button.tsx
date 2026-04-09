"use client"

import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/*
 * 3D Button System
 *
 * Structure: wrapper (clickable) → edge (stationary bg) → front (slides up/down)
 *
 * The 3D effect comes from the front face floating above the edge.
 * - Rest: front is lifted N px above the edge
 * - Hover: front lifts higher (springy ease)
 * - Active: front presses flush with edge (snappy)
 * - Release: front returns to rest (slow, satisfying)
 */

/* ─── 3D edge (stationary background layer) ─── */
const edgeVariants = cva("absolute inset-x-0 bottom-0", {
  variants: {
    variant: {
      gold: "bg-gradient-to-b from-[rgba(212,168,67,0.2)] to-[rgba(140,110,30,0.35)]",
      red: "bg-gradient-to-b from-[rgba(239,68,68,0.15)] to-[rgba(120,20,20,0.3)]",
      ghost: "bg-gradient-to-b from-white/[0.04] to-white/[0.08]",
      text: "hidden",
    },
    size: {
      sm: "rounded-lg top-[2px]",
      default: "rounded-xl top-[4px]",
      lg: "rounded-2xl top-[4px]",
    },
  },
  defaultVariants: { variant: "gold", size: "default" },
})

/* ─── Front face variant colors ─── */
const frontColorVariants = cva("", {
  variants: {
    variant: {
      gold: "bg-gradient-to-b from-[#1a1408] to-[#110d05] border border-[#D4A843]/35 text-[#D4A843]",
      red: "bg-gradient-to-b from-[#1a0808] to-[#120505] border border-red-500/35 text-red-300",
      ghost: "bg-gradient-to-b from-[#0e0c0c] to-[#0a0808] border border-white/12 text-white/55",
      text: "bg-transparent border-none text-white/30 font-medium",
    },
  },
  defaultVariants: { variant: "gold" },
})

/* ─── Front face sizes ─── */
const frontSizeVariants = cva("", {
  variants: {
    size: {
      sm: "px-4 py-2.5 text-[13px] min-h-[40px] rounded-lg",
      default: "px-7 py-3 text-sm min-h-[48px] rounded-xl",
      lg: "px-9 py-4 text-[15px] min-h-[56px] rounded-2xl tracking-wider",
    },
  },
  defaultVariants: { size: "default" },
})

/* Lift distances per size (in px) */
const LIFT = { sm: 2, default: 4, lg: 4 } as const
const HOVER_LIFT = { sm: 3, default: 6, lg: 6 } as const

/* ─── Mist glow backgrounds ─── */
const mistBg: Record<string, string> = {
  gold: "before:bg-[radial-gradient(ellipse_at_center,rgba(212,168,67,0.2)_0%,rgba(212,168,67,0.08)_40%,transparent_70%)]",
  red: "before:bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.18)_0%,rgba(239,68,68,0.06)_40%,transparent_70%)]",
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof frontColorVariants>,
    VariantProps<typeof frontSizeVariants> {
  /** Breathing atmospheric glow behind the button */
  mist?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "gold", size = "default", mist = false, children, ...props }, ref) => {
    const isText = variant === "text"
    const showMist = mist && !isText && variant !== "ghost"
    const mistClass = showMist
      ? `before:content-[''] before:absolute before:-inset-x-6 before:-inset-y-4 before:rounded-full before:blur-[28px] before:opacity-0 before:-z-10 before:pointer-events-none before:animate-[mist-breathe_3.5s_ease-in-out_infinite] hover:before:animate-[mist-breathe-hover_2.5s_ease-in-out_infinite] ${mistBg[variant as string] ?? ""}`
      : ""

    const sizeKey = (size ?? "default") as keyof typeof LIFT
    const lift = isText ? 0 : LIFT[sizeKey]
    const hoverLift = isText ? 0 : HOVER_LIFT[sizeKey]

    return (
      <button
        ref={ref}
        data-slot="button"
        className={cn(
          "group/btn relative inline-flex items-center justify-center",
          "cursor-pointer border-none bg-transparent p-0 outline-none",
          !isText && `pb-[${lift}px]`,
          "-webkit-tap-highlight-color-transparent",
          mistClass,
          className,
        )}
        style={{ WebkitTapHighlightColor: "transparent" }}
        {...props}
      >
        {/* 3D edge */}
        <span className={edgeVariants({ variant, size })} aria-hidden="true" />

        {/* Front face — transitions handled via inline style for reliable animation */}
        <span
          className={cn(
            "relative inline-flex w-full items-center justify-center gap-2",
            "font-semibold tracking-wide whitespace-nowrap select-none",
            "will-change-transform",
            "disabled:pointer-events-none disabled:opacity-50",
            frontColorVariants({ variant }),
            frontSizeVariants({ size }),
            // Hover border/bg enhancements
            variant === "gold" && "group-hover/btn:border-[#D4A843]/55 group-hover/btn:from-[#1f1809] group-hover/btn:to-[#151006]",
            variant === "red" && "group-hover/btn:border-red-500/55 group-hover/btn:from-[#1f0a0a] group-hover/btn:to-[#160606]",
            variant === "ghost" && "group-hover/btn:border-white/22 group-hover/btn:from-[#111010] group-hover/btn:to-[#0c0a0a] group-hover/btn:text-white/75",
            isText && "group-hover/btn:text-white/50",
            // Filter
            !isText && "group-hover/btn:brightness-110",
          )}
          style={{
            transform: `translateY(-${lift}px)`,
            transition: "transform 600ms cubic-bezier(0.3, 0.7, 0.4, 1), border-color 200ms, background 200ms",
          }}
          // These event handlers provide the snappy press/springy hover via inline styles
          onPointerDown={(e) => {
            if (isText) return
            e.currentTarget.style.transform = `translateY(0px)`
            e.currentTarget.style.transition = "transform 34ms"
          }}
          onPointerUp={(e) => {
            if (isText) return
            e.currentTarget.style.transform = `translateY(-${lift}px)`
            e.currentTarget.style.transition = "transform 600ms cubic-bezier(0.3, 0.7, 0.4, 1)"
          }}
          onPointerLeave={(e) => {
            if (isText) return
            e.currentTarget.style.transform = `translateY(-${lift}px)`
            e.currentTarget.style.transition = "transform 600ms cubic-bezier(0.3, 0.7, 0.4, 1)"
          }}
          onPointerEnter={(e) => {
            if (isText) return
            e.currentTarget.style.transform = `translateY(-${hoverLift}px)`
            e.currentTarget.style.transition = "transform 250ms cubic-bezier(0.3, 0.7, 0.4, 1.5)"
          }}
        >
          {children}
        </span>
      </button>
    )
  }
)

Button.displayName = "Button"

/** Arrow icon that slides right on hover */
function ButtonArrow({ direction = "right" }: { direction?: "right" | "down" }) {
  return (
    <span
      className={cn(
        "inline-flex transition-transform duration-250",
        "ease-[cubic-bezier(.3,.7,.4,1.5)]",
        direction === "right"
          ? "group-hover/btn:translate-x-[3px]"
          : "group-hover/btn:translate-y-[2px]"
      )}
      aria-hidden="true"
    >
      {direction === "right" ? "\u2192" : "\u2193"}
    </span>
  )
}

export { Button, ButtonArrow }
