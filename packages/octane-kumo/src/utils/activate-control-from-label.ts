export function activateControlFromLabel(event: MouseEvent) {
  const target = event.target;
  if (
    target instanceof Element &&
    target.closest("button,input,a,select,textarea")
  ) {
    return;
  }

  (event.currentTarget as HTMLElement)
    .querySelector<HTMLButtonElement>(
      '[role="checkbox"],[role="radio"],[role="switch"]',
    )
    ?.click();
}
