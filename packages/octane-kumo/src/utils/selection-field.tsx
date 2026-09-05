/** @jsxImportSource octane */
import {
  FieldError as AriaFieldError,
  FieldErrorContext,
  Label as AriaLabel,
  Text as AriaText,
} from "@octanejs/aria/components";
import { useContext, type OctaneNode } from "octane";
import {
  normalizeFieldError,
  type FieldError,
  type FieldErrorMatch,
} from "../components/field/field";
import { Label } from "../components/label/label";
import { cn } from "./cn";

export interface SelectionFieldPresentationProps {
  children: OctaneNode;
  description?: OctaneNode;
  error?: string | FieldError;
  hideLabel?: boolean;
  label?: OctaneNode;
  labelTooltip?: OctaneNode;
  required?: boolean;
}

function matchesValidation(
  match: FieldErrorMatch,
  validation: {
    isInvalid: boolean;
    validationDetails: ValidityState;
  } | null,
) {
  if (!validation?.isInvalid || match === false) return false;
  if (match === true) return true;
  return Boolean(validation.validationDetails[match]);
}

/**
 * Kumo field chrome for controls that already provide React Aria field contexts.
 * Render this inside an Aria Select or ComboBox so their Label/Text/FieldError
 * contexts retain ownership of the control's accessible relationships.
 */
export function SelectionFieldPresentation({
  children,
  description,
  error: errorProp,
  hideLabel = false,
  label,
  labelTooltip,
  required,
}: SelectionFieldPresentationProps) {
  const error = normalizeFieldError(errorProp);
  const validation = useContext(FieldErrorContext);
  const showError = error ? matchesValidation(error.match, validation) : false;

  return (
    <>
      {label ? (
        <AriaLabel
          className={cn(
            "m-0 text-base font-medium text-kumo-default select-none",
            hideLabel && "sr-only",
          )}
        >
          <Label
            asContent
            showOptional={required === false}
            tooltip={hideLabel ? undefined : labelTooltip}
          >
            {label}
          </Label>
        </AriaLabel>
      ) : null}
      {children}
      {error ? (
        showError ? (
          <AriaFieldError
            className={cn(
              "col-span-full text-sm leading-snug text-kumo-danger",
            )}
          >
            {error.message}
          </AriaFieldError>
        ) : null
      ) : description ? (
        <AriaText
          className={cn("col-span-full text-sm leading-snug text-kumo-subtle")}
          slot="description"
        >
          {description}
        </AriaText>
      ) : null}
    </>
  );
}
