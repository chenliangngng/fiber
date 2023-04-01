import ReactDOM from "./react-dom"

const CAPTURE = "capture"

export function addEvent(dom, reactEventType, handler) {
  const root = ReactDOM.getRoot()

  const eventType = reactEventType.toLocaleLowerCase()
  const useCapture = eventType.endsWith(CAPTURE)
  const _eventStore = dom?._eventStore || {}
  dom._eventStore = _eventStore
  _eventStore[eventType] = handler
  if (!root._eventList) {
    root._eventList = []
  }

  if (!root._eventList.includes(eventType)) {
    root._eventList.push(eventType)
    let nativeEventType = eventType.slice(2)
    if (useCapture) {
      nativeEventType = nativeEventType.slice(
        0,
        nativeEventType.length - CAPTURE.length
      )
      document.addEventListener(`${nativeEventType}`, dispatchEvent(true), true)
    } else {
      document.addEventListener(`${nativeEventType}`, dispatchEvent())
    }
  }
}

function dispatchEvent(useCapture) {
  return (event) => {
    const root = ReactDOM.getRoot()

    const { type } = event
    let { target } = event
    const eventType = `on${type}${useCapture ? CAPTURE : ""}`
    const syntheticEvent = createSyntheticEvent(event)
    if (!useCapture) {
      while (target) {
        const handler = target?._eventStore?.[eventType]
        handler?.call?.(target, syntheticEvent)
        target = target.parentNode
      }
    } else {
      const handlerQueue = []

      while (target && target !== root) {
        const handler = target?._eventStore?.[eventType]
        handler && handlerQueue.push(handler)
        target = target.parentNode
      }
      handlerQueue
        .reverse()
        .forEach((handler) => handler.call(target, syntheticEvent))
    }
  }
}

// 此处源码做了浏览器兼容性适配
function createSyntheticEvent(event) {
  let syntheticEvent = {}
  Object.keys(event).forEach((key) => {
    syntheticEvent[key] = event
  })
  return syntheticEvent
}
