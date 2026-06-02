import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gold text-black shadow-sm hover:bg-gold-deep hover:shadow-md",
        secondary:
          "border-2 border-gold-deep bg-transparent text-foreground hover:bg-gold-soft",
        destructive: "bg-danger text-white hover:opacity-90",
        ghost: "hover:bg-gold-soft/80 text-foreground",
        outline:
          "border border-border bg-card hover:border-gold/50 hover:bg-gold-soft/30",
        staff: "bg-gold text-black hover:bg-gold-deep shadow-soft",
        staffGhost:
          "text-white/80 hover:bg-white/10 hover:text-white",
        staffOutline:
          "border border-white/25 bg-transparent text-white hover:border-gold/50 hover:bg-white/5",
      },
      size: {
        default: "min-h-12 px-6 py-3",
        sm: "min-h-10 rounded-lg px-4 text-xs",
        lg: "min-h-14 rounded-2xl px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
