import { TAG_ROOT } from "./constants"
import { scheduleRoot } from "./scheduler"

function render(/* React元素 */ element, /* root DOM节点 */ container) {
  const rootFiber = {
    tag: TAG_ROOT,
    stateNode: container, // 一般情况如果这个元素是原生节点，则stateNode指向真实DOM元素
    props: {
      children: [element],
    },
  }
  scheduleRoot(rootFiber)
}

const ReactDOM = {
  render,
}

export default ReactDOM
