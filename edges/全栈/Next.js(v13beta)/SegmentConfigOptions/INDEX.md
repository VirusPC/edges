# Segment Config Options

The Route Segment Config Options allows you configure the behavior of a [Page](https://beta.nextjs.org/docs/routing/pages-and-layouts), [Layout](https://beta.nextjs.org/docs/routing/pages-and-layouts), or [Route Handler](https://beta.nextjs.org/docs/routing/route-handlers) by directly exporting the following variables:  


```tsx
export const dynamic = 'auto'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
export function generateStaticParams(...)
```



> 更新: 2023-04-20 14:01:21  
> 原文: <https://www.yuque.com/viruspc/el3mi0/bb6tg8lmron704b3>