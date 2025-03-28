import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

// TODO: dark variants
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 cursor-default whitespace-nowrap rounded-md font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 dark:ring-offset-primary-950 dark:focus-visible:ring-primary-300",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-text-50 hover:bg-primary-600 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-100",
        destructive:
          "bg-red-500 text-primary-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-primary-50 dark:hover:bg-red-900/90",
        outline:
          "border border-primary-200 bg-white hover:bg-primary-100 hover:text-primary-900 dark:border-primary-800 dark:bg-primary-50 dark:hover:bg-primary-100 dark:hover:text-primary-900",
        secondary:
          "bg-secondary text-text hover:bg-secondary-600 dark:bg-secondary dark:text-secondary-900 dark:hover:bg-secondary-200",
        accent:
          "bg-accent text-text hover:bg-accent-600 dark:bg-accent dark:text-text dark:hover:bg-accent-200",
        ghost: "hover:bg-primary-100 hover:text-primary-900",
        link: "text-primary-900 underline-offset-4 hover:underline dark:text-primary-50",
      },
      size: {
        default: "h-10 px-4 py-2 text-md",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-11 rounded-md px-8 text-lg",
        icon: "h-10 w-10",
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
