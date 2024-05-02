import { tmpl } from '@n8n_io/riot-tmpl';
import SandboxMessagePort from './SandboxMessagePort';
import { debugLog } from '#packages/common/utils/helper';

debugLog('Start sandbox');

SandboxMessagePort.on('evaluate-code', (code, context) => {
  if (typeof code === 'string') return tmpl(code, context);

  const result: Record<string, unknown> = {};
  for (const key in code) {
    result[key] = tmpl(code[key], context);
  }

  return result;
});
