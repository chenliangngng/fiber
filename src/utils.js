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
  if (/^on/.test(key)) {
    dom[key.toLowerCase()] = value
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
