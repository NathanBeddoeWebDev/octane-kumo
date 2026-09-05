/** @jsxImportSource octane */
import type { OctaneNode } from "octane";
import type { JSX } from "octane/jsx-runtime";
import { Checkbox, type CheckboxChangeEventDetails } from "../checkbox";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";

export const KUMO_TABLE_VARIANTS = {
  layout: {
    auto: {
      classes: "",
      description: "Auto table layout - columns resize based on content",
    },
    fixed: {
      classes: "table-fixed",
      description:
        "Fixed table layout - columns have equal width, controlled via colgroup",
    },
  },
  variant: {
    default: {
      classes:
        "even:bg-kumo-elevated [--kumo-table-row-bg:var(--color-kumo-base)] even:[--kumo-table-row-bg:var(--color-kumo-elevated)]",
      description: "Default row variant",
    },
    selected: {
      classes: "bg-kumo-tint [--kumo-table-row-bg:var(--color-kumo-tint)]",
      description: "Selected row variant",
    },
  },
  sticky: {
    left: {
      classes: "sticky left-0",
      description: "Pin column to the left edge of the scroll container",
    },
    right: {
      classes: "sticky right-0",
      description: "Pin column to the right edge of the scroll container",
    },
  },
} as const;

export type KumoTableStickyColumn = keyof typeof KUMO_TABLE_VARIANTS.sticky;
export const KUMO_TABLE_DEFAULT_VARIANTS = {
  layout: "auto",
  variant: "default",
} as const;
export type KumoTableRowVariant = keyof typeof KUMO_TABLE_VARIANTS.variant;
export type KumoTableLayout = keyof typeof KUMO_TABLE_VARIANTS.layout;

function stickyColumnClasses(
  side: KumoTableStickyColumn,
  element: "head" | "cell",
) {
  const base = resolveVariant(KUMO_TABLE_VARIANTS.sticky, side, "left").classes;
  const z = element === "head" ? "z-2" : "z-1";
  const fadePosition = side === "right" ? "before:-left-6" : "before:-right-6";
  const fadeBase =
    "before:pointer-events-none before:absolute before:inset-y-0 before:w-6";
  if (element === "cell") {
    const fade =
      side === "right"
        ? "before:bg-gradient-to-r before:from-transparent before:to-(--kumo-table-row-bg)"
        : "before:bg-gradient-to-l before:from-transparent before:to-(--kumo-table-row-bg)";
    return cn(
      base,
      z,
      "bg-(--kumo-table-row-bg)",
      fadeBase,
      fadePosition,
      fade,
    );
  }
  const bg = "bg-kumo-base group-data-[compact]/header:bg-kumo-elevated";
  const fade =
    side === "right"
      ? "before:bg-gradient-to-r before:from-transparent before:to-kumo-base group-data-[compact]/header:before:to-kumo-elevated"
      : "before:bg-gradient-to-l before:from-transparent before:to-kumo-base group-data-[compact]/header:before:to-kumo-elevated";
  return cn(base, z, bg, fadeBase, fadePosition, fade);
}

type IntrinsicProps<K extends keyof JSX.IntrinsicElements> = Omit<
  JSX.IntrinsicElements[K],
  "children"
> & { children?: OctaneNode };

export interface TableProps extends IntrinsicProps<"table"> {
  layout?: KumoTableLayout;
}
export interface TableHeaderProps extends IntrinsicProps<"thead"> {
  variant?: "default" | "compact";
  sticky?: boolean;
}
export interface TableHeadProps extends IntrinsicProps<"th"> {
  sticky?: KumoTableStickyColumn;
}
export interface TableRowProps extends IntrinsicProps<"tr"> {
  variant?: KumoTableRowVariant;
}
export type TableBodyProps = IntrinsicProps<"tbody">;
export interface TableCellProps extends IntrinsicProps<"td"> {
  sticky?: KumoTableStickyColumn;
}
export type TableFooterProps = IntrinsicProps<"tfoot">;
export type TableResizeHandleProps = IntrinsicProps<"button">;

export interface TableCheckProps extends IntrinsicProps<"td"> {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (
    checked: boolean,
    eventDetails?: CheckboxChangeEventDetails,
  ) => void;
  /** @deprecated Use `onCheckedChange` instead. */
  onValueChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export interface TableCheckHeadProps extends IntrinsicProps<"th"> {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (
    checked: boolean,
    eventDetails?: CheckboxChangeEventDetails,
  ) => void;
  /** @deprecated Use `onCheckedChange` instead. */
  onValueChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function TableRoot({
  layout = "auto",
  ref,
  className,
  ...props
}: TableProps) {
  return (
    <table
      ref={ref}
      {...props}
      className={cn(
        "isolate w-full",
        resolveVariant(
          KUMO_TABLE_VARIANTS.layout,
          layout,
          KUMO_TABLE_DEFAULT_VARIANTS.layout,
        ).classes,
        "[&_td]:p-3",
        "[&_th]:border-b [&_th]:border-kumo-fill [&_th]:p-3 [&_th]:text-base [&_th]:font-semibold",
        "[&_th]:bg-kumo-base",
        "text-left text-base text-kumo-default",
        className,
      )}
    />
  );
}

export function TableHeader({
  variant = "default",
  sticky,
  ref,
  className,
  ...props
}: TableHeaderProps) {
  const compact = variant === "compact";
  return (
    <thead
      ref={ref}
      {...props}
      className={cn(
        "group/header",
        compact &&
          "text-xs text-kumo-strong [&_th]:bg-kumo-elevated [&_th]:py-2",
        // A header-wide stacking context keeps pinned body cells below it.
        sticky && "sticky top-0 z-2",
        className,
      )}
      {...(compact ? { "data-compact": "" } : {})}
    />
  );
}

export function TableHead({
  sticky,
  ref,
  className,
  ...props
}: TableHeadProps) {
  return (
    <th
      ref={ref}
      {...props}
      className={cn(
        "group relative",
        sticky && stickyColumnClasses(sticky, "head"),
        className,
      )}
    />
  );
}
export function TableRow({
  variant = KUMO_TABLE_DEFAULT_VARIANTS.variant,
  ref,
  className,
  ...props
}: TableRowProps) {
  return (
    <tr
      ref={ref}
      {...props}
      className={cn(
        resolveVariant(
          KUMO_TABLE_VARIANTS.variant,
          variant,
          KUMO_TABLE_DEFAULT_VARIANTS.variant,
        ).classes,
        className,
      )}
    />
  );
}
export function TableBody({ ref, ...props }: TableBodyProps) {
  return <tbody ref={ref} {...props} />;
}
export function TableCell({
  sticky,
  ref,
  className,
  ...props
}: TableCellProps) {
  return (
    <td
      ref={ref}
      {...props}
      className={cn(sticky && stickyColumnClasses(sticky, "cell"), className)}
    />
  );
}
export function TableFooter({ ref, ...props }: TableFooterProps) {
  return <tfoot ref={ref} {...props} />;
}

export function TableResizeHandle({
  ref,
  className,
  ...props
}: TableResizeHandleProps) {
  return (
    <button
      ref={ref}
      {...props}
      type="button"
      aria-label="Resize column"
      className={cn(
        "invisible h-full group-hover:visible",
        "w-[10px]",
        "flex items-center justify-center",
        "cursor-col-resize touch-none select-none",
        "absolute top-0 right-0",
        "m-0 bg-kumo-base p-0",
        "focus-visible:ring-2 focus-visible:ring-kumo-brand",
        className,
      )}
    >
      <span className={cn("h-5 w-[2px] rounded bg-kumo-hairline")} />
    </button>
  );
}

function SelectionCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  onValueChange,
  label,
  disabled,
}: Pick<
  TableCheckProps,
  | "checked"
  | "indeterminate"
  | "onCheckedChange"
  | "onValueChange"
  | "label"
  | "disabled"
>) {
  return (
    <Checkbox
      checked={checked}
      indeterminate={indeterminate}
      disabled={disabled}
      aria-label={label ?? "Select row"}
      onCheckedChange={(next, details) => {
        onCheckedChange?.(next, details);
        onValueChange?.(next);
      }}
      className={cn(
        "relative before:absolute before:-inset-3 before:content-['']",
      )}
    />
  );
}

export function TableCheckCell({
  checked,
  indeterminate,
  onCheckedChange,
  onValueChange,
  label,
  disabled,
  ref,
  className,
  ...props
}: TableCheckProps) {
  return (
    <TableCell
      ref={ref}
      {...props}
      className={cn("w-10 leading-none", className)}
    >
      <SelectionCheckbox
        {...{
          checked,
          indeterminate,
          onCheckedChange,
          onValueChange,
          label,
          disabled,
        }}
      />
    </TableCell>
  );
}
export function TableCheckHead({
  checked,
  indeterminate,
  onCheckedChange,
  onValueChange,
  label,
  disabled,
  ref,
  className,
  ...props
}: TableCheckHeadProps) {
  return (
    <TableHead
      ref={ref}
      {...props}
      className={cn("w-10 leading-none", className)}
    >
      <SelectionCheckbox
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        label={label ?? "Select all rows"}
        onCheckedChange={onCheckedChange}
        onValueChange={onValueChange}
      />
    </TableHead>
  );
}

TableRoot.displayName = "Table";
TableHeader.displayName = "Table.Header";
TableHead.displayName = "Table.Head";
TableRow.displayName = "Table.Row";
TableBody.displayName = "Table.Body";
TableCell.displayName = "Table.Cell";
TableCheckCell.displayName = "Table.CheckCell";
TableCheckHead.displayName = "Table.CheckHead";
TableFooter.displayName = "Table.Footer";
TableResizeHandle.displayName = "Table.ResizeHandle";

export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Head: TableHead,
  Row: TableRow,
  Body: TableBody,
  Cell: TableCell,
  CheckCell: TableCheckCell,
  CheckHead: TableCheckHead,
  Footer: TableFooter,
  ResizeHandle: TableResizeHandle,
});
