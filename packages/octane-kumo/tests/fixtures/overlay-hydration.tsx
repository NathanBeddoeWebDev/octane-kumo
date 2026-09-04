/** @jsxImportSource octane */
import { useState } from "octane";
import { Button } from "../../src/components/button/button";
import { Dialog } from "../../src/components/dialog/dialog";
import { DropdownMenu } from "../../src/components/dropdown/dropdown";
import { Popover } from "../../src/components/popover/popover";

export function DialogHydrationFixture() {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button />}>Hydrated dialog</Dialog.Trigger>
      <Dialog>
        <Dialog.Title>Hydrated dialog title</Dialog.Title>
        <Dialog.Description>Dialog content after hydration.</Dialog.Description>
        <Dialog.Close>Close dialog</Dialog.Close>
      </Dialog>
    </Dialog.Root>
  );
}

export function PopoverHydrationFixture() {
  return (
    <Popover>
      <Popover.Trigger render={<Button />}>Hydrated popover</Popover.Trigger>
      <Popover.Content>
        <Popover.Title>Hydrated popover title</Popover.Title>
        <Popover.Close>Close popover</Popover.Close>
      </Popover.Content>
    </Popover>
  );
}

export function DropdownHydrationFixture() {
  const [actions, setActions] = useState(0);

  return (
    <div>
      <DropdownMenu>
        <DropdownMenu.Trigger render={<Button />}>
          Hydrated menu
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item onClick={() => setActions((value) => value + 1)}>
            Run action
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
      <output data-testid="overlay-actions">{actions}</output>
    </div>
  );
}
