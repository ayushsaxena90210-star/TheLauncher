import { useEffect, useState } from "react";

/**
 * Returns true when the user prefers reduced motion.
 * Listens to the OS media query as well as the data-reduced-motion attribute
 * that can be set manually via Settings.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reducedMotion === "true",
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setPrefersReducedMotion(
        media.matches || document.documentElement.dataset.reducedMotion === "true",
      );
    };

    media.addEventListener("change", update);

    // Also watch for attribute changes on <html>
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributeFilter: ["data-reduced-motion"] });

    return () => {
      media.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);

  return prefersReducedMotion;
}
