> 这是我个人使用的note，用于记录一些事项--cyz

## 计划

处理信息存储问题：删除schedules库中每门课程中的选课名单，只保留选课人数。

* 涉及的库：`schedules`,`people`(也许),`booking`(也许)
* 可能涉及的云函数和页面：

| 类型 | 名称 |
|:---:|:---:|
| 云函数 | `checkClassStatus`,<br>`deletePeople`,<br>`getBookingHistory`,<br>`manageSchedule`,<br>`updateSchedule` |
| 页面 | `Schedules.js`,<br>`youkekebiao.js`,<br>`yueke.js`(已修改) |

## TODO

* 检查上述页面并添加其运行逻辑的描述.
* 写README.md(可选).