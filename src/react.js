import { ELEMENT_TEXT } from "./constants"
import { scheduleRoot } from "./scheduler"
import { Update, UpdateQueue } from "./UpdateQueue"

function createElement(type, config, ...children) {
  delete config.__self // babel编译，这里简化
  delete config.__source // 表示这个元素再哪行哪列哪个文件生成的
  const node = {
    type,
    props: {
      ...config,
      children: children.map((child) =>
        typeof child === "object"
          ? child
          : {
              type: ELEMENT_TEXT,
              props: { text: child, children: [] },
            }
      ),
    },
  }
  return node
}

class Component {
  constructor(props) {
    this.props = props
    // this.updateQueue = new UpdateQueue()
  }
  setState(payload) {
    const update = new Update(payload)
    // updateQueue放在此类组件对应的fiber节点的internalFiber
    this.internalFiber.updateQueue.enqueueUpdate(update)
    // this.updateQueue.enqueueUpdate(update)
    scheduleRoot()
  }
}
Component.prototype.isReactComponent = {}

const React = {
  createElement,
  Component,
}

export default React
