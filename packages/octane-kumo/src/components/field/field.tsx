/** @jsxImportSource octane */
import { Field as FieldBase } from "@octanejs/base-ui/field";
import type { OctaneNode } from "octane";
import { Label } from "../label/label";
import { cn } from "../../utils/cn";

export type FieldErrorMatch =
  | boolean
  | "badInput"
  | "customError"
  | "patternMismatch"
  | "rangeOverflow"
  | "rangeUnderflow"
  | "stepMismatch"
  | "tooLong"
  | "tooShort"
  | "typeMismatch"
  | "valid"
  | "valueMissing";

export interface FieldError {
  match: FieldErrorMatch;
  message: OctaneNode;
}

export function normalizeFieldError(
  error: string | FieldError | undefined,
): FieldError | undefined {
  if (!error) return undefined;
  if (typeof error === "string") return { match: true, message: error };
  return error;
}

export const KUMO_FIELD_VARIANTS = {} as const;

export const KUMO_FIELD_DEFAULT_VARIANTS = {} as const;

export interface KumoFieldVariantsProps {
  controlFirst?: boolean;
}

export function fieldVariants({
  controlFirst = false,
}: KumoFieldVariantsProps = {}) {
  return cn(
    "grid gap-2",
    "has-[input[type=checkbox]]:grid-cols-[auto_1fr] has-[input[type=checkbox]]:items-center",
    "has-[[role=switch]]:grid-cols-[auto_1fr] has-[[role=switch]]:items-center",
    controlFirst && [
      "has-[input[type=checkbox]]:flex has-[input[type=checkbox]]:flex-row-reverse has-[input[type=checkbox]]:flex-wrap has-[input[type=checkbox]]:items-center",
      "has-[[role=switch]]:flex has-[[role=switch]]:flex-row-reverse has-[[role=switch]]:flex-wrap has-[[role=switch]]:items-center",
      "[&>label]:flex-1",
    ],
  );
}

export interface FieldProps extends KumoFieldVariantsProps {
  children: OctaneNode;
  description?: OctaneNode;
  error?: FieldError;
  hideLabel?: boolean;
  label: OctaneNode;
  labelTooltip?: OctaneNode;
  required?: boolean;
}

export function Field({
  children,
  controlFirst = false,
  description,
  error,
  hideLabel = false,
  label,
  labelTooltip,
  required,
}: FieldProps) {
  return (
    <FieldBase.Root className={fieldVariants({ controlFirst })}>
      {!hideLabel ? (
        <FieldBase.Label
          className={cn(
            "m-0 text-base font-medium text-kumo-default select-none",
          )}
        >
          <Label
            asContent
            showOptional={required === false}
            tooltip={labelTooltip}
          >
            {label}
          </Label>
        </FieldBase.Label>
      ) : null}
      <span className={cn("contents")}>{children}</span>
      {error ? (
        <FieldBase.Error
          className={cn("col-span-full text-sm leading-snug text-kumo-danger")}
          match={error.match}
        >
          {error.message}
        </FieldBase.Error>
      ) : description ? (
        <FieldBase.Description
          className={cn("col-span-full text-sm leading-snug text-kumo-subtle")}
        >
          {description}
        </FieldBase.Description>
      ) : null}
    </FieldBase.Root>
  );
}
