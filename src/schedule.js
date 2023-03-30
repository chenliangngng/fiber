/**
 * 从根节点开始渲染和调度，有两个阶段
 * diff阶段/render阶段 对比新旧的虚拟DOM，进行增量更新或创建，
 * 这个阶段比较花时间，可以对任务进行拆分，拆分虚拟dom维度。此阶段可以暂停
 * 1. 根据虚拟DOM生成fiber树 2.收集effect list
 * commit阶段，进行DOM更新创建阶段，此阶段不能暂停，要一气呵成
 */

import {
  ELEMENT_TEXT,
  TAG_HOST,
  TAG_ROOT,
  TAG_TEXT,
  PLACEMENT,
} from "./constants"
import { setProps } from "./utils"

let nextUnitOfWork = null
let workInProgressRoot = null // RootFiber应用的根

export function scheduleRoot(rootFiber) {
  workInProgressRoot = rootFiber
  nextUnitOfWork = rootFiber
}

function performUnitOfWork(currentFiber) {
  beginWork(currentFiber)
  if (currentFiber.child) {
    return currentFiber.child
  }
  while (currentFiber) {
    completeUnitOfWork(currentFiber)
    if (currentFiber.sibling) {
      return currentFiber.sibling
    }
    currentFiber = currentFiber.return
  }
}

/**
 * 在完成的时候要收集有副作用的fiber，然后组成effect list
 * 每个fiber有两个属性，firstEffect指向第一个有副作用的子fiber，lastEffect指向最后一个有副作用fiber
 * 中间的副作用用nextEffect做成一个单链表
 */
function completeUnitOfWork(currentFiber) {
  let returnFiber = currentFiber.return
  if (returnFiber) {
    // 挂载child到父节点
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = currentFiber.firstEffect
    }
    if (currentFiber.lastEffect) {
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber.firstEffect
      }
      returnFiber.lastEffect = currentFiber.lastEffect
    }
    // 挂载自己到父节点
    const { effectTag } = currentFiber
    if (effectTag) {
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber
      } else {
        returnFiber.firstEffect = currentFiber
      }
      returnFiber.lastEffect = currentFiber
    }
  }
}

/**
 * 1. 创建真实DOM元素
 * 2. 创建子fiber
 */
function beginWork(currentFiber) {
  if (currentFiber.tag === TAG_ROOT) {
    updateHostRoot(currentFiber)
  } else if (currentFiber.tag === TAG_TEXT) {
    updateHostText(currentFiber)
  } else if (currentFiber.tag === TAG_HOST) {
    updateHost(currentFiber)
  }
}

/**
 * 第一个完成节点调用reconcileChildren函数两次
 * 1. 第一次由其父节点进入，创建第一个完成节点的fiber
 * 2. 第二次自己进入函数，创建dom元素，并以children空数组方式进入reconcileChildren
 */
function updateHost(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber)
  }
  const newChildren = currentFiber.props.children
  reconcileChildren(currentFiber, newChildren)
}

function updateHostText(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber)
  }
}

function createDOM(currentFiber) {
  if (currentFiber.tag === TAG_TEXT) {
    return document.createTextNode(currentFiber.props.text)
  } else if (currentFiber.tag === TAG_HOST) {
    let stateNode = document.createElement(currentFiber.type)
    updateDOM(stateNode, {}, currentFiber.props)
    return stateNode
  }
}

function updateDOM(stateNode, oldProps, newProps) {
  setProps(stateNode, oldProps, newProps)
}

function updateHostRoot(currentFiber) {
  const newChildren = currentFiber.props.children
  reconcileChildren(currentFiber, newChildren)
}

/**
 * 虚拟dom转fiber
 */
function reconcileChildren(currentFiber, newChildren) {
  let newChildIndex = 0 // 新子节点的索引
  let prevSibling // 上一个新的子fiber
  while (newChildIndex < newChildren.length) {
    let newChild = newChildren[newChildIndex]
    let tag
    if (newChild.type === ELEMENT_TEXT) {
      tag = TAG_TEXT
    } else if (typeof newChild.type === "string") {
      tag = TAG_HOST
    }
    let newFiber = {
      tag,
      type: newChild.type,
      props: newChild.props,
      stateNode: null, // 暂未创建元素
      return: currentFiber,
      effectTag: PLACEMENT,
      nextEffect: null, // effect list 也是一个单链表
    }
    if (newFiber) {
      if (newChildIndex === 0) {
        currentFiber.child = newFiber
      } else {
        prevSibling.sibling = newFiber
      }
      prevSibling = newFiber
    }
    newChildIndex++
  }
}

/**
 * 循环执行工作 nextUnitOfWork
 */
function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }
  if (!nextUnitOfWork && workInProgressRoot) {
    console.log("render阶段结束")
    commitRoot()
  }
  requestIdleCallback(workLoop, { timeout: 500 })
}

function commitRoot() {
  console.log(workInProgressRoot)
  let currentFiber = workInProgressRoot.firstEffect
  while (currentFiber) {
    commitWork(currentFiber)
    currentFiber = currentFiber.nextEffect
  }
  workInProgressRoot = null
}

function commitWork(currentFiber) {
  if (!currentFiber) return
  const returnFiber = currentFiber.return
  const returnDOM = returnFiber.stateNode
  if (currentFiber.effectTag === PLACEMENT) {
    returnDOM.appendChild(currentFiber.stateNode)
  }
  currentFiber.effectTag = null
}

requestIdleCallback(workLoop, { timeout: 500 })
