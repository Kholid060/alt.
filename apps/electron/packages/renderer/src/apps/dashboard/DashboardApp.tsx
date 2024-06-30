import { Outlet, useNavigate } from 'react-router-dom';
import DashboardSidebar from '/@/components/dashboard/DashboardSidebar';
import { useEffect, useRef } from 'react';
import DashboardAppEventListener from '/@/components/dashboard/DashboardAppEventListener';
import preloadAPI from '/@/utils/preloadAPI';

function AppEventListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const offAppUpdateRoute = preloadAPI.main.ipc.on(
      'app:update-route',
      (_, path, routeData) => {
        navigate(path, { state: routeData });
      },
    );

    return () => {
      offAppUpdateRoute();
    };
  }, [navigate]);

  return null;
}

function DashboardApp() {
  const appContainerRef = useRef<HTMLDivElement>(null);

  function onVisibilityChange(hide: boolean) {
    if (!appContainerRef.current) return;

    appContainerRef.current.classList.value = hide ? '' : 'pl-20 lg:pl-64';
  }

  return (
    <>
      <DashboardSidebar onVisibilityChange={onVisibilityChange} />
      <div ref={appContainerRef}>
        <Outlet />
      </div>
      <AppEventListener />
      <DashboardAppEventListener />
    </>
  );
}

export default DashboardApp;
