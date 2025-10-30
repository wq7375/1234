# 小程序自定义指南

> 本文档由大模型生成。

## 目录

- [小程序自定义指南](#小程序自定义指南)
  - [目录](#目录)
  - [一、基础介绍](#一基础介绍)
    - [1. 小程序基础信息修改](#1-小程序基础信息修改)
    - [2. 课程类型与卡券配置](#2-课程类型与卡券配置)
    - [3. 页面样式调整](#3-页面样式调整)
    - [4. 预约规则配置](#4-预约规则配置)
    - [5. 通知模板设置](#5-通知模板设置)
  - [二、技术细节](#二技术细节)
    - [1. 数据库集合设计](#1-数据库集合设计)
    - [2. 项目代码结构解析](#2-项目代码结构解析)
    - [3. 云函数参数配置](#3-云函数参数配置)
      - [云函数说明](#云函数说明)
        - [addBanner (添加轮播图)](#addbanner-添加轮播图)
        - [addPeople (添加用户)](#addpeople-添加用户)
        - [deleteBanner (删除轮播图)](#deletebanner-删除轮播图)
        - [deletePeople (删除用户)](#deletepeople-删除用户)
        - [getInfo (获取用户信息)](#getinfo-获取用户信息)
        - [deleteTeacher (删除教师)](#deleteteacher-删除教师)
        - [deleteTrialLesson (删除体验课)](#deletetriallesson-删除体验课)
        - [getBookingHistory (获取预约历史)](#getbookinghistory-获取预约历史)
        - [sendTrailNotify (发送体验课通知)](#sendtrailnotify-发送体验课通知)
        - [updateTeacher (更新教师信息)](#updateteacher-更新教师信息)
        - [checkClassStatus (检查课程状态)](#checkclassstatus-检查课程状态)
        - [getLessonBookings (获取课程预约)](#getlessonbookings-获取课程预约)
        - [login (用户登录)](#login-用户登录)
        - [manageSchedule (管理课表)](#manageschedule-管理课表)
        - [reserveClass (预约课程)](#reserveclass-预约课程)
        - [updatePeople (更新用户信息)](#updatepeople-更新用户信息)
        - [updateSchedule (更新课表)](#updateschedule-更新课表)
        - [quickstartFunctions (快速启动函数)](#quickstartfunctions-快速启动函数)
      - [关键参数配置](#关键参数配置)
    - [4. API接口说明](#4-api接口说明)
    - [5. 性能优化建议](#5-性能优化建议)
    - [6. 第三方服务集成](#6-第三方服务集成)

## 一、基础介绍

### 1. 小程序基础信息修改

- **小程序名称与Logo**在 `project.config.json` 文件中修改 `appid` 和 `projectname` 字段，替换 `miniprogram/images/logo.png` 文件可更改图标。
- **主题色调整**
  编辑 `miniprogram/app.wxss` 文件中的 `--primary-color` 变量，修改全局主题色：

  ```css
  :root {
    --primary-color: #你的颜色值; /* 例如 #FF5733 */
  }
  ```

### 2. 课程类型与卡券配置

- **添加课程类型**管理员在 "课程管理" 页面直接添加新课程，设置课程名称、类型（团课/私教）、时长和价格。
- **卡券管理**
  在 "卡券设置" 中添加次卡/月卡，设置有效期和课程次数，支持设置不同卡券对应不同课程类型。

### 3. 页面样式调整

- **更换图片资源**替换 `miniprogram/images/` 目录下的图片文件，保持文件名一致即可更新页面图片。
- **调整布局**
  简单修改页面边距和字体大小可编辑对应页面的 `.wxss` 文件，例如 `miniprogram/pages/index/index.wxss`。

### 4. 预约规则配置

- **设置最低开课人数**在课程添加页面设置 "最低人数"，未达标的课程将在开课前2小时自动取消。
- **取消预约规则**
  编辑 `cloudfunctions/reserveClass/index.js` 中的 `cancelDeadline` 变量，设置取消预约的时间限制（单位：小时）。

### 5. 通知模板设置

- **配置微信订阅通知**
  1. 在[微信公众平台](https://mp.weixin.qq.com/)申请通知模板
  2. 将模板ID填入 `cloudfunctions/sendTrailNotify/index.js` 中的 `templateId` 字段

## 二、技术细节

### 1. 数据库集合设计

- **主要集合结构**

  - `people`: 用户信息（_id, name, phone, role, cards[]）
  - `schedules`: 课表信息（weekStart, courses[{date, type, lessons}]）
  - `booking`: 预约记录（studentId, courseDate, lessonIndex, status）
  - `cards`: 卡券信息（label, type, remainCount, expireDate）
- **索引建议**
  为 `schedules` 集合的 `weekStart` 字段创建索引，优化查询性能。

### 2. 项目代码结构解析

```
miniprogram/              # 小程序前端代码
├── app.js                # 全局入口文件
├── pages/                # 页面代码（按功能模块划分）
│   ├── admin/            # 管理员相关页面
│   │   ├── bannerManage/ # 轮播图管理页面
│   │   ├── courseManage/ # 课程管理页面
│   │   ├── schedules/    # 课表管理页面
│   │   ├── studentManage/ # 学生管理页面
│   │   ├── teacherManage/ # 教师管理页面
│   │   └── trailManage/  # 体验课管理页面
│   ├── adminHome/        # 管理员首页
│   ├── experience/       # 体验课页面
│   ├── index/            # 小程序首页
│   ├── login/            # 登录页面
│   ├── my/               # 个人中心页面
│   ├── studentHome/      # 学生首页
│   ├── teacherDetail/    # 教师详情页面
│   ├── youke/            # 游客页面
│   ├── youkekebiao/      # 游客课表页面
│   └── yueke/            # 约课页面
├── components/           # 可复用组件
├── images/               # 静态资源
└── app.wxss              # 全局样式

cloudfunctions/           # 云函数代码
├── addBanner/            # 添加轮播图
├── addPeople/            # 添加用户
├── checkClassStatus/     # 检查课程状态
├── deleteBanner/         # 删除轮播图
├── deletePeople/         # 删除用户
├── deleteTeacher/        # 删除教师
├── deleteTrialLesson/    # 删除体验课
├── getBookingHistory/    # 获取预约历史
├── getInfo/              # 获取信息
├── getLessonBookings/    # 获取课程预约
├── login/                # 用户登录
├── manageSchedule/       # 管理课表
├── quickstartFunctions/  # 快速启动函数
├── reserveClass/         # 预约课程
├── sendTrailNotify/      # 发送体验课通知
├── updatePeople/         # 更新用户信息
├── updateSchedule/       # 更新课表
└── updateTeacher/        # 更新教师信息
```

### 3. 云函数参数配置

#### 云函数说明

##### addBanner (添加轮播图)

**功能**：管理员上传轮播图并保存到数据库
**参数**：

- `cloudPath`: 云存储路径
- `fileID`: 上传文件的ID

**权限验证**：仅管理员可操作，非管理员会自动删除已上传图片
**关键逻辑**：

```javascript
// 管理员验证
const user = await db.collection('people').where({
  _openid: wxContext.OPENID,
  role: 'admin'
}).get()
// 保存轮播图记录
await db.collection('banners').add({
  data: { image: fileID, createdAt: db.serverDate() }
})
```

##### addPeople (添加用户)

**功能**：管理员添加新用户（学员/教师）
**参数**：

- `data.name`: 姓名（必填）
- `data.phone`: 手机号（必填）
- `data.role`: 角色（默认：student）
- `data.cards`: 卡券信息（学员特有）

**数据验证**：

```javascript
if (!data.name || !data.phone) {
  return { success: false, error: '姓名和手机号不能为空' }
}
// 查重检查
const duplicateCheck = await db.collection('people').where({
  name: name,
  phone: phone
}).get()
```

##### deleteBanner (删除轮播图)

**功能**：删除轮播图并清理云存储图片
**参数**：`id` - 轮播图记录ID

**关键逻辑**：

1. 验证管理员权限
2. 获取轮播图信息并删除云存储图片
3. 从数据库删除记录：`await db.collection('banners').doc(id).remove()`

##### deletePeople (删除用户)

**功能**：删除用户并清理相关预约记录
**参数**：`id` - 用户记录ID

**级联操作**：

- 查询并删除用户所有预约记录
- 更新课程预约人数：`updatedBookedCount = Math.max(0, (lesson.bookedCount || 0) - 1)`
- 最终删除用户记录

##### getInfo (获取用户信息)

**功能**：获取当前登录用户信息
**返回值**：用户完整信息（含角色、卡券等）
**逻辑**：

```javascript
const existRes = await db.collection('people').where({
  _openid: wxContext.OPENID
}).get()
return existRes.data.length > 0 ? existRes.data[0] : null
```

##### deleteTeacher (删除教师)

**功能**：删除教师信息并清理相关资源
**参数**：`id` - 教师记录ID

**关键操作**：

1. 验证管理员权限
2. 删除教师头像和视频文件：

```javascript
const fileList = []
if (teacher.data.avatar) fileList.push(teacher.data.avatar)
if (teacher.data.video) fileList.push(teacher.data.video)
await cloud.deleteFile({ fileList })
```

3. 删除教师记录：`await db.collection('teachers').doc(id).remove()`

##### deleteTrialLesson (删除体验课)

**功能**：删除体验课记录
**参数**：`id` - 体验课记录ID

**实现逻辑**：

```javascript
try {
  await db.collection('trialLessons').doc(id).remove();
  return { success: true };
} catch (e) {
  return { success: false, error: e };
}
```

##### getBookingHistory (获取预约历史)

**功能**：查询学生的课程预约历史
**参数**：`studentId` - 学生ID

**数据组合**：

1. 获取预约记录并按日期排序
2. 关联查询课表信息
3. 组合返回完整预约详情：

```javascript
return bookingRes.data.map(booking => {
  // 查找对应课程和课节信息
  const schedule = scheduleMap[booking.weekStart]
  const courseDay = schedule.courses.find(c => c.date === booking.courseDate)
  const lesson = courseDay.lessons[booking.lessonIndex]
  
  return {
    _id: booking._id,
    courseDate: booking.courseDate,
    courseInfo: { /* 组合课程详情 */ }
  }
})
```

##### sendTrailNotify (发送体验课通知)

**功能**：发送体验课预约通知
**参数**：

- `name`: 姓名
- `mobile`: 手机号
- `date`: 日期
- `remark`: 备注信息

**配置要求**：需替换管理员OpenID和模板ID

```javascript
await cloud.openapi.subscribeMessage.send({
  touser: adminOpenId, // 管理员OpenID
  templateId: '订阅消息模板ID', // 需替换为实际模板ID
  data: {
    name1: { value: name },
    tel2: { value: mobile },
    date3: { value: date },
    thing4: { value: remark || '无' }
  }
})
```

##### updateTeacher (更新教师信息)

**功能**：更新教师资料
**参数**：

- `id`: 教师ID
- `data`: 更新数据（头像、姓名、简介等）

**更新逻辑**：

```javascript
// 仅更新提供的字段
const updateData = {}
if (data.avatar !== undefined) updateData.avatar = data.avatar
if (data.name !== undefined) updateData.name = data.name
// ...其他字段

// 添加更新时间
updateData.updateTime = db.serverDate()

await db.collection('teachers').doc(id).update({ data: updateData })
```

##### checkClassStatus (检查课程状态)

**功能**：检查课程人数并处理取消逻辑
**参数**：

- `weekStart`: 周起始日期
- `currentTime`: 当前时间
- `thresholdTime`: 阈值时间（通常为课程开始前2小时）

**核心逻辑**：

```javascript
// 检查课程是否在2小时内开始且未处理过
if (courseDateTime > now &&
    courseDateTime <= threshold &&
    lesson.status !== 'cancelled' &&
    lesson.status !== 'checked') {
  
  // 检查人数是否不足
  if (lesson.bookedCount < lesson.minCount) {
    // 取消课程并通知学员
    const cancelResult = await cancelClassAndNotify(
      weekStart, course.date, course.type, lessonId, lesson
    );
  
    if (cancelResult.success) {
      // 标记课程为已取消
      courses[i].lessons[lessonId].status = 'cancelled';
      courses[i].lessons[lessonId].cancelledAt = new Date();
    }
  }
}
```

##### getLessonBookings (获取课程预约)

**功能**：获取课程预约名单
**参数**：`studentId` - 学生ID

**实现逻辑**：

```javascript
// 查询预约记录
const bookingRes = await db.collection('booking')
  .where({
    studentId: studentId
  })
  .orderBy('courseDate', 'desc')
  .get()

// 组合学生信息
const students = bookingRes.data.map(booking => {
  const student = studentMap[booking.studentId]
  return {
    studentId: booking.studentId,
    name: student ? student.name : '未知用户',
    cardLabel: booking.cardLabel
  }
})
```

##### login (用户登录)

**功能**：用户登录认证
**参数**：

- `name`: 姓名
- `phone`: 手机号

**登录流程**：

```javascript
// 查是否已有当前 openid
const existRes = await db.collection('people').where({
  _openid: wxContext.OPENID
}).get()

// 第一个用户自动成为管理员
if (allRes.data.length === 0) {
  const addRes = await db.collection('people').add({
    data: {
      name, phone, role: 'admin', _openid: wxContext.OPENID, cards: []
    }
  })
  return { success: true, role: 'admin', userId: addRes._id }
}
```

##### manageSchedule (管理课表)

**功能**：课表管理（创建/更新/删除/复制上周课表）
**参数**：

- `operation`: 操作类型(create/update/delete/copy)
- `data`: 课表数据

**权限验证**：

```javascript
// 检查管理员权限
const userRes = await db.collection('people')
  .where({ _openid: wxContext.OPENID })
  .get()

if (userRes.data.length === 0 || userRes.data[0].role !== 'admin') {
  return { success: false, message: '无管理员权限' }
}
```

##### reserveClass (预约课程)

**功能**：课程预约与取消
**参数**：

- `action`: 操作类型(reserve/cancel)
- `studentId`: 学生ID
- `cardLabel`: 卡券标签
- `weekStart`: 周起始日期
- `type`: 课程类型
- `date`: 课程日期
- `lessonIndex`: 课节索引
- `isForce`: 是否强制操作

**预约逻辑**：

```javascript
// 检查是否已预约
const existBooking = await db.collection('booking').where({
  studentId, weekStart, courseType, courseDate, lessonIndex, status: 1
}).get()

if (existBooking.data.length > 0) {
  return { success: false, msg: '已预约过该课程' }
}

// 次卡校验剩余次数
if (isCountCard && (!card.remainCount || card.remainCount <= 0)) {
  return { success: false, msg: '剩余次数不足' }
}
```

##### updatePeople (更新用户信息)

**功能**：更新用户资料
**参数**：

- `id`: 用户ID
- `data`: 更新数据（姓名、手机号、角色等）

**更新逻辑**：

```javascript
// 权限验证
const user = await db.collection('people').where({
  _openid: openid,
  role: 'admin'
}).get()

if (user.data.length === 0) {
  return { success: false, error: '无权限操作' }
}

// 查重检查
const duplicateCheck = await db.collection('people')
  .where({
    name: data.name,
    phone: data.phone,
    _id: db.command.neq(id) // 排除当前记录
  })
  .get()

// 执行更新
const result = await db.collection('people').doc(id).update({
  data: {
    ...data,
    updateTime: db.serverDate()
  }
})
```

##### updateSchedule (更新课表)

**功能**：更新课程预约状态
**参数**：

- `weekStart`: 周起始日期
- `type`: 课程类型
- `date`: 课程日期
- `lessonIndex`: 课节索引
- `action`: 操作类型(book/cancel/forceBook/forceCancel)
- `student`: 学生信息

**核心逻辑**：

```javascript
// 查询课表
const res = await db.collection('schedules').where({ weekStart }).get()
const courses = JSON.parse(JSON.stringify(doc.courses))

// 查找对应课程
const courseIdx = courses.findIndex(c => c.type == type && c.date == date)
const lessonsObj = courses[courseIdx].lessons

// 更新预约人数
if (action === 'book' || action === 'forceBook') {
  lesson.bookedCount += 1
} else if (action === 'cancel' || action === 'forceCancel') {
  lesson.bookedCount -= 1
  if (lesson.bookedCount < 0) lesson.bookedCount = 0
}

// 保存更新
await db.collection('schedules').doc(doc._id).update({
  data: { courses: courses }
})
```

##### quickstartFunctions (快速启动函数)

**功能**：云开发基础功能示例集合
**包含功能**：

- `getOpenId`: 获取用户OpenID
- `getMiniProgramCode`: 生成小程序二维码
- `createCollection`: 创建数据库集合
- `selectRecord`: 查询数据
- `updateRecord`: 更新数据
- `insertRecord`: 插入数据
- `deleteRecord`: 删除数据

**调用示例**：

```javascript
// 调用方式
wx.cloud.callFunction({
  name: 'quickstartFunctions',
  data: {
    type: 'getOpenId' // 指定功能类型
  }
})
```

#### 关键参数配置

- **自动取消课程参数** (`checkClassStatus/index.js`)：

  ```javascript
  const thresholdHours = 2; // 开课前X小时检查人数
  const minStudents = 3;    // 默认最低开课人数
  ```

- **预约限制配置** (`reserveClass/index.js`)：

  ```javascript
  const maxReservationsPerUser = 5; // 每人最大预约数
  ```

### 4. API接口说明

- **用户登录**调用 `login` 云函数，返回用户角色和ID：

  ```javascript
  wx.cloud.callFunction({
    name: 'login',
    data: { name: '用户名', phone: '手机号' }
  })
  ```

- **课程预约**
  调用 `reserveClass` 云函数：

  ```javascript
  wx.cloud.callFunction({
    name: 'reserveClass',
    data: {
      action: 'reserve',
      studentId: '用户ID',
      courseDate: '2023-10-30',
      lessonIndex: 0
    }
  })
  ```

### 5. 性能优化建议

- **数据库查询优化**使用 `where` 条件过滤和 `limit` 限制返回数量，避免全表查询。
- **前端缓存策略**
  对课程列表等不频繁变动的数据使用 `wx.setStorageSync` 进行本地缓存。

### 6. 第三方服务集成

- **支付功能**如需添加支付，可集成微信支付API，在 `cloudfunctions/payment/index.js` 中实现支付逻辑。
- **短信通知**
  对接短信服务提供商，在 `cloudfunctions/sendSms/index.js` 中添加短信发送代码。
