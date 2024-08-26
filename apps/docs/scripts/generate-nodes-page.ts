import { WORKFLOW_NODES } from '@altdot/workflow';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fsPromise from 'fs/promises';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const NODES_DIR = path.join(__dirname, '../src/content/docs/reference/Workflow Nodes');

function contentTemplate(title: string) {
  return `
---
title: ${title}
---

WIP

## Parameters
`.trimStart()
}

await Promise.all(Object.values(WORKFLOW_NODES).map(async (node) => {
  const nodeFilePath = path.join(NODES_DIR, `${node.type}.md`);
  if (fs.existsSync(nodeFilePath)) return;

  await fsPromise.writeFile(nodeFilePath, contentTemplate(`${node.title} Node`));
}));
