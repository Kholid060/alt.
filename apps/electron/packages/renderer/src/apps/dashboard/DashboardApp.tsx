import { Outlet } from 'react-router-dom';
import DashboardSidebar from '/@/components/dashboard/DashboardSidebar';
import { UiTooltipProvider } from '@repo/ui';

function DashboardApp() {
  return (
    <UiTooltipProvider>
      <DashboardSidebar />
      <div className="pl-20 lg:pl-64">
        <Outlet />
      </div>
    </UiTooltipProvider>
  );
}

export default DashboardApp;
