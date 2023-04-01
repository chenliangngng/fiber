import { addEvent } from "./event"

export function setProps(dom, oldProps, newProps) {
  Object.keys(oldProps).forEach((key) => {
    if (key !== "children") {
      if (newProps.hasOwnProperty(key)) {
        setProp(dom, key, newProps[key])
      } else {
        dom.removeAttribute(key)
      }
    }
  })
  Object.keys(newProps).forEach((key) => {
    if (key !== "children") {
      if (!oldProps.hasOwnProperty(key)) {
        setProp(dom, key, newProps[key])
      }
    }
  })
}

function setProp(dom, key, value) {
  if (/^on[A-Z]/.test(key)) {
    addEvent(dom, key, value)
  } else if (key === "style") {
    if (value) {
      Object.keys(value).forEach((styleName) => {
        dom.style[styleName] = value[styleName]
      })
    }
  } else {
    dom.setAttribute(key, value)
  }
}

export function shallowEqual(obj1, obj2, exclude) {
  if (obj1 === obj2) {
    return true
  }
  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    return false
  }
  const key1 = Object.keys(obj1)
  const key2 = Object.keys(obj2)
  if (key1.length !== key2.length) {
    return false
  }
  const result = key1.filter(
    (key) =>
      key !== exclude && (!obj2.hasOwnProperty(key) || obj1[key] !== obj2[key])
  )
  if (result.length > 0) {
    return false
  }
  return true
}
