/** @jsxImportSource octane */
import { useState } from "octane";
import { Button, CommandPalette as C } from "octane-kumo";

const groups = [
  {
    label: "Compute",
    items: [
      { id: "workers", title: "Workers" },
      { id: "pages", title: "Pages" },
      { id: "disabled", title: "Unavailable" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "members", title: "Members" },
      { id: "billing", title: "Billing" },
    ],
  },
];
export function CommandPaletteFixture() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("No selection");
  const filtered = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()),
      ),
    }))
    .filter((group) => group.items.length);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open commands</Button>
      <output>{selected}</output>
      <C.Root
        open={open}
        onOpenChange={setOpen}
        items={filtered}
        value={query}
        onValueChange={setQuery}
        getSelectableItems={(items) => items.flatMap((group) => group.items)}
        onSelect={(item) => setSelected(`${item.title} in new tab`)}
      >
        <C.Input
          placeholder="Search resources…"
          trailing={
            <Button size="sm" onClick={() => setOpen(false)}>
              Esc
            </Button>
          }
        />
        <C.List>
          <C.Results<(typeof groups)[number]>>
            {(group) => (
              <C.Group items={group.items}>
                <C.GroupLabel>{group.label}</C.GroupLabel>
                <C.Items<(typeof group.items)[number]>>
                  {(item) => (
                    <C.ResultItem
                      value={item}
                      title={item.title}
                      breadcrumbs={[group.label]}
                      titleHighlights={
                        query ? [[0, query.length - 1]] : undefined
                      }
                      nonInteractive={item.id === "disabled"}
                      onClick={() => setSelected(item.title)}
                    />
                  )}
                </C.Items>
              </C.Group>
            )}
          </C.Results>
          <C.Empty />
        </C.List>
        <C.Footer>
          ↑ ↓ to navigate · Enter to select · Ctrl/⌘ Enter for a new tab
        </C.Footer>
      </C.Root>
    </>
  );
}
