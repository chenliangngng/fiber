import React from "./react"
import ReactDOM from "./react-dom"

const style = { border: "3px solid red", margin: "5px" }

const Element2 = (
  <div id="A1" style={style}>
    <div id="B1" style={style}>
      <div id="C1" style={style}>
        C1
      </div>
      <div id="C1" style={style}>
        C2
      </div>
    </div>
    <div id="B2" style={style}></div>
  </div>
)

const Element1 = React.createElement(
  "div",
  { id: "A1", style },
  React.createElement(
    "div",
    { id: "B1", style },
    React.createElement("div", { id: "C1", style }, "C1"),
    React.createElement("div", { id: "C2", style }, "C2")
  ),
  React.createElement("div", { id: "B2", style })
)
ReactDOM.render(Element1, document.getElementById("root"))
