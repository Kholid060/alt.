import { UiButton, UiTooltip } from '@repo/ui';
import { MaximizeIcon, MinusIcon, PlusIcon } from 'lucide-react';
import { useReactFlow, useStore } from 'reactflow';
import { useShallow } from 'zustand/react/shallow';

function WorkflowEditorControls() {
  const { minZoomReached, maxZoomReached } = useStore(
    useShallow((state) => ({
      minZoomReached: state.transform[2] <= state.minZoom,
      maxZoomReached: state.transform[2] >= state.maxZoom,
    })),
  );
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center border border-border/60 bg-secondary rounded-md">
        <UiTooltip label="Zoom out" sideOffset={5}>
          <UiButton
            variant="ghost"
            size="icon"
            disabled={minZoomReached}
            onClick={() => zoomOut({ duration: 200 })}
          >
            <MinusIcon className="h-5 w-5" />
          </UiButton>
        </UiTooltip>
        <hr className="h-5 bg-border/60 w-px" />
        <UiTooltip label="Zoom in" sideOffset={5}>
          <UiButton
            variant="ghost"
            size="icon"
            disabled={maxZoomReached}
            onClick={() => zoomIn({ duration: 200 })}
          >
            <PlusIcon className="h-5 w-5" />
          </UiButton>
        </UiTooltip>
      </div>
      <UiTooltip label="Fit view" sideOffset={5}>
        <UiButton
          variant="secondary"
          className="border border-border/60"
          size="icon"
          onClick={() => fitView({ duration: 500 })}
        >
          <MaximizeIcon className="h-5 w-5" />
        </UiButton>
      </UiTooltip>
    </div>
  );
}

export default WorkflowEditorControls;
