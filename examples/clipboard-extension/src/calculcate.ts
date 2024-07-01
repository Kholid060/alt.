import { CommandViewJSONRenderer } from '@alt-dot/extension';
// import { evaluate } from 'mathjs';

const CommandMain: CommandViewJSONRenderer = ({ updateView }) => {
  console.log('hello world CLEAR');
  _extension.ui.searchPanel.clearValue();
  _extension.ui.searchPanel.onChanged.addListener((value) => {
    if (!value.trim()) return;
    console.log('changed', value);
    try {
      // const result = evaluate(value);
      const result = 'hello world';
      updateView({
        type: 'list',
        shouldFilter: false,
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
      updateView(null);
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
