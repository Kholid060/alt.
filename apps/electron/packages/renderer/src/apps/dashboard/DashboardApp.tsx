import { Outlet } from 'react-router-dom';
import DashboardSidebar from '/@/components/dashboard/DashboardSidebar';
import { useRef } from 'react';
import DashboardAppEventListener from '/@/components/dashboard/DashboardAppEventListener';

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
      <DashboardAppEventListener />
    </>
  );
}

export default DashboardApp;
