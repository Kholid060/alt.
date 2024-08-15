---
title: Branch Execution Order
sidebar:
  order: 3
---

When you have a branching node inside your workflow, the execution order will start from the node where the position is the top to the bottom. See the below image for an example,

![Branching nodes](@/assets/images/workflow-branching-node.png)

In this case, when the HTTP Request node execution is finished, the workflow will execute the File System node and then continue to the Notification node first. Then continues execution to the next branch, which is the Browser Tab node and the Mouse node.