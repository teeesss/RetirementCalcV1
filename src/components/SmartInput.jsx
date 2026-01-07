import { useState, useEffect } from 'react';

/**
 * SmartInput - A wrapper around input type="number" that handles empty strings and 0s better.
 *
 * Problem: When a user deletes a value in a number input, Controlled Inputs often snap back to 0 immediately
 * or don't allow keeping the field empty while typing.
 *
 * Solution: Maintain a local string state that syncs with the parent numeric value only on blur or valid entry,
 * allowing the user to have an empty field or "-" while typing.
 */
export default function SmartInput({ value, onChange, className, placeholder, step = "1", type = "number" }) {
    const [localValue, setLocalValue] = useState(value?.toString() || '');

    // Sync from parent when parent value changes externally (e.g. Monte Carlo update or Preset load)
    // We ignore 0 if localValue is currently empty to prevent fighting the user.
    useEffect(() => {
        if (value !== undefined && value !== null) {
            // Only override local if it's materially different (parsing match)
            // or if parent changed significantly.
            // Simple heuristic: if parent value matches parsed local, don't touch local.
            const parsedLocal = parseFloat(localValue);
            if (parsedLocal !== value) {
                // If value is 0 and local is empty string, keep empty string (user deleted it)
                if (value === 0 && localValue === '') return;
                setLocalValue(value.toString());
            }
        }
    }, [value, localValue]);

    const handleChange = (e) => {
        const newVal = e.target.value;
        setLocalValue(newVal);

        if (newVal === '') {
            onChange(0); // Determine if we want to send 0 or undefined. For this app, 0 is safer for calculation.
            return;
        }

        const parsed = parseFloat(newVal);
        if (!isNaN(parsed)) {
            onChange(parsed);
        }
    };

    const handleBlur = () => {
        // On blur, strictly sync local to the sanitized parent value
        const parsed = parseFloat(localValue);
        if (isNaN(parsed) || localValue === '') {
            setLocalValue('0');
            onChange(0);
        } else {
            setLocalValue(parsed.toString()); // Remove trailing zeros/dots etc.
        }
    };

    return (
        <input
            type={type}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className={className}
            placeholder={placeholder}
            step={step}
        />
    );
}
