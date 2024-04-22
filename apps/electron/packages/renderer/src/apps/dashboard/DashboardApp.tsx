import { Outlet } from 'react-router-dom';
import DashboardSidebar from '/@/components/dashboard/DashboardSidebar';

function DashboardApp() {
  return (
    <>
      <DashboardSidebar />
      <div className="pl-20 lg:pl-64">
        <Outlet />
      </div>
    </>
  );
}

export default DashboardApp;
