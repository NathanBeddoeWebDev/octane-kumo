/** @jsxImportSource octane */
import { useState } from "octane";
import { MenuBar } from "../../src/components/menubar/menubar";
import { Tabs } from "../../src/components/tabs/tabs";
import { Toolbar } from "../../src/components/toolbar/toolbar";

export function NavigationHydrationFixture() {
  const [activeTab, setActiveTab] = useState("overview");
  const [toolbarActions, setToolbarActions] = useState(0);
  const [activeMenu, setActiveMenu] = useState("list");

  return (
    <div>
      <Tabs
        onValueChange={setActiveTab}
        tabs={[
          { value: "overview", label: "Hydrated overview" },
          { value: "settings", label: "Hydrated settings" },
        ]}
        value={activeTab}
      />
      <output data-testid="hydrated-tab-value">{activeTab}</output>
      <Toolbar aria-label="Hydrated toolbar">
        <Toolbar.Button
          onClick={() => setToolbarActions((current) => current + 1)}
        >
          Run hydrated action
        </Toolbar.Button>
      </Toolbar>
      <output data-testid="hydrated-toolbar-actions">{toolbarActions}</output>
      <MenuBar
        isActive={activeMenu}
        optionIds
        options={[
          {
            id: "list",
            icon: <span aria-hidden="true">L</span>,
            tooltip: "Hydrated list view",
            onClick: () => setActiveMenu("list"),
          },
          {
            id: "grid",
            icon: <span aria-hidden="true">G</span>,
            tooltip: "Hydrated grid view",
            onClick: () => setActiveMenu("grid"),
          },
        ]}
      />
      <output data-testid="hydrated-menu-value">{activeMenu}</output>
    </div>
  );
}
