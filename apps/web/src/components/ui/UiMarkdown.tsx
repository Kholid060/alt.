import clsx from 'clsx';
import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';

function UiMarkdown({
  className,
  options,
  markdown,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  markdown: string;
  options?: MarkdownToJSX.Options;
}) {
  return (
    <div
      className={clsx(
        'prose max-w-3xl dark:prose-invert prose-code:bg-card prose-pre:rounded-lg prose-pre:bg-card prose-thead:border-border prose-tr:border-border prose-img:rounded-lg prose-hr:border-border',
        className,
      )}
      {...props}
    >
      <Markdown options={options}>{markdown}</Markdown>
    </div>
  );
}

export default UiMarkdown;
