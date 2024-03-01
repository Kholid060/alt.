import { PRELOAD_API_KEY } from '#common/utils/constant/constant';

const preloadAPI = {
  main: window[PRELOAD_API_KEY.main],
  extension: window[PRELOAD_API_KEY.extension],
};

export default preloadAPI;
