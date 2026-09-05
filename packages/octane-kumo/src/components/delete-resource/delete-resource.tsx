/** @jsxImportSource octane */
import { Check, Copy, WarningCircle, X } from "@octanejs/phosphor-icons";
import { useCallback, useEffect, useRef, useState } from "octane";
import { Banner } from "../banner/banner";
import { Button } from "../button/button";
import { Dialog } from "../dialog/dialog";
import { Input } from "../input/input";
import { cn } from "../../utils/cn";
import { copyText } from "../../utils/copy-text";

const COPIED_FEEDBACK_MS = 1500;

export const KUMO_DELETE_RESOURCE_VARIANTS = {
  size: {
    sm: {
      classes: "",
      description: "Small dialog for simple delete confirmations",
    },
    base: {
      classes: "",
      description: "Default delete confirmation dialog size",
    },
  },
} as const;

export const KUMO_DELETE_RESOURCE_DEFAULT_VARIANTS = { size: "base" } as const;

export type KumoDeleteResourceSize =
  keyof typeof KUMO_DELETE_RESOURCE_VARIANTS.size;

export interface KumoDeleteResourceVariantsProps {
  size?: KumoDeleteResourceSize;
}

export interface DeleteResourceProps extends KumoDeleteResourceVariantsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: string;
  resourceName: string;
  onDelete: () => void | Promise<void>;
  isDeleting?: boolean;
  caseSensitive?: boolean;
  deleteButtonText?: string;
  className?: string;
  errorMessage?: string;
}

export function DeleteResource({
  open,
  onOpenChange,
  resourceType,
  resourceName,
  onDelete,
  isDeleting = false,
  caseSensitive = true,
  deleteButtonText,
  size = KUMO_DELETE_RESOURCE_DEFAULT_VARIANTS.size,
  errorMessage,
  className,
}: DeleteResourceProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [copied, setCopied] = useState(false);
  const mountedRef = useRef(true);
  const deletingRef = useRef(false);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyEpoch = useRef(0);

  const reset = useCallback(() => {
    copyEpoch.current += 1;
    setConfirmationInput("");
    setCopied(false);
    if (copyResetRef.current !== null) {
      clearTimeout(copyResetRef.current);
      copyResetRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(
    () => () => {
      mountedRef.current = false;
      if (copyResetRef.current !== null) clearTimeout(copyResetRef.current);
    },
    [],
  );

  const normalize = useCallback(
    (value: string) => (caseSensitive ? value : value.toLowerCase()),
    [caseSensitive],
  );
  const isConfirmed = normalize(confirmationInput) === normalize(resourceName);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) reset();
      onOpenChange(nextOpen);
    },
    [onOpenChange, reset],
  );

  const handleDelete = useCallback(async () => {
    if (!isConfirmed || isDeleting || deletingRef.current) return;
    deletingRef.current = true;
    try {
      await onDelete();
    } finally {
      if (mountedRef.current) deletingRef.current = false;
    }
  }, [isConfirmed, isDeleting, onDelete]);

  const handleCopy = useCallback(async () => {
    const epoch = copyEpoch.current;
    const succeeded = await copyText(resourceName);
    if (!succeeded || !mountedRef.current || epoch !== copyEpoch.current)
      return;
    setCopied(true);
    if (copyResetRef.current !== null) clearTimeout(copyResetRef.current);
    copyResetRef.current = setTimeout(() => {
      copyResetRef.current = null;
      if (mountedRef.current) setCopied(false);
    }, COPIED_FEEDBACK_MS);
  }, [resourceName]);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog size={size} className={cn("p-0", className)}>
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-b border-kumo-line px-6 py-4",
          )}
        >
          <Dialog.Title
            className={cn("min-w-0 text-lg font-semibold break-words")}
          >
            Delete {resourceName}
          </Dialog.Title>
          <Dialog.Close
            render={
              <Button
                variant="ghost"
                shape="square"
                size="sm"
                aria-label="Close"
              />
            }
            aria-label="Close"
            disabled={isDeleting}
          >
            <X size={18} />
          </Dialog.Close>
        </div>

        <div className={cn("flex flex-col gap-4 p-6")}>
          <div className={cn("flex flex-col gap-2")}>
            {errorMessage ? (
              <Banner icon={<WarningCircle />} variant="error">
                {errorMessage}
              </Banner>
            ) : null}
            <p
              className={cn(
                "max-w-prose text-base text-pretty break-words text-kumo-subtle",
              )}
            >
              This action cannot be undone. This will permanently delete the{" "}
              <span className={cn("font-medium text-kumo-default")}>
                {resourceName}
              </span>{" "}
              {resourceType.toLowerCase()}.
            </p>
          </div>

          <div className={cn("flex flex-col gap-2")}>
            <div className={cn("flex items-center gap-1.5 text-base")}>
              <span>
                Type{" "}
                <button
                  type="button"
                  className={cn(
                    "group inline max-w-full cursor-pointer rounded-md bg-kumo-tint px-2 py-1 font-mono text-xs font-medium break-all hover:bg-kumo-fill",
                  )}
                  onClick={handleCopy}
                  aria-label={`Copy ${resourceName} to clipboard`}
                >
                  {resourceName}
                  {copied ? (
                    <Check
                      size={12}
                      weight="bold"
                      className={cn("ml-1.5 inline")}
                    />
                  ) : (
                    <Copy
                      size={12}
                      weight="bold"
                      className={cn(
                        "ml-1.5 inline text-kumo-subtle group-hover:text-kumo-default",
                      )}
                    />
                  )}
                </button>{" "}
                to confirm:
              </span>
            </div>
            <Input
              placeholder={resourceName}
              value={confirmationInput}
              onValueChange={setConfirmationInput}
              disabled={isDeleting}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label={`Type ${resourceName} to confirm deletion`}
              className={cn("w-full")}
            />
            <span className={cn("sr-only")} aria-live="polite">
              {copied ? "Copied" : ""}
            </span>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-wrap justify-end gap-3 border-t border-kumo-line px-6 py-4",
          )}
        >
          <Dialog.Close
            render={<Button variant="secondary" />}
            disabled={isDeleting}
          >
            Cancel
          </Dialog.Close>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            loading={isDeleting}
          >
            {deleteButtonText || `Delete ${resourceType}`}
          </Button>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

DeleteResource.displayName = "DeleteResource";
