import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-110 transition-all font-bold uppercase tracking-wider border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110 transition-all font-bold uppercase tracking-wider border-4 border-destructive shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        outline: "border-4 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground transition-all font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        secondary: "bg-secondary text-secondary-foreground hover:brightness-110 transition-all font-bold uppercase tracking-wider border-4 border-secondary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        ghost: "hover:bg-accent hover:text-accent-foreground transition-all font-bold uppercase tracking-wider border-2 border-transparent hover:border-accent",
        link: "text-primary underline-offset-4 hover:underline transition-all font-bold uppercase tracking-wider",
        premium: "bg-premium text-premium-foreground hover:brightness-110 transition-all font-bold uppercase tracking-wider border-4 border-premium shadow-[4px_4px_0px_0px_rgba(0,0,0,1),0_0_15px_rgba(255,215,0,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1),0_0_25px_rgba(255,215,0,0.7)] hover:translate-x-[-2px] hover:translate-y-[-2px] animate-blink",
        gradient: "bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground hover:brightness-110 transition-all font-bold uppercase tracking-wider border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
      },
      size: {
        default: "h-12 px-6 py-3 text-xs",
        sm: "h-10 px-4 text-xs",
        lg: "h-14 px-8 text-sm",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
