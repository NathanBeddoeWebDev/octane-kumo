/** @jsxImportSource octane */
import { Sidebar } from "../../src/components/sidebar/sidebar";

export function SidebarHydrationFixture() {
  return (
    <Sidebar.Provider>
      <Sidebar>
        <Sidebar.Header>Account</Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Navigate</Sidebar.GroupLabel>
            <Sidebar.Menu>
              <Sidebar.MenuButton>Home</Sidebar.MenuButton>
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>Footer</Sidebar.Footer>
      </Sidebar>
    </Sidebar.Provider>
  );
}
