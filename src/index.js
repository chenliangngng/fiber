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

const render2 = document.getElementById("render2")
render2.addEventListener("click", () => {
  const Element3 = React.createElement(
    "div",
    { id: "A1-new", style },
    React.createElement(
      "div",
      { id: "B1-new", style },
      React.createElement("div", { id: "C1-new", style }, "C1-new"),
      React.createElement("div", { id: "C2-new", style }, "C2-new")
    ),
    React.createElement("div", { id: "B2-new", style }),
    React.createElement("div", { id: "B3-new", style })
  )
  ReactDOM.render(Element3, document.getElementById("root"))
})

const render3 = document.getElementById("render3")
render3.addEventListener("click", () => {
  const Element4 = React.createElement(
    "div",
    { id: "A1-new2", style },
    React.createElement(
      "div",
      { id: "B1-new2", style },
      React.createElement("div", { id: "C1-new2", style }, "C1-new2"),
      React.createElement("div", { id: "C2-new2", style }, "C2-new2")
    ),
    React.createElement("div", { id: "B2-new", style })
  )
  ReactDOM.render(Element4, document.getElementById("root"))
})
