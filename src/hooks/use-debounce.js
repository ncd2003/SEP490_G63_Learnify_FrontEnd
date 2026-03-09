import { useState, useEffect } from "react";

/**
 * Debounce a value by a given delay.
 * @template T
 * @param {T} value
 * @param {number} [delay=300]
 * @returns {T}
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
