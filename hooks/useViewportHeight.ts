import { useState, useEffect } from 'react';

export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    // Function to update viewport height
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    // Set initial value
    updateViewportHeight();

    // Add event listener for resize
    window.addEventListener('resize', updateViewportHeight);

    // Cleanup
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  return viewportHeight;
}