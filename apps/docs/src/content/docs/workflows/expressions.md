---
title: Expressions
sidebar:
  order: 3
---

Expressions allow you to put dynamic data in the node parameter. The data can be from the workflow variables or the previous node.

To use expressions as the parameter node value, enable the "Expression" toggle in the node parameter and write the expression by using the `{{ expression here }}` format. You can write JavaScript inside the expression and use the built-in expression function. The returned value will used as the node parameter value.

Inside the expression, you can only write a single-line code; multi-line code will be invalid. For example,
```js
{{ 1 + 1 }}
```
and the below example is invalid:
```js
{{
  const add = (a, b) => a + b;
  add(10, 20);
}}
```
## Built-in Functions

### `$getData`

> $getData(path: string): unknown

Function to access the workflow data like the workflow variables.

You can write dot-notation in the path parameter. See the [dot-prop documentation](https://github.com/sindresorhus/dot-prop?tab=readme-ov-file#usage) for more details about the format you can use in the path parameter.

List of data you can access:

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `vars` | `Record<string, unknown>` | [Workflow variables](/workflows/variables) |
| `loopData` | Record<string, [`LoopData`](/reference/workfllow-nodes/looping-node/#loopdata)> | The [Looping Node](/reference/workfllow-nodes/looping-node/) data. The property key is using the id of the Looping node |
| `prevNode` | `unknown \| null` | Data returned by the previous node |
| `parentWorkflow` | `{ id: string; vars: Record<string, unknown> } \| null` | The parent workflow data. This will be available if the workflow is executed using the Workflow Execute Node |

#### Examples

Let's say the workflow has data like the below
```json
{
  "vars": {
    "greeting": "Hello world",
    "user": { "name": "John Doe", "age": 30 }
  },
  "prevNode": [{ "id": 1, "title": "Item 1" }, { "id": 2, "title": "Item 2" }]
}
```

To access data using the function:

```js
// access all variables
$getData('vars')

// access the "greeting" variable
$getData('vars.greeting') //=> Hello world

// access the first element of the previous node data
$getData('prevNode[0]') //=> { "id": 1, "title": "Item 1" }

// access the "title" property of the previous node's first element
$getData('prevNode[0].title') //=> Item 1
```

### `$setVars`

> $setVars(name: string, value: unknown): void

Set a workflow variable value.

#### Examples

```js
// set the "greeting" variable value
$setVars('greeting', 'Hello')

// set the "user" variable value
$setVars('user', { name: 'Jane Doe', age: 25 })
```