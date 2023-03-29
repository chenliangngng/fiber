import React from "react"
import ReactDOM from "react-dom/client"

const root = ReactDOM.createRoot(document.getElementById("root"))

const element = React.createElement(
  "div",
  { id: "A1" },
  React.createElement(
    "div",
    { id: "B1" },
    React.createElement("div", { id: "C1" }, "C1"),
    React.createElement("div", { id: "C2" })
  ),
  React.createElement("div", { id: "B2" })
)
root.render(element)
