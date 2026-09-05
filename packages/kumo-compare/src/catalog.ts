export const catalog = [
  {
    id: "display",
    title: "Display & actions",
    components: "Button, Badge, Banner, Text, Grid, Meter, Empty",
    description:
      "Compare everyday actions, loading and disabled states, status indicators, and content surfaces.",
    note: "Loading indicators may animate independently.",
  },
  {
    id: "forms",
    title: "Form controls",
    components: "Input, InputGroup, Checkbox, Switch, Radio",
    description:
      "Edit inputs and exercise error states, render composition, and keyboard-accessible selection.",
    note: "Switch retains semantic theme colors rather than the React implementation’s hard-coded palette.",
  },
  {
    id: "selection",
    title: "Select & search",
    components: "Select, Autocomplete, Combobox",
    description:
      "Compare accessible labels, searchable collections, popup placement, and rapid keyboard selection.",
    note: "Try opening Environment, then Home or End followed immediately by Enter.",
  },
  {
    id: "navigation",
    title: "Navigation",
    components: "Tabs, Toolbar, MenuBar, Collapsible",
    description:
      "Switch tabs, move toolbar focus with arrow keys, and open disclosure content.",
    note: "Disabled toolbar items remain focusable in both implementations.",
  },
  {
    id: "overlays",
    title: "Dialogs & overlays",
    components: "Dialog, Popover, DropdownMenu, Tooltip",
    description:
      "Open matching overlays and compare focus, dismissal, and portal positioning.",
    note: "The audit found missing general Tooltip role/description semantics in both implementations.",
  },
  {
    id: "table",
    title: "Table & pagination",
    components: "Table, Pagination",
    description:
      "Browse a small resource table with caller-controlled pagination.",
    note: "Empty-total and invalid-input corrections in Octane are intentional adaptations.",
  },
  {
    id: "delete",
    title: "Delete resource",
    components: "DeleteResource",
    description:
      "Open the confirmation dialog and type edge-api to enable deletion.",
    note: "This is local demo state only. No resource or network operation is performed.",
  },
  {
    id: "command",
    title: "Command palette",
    components: "CommandPalette",
    description:
      "Search, navigate, and activate command results with keyboard or pointer.",
    note: "Octane skips disabled results. The pinned React oracle can activate one with modifier-Enter.",
  },
  {
    id: "flow",
    title: "Flow diagrams",
    components: "Flow.Node, Flow.Parallel, Flow.List",
    description:
      "Compare measured node layout and connectors, then toggle orientation.",
    note: "Wide diagrams pan inside their canvas. React development builds warn about nested list items in the pinned parallel-node example. Charts remain deferred.",
  },
  {
    id: "date",
    title: "Date picker",
    components: "DatePicker",
    description:
      "Select a day in a fixed September 2024 calendar with a disabled date.",
    note: "Octane uses native day-picker v10 with documented compatibility mappings.",
  },
  {
    id: "legacy-date",
    title: "Legacy date range",
    components: "DateRangePicker",
    description: "Explore the deprecated two-month range picker.",
    note: "Uses the current month. Both versions need horizontal scrolling on narrow screens.",
  },
  {
    id: "feedback",
    title: "Toast & clipboard",
    components: "Toasty, ClipboardText",
    description:
      "Copy sample text and trigger a success notification in each isolated preview.",
    note: "Clipboard access requires a secure context such as localhost and browser permission.",
  },
  {
    id: "code",
    title: "Code & highlighting",
    components: "Code, CodeBlock, CodeHighlighted",
    description:
      "Compare escaped code, asynchronous syntax highlighting, and copying.",
    note: "Highlighting loads asynchronously. The native code entry remains isolated from ordinary component imports.",
  },
  {
    id: "shell",
    title: "Sidebar & contents",
    components: "Sidebar, TableOfContents",
    description: "Try responsive navigation and a small table of contents.",
    note: "The native Sidebar uses a plain scrolling viewport instead of a custom ScrollArea.",
  },
] as const;
