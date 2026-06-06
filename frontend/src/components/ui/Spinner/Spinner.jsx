/**
 * Spinner Component — Loading indicator
 *
 * Props:
 *   size  - "sm" | "md" | "lg"
 *   color - Tailwind color class for the spinner (default: current text color)
 */
const Spinner = ({ size = "md", className = "" }) => {
    const sizes = {
        sm: "h-4 w-4 border-2",
        md: "h-6 w-6 border-2",
        lg: "h-10 w-10 border-[3px]",
    };

    return (
        <span
            role="status"
            aria-label="Loading"
            className={`inline-block rounded-full border-current border-r-transparent animate-spin ${sizes[size]} ${className}`}
        />
    );
};

export default Spinner;
