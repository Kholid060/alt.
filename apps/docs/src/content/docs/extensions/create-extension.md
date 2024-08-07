---
title: Create an Extension
description: Building an Extension for Alt. app
sidebar:
  order: 1
---

## Prerequisite

Before building your first extension, ensure you have the prerequisite.
- [Node.js](https://nodejs.org/) v20.16.0 or higher installed
- Package manager like [npm](http://npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/) installed
- Familiar with [React](https://react.dev/) or [Typescript](https://www.typescriptlang.org/)

## Create a New Extension

To create a new extension, fork or download the [extension starter template](https://github.com/Kholid060/alt-extension-starter) and install the modules using the package manager, for example, if you're using npm `npm install`;

Open the `manifest.ts` file to change the extension details like the name, description, etc.

## Develop Extension

In the terminal, run the `npm run dev` script. It will build the extension in development mode and automatically rebuild the file when you make changes. If you modify the view type command file, you must re-run it in the Command Bar to see the changes.

Use the `npm run build` script to build the extension for production.

## Import Extension

![Imported extension](@/assets/images/imported-extension.png)

To import the extension into the Alt app, use the [Import Extension Command](/basics/core-commands/#import-extension-command), navigate to the extension directory, and select the `manifest.json` file inside the `dist` folder of the extension. You'll see the extension commands in the Command Bar.

With that, congratulations 🎉 you just built your first extension.

:::note
When you change the manifest of the imported extension, you need to manually run the extension reload action for the changes to take effect.

![Reload extension actions](@/assets/images/reload-extension-action.png)
:::