import Spinner from "@/components/ui/Spinner/Spinner";

/**
 * Button Component
 *
 * Props:
 *   variant   - "primary" | "secondary" | "outline" | "ghost" | "danger"
 *   size      - "sm" | "md" | "lg"
 *   isLoading - shows spinner and disables button
 *   fullWidth - takes full container width
 *   ...props  - all standard button HTML attributes (onClick, type, etc.)
 *
 * Usage:
 *   <Button variant="primary" isLoading={isPending} type="submit">
 *       Login
 *   </Button>
 */
const Button = ({
    children,
    variant = "primary",
    size = "md",
    isLoading = false,
    fullWidth = false,
    className = "",
    disabled,
    ...props
}) => {
    const baseClasses =
        "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

    const variants = {
        primary:
            "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 focus:ring-indigo-500",
        secondary:
            "bg-pink-500 text-white hover:bg-pink-600 active:bg-pink-700 focus:ring-pink-400",
        outline:
            "border border-indigo-600 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 focus:ring-indigo-400",
        ghost:
            "text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-300",
        danger:
            "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-400",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Spinner size="sm" />}
            {children}
        </button>
    );
};

export default Button;
