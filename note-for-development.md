> 这是我个人使用的note，用于记录一些事项--cyz

## 计划

### 处理信息存储问题

删除schedules库中每门课程中的选课名单，只保留选课人数。

* 涉及的库：`schedules`,`people`(也许),`booking`(也许)
* 可能涉及的云函数和页面：

| 类型 | 名称 |
|:---:|:---:|
| 云函数 | `checkClassStatus`(已处理),<br>`deletePeople`(已处理),<br>`getBookingHistory`(已处理),<br>`manageSchedule`(已处理),<br>`updateSchedule`(已处理) |
| 页面 | `courseManage.js`(已处理),<br>`Schedules.js`(已处理),<br>`youkekebiao.js`(已处理),<br>`yueke.js`(已处理) |

#### TODO

* 检查上述页面并修改对应代码。
* 写`README.md`(可选).

### 页面`courseManage`的逻辑修改

* 修改删除课程的逻辑
* 添加提醒保存功能
  > 暂定实现逻辑：给页面添加一个属性`isEdited`，在进行页面操作和保存时，修改这一属性的值。

## 疑问

定义了云函数`checkClassStatus`，但没有见到调用，这是为何啊？