export function fallbackCopyText(value: string): boolean {
  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);

  const selection = document.getSelection();
  const previousRange = selection?.rangeCount
    ? selection.getRangeAt(0)
    : undefined;
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch (error) {
    console.warn("Clipboard copy failed", error);
    return false;
  } finally {
    textarea.remove();
    if (previousRange) {
      selection?.removeAllRanges();
      selection?.addRange(previousRange);
    }
  }
}

export async function copyText(value: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard?.writeText === "function"
    ) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // The legacy fallback below can still succeed when Clipboard API access is denied.
  }

  return fallbackCopyText(value);
}
