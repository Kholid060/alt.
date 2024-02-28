import { UiCommandGroup, UiCommandItem, useCommandState } from '@repo/ui';
import { commandIcons } from '#common/utils/command-icons';
import { Fragment } from 'react';
import { CommandSelectedItem, useCommandStore } from '/@/stores/command.store';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import UiImage from '../ui/UiImage';

type CommandIconName = keyof typeof commandIcons;

interface CommonListProps {
  selectedExt: CommandSelectedItem;
}

const iconPrefix = 'icon:';

function CommandIcon({ icon }: { icon: string }) {
  const Icon = commandIcons[icon as CommandIconName] ?? icon;

  return (
    <span className="group-aria-selected:bg-secondary-hover  group-aria-selected:text-foreground text-muted-foreground inline-flex justify-center items-center bg-secondary rounded-sm border border-border/40 h-full w-full">
      {typeof Icon === 'string' ? Icon : <Icon className="h-4 w-4" />}
    </span>
  );
}

function CommandPrefix({
  id,
  icon,
  alt,
}: {
  icon: string;
  alt: string;
  id: string;
}) {
  if (icon.startsWith(iconPrefix)) {
    let iconName = icon.slice(iconPrefix.length) as CommandIconName;
    iconName = commandIcons[iconName] ? iconName : 'Command';

    return <CommandIcon icon={iconName} />;
  }

  return (
    <UiImage
      src={`${CUSTOM_SCHEME.extension}://${id}/icon/${icon}`}
      alt={alt}
    />
  );
}

export function CommandItem({
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
      {icon && (
        <span className="h-8 w-8 mr-2 inline-flex items-center justify-center">
          {icon}
        </span>
      )}
      <div>
        <p className="leading-tight">{title}</p>
        <p className="text-muted-foreground leading-tight">{subtitle}</p>
      </div>
    </UiCommandItem>
  );
}

function CommandExtensionList({ selectedExt }: CommonListProps) {
  const searchStr = useCommandState((state) => state.search);
  const [extensions, setStoreState] = useCommandStore((state) => [
    state.extensions,
    state.setState,
  ]);

  return (
    <UiCommandGroup heading="Extensions">
      {extensions.map(({ id, manifest }) => {
        const extensionIcon = (
          <CommandPrefix
            alt={`${manifest.title} icon`}
            id={id}
            icon={manifest.icon}
          />
        );

        return (
          <Fragment key={id + manifest.name}>
            {!selectedExt && (
              <CommandItem
                icon={extensionIcon}
                title={manifest.title}
                value={manifest.title}
                subtitle={manifest.description}
                onSelect={() =>
                  setStoreState('paths', [
                    { id, label: manifest.title, type: 'extension' },
                  ])
                }
              />
            )}
            {(selectedExt?.id === id || searchStr) &&
              manifest.commands.map((command) => (
                <CommandItem
                  key={manifest.name + command.name}
                  title={command.title}
                  value={manifest.name + ' ' + command.title}
                  subtitle={command.subtitle}
                  onSelect={() => {
                    setStoreState('paths', [
                      { id, label: manifest.title, type: 'extension' },
                      {
                        id: command.name,
                        label: command.title,
                        type: 'command',
                      },
                    ]);
                  }}
                  icon={
                    command.icon ? (
                      <CommandPrefix
                        id={id}
                        alt={command.name}
                        icon={command.icon}
                      />
                    ) : (
                      extensionIcon
                    )
                  }
                />
              ))}
          </Fragment>
        );
      })}
    </UiCommandGroup>
  );
}

function CommandKeywordsList({ selectedExt }: CommonListProps) {
  if (selectedExt) return null;

  return (
    <UiCommandGroup heading="Keywords">
      <CommandItem
        icon={<CommandIcon icon="?" />}
        title={'Do Math'}
        value={'Do Math'}
      />
    </UiCommandGroup>
  );
}

function CommandList() {
  const selectedExt = useCommandStore((state) => state.paths[0]);

  return (
    <>
      <CommandExtensionList selectedExt={selectedExt} />
      <CommandKeywordsList selectedExt={selectedExt} />
    </>
  );
}

export default CommandList;
