// 表示文本元素
export const ELEMENT_TEXT = Symbol.for("ELEMENT_TEXT")

// React应用需要一个根Fiber
export const TAG_ROOT = Symbol.for("TAG_ROOT")

// dom原生节点, react原生节点
export const TAG_HOST = Symbol.for("TAG_HOST")

// 文本节点
export const TAG_TEXT = Symbol.for("TAG_TEXT")
// 类节点
export const TAG_CLASS = Symbol.for("TAG_CLASS")
// 函数组件
export const TAG_FUNCTION_COMPONENT = Symbol.for("TAG_FUNCTION_COMPONENT")
// memo节点
export const TAG_MEMO = Symbol.for("memo")

// 副作用标识，插入节点
export const PLACEMENT = Symbol.for("PLACEMENT")
// 副作用标识，更新节点
export const UPDATE = Symbol.for("UPDATE")
// 副作用标识，删除节点
export const DELETION = Symbol.for("DELETION")
