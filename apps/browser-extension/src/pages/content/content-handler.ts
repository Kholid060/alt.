import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import { runtimeOnElClick } from './runtime-events/element.events';

refreshOnUpdate('pages/content/injected/content-handler');

RuntimeMessage.instance.onMessage('element:click', runtimeOnElClick);
