import { UiCommandItem, useCommandState } from '@repo/ui';
import { commandIcons } from '/@/utils/command-icons';
import { Fragment } from 'react';
import { useCommandStore } from '/@/stores/command.store';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import UiImage from '../ui/UiImage';

const iconPrefix = 'icon:';

function CommandIcon({ id, icon, alt }: { icon: string; alt: string; id: string }) {
  if (icon.startsWith(iconPrefix)) {
    const Icon = commandIcons[icon.slice(iconPrefix.length)] ?? commandIcons['Command'];
    return (
      <span className="group-aria-selected:bg-secondary-hover inline-flex justify-center items-center bg-secondary rounded-sm border border-border/40 h-full w-full">
        <Icon className="h-4 w-4 group-aria-selected:text-foreground text-muted-foreground" />
      </span>
    );
  }

  return (
    <UiImage
      src={`${CUSTOM_SCHEME.extIcon}://${id}/${icon}`}
      alt={alt}
    />
  );
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
      {extensions.map(({ id, manifest }) => {
        const extensionIcon = <CommandIcon alt={`${manifest.title} icon`} id={id} icon={manifest.icon} />;

        return (
          <Fragment key={id + manifest.name}>
            {!extName &&
              <CommandItem
                icon={extensionIcon}
                title={manifest.title}
                value={manifest.title}
                subtitle={manifest.description}
                onSelect={() => setStoreState('paths', [{ id: manifest.name, label: manifest.title }])}
              />
            }
            {(extName?.id == manifest.name || searchStr) && manifest.commands.map((command) =>
              <CommandItem
                key={manifest.name + command.name}
                title={command.title}
                value={manifest.name + ' ' + command.title}
                subtitle={command.subtitle}
                onSelect={() => {
                  setStoreState('paths', [
                    { id: manifest.name, label: manifest.title },
                    { id: command.name, label: command.title }
                  ]);
                }}
                icon={command.icon ? <CommandIcon id={id} alt={command.name} icon={command.icon} /> : extensionIcon}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

export default CommandList;
