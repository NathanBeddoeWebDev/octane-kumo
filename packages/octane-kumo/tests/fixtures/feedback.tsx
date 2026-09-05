/** @jsxImportSource octane */
import { useState, type OctaneNode } from "octane";
import {
  Button,
  ClipboardText,
  Toasty,
  useKumoToastManager,
} from "octane-kumo";
import { cn } from "../../src/utils/cn";

function FeedbackControls() {
  const manager = useKumoToastManager();
  const [undone, setUndone] = useState(false);
  return (
    <div>
      <div className={cn("feedback-buttons")}>
        {(["default", "success", "error", "warning", "info"] as const).map(
          (variant) => (
            <Button
              key={variant}
              onClick={() =>
                manager.add({
                  id: variant,
                  title: `${variant} notification`,
                  description: "Your account changes are ready to review.",
                  variant,
                  timeout: 0,
                  actions: [
                    {
                      children: "Undo",
                      onClick: () => {
                        setUndone(true);
                        manager.close(variant);
                      },
                    },
                  ],
                })
              }
            >
              Show {variant}
            </Button>
          ),
        )}
        <Button
          onClick={() =>
            manager.add({
              title: "Temporary notification",
              description: "Dismisses automatically",
              timeout: 1200,
            })
          }
        >
          Show timed
        </Button>
        <Button onClick={() => manager.close()}>Clear toasts</Button>
      </div>
      <output>{undone ? "Change undone" : "No action taken"}</output>
      <div className={cn("clipboard-examples")}>
        <ClipboardText
          size="sm"
          text="Small field"
          labels={{ copyAction: "Copy small" }}
        />
        <ClipboardText
          size="base"
          text="Displayed resource name"
          textToCopy="resource-id-123"
          tooltip={{
            text: "Copy resource ID",
            copiedText: "Resource ID copied",
            side: "top",
          }}
          labels={{ copyAction: "Copy resource ID" }}
        />
        <ClipboardText
          text="pnpm add octane-kumo"
          tooltip={{
            text: "Copy install command",
            copiedText: "Command copied",
            side: "bottom",
          }}
          labels={{ copyAction: "Copy install command" }}
        />
      </div>
    </div>
  );
}
export function FeedbackFixture({ children }: { children?: OctaneNode }) {
  return (
    <Toasty>
      <FeedbackControls />
      {children}
    </Toasty>
  );
}
