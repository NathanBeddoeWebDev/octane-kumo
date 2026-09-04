/** @jsxImportSource octane */
import { IconContext } from "@octanejs/phosphor-icons";
import { useRef, type OctaneNode } from "octane";
import { Tooltip } from "../tooltip/tooltip";
import { cn } from "../../utils/cn";
import { useMenuNavigation } from "./use-menu-navigation";

export const KUMO_MENUBAR_VARIANTS = {} as const;

export const KUMO_MENUBAR_DEFAULT_VARIANTS = {} as const;

export interface KumoMenuBarVariantsProps {}

export function menuBarVariants(_props: KumoMenuBarVariantsProps = {}) {
  return cn(
    "flex rounded-lg border border-kumo-recessed bg-kumo-recessed pl-px shadow-xs transition-colors",
  );
}

export type MenuOptionProps = {
  icon: OctaneNode;
  id?: number | string;
  isActive?: number | boolean | string;
  onClick: () => void;
  tooltip: string;
};

function MenuOption({ icon, id, isActive, onClick, tooltip }: MenuOptionProps) {
  const button = (
    <button
      data-kumo-component="MenuBar"
      data-kumo-part="option"
      aria-label={tooltip}
      className={cn(
        "relative -ml-px flex h-full w-11 cursor-pointer items-center justify-center rounded-md border-none bg-kumo-recessed transition-colors first:rounded-l-lg last:rounded-r-lg focus:z-3 focus:ring-kumo-focus/50 focus:outline-none focus-visible:z-3 focus-visible:ring-2 focus-visible:ring-kumo-brand",
        isActive === id && "z-2 bg-kumo-base shadow-xs transition-colors",
      )}
      onClick={onClick}
    >
      <IconContext.Provider value={{ size: 18 }}>{icon}</IconContext.Provider>
    </button>
  );

  return <Tooltip content={tooltip} render={button} />;
}

export type MenuBarProps = {
  className?: string;
  isActive: number | boolean | string | undefined;
  optionIds?: boolean;
  options: MenuOptionProps[];
};

/** @deprecated Use `Tabs` with `variant="segmented"` instead. */
export function MenuBar({
  className,
  isActive,
  options,
  optionIds = false,
}: MenuBarProps) {
  const menuRef = useRef<HTMLElement | null>(null);
  useMenuNavigation({ menuRef, direction: "horizontal" });

  return (
    <nav
      className={cn(
        "isolate flex rounded-lg bg-kumo-recessed pl-px shadow-xs ring ring-kumo-line transition-colors",
        className,
      )}
      ref={menuRef}
    >
      {options.map((option, index) => (
        <MenuOption
          key={index}
          {...option}
          isActive={isActive}
          id={optionIds ? option.id : index}
        />
      ))}
    </nav>
  );
}

MenuBar.displayName = "MenuBar";
