# 代码示例

- [**1. MVC 示例**](#1-mvc-%E7%A4%BA%E4%BE%8B)
  * [**重点：**](#%E9%87%8D%E7%82%B9)
- [**2. MVP 示例**](#2-mvp-%E7%A4%BA%E4%BE%8B)
  * [**重点：**](#%E9%87%8D%E7%82%B9-1)
- [**3. MVVM 示例**](#3-mvvm-%E7%A4%BA%E4%BE%8B)
  * [**重点：**](#%E9%87%8D%E7%82%B9-2)
- [**总结代码对比**](#%E6%80%BB%E7%BB%93%E4%BB%A3%E7%A0%81%E5%AF%B9%E6%AF%94)

---

下面是用 **TypeScript** 写的简化代码示例，分别体现 **MVC**、**MVP** 和 **MVVM** 的区别。代码中重点通过注释说明各模式的核心思想和组件间的关系。

***

### **1. MVC 示例**

MVC 中的 **Controller** 负责处理用户输入，更新 **Model**，并通知 **View** 更新界面。

```typescript
// Model: 管理数据和业务逻辑
class Model {
  private data: string = "Initial Data";

  getData() {
    return this.data;
  }

  setData(newData: string) {
    this.data = newData;
  }
}

// View: 负责显示用户界面
class View {
  render(data: string) {
    console.log(`View is rendering: ${data}`);
  }
}

// Controller: 处理用户输入，协调 Model 和 View
class Controller {
  private model: Model;
  private view: View;

  constructor(model: Model, view: View) {
    this.model = model;
    this.view = view;
  }

  handleUserInput(newData: string) {
    // 更新 Model
    this.model.setData(newData);
    // 更新 View
    this.view.render(this.model.getData());
  }
}

// 使用 MVC
const model = new Model();
const view = new View();
const controller = new Controller(model, view);

// 模拟用户输入
controller.handleUserInput("Updated Data");
```

#### **重点：**

* **Controller** 是核心，负责协调 **Model** 和 **View**。
* **View** 和 **Controller** 耦合较高，直接依赖 **Controller** 的操作。

***

### **2. MVP 示例**

MVP 中的 **Presenter** 是核心，负责处理用户输入和更新 **Model**，并通过接口通知 **View** 更新界面。

```typescript
// Model: 管理数据和业务逻辑
class Model {
  private data: string = "Initial Data";

  getData() {
    return this.data;
  }

  setData(newData: string) {
    this.data = newData;
  }
}

// View: 定义接口，负责显示用户界面
interface IView {
  render(data: string): void;
}

// View 实现接口
class View implements IView {
  render(data: string) {
    console.log(`View is rendering: ${data}`);
  }
}

// Presenter: 处理用户输入，协调 Model 和 View
class Presenter {
  private model: Model;
  private view: IView;

  constructor(model: Model, view: IView) {
    this.model = model;
    this.view = view;
  }

  handleUserInput(newData: string) {
    // 更新 Model
    this.model.setData(newData);
    // 更新 View
    this.view.render(this.model.getData());
  }
}

// 使用 MVP
const model = new Model();
const view = new View();
const presenter = new Presenter(model, view);

// 模拟用户输入
presenter.handleUserInput("Updated Data");
```

#### **重点：**

* **Presenter** 是核心，完全独立于 **View**，通过接口与 **View** 通信。
* **View** 更加被动，只负责显示界面。

***

### **3. MVVM 示例**

MVVM 中的 **ViewModel** 是核心，负责管理状态和逻辑，**View** 通过数据绑定自动更新界面。

```typescript
// Model: 管理数据和业务逻辑
class Model {
  private data: string = "Initial Data";

  getData() {
    return this.data;
  }

  setData(newData: string) {
    this.data = newData;
  }
}

// ViewModel: 管理状态和逻辑
class ViewModel {
  private model: Model;
  public viewData: string = ""; // 供 View 绑定的数据

  constructor(model: Model) {
    this.model = model;
    this.viewData = model.getData();
  }

  updateData(newData: string) {
    // 更新 Model
    this.model.setData(newData);
    // 同步更新 ViewData
    this.viewData = this.model.getData();
  }
}

// View: 通过绑定 ViewModel 的数据更新界面
class View {
  private viewModel: ViewModel;

  constructor(viewModel: ViewModel) {
    this.viewModel = viewModel;
  }

  render() {
    console.log(`View is rendering: ${this.viewModel.viewData}`);
  }
}

// 使用 MVVM
const model = new Model();
const viewModel = new ViewModel(model);
const view = new View(viewModel);

// 初始渲染
view.render();

// 模拟用户输入
viewModel.updateData("Updated Data");
// 数据绑定自动更新
view.render();
```

#### **重点：**

* **ViewModel** 是核心，管理状态并将数据提供给 **View**。
* **View** 通过数据绑定机制（模拟为直接访问 `viewData`）自动更新界面。
* **View** 和 **ViewModel** 解耦，**ViewModel** 不直接操作 **View**。

***

### **总结代码对比**

| **模式** | **核心组件** | **数据流** | **耦合性** | **代码特点** |
| --- | --- | --- | --- | --- |
| **MVC** | Model, View, Controller | 双向数据流 | View 和 Controller 耦合较高 | Controller 直接更新 View |
| **MVP** | Model, View, Presenter | 双向数据流 | View 和 Presenter 解耦 | Presenter 通过接口更新 View |
| **MVVM** | Model, View, ViewModel | 单向或双向数据流 | View 和 ViewModel 解耦 | View 通过绑定机制自动更新界面 |

这三种模式的代码示例展示了它们在架构设计和组件之间的关系上的差异，可以根据项目需求选择合适的模式。


> 更新: 2025-08-02 10:48:57  
> 原文: <https://www.yuque.com/viruspc/el3mi0/hepxw71ksgxgw2t5>