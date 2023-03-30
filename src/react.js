import { ELEMENT_TEXT } from "./constants"

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

const React = {
  createElement,
}

export default React
