import { ForwardConsolePayload } from '../../main/src/common/utils/forward-console';

export function forwardConsoleHandler(data: ForwardConsolePayload) {
  console.log(
    `%c("${data.extensionTitle}" extension > ${data.commandTitle})[${data.level}]`,
    'color: #84cc16; font-weight: 600;',
    ...data.args,
  );
}
