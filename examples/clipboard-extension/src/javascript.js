const emojis = ['🤯', '🎉', '✅', '🔃', '👏', '🟩', '🔴', '😅', '🤔', '❌', '🌿', '😍'];

console.log(JSON.stringify({
  view: {
    type: 'list',
    items: emojis.map((emoji, index) => ({
      title: emoji,
      value: `emoji-${index}`,
      actions: [
        { type: 'paste', content: emoji, defaultAction: true },
        { type: 'open-url', url: `https://emojipedia.org/${emoji}` },
      ],
    })),
  }
}))