/** @jsxImportSource octane */
import { useEffect } from "octane";

export type MenuNavigationDirection = "horizontal" | "vertical";

export interface UseMenuNavigationProps {
  direction?: MenuNavigationDirection;
  menuRef: { current: HTMLElement | null };
}

export function useMenuNavigation({
  menuRef,
  direction = "horizontal",
}: UseMenuNavigationProps) {
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    function handleKeyDown(event: KeyboardEvent) {
      const focusableElements = Array.from(
        menu?.querySelectorAll<HTMLElement>(
          'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const activeElement = document.activeElement as HTMLElement | null;
      if (!activeElement || focusableElements.length === 0) return;

      const currentIndex = focusableElements.indexOf(activeElement);
      if (currentIndex === -1) return;

      const isHorizontal = direction === "horizontal";
      const forwardKey = isHorizontal ? "ArrowRight" : "ArrowDown";
      const backwardKey = isHorizontal ? "ArrowLeft" : "ArrowUp";
      let nextIndex = currentIndex;

      if (event.key === forwardKey) {
        event.preventDefault();
        nextIndex = (currentIndex + 1) % focusableElements.length;
      } else if (event.key === backwardKey) {
        event.preventDefault();
        nextIndex =
          (currentIndex - 1 + focusableElements.length) %
          focusableElements.length;
      } else {
        return;
      }

      const nextElement = focusableElements[nextIndex];
      if (!nextElement) return;
      nextElement.focus();
    }

    menu.addEventListener("keydown", handleKeyDown);

    return () => {
      menu.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuRef, direction]);
}
