# 手写js

- [throttle-不用setTimeout](#throttle-%E4%B8%8D%E7%94%A8settimeout)
- [throttle-用setTimeout](#throttle-%E7%94%A8settimeout)
- [debounce](#debounce)
- [柯里化](#%E6%9F%AF%E9%87%8C%E5%8C%96)
- [Promise.all](#promiseall)
- [Promise.race](#promiserace)
- [new操作符](#new%E6%93%8D%E4%BD%9C%E7%AC%A6)
- [call 和 apply](#call-%E5%92%8C-apply)
- [bind](#bind)
- [Promise retry](#promise-retry)
- [Promise chain](#promise-chain)
- [Promise chain + retry](#promise-chain--retry)
- [Generator =》 async](#generator--async)
- [带并发限制的异步调度器 Scheduler](#%E5%B8%A6%E5%B9%B6%E5%8F%91%E9%99%90%E5%88%B6%E7%9A%84%E5%BC%82%E6%AD%A5%E8%B0%83%E5%BA%A6%E5%99%A8-scheduler)

---

# throttle-不用setTimeout
    1. 每次调用，判断下curTIme-startTime与delay
    2. 闭包
    3. apply

```javascript
function throttle(func, delay){
  let startTime = 0;
  return function(){
    const curTime = new Date();
    if(curTime-startTime > delay){
      func.apply(this, arguments);
      startTime = curTime;
    }
  }
}
```





# throttle-用setTimeout
    1. timer，有则不执行, 执行完重置
    2. 保存this和arguments

```javascript
function throttle(func, delay){
  let timer;
  return function(...args){
    if(timer) return;
    let self = this;
    // let args = arguments;
    setTimeout(() => {
      func.apply(self, args);
      clearTimeout(timer);
    }, delay);
  }
}
```



# debounce
    3.  timer，每次执行前重置
    4. 保存this和arguments

```javascript
function debounce(func, delay){
  let timer;
  return function(...args){
    const self = this;
    // const args = arguments
    clearTimeout(timer);
    setTimeout(() => {
      func.apply(this, args)
    }, delay);
  }
}
```

# 柯里化
1. Function.length 返回该函数预接收参数的个数。
2. 闭包对参数做缓存
3. 返回函数中，
    1. 合并arguments。 Array.prototype.slice.call(arguments) 浅拷贝
    2. 参数个数不够递归，够了执行

```javascript
// function curry(fn, ...args) {
//   length = fn.length;
//   return function(){
//     const newArgs = args.concat(Array.prototype.slice.call(arguments)); 
//     if(newArgs.length < length) {
//       return curry.call(this, fn, ...newArgs);
//     } else {
//       return fn.apply(this, newArgs);
//     }
//   }
// }

function curry(fn, ...args) {
  length = fn.length;
  return function(...newArgs){
    const mergedArgs = [...args, ...newArgs];
    if((mergedArgs.length) < length) {
      return curry.call(this, fn, ...mergedArgs);
    } else {
      return fn.apply(this, mergedArgs);
    }
  }
}
```



# Promise.all


1. 返回的是一个Promise
2. Promise的值通过调用resolve来设置
3. 注意判断长度

```javascript
function all(promises) {
    let len = promises.length;
    let res = [];
    let count = 0;
    if (len) {
        return new Promise(function (resolve, reject) {
            for(let i=0; i<len; i++) {
                let promise = promises[i];
                promise.then(response => {
                    res[i] = response;
                    ++count;
                    if(count === len) resolve(res);
                }, error => {
                   reject(error);
                })
            }
        })
    }
}

function all2(promises){
  const results = [];

  const merged = promises.reduce(
    (acc, p) => acc.then(() => p).then(r => results.push(r)),
    Promise.resolve(null));

  return merged.then(() => results);
};
```

# Promise.race
1. 其实。。。只要一个resolve或reject了，后续的resolve或reject就无效了

```javascript
function race(...promises) {
  return new Promise((res, rej) => {
    promises.forEach(p => p.then(res).catch(rej));
  });
}
```

# new操作符
1. 拷贝原型链
2. 当构造函数返回非空对象(object或function)时, 即instanceof Object时，返回该对象。

```javascript
function New(func, ...args) {
    let res = Object.create(func.prototype, {});;
    let ret = func.apply(res, args);
    // if ((typeof ret === "object" || typeof ret === "function") && ret !== null) {
    if (ret instanceof Object){ 
      return ret;
    }
    return res;
}
```



# call 和 apply
1. 在context上增加一个属性，属性值为调用call/apply的函数 （新增属性不能和旧的冲突，可以用Symbol）
2. 执行context上新增的函数，保存执行结果
3. 删除该属性
4. 返回结果

```javascript
Function.prototype.call = function(context, ...args){
  const funcName = Symbol();
  context[funcName]  = this;
  const result = context[funcName](...args);
  delete context[funcName];
  return result; 
}

Function.prototype.apply = function(context, args){  // 与call的唯一不同之处
  const funcName = Symbol();
  context[funcName]  = this;
  const result = context[funcName](...args);
  delete context[funcName];
  return result; 
}
```

# bind
1. 返回的函数可能用于new，作为构造函数，此时this是resFn的实例
2. 通过中间构造函数tmp，浅拷贝原型，再赋予resFn。避免更改新函数的原型对象时，原函数的原型对象也会被改变。

```javascript
Function.prototype.bind = function(content, ...args) {
//    if(typeof this != "function") {
//        throw Error("not a function")
//    }
    let fn = this;
  
    let resFn = function() {
        return fn.apply(this instanceof resFn ? this : content,args.concat(...arguments) )
    }
    function tmp() {}
    tmp.prototype = this.prototype;
    resFn.prototype = new tmp();
    
    return resFn;
}
```



# Promise retry
1. attempt 函数，执行promise，并且当失败时重新attempt

```javascript
function retry(p, times, delay) {
  return new Promise((resolve, reject) => {

    function attempt() {
      p().then(
        (value) => resolve(value),
        (reason) => times-- ? attempt() : resolve(reason)
      );
    }

    attempt();

  });
}
```



# Promise chain
```javascript
function chainPromise(promiseFactories) {
  const results = [];
  return new Promise((resolve, reject) => {
    const chainedPromise = promiseFactories.reduce(
      (pre, cur) => pre.then(() => cur())
        .then((value) => results.push(value), (reason) => reject(reason)),
      Promise.resolve(null)
    );
    chainedPromise.then(() => resolve(results));
  });
}

```



# Promise chain + retry
```javascript
function chainPromise(promiseFactories, times) {
  const results = [];
  return new Promise((resolve, reject) => {
    const chainedPromise = promiseFactories.reduce(
      (pre, cur) => pre.then(() => retry(cur, times))
        .then((value) => results.push(value), (reason) => reject(reason)),
      Promise.resolve(null)
    );
    chainedPromise.then(() => resolve(results));
  });
}
```

# Generator =》 async
```javascript
// https://www.ruanyifeng.com/blog/2015/05/async.html
function* asyncFun() {
  let a = yield Promise.resolve("A");
  let b = yield new Promise((resolve) => setTimeout(() => resolve("B"), 1000));
  return a + b;
}

function spawn(genF) {
  return new Promise(function (resolve, reject) {
    const gen = genF();
    // move one step forward
    function step(nextF) {
      let next;
      try {
        next = nextF();
      } catch (e) {
        return reject(e);
      }
      if (next.done) {
        return resolve(next.value);
      }
      Promise.resolve(next.value).then(
        (v) => step(() => gen.next(v)),
        (e) => step(() => gen.throw(e))
      );
    }
    step(() => gen.next(undefined));
  });
}

spawn(asyncFun).then((value) => console.log(value));
```



# 带并发限制的异步调度器 Scheduler
```typescript
// 实现带并发限制的异步调度器 Scheduler
// JS实现一个带并发限制的异步调度器Scheduler.
// 保证同时运行的任务最多有两个。
// 完善代码中Scheduler类,
// 使得以下程序能正确输出

// 信号量模式
type Task = () => Promise<unknown>;
type QueuedTask = {
  task: Task;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}
class Scheduler {
  private _maxLength: number;
  private _waitingQueue: QueuedTask[];
  private _executingCount: number;

  constructor(maxLength: number) {
    this._maxLength = maxLength;
    this._waitingQueue = [];
    this._executingCount = 0;
  }

  /**
   * 关键点：
   * 1. 返回Promise以支持链式调用
   * 2. 返回Promise 的 resolve/reject 统一放到 queue 中管理，由 execute 方法取出执行。
   * @param task 异步任务函数
   * @returns Promise 任务执行的结果
   */
  async add(task: Task) {
    return new Promise((resolve, reject) => {
      this._waitingQueue.push({
        task,
        resolve,
        reject
      });
      this._execute();
    });

  }

  private async _execute() {
    if(this._executingCount >= this._maxLength) return;
    const nextQueuedTask = this._waitingQueue.shift();
    if(!nextQueuedTask) return;
    this._executingCount++;
    const { task, resolve, reject } = nextQueuedTask;
    try{
      const value = await task();
      resolve(value);
    } catch(e) {
      reject(e);
    } finally {
      this._executingCount--;
      this._execute();
    }
  }
}

const timeout = (time) =>
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });
const MAX_LENGTH = 2;

const scheduler = new Scheduler(MAX_LENGTH);
const addTask = (time, order) => {
  scheduler.add(() => {
    return timeout(time);
  })
    .then(() => console.log(order));
};
addTask(1000, "1");
addTask(500, "2");
addTask(300, "3");
addTask(400, "4");
// output; 2 3 1 4
// 一开始，1、2两个任务进入队列
// 500ms时，2完成，输出2，任务3进队
// 800ms时，3完成，输出3，任务4进队
// 1000ms时，1完成，输出1
// 1200ms时，4完成，输出4
```



> 更新: 2025-07-20 05:24:47  
> 原文: <https://www.yuque.com/viruspc/el3mi0/prna8l>