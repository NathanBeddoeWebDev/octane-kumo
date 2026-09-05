import type { OctaneNode } from "octane";
import type { InputProps } from "@octanejs/aria/components";
import type { PortalContainer } from "../../utils/portal-provider";

/** Inclusive match offsets, compatible with Fuse.js indices. */
export type HighlightRange = [number, number];
export interface CommandPaletteRootProps<TGroup, TItem = TGroup> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackdropClick?: (event: MouseEvent) => void;
  children: OctaneNode;
  items: TGroup[];
  value?: string;
  onValueChange?: (value: string) => void;
  onItemHighlighted?: (
    item: TGroup | undefined,
    details: { reason: string; event: Event; index: number },
  ) => void;
  itemToStringValue?: (item: TGroup) => string;
  filter?: (item: TGroup, query: string) => boolean;
  /** Modifier-Enter selection; ordinary activation uses the item's onClick. */
  onSelect?: (item: TItem, options: { newTab: boolean }) => void;
  getSelectableItems?: (items: TGroup[]) => TItem[];
  container?: PortalContainer;
}
export type CommandPalettePanelProps<TGroup, TItem = TGroup> = Omit<
  CommandPaletteRootProps<TGroup, TItem>,
  "open" | "onOpenChange" | "onBackdropClick" | "container"
> & { open?: boolean; className?: string };
export interface CommandPaletteItemProps<T = unknown> {
  value: T;
  disabled?: boolean;
  children: OctaneNode;
  onClick?: (event: MouseEvent) => void;
}
export interface CommandPaletteFooterProps {
  children?: OctaneNode;
}
export interface CommandPaletteListProps {
  children: OctaneNode;
}
export interface CommandPaletteGroupProps {
  children: OctaneNode;
}
export interface CommandPaletteGroupLabelProps {
  children: OctaneNode;
}
export interface CommandPaletteEmptyProps {
  children?: OctaneNode;
}
export interface CommandPaletteLoadingProps {
  children?: OctaneNode;
}
export interface CommandPaletteResultItemProps<T = unknown> {
  title: string;
  breadcrumbs?: string[];
  titleHighlights?: HighlightRange[];
  breadcrumbHighlights?: HighlightRange[][];
  description?: string;
  icon?: OctaneNode;
  value: T;
  onClick: (event: MouseEvent) => void;
  showArrow?: boolean;
  external?: boolean;
  nonInteractive?: boolean;
}
export type CommandPaletteInputProps = Omit<
  InputProps,
  "children" | "defaultValue" | "defaultChecked" | "color" | "onKeyDown"
> & {
  onKeyDown?: (event: KeyboardEvent) => void;
  leading?: OctaneNode;
  trailing?: OctaneNode;
};
