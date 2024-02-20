import { UiCommandItem, useCommandState } from '@repo/ui';
import { commandIcons } from '/@/utils/command-icons';
import { ExtensionManifest } from '@repo/command-api';
import { Fragment } from 'react';
import { useCommandStore } from '/@/stores/command.store';

function CommandIcon({ icon, alt }: { icon: string; alt: string; }) {
  if (icon.startsWith('http')) {
    return <img src={icon} alt={alt} />;
  } else if (icon.startsWith('icon:')) {
    const Icon = commandIcons[icon] ?? commandIcons['Command'];
    return (
      <span className="group-aria-selected:bg-secondary-hover inline-flex justify-center items-center bg-secondary rounded-sm border border-border/40 h-full w-full">
        <Icon className="h-4 w-4 group-aria-selected:text-foreground text-muted-foreground" />
      </span>
    );
  }

  // resolve extension icon

  return null;
}

function CommandItem({
  icon,
  title,
  value,
  onSelect,
  subtitle,
}: {
  title: string;
  value?: string;
  subtitle?: string;
  onSelect?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <UiCommandItem
      value={value}
      onSelect={onSelect}
      className="group aria-selected:bg-secondary min-h-12"
    >
      <span className="h-8 w-8 mr-2">
        {icon}
      </span>
      <div>
        <p className="leading-tight">{title}</p>
        <p className="text-muted-foreground leading-tight">{subtitle}</p>
      </div>
    </UiCommandItem>
  );
}

function CommandList() {
  const searchStr = useCommandState((state) => state.search);
  const [extensions, setStoreState] = useCommandStore((state) => [state.extensions, state.setState]);
  const [extName] = useCommandStore((state) => state.paths);

  return (
    <>
      {extensions.map((extension) => {
        const extensionIcon = <CommandIcon alt={`${extension.title} icon`} icon={extension.icon} />;

        return (
          <Fragment key={extension.name}>
            {!extName &&
              <CommandItem
                icon={extensionIcon}
                title={extension.title}
                value={extension.title}
                subtitle={extension.description}
                onSelect={() => setStoreState('paths', [{ id: extension.name, label: extension.title }])}
              />
            }
            {(extName?.id == extension.name || searchStr) && extension.commands.map((command) =>
              <CommandItem
                key={extension.name + command.name}
                title={command.title}
                value={extension.name + ' ' + command.title}
                subtitle={command.subtitle}
                onSelect={() => {
                  setStoreState('paths', [
                    { id: extension.name, label: extension.title },
                    { id: command.name, label: command.title }
                  ]);
                }}
                icon={command.icon ? <CommandIcon alt={command.name} icon={command.icon} /> : extensionIcon}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

export default CommandList;
