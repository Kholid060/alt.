import { AppSettings } from '#packages/common/interface/app.interface';
import {
  UiButton,
  UiLabel,
  UiPopover,
  UiPopoverContent,
  UiPopoverTrigger,
  UiSelect,
  UiSwitch,
  useToast,
} from '@altdot/ui';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '#packages/common/utils/helper';
import {
  AppWindowIcon,
  HardDriveDownloadIcon,
  HardDriveUploadIcon,
  Loader2Icon,
  SettingsIcon,
  SquarePowerIcon,
} from 'lucide-react';
import { useDocumentTitle } from '/@/hooks/useDocumentTitle';
import themeDarkImg from '/@/assets/images/theme-dark.png';
import themeLightImg from '/@/assets/images/theme-light.png';
import themeSystemImg from '/@/assets/images/theme-system.png';

type SettingsSection<T extends object = object> = React.FC<
  {
    settings: AppSettings;
    onUpdateSetting(settings: Partial<AppSettings>): void;
  } & T
>;

const themes = [
  { img: themeLightImg, name: 'Light', value: 'light' },
  { img: themeDarkImg, name: 'Dark', value: 'dark' },
  { img: themeSystemImg, name: 'System', value: 'system' },
] as const;

const SettingGeneral: SettingsSection = ({ settings, onUpdateSetting }) => {
  return (
    <section
      className="settings-section rounded-lg border"
      aria-label="general"
    >
      <div className="px-4 pt-4">
        <h3 className="font-semibold">General</h3>
      </div>
      <div className="p-4">
        <ul className="space-y-4 divide-y divide-border/70">
          <li>
            <p>Theme</p>
            <div className="flex items-center gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  className={clsx(
                    'group text-sm text-muted-foreground hover:text-foreground',
                    theme.value === settings.theme && 'text-foreground',
                  )}
                  onClick={() => {
                    onUpdateSetting({ theme: theme.value });
                  }}
                >
                  <img
                    src={theme.img}
                    alt={`Theme ${theme.name}`}
                    className={clsx(
                      'h-20 w-36 rounded-md border-[3px] object-cover object-top transition group-hover:border-primary',
                      theme.value === settings.theme && 'border-primary',
                    )}
                  />
                  <p>{theme.name}</p>
                </button>
              ))}
            </div>
          </li>
          <li className="flex items-center gap-4 pt-4">
            <SquarePowerIcon />
            <div className="flex-1">
              <p className="leading-tight">Startup</p>
              <p className="text-sm leading-tight text-muted-foreground">
                Launch alt. app on startup
              </p>
            </div>
            <UiSwitch
              size="sm"
              checked={settings.startup}
              onCheckedChange={(value) => onUpdateSetting({ startup: value })}
            />
          </li>
          <li className="flex items-center gap-4 pt-4">
            <AppWindowIcon />
            <div className="flex-1">
              <p className="leading-tight">Clear command window state</p>
              <p className="text-sm leading-tight text-muted-foreground">
                Clear command window state once idle
              </p>
            </div>
            <UiSelect
              inputSize="sm"
              className="w-40 text-sm"
              value={(settings.clearStateAfter ?? 10).toString()}
              onValueChange={(value) =>
                onUpdateSetting({ clearStateAfter: +value })
              }
            >
              <UiSelect.Option value="1">After 1 minutes</UiSelect.Option>
              <UiSelect.Option value="2">After 2 minutes</UiSelect.Option>
              <UiSelect.Option value="5">After 5 minutes</UiSelect.Option>
              <UiSelect.Option value="10">After 10 minutes</UiSelect.Option>
              <UiSelect.Option value="15">After 15 minutes</UiSelect.Option>
              <UiSelect.Option value="30">After 30 minutes</UiSelect.Option>
            </UiSelect>
          </li>
        </ul>
      </div>
    </section>
  );
};

const SettingBackupData: SettingsSection<{ onRestore?(): void }> = ({
  settings,
  onRestore,
  onUpdateSetting,
}) => {
  const { toast } = useToast();

  const [loading, setLoading] = useState<'restore' | 'backup' | null>(null);

  async function backupData() {
    try {
      setLoading('backup');

      const result = await preloadAPI.main.ipc.invoke('app:backup-data');
      if (isIPCEventError(result)) {
        toast({
          title: 'Error!',
          variant: 'destructive',
          description: result.message,
        });
        return;
      }
      if (!result) return;

      toast({
        title: 'Data is successfully backed up',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong!',
      });
    } finally {
      setLoading(null);
    }
  }
  async function restoreData() {
    try {
      setLoading('restore');

      const result = await preloadAPI.main.ipc.invoke(
        'app:restore-data',
        settings.upsertRestoreDuplicate,
      );
      if (isIPCEventError(result)) {
        toast({
          title: 'Error!',
          variant: 'destructive',
          description: result.message,
        });
        return;
      }
      if (!result) return;

      onRestore?.();

      toast({
        title: 'Data is successfully restored',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong!',
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <section
      className="settings-section rounded-lg border"
      aria-label="backup-data"
    >
      <div className="px-4 pt-4">
        <h3 className="font-semibold">Backup Data</h3>
      </div>
      <div className="p-4">
        <ul className="space-y-4 divide-y divide-border/70">
          <li className="flex items-center gap-4">
            <HardDriveDownloadIcon />
            <div className="flex-1">
              <p className="leading-tight">Backup</p>
              <p className="text-sm leading-tight text-muted-foreground">
                Backup your settings, extensions data, and workflows
              </p>
            </div>
            <UiButton
              size="sm"
              variant="secondary"
              className="relative"
              disabled={!!loading}
              onClick={backupData}
            >
              Backup data
              {loading === 'backup' && (
                <div className="absolute flex h-full w-full cursor-default items-center justify-center rounded-md bg-inherit bg-secondary">
                  <Loader2Icon className="animate-spin" />
                </div>
              )}
            </UiButton>
          </li>
          <li className="flex items-center pt-4">
            <HardDriveUploadIcon />
            <div className="ml-4 flex-1">
              <p className="leading-tight">Restore</p>
              <p className="text-sm leading-tight text-muted-foreground">
                Restore your backed-up data
              </p>
            </div>
            <UiPopover>
              <UiPopoverTrigger asChild>
                <UiButton size="icon-sm" variant="secondary">
                  <SettingsIcon className="size-5" />
                </UiButton>
              </UiPopoverTrigger>
              <UiPopoverContent className="w-64 text-sm">
                <p className="font-semibold">Restore settings</p>
                <div className="mt-4 flex items-center">
                  <UiLabel htmlFor="upsert-restore" className="flex-1">
                    Update if duplicate
                  </UiLabel>
                  <UiSwitch
                    id="upsert-restore"
                    size="sm"
                    checked={settings.upsertRestoreDuplicate}
                    onCheckedChange={(value) =>
                      onUpdateSetting({ upsertRestoreDuplicate: value })
                    }
                  />
                </div>
              </UiPopoverContent>
            </UiPopover>
            <UiButton
              size="sm"
              variant="secondary"
              className="relative ml-2"
              disabled={!!loading}
              onClick={restoreData}
            >
              Restore data
              {loading === 'restore' && (
                <div className="absolute flex h-full w-full cursor-default items-center justify-center rounded-md bg-inherit bg-secondary">
                  <Loader2Icon className="animate-spin" />
                </div>
              )}
            </UiButton>
          </li>
        </ul>
      </div>
    </section>
  );
};

const sections: { name: string; id: string }[] = [
  { name: 'General', id: 'general' },
  { name: 'Backup data', id: 'backup-data' },
];
function SettingsSidebar() {
  const buttonsRef = useRef<Record<string, HTMLButtonElement>>({});

  const [activeSetting, setActiveSetting] = useState('general');

  function navigateToSection(name: string) {
    const sectionEl = document.querySelector(`[aria-label="${name}"]`);
    if (!sectionEl) return;

    sectionEl.scrollIntoView({
      behavior: 'smooth',
    });
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let id: string | null = null;
        entries.forEach((entry) => {
          if (!entry.isIntersecting || id) return;
          id = entry.target.getAttribute('aria-label') ?? '';
        });

        if (id) setActiveSetting(id);
      },
      {
        threshold: 0.25,
      },
    );

    const sections = document.querySelectorAll('.settings-section');
    sections.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <aside className="flex-shrink-0 lg:w-64">
      <ul className="flex items-center gap-2 space-y-1 text-muted-foreground lg:block">
        {sections.map((section) => (
          <li key={section.id} className="relative">
            <span
              className="absolute left-0 top-1/2 h-4/6 w-2 -translate-y-1/2 rounded-full bg-primary"
              style={{ width: activeSetting === section.id ? 4 : 0 }}
            ></span>
            <button
              className={clsx(
                'h-10 w-full rounded-md px-3 text-left hover:bg-secondary/70',
                activeSetting === section.id &&
                  'bg-secondary/70 text-foreground',
              )}
              ref={(ref) => ref && (buttonsRef.current[section.id] = ref)}
              onClick={() => navigateToSection(section.id)}
            >
              {section.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function RouteSettings() {
  useDocumentTitle('Settings');

  const { toast } = useToast();

  const [settings, setSettings] = useState<AppSettings | null>(null);

  const fetchSettings = useCallback(() => {
    preloadAPI.main.ipc
      .invokeWithError('app:get-settings')
      .then((appSettings) => {
        setSettings(appSettings as unknown as AppSettings);
      })
      .catch(console.error);
  }, []);

  async function updateSettings(newSettings: Partial<AppSettings>) {
    if (!settings) return;

    try {
      const updatedSettings = {
        ...settings,
        ...newSettings,
      };

      const result = await preloadAPI.main.ipc.invoke(
        'app:set-settings',
        updatedSettings,
      );
      if (isIPCEventError(result)) {
        toast({
          title: 'Error!',
          variant: 'destructive',
          description: result.message,
        });
        return;
      }

      setSettings(updatedSettings);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong!',
      });
    }
  }

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (!settings) return null;

  return (
    <div className="container p-8">
      <h2 className="-mt-0.5 cursor-default text-2xl font-semibold leading-tight">
        Settings
      </h2>
      <main className="mt-8 cursor-default gap-6 lg:flex">
        <SettingsSidebar />
        <div className="mt-4 flex-1 space-y-8 lg:mt-0 lg:max-w-2xl">
          <SettingGeneral
            settings={settings}
            onUpdateSetting={updateSettings}
          />
          <SettingBackupData
            settings={settings}
            onRestore={() => fetchSettings()}
            onUpdateSetting={updateSettings}
          />
        </div>
      </main>
    </div>
  );
}

export { RouteSettings as Component };
