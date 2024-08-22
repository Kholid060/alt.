import { z } from 'zod';

export const CommandJSONActionPasteValidation = z.object({
  content: z.string(),
  type: z.literal('paste'),
});
export type CommandJSONActionPaste = z.infer<
  typeof CommandJSONActionPasteValidation
>;

export const CommandJSONActionCopyValidation = z.object({
  content: z.unknown(),
  type: z.literal('copy'),
});
export type CommandJSONActionCopy = z.infer<
  typeof CommandJSONActionCopyValidation
>;

export const CommandJSONActionOpenURLValidation = z.object({
  url: z.string().url(),
  type: z.literal('open-url'),
});
export type CommandJSONActionOpenURL = z.infer<
  typeof CommandJSONActionOpenURLValidation
>;

export const CommandJSONActionShowFolderValidation = z.object({
  path: z.string().min(1),
  type: z.literal('show-in-folder'),
});
export type CommandJSONActionShowFolder = z.infer<
  typeof CommandJSONActionShowFolderValidation
>;

export const CommandJSONActionValidation = z.discriminatedUnion('type', [
  CommandJSONActionCopyValidation,
  CommandJSONActionPasteValidation,
  CommandJSONActionOpenURLValidation,
  CommandJSONActionShowFolderValidation,
]);
export type CommandJSONAction = z.infer<typeof CommandJSONActionValidation>;

export const CommandJSONViewTextValidation = z.object({
  text: z.string(),
  type: z.literal('text'),
  align: z.enum(['start', 'end', 'justify', 'center']).optional(),
  color: z.enum(['destructive', 'default', 'muted', 'primary']).optional(),
  textStyle: z
    .enum([
      'body',
      'code',
      'heading-1',
      'heading-2',
      'heading-3',
      'heading-4',
      'body-small',
    ])
    .default('body'),
});
export type CommandJSONViewText = z.infer<typeof CommandJSONViewTextValidation>;

export const CommandJSONViewListItemValidation = z.object({
  title: z.string().min(1),
  value: z.string().min(1),
  icon: z.string().optional(),
  group: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  actions: z
    .intersection(
      CommandJSONActionValidation,
      z.object({ defaultAction: z.boolean().optional() }),
    )
    .array()
    .optional(),
});
export type CommandJSONViewListItem = z.infer<
  typeof CommandJSONViewListItemValidation
>;

export const CommandJSONViewListValidation = z.object({
  type: z.literal('list'),
  shouldFilter: z.boolean().optional(),
  items: CommandJSONViewListItemValidation.array(),
});
export type CommandJSONViewList = z.infer<typeof CommandJSONViewListValidation>;

export const CommandJSONViewFormTextFieldValidation = z.object({
  key: z.string().min(1),
  type: z.literal('text'),
  label: z.string().optional(),
  required: z.boolean().optional(),
  multiline: z.boolean().optional(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.union([z.string(), z.number()]).optional(),
});
export type CommandJSONViewFormTextField = z.infer<
  typeof CommandJSONViewFormTextFieldValidation
>;

export const CommandJSONViewFormDateValidation =
  CommandJSONViewFormTextFieldValidation.omit({ multiline: true }).merge(
    z.object({
      type: z.literal('date'),
      includeTime: z.boolean().optional(),
    }),
  );
export type CommandJSONViewFormDate = z.infer<
  typeof CommandJSONViewFormDateValidation
>;

export const CommandJSONViewFormSelectOptionValidation = z
  .object({
    label: z.string(),
    value: z.string(),
  })
  .or(z.string());
export type CommandJSONViewFormSelectOption = z.infer<
  typeof CommandJSONViewFormSelectOptionValidation
>;

export const CommandJSONViewFormSelectValidation = z.object({
  key: z.string().min(1),
  type: z.literal('select'),
  label: z.string().optional(),
  required: z.boolean().optional(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  options: CommandJSONViewFormSelectOptionValidation.array(),
});
export type CommandJSONViewFormSelect = z.infer<
  typeof CommandJSONViewFormSelectValidation
>;

export const CommandJSONViewFormToggleValidation = z.object({
  key: z.string().min(1),
  type: z.literal('toggle'),
  label: z.string().optional(),
  description: z.string().optional(),
  defaultValue: z.boolean().optional(),
});
export type CommandJSONViewFormToggle = z.infer<
  typeof CommandJSONViewFormToggleValidation
>;

export const CommandJSONViewFormFieldsValidation = z.discriminatedUnion(
  'type',
  [
    CommandJSONViewFormDateValidation,
    CommandJSONViewFormToggleValidation,
    CommandJSONViewFormSelectValidation,
    CommandJSONViewFormTextFieldValidation,
  ],
);
export type CommandJSONViewFormFields = z.infer<
  typeof CommandJSONViewFormFieldsValidation
>;

// const CommandJSONViewFormSubmit = z.discriminatedUnion('action', [
//   z.object({
//     action: z.literal('http-request'),
//     headers: z.record(z.string(), z.unknown()).optional(),
//     method: z.enum(['GET', 'POST', 'DELETE', 'PUT', 'PATCH']),
//     searchParams: z.record(z.string(), z.unknown()).optional(),
//     contentType: z
//       .enum(['form-data', 'form-urlencoded', 'json', 'text'])
//       .optional()
//       .default('json'),
//   }),
//   z.object({
//     action: z.literal('rerun-command'),
//     extraParams: z.record(z.unknown(), z.unknown()).optional(),
//   }),
// ]);
export const CommandJSONViewFormValidation = z.object({
  type: z.literal('form'),
  title: z.string().optional(),
  description: z.string().optional(),
  cancelBtnText: z.string().optional(),
  submitBtnText: z.string().optional(),
  name: z.string().optional().default('form_value'),
  fields: z
    .union([
      CommandJSONViewFormFieldsValidation,
      CommandJSONViewFormFieldsValidation.array(),
    ])
    .array(),
});
export type CommandJSONViewForm = z.infer<typeof CommandJSONViewFormValidation>;

export const CommandJSONViewValidation = z.discriminatedUnion('type', [
  CommandJSONViewListValidation,
  CommandJSONViewTextValidation,
  CommandJSONViewFormValidation,
]);
export type CommandJSONView = z.infer<typeof CommandJSONViewValidation>;

export const CommandJSONValidation = z.object({
  view: CommandJSONViewValidation.optional(),
  action: CommandJSONActionValidation.optional(),
});
export type CommandJSON = z.infer<typeof CommandJSONValidation>;
