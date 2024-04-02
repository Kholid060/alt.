import { CommandViewJSONRenderer } from '@repo/extension';
import { evaluate } from 'mathjs';

const CommandMain: CommandViewJSONRenderer = ({ updateView }) => {
  console.log('hello world');
  _extension.ui.searchPanel.onChanged.addListener((value) => {
    try {
      const result = evaluate(value);
      updateView({
        type: 'list',
        items: [
          {
            title: result,
            value: 'result',
            icon: 'icon:Calculator',
            description: 'Copy to clipboard',
            actions: [
              { type: 'copy', content: result.toString(), defaultAction: true }
            ],
          },
        ],
      });
    } catch (error) {
      console.error(error);
    }
  });

  return {
    type: 'list',
    items: [
      {
        title: 'Copy URL',
        value: 'copy-url',
        icon: 'icon:MousePointer2',
        actions: [
          { type: 'copy', content: 'https://google.com' },
          { type: 'open-url', url: 'https://google.com', defaultAction: true },
        ]
      },
      {
        title: 'Paste',
        icon: 'icon:Clipboard',
        value: 'paste',
        actions: [{ type: 'paste', content: 'haha' }, { type: 'show-in-folder', path: 'c:\\' }],
      },
    ]
  }
}

export default CommandMain;
