import { forwardRef } from "react";

/**
 * Input Component
 *
 * A controlled input with label, helper text, and error state.
 * Uses forwardRef so it works seamlessly with react-hook-form's register().
 *
 * Props:
 *   label      - Label text above the input
 *   error      - Error message string (turns input border red)
 *   helperText - Subtext below input (ignored if error is present)
 *   ...props   - All standard <input> attributes (type, placeholder, onChange, etc.)
 *
 * Usage with react-hook-form:
 *   <Input
 *       label="Email"
 *       error={errors.email?.message}
 *       {...register("email")}
 *   />
 */
const Input = forwardRef(({ label, error, helperText, id, className = "", ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-gray-700"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                ref={ref}
                className={`
                    w-full px-3 py-2 text-sm rounded-lg border bg-white
                    text-gray-900 placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-offset-0
                    transition-colors duration-150
                    disabled:bg-gray-50 disabled:cursor-not-allowed
                    ${error
                        ? "border-red-400 focus:ring-red-300"
                        : "border-gray-300 focus:border-indigo-400 focus:ring-indigo-200"
                    }
                    ${className}
                `}
                aria-invalid={!!error}
                aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                {...props}
            />
            {error && (
                <p id={`${inputId}-error`} className="text-xs text-red-500">
                    {error}
                </p>
            )}
            {!error && helperText && (
                <p id={`${inputId}-helper`} className="text-xs text-gray-500">
                    {helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = "Input";

export default Input;
