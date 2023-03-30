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
  DELETION,
  UPDATE,
} from "./constants"
import { setProps } from "./utils"

let nextUnitOfWork = null
let workInProgressRoot = null // RootFiber应用的根
let currentRoot = null // 渲染成功之后当前根RootFiber
let deletions = [] // 删除的节点不放effect list，需要单独记录并执行

export function scheduleRoot(rootFiber) {
  if (currentRoot && currentRoot.alternate) {
    // 多次渲染，双缓存机制，复用上一次的currentRoot
    workInProgressRoot = currentRoot.alternate
    workInProgressRoot.props = rootFiber.props
    workInProgressRoot.alternate = currentRoot
  } else if (currentRoot) {
    // 第二次渲染
    rootFiber.alternate = currentRoot
    workInProgressRoot = rootFiber
  } else {
    // 第一次渲染
    workInProgressRoot = rootFiber
  }
  workInProgressRoot.firstEffect =
    workInProgressRoot.lastEffect =
    workInProgressRoot.nextEffect =
      null
  nextUnitOfWork = workInProgressRoot
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
  let oldFiber = currentFiber.alternate && currentFiber.alternate.child
  let prevSibling // 上一个新的子fiber
  while (newChildIndex < newChildren.length || oldFiber) {
    let newChild = newChildren[newChildIndex]
    let newFiber
    const sameType = oldFiber && newChild && oldFiber.type === newChild.type
    let tag
    if (newChild) {
      if (newChild.type === ELEMENT_TEXT) {
        tag = TAG_TEXT
      } else if (typeof newChild.type === "string") {
        tag = TAG_HOST
      }
    }

    if (sameType) {
      if (oldFiber.alternate) {
        // 多次渲染
        newFiber = oldFiber.alternate
        newFiber.props = newChild.props
        newFiber.alternate = oldFiber
        newFiber.effectTag = UPDATE
        newFiber.nextEffect = null
      } else {
        newFiber = {
          tag: oldFiber.tag,
          type: oldFiber.type,
          props: newChild.props,
          stateNode: oldFiber.stateNode,
          return: currentFiber,
          alternate: oldFiber,
          effectTag: UPDATE,
          nextEffect: null,
        }
      }
    } else {
      if (newChild) {
        newFiber = {
          tag,
          type: newChild.type,
          props: newChild.props,
          stateNode: null, // 暂未创建元素
          return: currentFiber,
          effectTag: PLACEMENT,
          nextEffect: null, // effect list 也是一个单链表
        }
      }
      if (oldFiber) {
        oldFiber.effectTag = DELETION
        deletions.push(oldFiber)
      }
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling
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
  deletions.forEach(commitWork) // 执行effect list之前先把该删除的元素删除
  let currentFiber = workInProgressRoot.firstEffect
  while (currentFiber) {
    commitWork(currentFiber)
    currentFiber = currentFiber.nextEffect
  }
  deletions.length = 0 // 清空deletion
  currentRoot = workInProgressRoot
  workInProgressRoot = null
}

function commitWork(currentFiber) {
  if (!currentFiber) return
  const returnFiber = currentFiber.return
  const returnDOM = returnFiber.stateNode
  if (currentFiber.effectTag === PLACEMENT) {
    returnDOM.appendChild(currentFiber.stateNode)
  } else if (currentFiber.effectTag === DELETION) {
    returnDOM.removeChild(currentFiber.stateNode)
  } else if (currentFiber.effectTag === UPDATE) {
    if (currentFiber.type === ELEMENT_TEXT) {
      if (currentFiber.alternate.props.text !== currentFiber.props.text) {
        currentFiber.stateNode.textContent = currentFiber.props.text
      }
    } else {
      updateDOM(
        currentFiber.stateNode,
        currentFiber.alternate.props,
        currentFiber.props
      )
    }
  }
  currentFiber.effectTag = null
}

requestIdleCallback(workLoop, { timeout: 500 })
