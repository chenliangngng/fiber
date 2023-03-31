import React from "./react"
import ReactDOM from "./react-dom"

class ClassCounter extends React.Component {
  constructor(props) {
    super(props)
    this.state = { number: 0 }
  }
  onClick = () => {
    this.setState((state) => ({ number: state.number + 1 }))
  }
  render() {
    return React.createElement(
      "div",
      { id: "counter" },
      React.createElement("span", {}, this.state.number),
      React.createElement("button", { onClick: this.onClick }, "加1")
    )
  }
}

ReactDOM.render(
  React.createElement(ClassCounter, { name: "计数器" }),
  document.getElementById("root")
)
