import React from "./react"
import ReactDOM from "./react-dom"

const CounterContext = React.createContext()
class ClassCounter2 extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    return React.createElement(
      "div",
      { id: "counter2" },
      123,
      React.createElement(
        CounterContext.Consumer,
        {},
        {
          type: (value) =>
            React.createElement(
              "div",
              {
                onClick: () => {
                  console.log("s", value)
                  value.dispatch({ state: value.state.state + 1 })
                },
              },
              value.state.state + "s"
            ),
        }
      )
    )
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

function ChildFunction({ numberState, handleClick }) {
  console.log("ChildFunction render", numberState)
  return React.createElement(
    "button",
    { onClick: handleClick },
    numberState.number
  )
}

const Child = React.memo(ChildFunction)

function FunctionCounter(props) {
  console.log("FunctionCounter render")
  const { state, dispatch: contextDispatch } = React.useContext(CounterContext)
  const [countState, dispatch] = React.useReducer(reducer, { count: 0 })
  const [numberState, setNumberState] = React.useState({ number: 10 })

  const onClick = () => {
    dispatch({ type: ADD })
    console.log("button冒泡")
  }
  const minus = () => setNumberState({ number: setNumberState.number - 1 })
  const memoNumber = React.useMemo(() => {
    return numberState
  }, [numberState.number])

  // React.useEffect(() => {
  // 这里有bug导致不停刷新组件
  //   setNumberState({ number: 99999 })
  // }, [numberState.number])

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
    React.createElement("div", {}, props?.state?.state),
    React.createElement("div", {}, state?.state),
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
    ),

    React.createElement(ClassCounter, {}),
    React.createElement(Child, {
      numberState: memoNumber,
      // handleClick: minus,
    })
  )
}

function App() {
  const [state, dispatch] = React.useState({ state: 33 })
  return React.createElement(
    CounterContext.Provider,
    { value: { state, dispatch } },
    React.createElement(FunctionCounter, {})
  )
}

ReactDOM.render(
  React.createElement(App, { name: "计数器" }),
  document.getElementById("root")
)
