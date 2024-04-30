import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import preloadAPI from '/@/utils/preloadAPI';

function DashboardAppEventListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const offOpenWindowListener = preloadAPI.main.ipc.on(
      'dashboard-window:open',
      (_, path) => {
        switch (path || 'dashboard') {
          case 'dashboard':
            navigate('/');
            break;
          case 'extensions':
            navigate('/extensions');
            break;
          case 'settings':
            navigate('/settings');
            break;
          case 'workflows':
            navigate('/workflows');
            break;
        }
      },
    );

    return () => {
      offOpenWindowListener();
    };
  }, [navigate]);

  return null;
}

export default DashboardAppEventListener;
