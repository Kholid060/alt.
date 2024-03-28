import { RuntimeMessageHandler } from '@root/src/interface/runtime-event.interface';
import QuerySelector from '@root/src/utils/QuerySelector';
import MouseDriver from '@root/src/utils/driver/MouseDriver';

export const runtimeOnElClick: RuntimeMessageHandler<'element:click'> = async (
  _,
  selector,
) => {
  const element = await QuerySelector.find(selector);
  if (!element) {
    throw new Error(`Couldn't find element with "${selector}" selector`);
  }

  MouseDriver.click(element);
};
