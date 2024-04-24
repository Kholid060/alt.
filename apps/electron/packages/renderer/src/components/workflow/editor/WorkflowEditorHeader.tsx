import { UiButton } from '@repo/ui';
import {
  ChevronLeftIcon,
  FolderOpenIcon,
  RedoIcon,
  SettingsIcon,
  UndoIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function WorkflowEditorHeader() {
  return (
    <header className="h-20 border-b flex items-center px-4">
      <UiButton
        variant="outline"
        size="icon-sm"
        className="flex-shrink-0"
        asChild
      >
        <Link to="/workflows">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
      </UiButton>
      <hr className="h-2/6 bg-border/50 w-px mx-4" />
      <div className="inline-flex items-center justify-center h-10 w-10 bg-card rounded-md">
        <FolderOpenIcon />
      </div>
      <div className="ml-2 flex-grow mr-4">
        <h2 className="font-semibold line-clamp-1">Workflow Name</h2>
        <p className="text-muted-foreground text-xs leading-tight line-clamp-1">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Voluptates
          optio, et corporis adipisci
        </p>
      </div>
      <UiButton variant="ghost" size="icon" disabled>
        <UndoIcon className="h-5 w-5" />
      </UiButton>
      <UiButton variant="ghost" size="icon" className="ml-1">
        <RedoIcon className="h-5 w-5" />
      </UiButton>
      <p className="text-xs text-muted-foreground ml-2">Saved 3 mins ago</p>
      <hr className="h-2/6 bg-border/50 w-px mx-4" />
      <UiButton size="icon" variant="secondary">
        <SettingsIcon className="h-5 w-5" />
      </UiButton>
      <UiButton className="ml-2">Publish</UiButton>
    </header>
  );
}

export default WorkflowEditorHeader;
