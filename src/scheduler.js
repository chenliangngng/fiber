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
  TAG_CLASS,
  TAG_FUNCTION_COMPONENT,
  TAG_MEMO,
} from "./constants"
import { Update, UpdateQueue } from "./UpdateQueue"
import { setProps } from "./utils"

let nextUnitOfWork = null
let workInProgressRoot = null // RootFiber应用的根
let currentRoot = null // 渲染成功之后当前根RootFiber
let deletions = [] // 删除的节点不放effect list，需要单独记录并执行
let workInProgressFiber = null // 正在工作的fiber
let hookIndex = 0 // hooks索引

export function scheduleRoot(rootFiber) {
  if (currentRoot && currentRoot.alternate) {
    // 多次渲染，双缓存机制，复用上一次的currentRoot
    workInProgressRoot = currentRoot.alternate
    workInProgressRoot.alternate = currentRoot
    if (rootFiber) {
      workInProgressRoot.props = rootFiber.props
    }
  } else if (currentRoot) {
    // 第二次渲染
    if (rootFiber) {
      rootFiber.alternate = currentRoot
      workInProgressRoot = rootFiber
    } else {
      workInProgressRoot = {
        ...currentRoot,
        alternate: currentRoot,
      }
    }
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
  } else if (currentFiber.tag === TAG_CLASS) {
    updateClassComponent(currentFiber)
  } else if (currentFiber.tag === TAG_FUNCTION_COMPONENT) {
    updateFunctionComponent(currentFiber)
  } else if (currentFiber.tag === TAG_MEMO) {
    updateMemoComponent(currentFiber)
  }
}

function updateMemoComponent(currentFiber) {
  workInProgressFiber = currentFiber
  const { type, props, prevProps } = workInProgressFiber
  if (!workInProgressFiber.type.compare(prevProps, props, "children")) {
    hookIndex = 0
    workInProgressFiber.hooks = []
    workInProgressFiber.prevProps = workInProgressFiber.props
    const newChildren = [currentFiber.type.type(currentFiber.props)]
    reconcileChildren(currentFiber, newChildren)
  }
}

function updateFunctionComponent(currentFiber) {
  workInProgressFiber = currentFiber
  hookIndex = 0
  workInProgressFiber.hooks = []
  const newChildren = [currentFiber.type(currentFiber.props)]
  reconcileChildren(currentFiber, newChildren)
}

function updateClassComponent(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = new currentFiber.type(currentFiber.props)
    currentFiber.stateNode.internalFiber = currentFiber // 类组件实例和fiber双向指向
    currentFiber.updateQueue = new UpdateQueue()
  }
  // 给组件的实例的state赋值
  currentFiber.stateNode.state = currentFiber.updateQueue.forceUpdate(
    currentFiber.stateNode.state
  )
  const newElement = currentFiber.stateNode.render()
  const newChildren = [newElement]
  reconcileChildren(currentFiber, newChildren)
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
    if (currentFiber.props.ref) {
      currentFiber.props.ref.current = stateNode
    }
    updateDOM(stateNode, {}, currentFiber.props)
    return stateNode
  }
}

function updateDOM(stateNode, oldProps, newProps) {
  if (stateNode?.setAttribute) {
    setProps(stateNode, oldProps, newProps)
  }
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
  if (oldFiber) {
    oldFiber.firstEffect = oldFiber.lastEffect = oldFiber.nextEffect = null
  }
  let prevSibling // 上一个新的子fiber
  while (newChildIndex < newChildren.length || oldFiber) {
    let newChild = newChildren[newChildIndex]
    let newFiber
    const sameType = oldFiber && newChild && oldFiber.type === newChild.type
    let tag
    if (newChild) {
      if (newChild.type.isMemo) {
        tag = TAG_MEMO
      } else if (
        typeof newChild.type === "function" &&
        newChild.type.prototype.isReactComponent
      ) {
        tag = TAG_CLASS
      } else if (
        typeof newChild.type === "function" &&
        !newChild.type.prototype.isReactComponent
      ) {
        tag = TAG_FUNCTION_COMPONENT
      } else if (newChild.type === ELEMENT_TEXT) {
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
        newFiber.updateQueue = oldFiber.updateQueue || new UpdateQueue()
        newFiber.nextEffect = null
      } else {
        newFiber = {
          tag: oldFiber.tag,
          type: oldFiber.type,
          props: newChild.props,
          stateNode: oldFiber.stateNode,
          return: currentFiber,
          effectTag: UPDATE,
          alternate: oldFiber,
          updateQueue: oldFiber.updateQueue || new UpdateQueue(),
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
          updateQueue: new UpdateQueue(),
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
      if (newFiber?.props?.ref) {
        newFiber.props.ref.current = newFiber.stateNode
      }
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
    // render阶段结束
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
  let returnFiber = currentFiber.return
  while (
    returnFiber.tag !== TAG_HOST &&
    returnFiber.tag !== TAG_ROOT &&
    returnFiber.tag !== TAG_TEXT
  ) {
    returnFiber = returnFiber.return
  }
  const returnDOM = returnFiber.stateNode
  if (currentFiber.effectTag === PLACEMENT) {
    let nextFiber = currentFiber
    // 如果要挂载的节点不是DOM节点，比如类组件fiber，一直往下找到真实DOM节点为止
    while (nextFiber.tag !== TAG_HOST && nextFiber.tag !== TAG_TEXT) {
      nextFiber = currentFiber.child
    }
    returnDOM.appendChild(nextFiber.stateNode)
  } else if (currentFiber.effectTag === DELETION) {
    commitDeletion(currentFiber, returnDOM)
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

function commitDeletion(currentFiber, returnDOM) {
  if (currentFiber.tag === TAG_HOST || currentFiber.tag !== TAG_TEXT) {
    returnDOM.removeChild(currentFiber.stateNode)
  } else {
    commitDeletion(currentFiber.childs, returnDOM)
  }
}

export function useReducer(reducer, initialValue) {
  let newHook = workInProgressFiber?.alternate?.hooks?.[hookIndex]
  if (newHook) {
    // 第二次渲染
    newHook.state = newHook.updateQueue.forceUpdate(newHook.state)
  } else {
    newHook = {
      state: initialValue,
      updateQueue: new UpdateQueue(),
    }
  }
  const dispatch = (action) => {
    const payload = reducer ? reducer(newHook.state, action) : action
    newHook.updateQueue.enqueueUpdate(new Update(payload))
    scheduleRoot()
  }
  workInProgressFiber.hooks[hookIndex] = newHook
  hookIndex++
  return [newHook.state, dispatch]
}

export function useState(initialValue) {
  return useReducer(null, initialValue)
}

export function useMemo(factory, deps) {
  let newHook = workInProgressFiber?.alternate?.hooks?.[hookIndex]
  if (newHook) {
    // 第二次渲染
    const [lastMemo, lastDeps] = newHook
    const everySame = deps.every((item, index) => item === lastDeps[index])
    if (everySame) {
      hookIndex++
      return lastMemo
    } else {
      const newMemo = factory()
      newHook = [newMemo, deps]
      workInProgressFiber.hooks[hookIndex] = newHook
      hookIndex++

      return newMemo
    }
  } else {
    const newMemo = factory()
    newHook = [newMemo, deps]
    workInProgressFiber.hooks[hookIndex] = newHook
    hookIndex++

    return newMemo
  }
}

export function useCallback(callback, deps) {
  let newHook = workInProgressFiber?.alternate?.hooks?.[hookIndex]
  if (newHook) {
    // 第二次渲染
    const [lastCallback, lastDeps] = newHook
    const everySame = deps.every((item, index) => item === lastDeps[index])
    if (everySame) {
      hookIndex++
      return lastCallback
    } else {
      newHook = [callback, deps]
      workInProgressFiber.hooks[hookIndex] = newHook
      hookIndex++

      return callback
    }
  } else {
    newHook = [callback, deps]
    workInProgressFiber.hooks[hookIndex] = newHook
    hookIndex++

    return callback
  }
}

// 浏览器空闲时候执行
// 有个优先级概念expirationTime
requestIdleCallback(workLoop, { timeout: 500 })
