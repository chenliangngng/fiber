1. 屏幕刷新率
   1s 60 桢，每桢 16.66ms

2. 桢
   每桢开头包含样式计算，布局，绘制
   JavaScript 引擎和页面渲染引擎在同一个渲染线程，GUI 渲染和 javascript 执行两者互斥

   1. 每桢任务

      1. 输入事件

      - Blocking input events(阻塞输入事件)
        - touch
        - wheel
      - Non-blocking input events(非阻塞输入事件)
        - click
        - keypress

      2. js 定时器
      3. 开始桢
         - Per frame events
           - window resize
           - scroll
           - media query change
      4. requestAnimationFrame
         - Frame callbacks
      5. Layout(布局)

         - Recalculate style(计算样式)
         - Update Layout(更新布局)

      6. Paint(绘制)
         - Compositing update
         - Paint invalidation
         - Record
      7. idle peroid(空闲阶段)

   2. requestAnimationFrame 每桢执行，渲染前执行
   3. requestIdleCallback 优先级低，但是超出 timeout 需要立即执行

      ```ts
      window.requestIdleCallback(
        (deadline: { timeRemaining: () => number; didTimeout: boolean }) => {},
        {
          timeout: 1000,
        }
      )
      ```

3. Fiber
   1. Fiber 之前的`Reconcilation`(协调)
      - React 会递归比对 virtualDOM 树，找出需要变动的节点，然后同步更新它们，这个过程即`Reconcilation`
      - `Reconcilation`期间，React 会一直占用浏览器资源，有可能导致用户触发事件不响应或者掉帧
      - 遍历无法中断，也有可能导致执行栈太深
   2. Fiber 概念
      - 通过调度策略合理分配 cpu 资源，提高用户响应速度
      - 通过 fiber 架构，让 Reconcilation 变成可中断。适时地让出 cpu 执行权
      1. Fiber 是一个执行单元
         - react 请求调度，浏览器先进行高优先级任务，在`idle peroid`阶段交给 react
         - 存在下一个任务单元就执行
         - 判断是否还有任务和时间
         - 有则执行，否则交回浏览器
      2. Fiber 是一个数据结构
         react 目前的做法是使用链表，每个 VirtualDOM 节点内部表示为一个 Fiber
         ```ts
         type Fiber = {
           type: any // 类型
           return: Fiber // 父节点
           child: Fiber // 指向第一个子节点
           sibling: Fiber // 指向下一个兄弟
         }
         ```
4. Fiber 执行阶段

   - 每次执行有两个阶段：Reconciliation(协调\render 阶段)和 Commit(提交阶段)
   - 协调阶段：可以认为是 Diff 阶段，这个阶段可以被中断，这个阶段会找出所有节点变更，例如节点新增、删除、属性变更等等，这些被 react 称之为副作用(Effect)
   - 提交阶段：将上一阶段计算出来的需要处理的副作用(Effects)一次性执行了。这个阶段必须同步执行，不能被打断

5. render 阶段
