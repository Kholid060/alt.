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
        'prose dark:prose-invert prose-pre:rounded-lg prose-pre:bg-card prose-code:bg-card prose-hr:border-border prose-img:rounded-lg prose-thead:border-border prose-tr:border-border max-w-3xl',
        className,
      )}
      {...props}
    >
      <Markdown options={options}>{markdown}</Markdown>
    </div>
  );
}

export default UiMarkdown;
