# 图编辑渲染引擎对比



2025.8.17



1. dagre-d3  d3; download: 80k/week; last publish: 6year gago.
2. React Flow  react;  download: 77k/week; last publish: 1 year ago.
3. AntV/G6. 图可视化。 [https://github.com/antvis/g6](https://github.com/antvis/g6) star: 11.6k; download: 109k/week; lastpublish: 2month ago; 底层用的AntV/G
4. LogicFlow [https://github.com/didi/LogicFlow](https://github.com/didi/LogicFlow)  star:10.4k; download: 6.5k/week ;  lastpublish: 1week ago;  滴滴
5. AntV/X6. 图编辑。svg；star: 6.2k; download: 39k/week; last publish: 1year ago; 底层没有用AntV/G
    1. antv/x6-geometry 只是定义一些几何属性和计算方法，没有绑定底层渲染。
    2. 核心渲染逻辑在 x6-react-shape 和 x6-vue-shape 视图层子包里 [https://github.com/antvis/X6/blob/master/packages/x6-react-shape/src/node.ts](https://github.com/antvis/X6/blob/master/packages/x6-react-shape/src/node.ts)
    3. 调度器 [https://github.com/antvis/X6/blob/master/packages/x6/src/renderer/scheduler.ts#L290](https://github.com/antvis/X6/blob/master/packages/x6/src/renderer/scheduler.ts#L290)
6. Drawflow [https://github.com/jerosoler/Drawflow](https://github.com/jerosoler/Drawflow) star:5.4k;  download: 11k/week; lastpublish:1year ago
7. JointJS [https://github.com/clientIO/joint](https://github.com/clientIO/joint) svg; star: 5k ; download: 20k/week; lastpublish: 2year ago deprecated; 
8. Coze



> 更新: 2025-08-17 05:38:09  
> 原文: <https://www.yuque.com/viruspc/el3mi0/gbly0c27bhe9g1ub>