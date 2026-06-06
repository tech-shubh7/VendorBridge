import { getInitials } from "@/utils/helpers";

/**
 * Avatar Component
 *
 * Shows a user's avatar image with a fallback to initials.
 *
 * Props:
 *   src    - Image URL (optional)
 *   name   - User's name (used to generate initials fallback)
 *   size   - "sm" | "md" | "lg" | "xl"
 *   className - Additional Tailwind classes
 */
const Avatar = ({ src, name, size = "md", className = "" }) => {
    const sizes = {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-14 w-14 text-base",
        xl: "h-20 w-20 text-xl",
    };

    const initials = getInitials(name);

    if (src) {
        return (
            <img
                src={src}
                alt={name || "User avatar"}
                className={`rounded-full object-cover flex-shrink-0 ${sizes[size]} ${className}`}
                onError={(e) => {
                    // If image fails to load, hide it so the fallback shows
                    e.currentTarget.style.display = "none";
                }}
            />
        );
    }

    return (
        <div
            className={`
                rounded-full flex-shrink-0 flex items-center justify-center font-semibold
                bg-indigo-100 text-indigo-700 select-none
                ${sizes[size]} ${className}
            `}
            aria-label={name || "User avatar"}
        >
            {initials}
        </div>
    );
};

export default Avatar;
