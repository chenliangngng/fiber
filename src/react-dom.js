import { TAG_ROOT } from "./constants"
import { scheduleRoot } from "./scheduler"

let root
function setRoot(container) {
  root = container
}
function getRoot() {
  return root
}

function render(/* React元素 */ element, /* root DOM节点 */ container) {
  setRoot(container)
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
  getRoot,
}

export default ReactDOM
