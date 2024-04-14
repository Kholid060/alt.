import { Outlet } from 'react-router-dom';
import DashboardSidebar from '/@/components/dashboard/DashboardSidebar';
import { UiToaster, UiTooltipProvider } from '@repo/ui';
import { DatabaseProvider } from '/@/context/database.context';

function DashboardApp() {
  return (
    <UiTooltipProvider>
      <DatabaseProvider>
        <UiToaster />
        <DashboardSidebar />
        <div className="pl-20 lg:pl-64">
          <Outlet />
        </div>
      </DatabaseProvider>
    </UiTooltipProvider>
  );
}

export default DashboardApp;
