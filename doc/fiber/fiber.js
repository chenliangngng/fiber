/**
 * 1. 从顶点开始遍历
 * 2. 有child再sibling，即深度优先遍历
 */

const rootFiber = require("./element")
let nextUnitOfWork = null // 下一个执行单元

function workloop(deadline) {
  while (
    (deadline.timeRemaining() > 1 || deadline.didTimeout) &&
    nextUnitOfWork
  ) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    console.log(1)
  }
  if (!nextUnitOfWork) {
    console.log("render阶段结束")
  }
}

function performUnitOfWork(fiber) {
  beginWork(fiber)
  if (fiber.child) {
    return fiber.child
  }
  while (fiber) {
    completeUnitOfWork(fiber)
    if (fiber.sibling) {
      return fiber.sibling
    }
    fiber = fiber.return
  }
}

function completeUnitOfWork(fiber) {
  console.log("结束", fiber.key)
}
function beginWork(fiber) {
  console.log("开始", fiber.key)
}

nextUnitOfWork = rootFiber

requestIdleCallback(workLoop, { timeout: 1000 })
