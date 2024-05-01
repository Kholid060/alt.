import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import preloadAPI from '/@/utils/preloadAPI';

function DashboardAppEventListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const offOpenWindowListener = preloadAPI.main.ipc.on(
      'dashboard-window:open',
      (_, path) => {
        navigate(path || '/');
      },
    );

    return () => {
      offOpenWindowListener();
    };
  }, [navigate]);

  return null;
}

export default DashboardAppEventListener;
