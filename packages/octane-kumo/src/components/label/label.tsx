/** @jsxImportSource octane */
import { Info } from "@octanejs/phosphor-icons";
import type { OctaneNode } from "octane";
import { Button } from "../button/button";
import { Tooltip } from "../tooltip/tooltip";
import { cn } from "../../utils/cn";

export const KUMO_LABEL_VARIANTS = {} as const;

export const KUMO_LABEL_DEFAULT_VARIANTS = {} as const;

export interface KumoLabelVariantsProps {}

export function labelVariants(_props: KumoLabelVariantsProps = {}) {
  return cn("m-0 text-base font-medium text-kumo-default");
}

export function labelContentVariants() {
  return cn("inline-flex items-center gap-1");
}

export interface LabelProps extends KumoLabelVariantsProps {
  asContent?: boolean;
  children: OctaneNode;
  className?: string;
  htmlFor?: string;
  showOptional?: boolean;
  tooltip?: OctaneNode;
}

export function Label({
  asContent = false,
  children,
  className,
  htmlFor,
  showOptional = false,
  tooltip,
}: LabelProps) {
  const content = (
    <>
      <span className={cn("contents")}>{children}</span>
      {showOptional ? (
        <span className={cn("font-normal text-kumo-subtle")}>(optional)</span>
      ) : null}
      {tooltip ? (
        <Tooltip
          content={tooltip}
          render={
            <Button
              aria-label="More information"
              shape="square"
              size="xs"
              variant="ghost"
            >
              <Info className={cn("size-4")} />
            </Button>
          }
        />
      ) : null}
    </>
  );

  if (asContent) {
    return (
      <span className={cn(labelContentVariants(), className)}>{content}</span>
    );
  }

  return (
    <label
      className={cn(labelVariants(), labelContentVariants(), className)}
      htmlFor={htmlFor}
    >
      {content}
    </label>
  );
}
