import React from "./react"
import ReactDOM from "./react-dom"

class ClassCounter2 extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    return React.createElement("div", { id: "counter2" }, 123)
  }
}

class ClassCounter extends React.Component {
  constructor(props) {
    super(props)
    this.state = { number: 0 }
    this.counterRef = React.createRef()
    this.childRef = React.createRef()
  }
  onClick = () => {
    this.setState((state) => ({ number: state.number + 1 }))
    console.log(this.counterRef, this.childRef)
  }
  render() {
    return React.createElement(
      "div",
      { id: "counter", ref: this.counterRef },
      React.createElement("span", {}, this.state.number),
      React.createElement("button", { onClick: this.onClick }, "加1"),
      React.createElement(ClassCounter2)
    )
  }
}

const ADD = "ADD"
function reducer(state, action) {
  switch (action.type) {
    case ADD:
      return { count: state.count + 1 }
    default:
      return state
  }
}

function FunctionCounter(props) {
  const [countState, dispatch] = React.useReducer(reducer, { count: 0 })
  const [numberState, setNumberState] = React.useState({ number: 10 })

  const onClick = () => {
    dispatch({ type: ADD })
    console.log("button冒泡")
  }
  return React.createElement(
    "div",
    {
      id: "counter",
      onClick: () => {
        console.log("counter onClick")
      },
      onClickCapture: () => {
        console.log("counter onClickCapture")
      },
    },
    React.createElement("span", {}, countState.count),
    React.createElement(
      "button",
      { onClick, onClickCapture: () => console.log("button捕获") },
      "加1"
    ),
    React.createElement("div", {}),
    React.createElement("span", {}, numberState.number),
    React.createElement(
      "button",
      {
        onClick: () => setNumberState({ number: numberState.number - 1 }),
      },
      "-1"
    )
  )
}

ReactDOM.render(
  // React.createElement(FunctionCounter, { name: "计数器" }),
  React.createElement(ClassCounter, { name: "计数器" }),
  document.getElementById("root")
)
