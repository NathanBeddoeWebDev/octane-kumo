/** @jsxImportSource octane */
import { useEffect, useRef } from "octane";
import { serializeSelectionValue } from "./selection-values";

export function SelectionFormValues<T>({
  name,
  form,
  disabled,
  values,
  serialize,
  onReset,
}: {
  name?: string;
  form?: string;
  disabled?: boolean;
  values: readonly T[];
  serialize?: (value: T) => string;
  onReset: () => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const owner = ref.current?.form;
    if (!owner) return;
    const reset = (event: Event) => {
      queueMicrotask(() => {
        if (!event.defaultPrevented) onReset();
      });
    };
    owner.addEventListener("reset", reset);
    return () => owner.removeEventListener("reset", reset);
  }, [form, onReset]);
  return (
    <>
      {name
        ? values.map((item, index) => (
            <input
              key={index}
              type="hidden"
              name={name}
              form={form}
              disabled={disabled}
              value={serializeSelectionValue(item, serialize)}
            />
          ))
        : null}
      <input ref={ref} type="hidden" form={form} />
    </>
  );
}
