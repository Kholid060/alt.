import { CommandJSONViewText } from '@altdot/extension/dist/validation/command-json.validation';

type TextType = Required<CommandJSONViewText>;

const textStyle: Record<TextType['textStyle'], string> = {
  'body-small': 'text-sm',
  body: '',
  'heading-1': 'text-3xl',
  'heading-2': 'text-2xl',
  'heading-3': 'text-xl',
  'heading-4': 'text-lg',
  code: 'font-mono text-sm',
};
const textColor: Record<TextType['color'], string> = {
  primary: 'text-primary',
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  destructive: 'text-destructive-text',
};

const CommandViewJSONText: React.FC<{ data: CommandJSONViewText }> = ({
  data,
}) => {
  return (
    <p
      className={`${textStyle[data.textStyle ?? 'body']} ${textColor[data.color ?? 'default']} px-6 py-4`}
      style={{ textAlign: data.align }}
    >
      {data.text}
    </p>
  );
};

export default CommandViewJSONText;
