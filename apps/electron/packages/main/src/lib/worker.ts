import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten';

getQuickJS().then((QuickJS) => {
  const result = QuickJS.evalCode('1 + 1', {
    shouldInterrupt: shouldInterruptAfterDeadline(Date.now() + 1000),
    memoryLimitBytes: 1024 * 1024,
  });
  console.log(result);
});
