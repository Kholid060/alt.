
import ExtensionAPI from './extension-api';

interface FlatActionExtensionAPI {
	'installedApps.query': typeof ExtensionAPI.installedApps.query;
	'installedApps.launch': typeof ExtensionAPI.installedApps.launch;
}
interface FlatValueExtensionAPI {
	'manifest': typeof ExtensionAPI.manifest;
	'tabs.hello': typeof ExtensionAPI.tabs.hello;
}


type FlatExtensionAPI = FlatActionExtensionAPI & FlatValueExtensionAPI;

declare const flatExtensionAPI: FlatExtensionAPI;
declare const flatValueExtensionAPI: FlatValueExtensionAPI;
declare const flatActionExtensionAPI: FlatActionExtensionAPI;

export { type FlatActionExtensionAPI, type FlatValueExtensionAPI, type FlatExtensionAPI, flatActionExtensionAPI, flatValueExtensionAPI };

export default flatExtensionAPI;
