import { useNativeApp } from '@/hooks/useNativeApp';
import { ApiWorkflowStoreListItem } from '@alt-dot/shared';
import {
  UiCard,
  UiCardHeader,
  UiButton,
  UiCardContent,
  UiCardFooter,
  UiAvatar,
  UiAvatarImage,
  UiAvatarFallback,
} from '@alt-dot/ui';
import { ShareIcon, UserRoundIcon, DownloadIcon } from 'lucide-react';
import WorkflowIcon from './WorkflowIcon';
import { Link } from '@tanstack/react-router';

const numberFormatter = new Intl.NumberFormat();

function WorkflowStoreCard({
  workflow,
  disabledOwnerLink,
}: {
  disabledOwnerLink?: boolean;
  workflow: ApiWorkflowStoreListItem;
}) {
  const { installWorkflow } = useNativeApp();

  return (
    <UiCard className="flex flex-col">
      <UiCardHeader className="flex-1 flex-row items-center justify-between space-y-0 p-4">
        <WorkflowIcon icon={workflow.icon} />
        <button
          className="md:hidden"
          onClick={() =>
            navigator.share({ url: `/store/workflows/${workflow.id}` })
          }
        >
          <ShareIcon className="size-5" />
        </button>
        <UiButton
          variant="secondary"
          className="hidden md:inline-block"
          onClick={() => installWorkflow(workflow.id)}
        >
          Install
        </UiButton>
      </UiCardHeader>
      <UiCardContent className="p-4 pt-0">
        <Link
          to="/store/workflows/$workflowId"
          params={{ workflowId: workflow.id }}
        >
          <p className="line-clamp-1 font-semibold">{workflow.name}</p>
          <p className="line-clamp-2 text-sm leading-tight text-muted-foreground">
            {workflow.description}
          </p>
        </Link>
      </UiCardContent>
      <UiCardFooter className="items-end p-4 pt-0 text-sm text-muted-foreground">
        <div className="flex-grow">
          <Link
            disabled={disabledOwnerLink}
            to="/u/$username/workflows"
            params={{ username: workflow.owner.username! }}
            className="line-clamp-1 transition-colors hover:text-foreground"
          >
            <UiAvatar className="inline-block size-4 align-middle">
              {workflow.owner.avatarUrl && (
                <UiAvatarImage loading="lazy" src={workflow.owner.avatarUrl} />
              )}
              <UiAvatarFallback>
                <UserRoundIcon className="size-4" />
              </UiAvatarFallback>
            </UiAvatar>
            <span className="ml-1.5 align-middle">{workflow.owner.name}</span>
          </Link>
        </div>
        <span title="Downloads count" className="ml-2 flex-shrink-0 lg:ml-3">
          <DownloadIcon className="inline-block size-5 align-middle" />
          <span className="ml-1 align-middle">
            {numberFormatter.format(workflow.downloadCount)}
          </span>
        </span>
      </UiCardFooter>
    </UiCard>
  );
}

export default WorkflowStoreCard;
