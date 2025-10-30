# 小程序自定义指南

## 一、基础介绍

### 1. 小程序基础信息修改

- **小程序名称与Logo**  
  在 `project.config.json` 文件中修改 `appid` 和 `projectname` 字段，替换 `miniprogram/images/logo.png` 文件可更改图标。

- **主题色调整**  
  编辑 `miniprogram/app.wxss` 文件中的 `--primary-color` 变量，修改全局主题色：

  ```css
  :root {
    --primary-color: #你的颜色值; /* 例如 #FF5733 */
  }
  ```

### 2. 课程类型与卡券配置

- **添加课程类型**  
  管理员在 "课程管理" 页面直接添加新课程，设置课程名称、类型（团课/私教）、时长和价格。

- **卡券管理**  
  在 "卡券设置" 中添加次卡/月卡，设置有效期和课程次数，支持设置不同卡券对应不同课程类型。

### 3. 页面样式调整

- **更换图片资源**  
  替换 `miniprogram/images/` 目录下的图片文件，保持文件名一致即可更新页面图片。

- **调整布局**  
  简单修改页面边距和字体大小可编辑对应页面的 `.wxss` 文件，例如 `miniprogram/pages/index/index.wxss`。

### 4. 预约规则配置

- **设置最低开课人数**  
  在课程添加页面设置 "最低人数"，未达标的课程将在开课前2小时自动取消。

- **取消预约规则**  
  编辑 `cloudfunctions/reserveClass/index.js` 中的 `cancelDeadline` 变量，设置取消预约的时间限制（单位：小时）。

### 5. 通知模板设置

- **配置微信订阅通知**  
  1. 在[微信公众平台](https://mp.weixin.qq.com/)申请通知模板
  2. 将模板ID填入 `cloudfunctions/sendTrailNotify/index.js` 中的 `templateId` 字段

## 二、技术细节

### 1. 项目代码结构解析

```
miniprogram/              # 小程序前端代码
├── app.js                # 全局入口文件
├── pages/                # 页面代码（按功能模块划分）
├── components/           # 可复用组件
├── images/               # 静态资源
└── app.wxss              # 全局样式

cloudfunctions/           # 云函数代码
├── login/                # 用户登录相关逻辑
├── reserveClass/         # 预约处理逻辑
├── manageSchedule/       # 课表管理逻辑
└── checkClassStatus/     # 课程状态检查逻辑
```

### 2. 云函数参数配置

- **自动取消课程参数**  
  在 `cloudfunctions/checkClassStatus/index.js` 中修改：

  ```javascript
  const thresholdHours = 2; // 开课前X小时检查人数
  const minStudents = 3;    // 默认最低开课人数
  ```

- **预约限制配置**  
  在 `cloudfunctions/reserveClass/index.js` 中调整：

  ```javascript
  const maxReservationsPerUser = 5; // 每人最大预约数
  ```

### 3. 数据库集合设计

- **主要集合结构**  
  - `people`: 用户信息（_id, name, phone, role, cards[]）
  - `schedules`: 课表信息（weekStart, courses[{date, type, lessons}]）
  - `booking`: 预约记录（studentId, courseDate, lessonIndex, status）
  - `cards`: 卡券信息（label, type, remainCount, expireDate）

- **索引建议**  
  为 `schedules` 集合的 `weekStart` 字段创建索引，优化查询性能。

### 4. API接口说明

- **用户登录**  
  调用 `login` 云函数，返回用户角色和ID：

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

- **数据库查询优化**  
  使用 `where` 条件过滤和 `limit` 限制返回数量，避免全表查询。

- **前端缓存策略**  
  对课程列表等不频繁变动的数据使用 `wx.setStorageSync` 进行本地缓存。

### 6. 第三方服务集成

- **支付功能**  
  如需添加支付，可集成微信支付API，在 `cloudfunctions/payment/index.js` 中实现支付逻辑。

- **短信通知**  
  对接短信服务提供商，在 `cloudfunctions/sendSms/index.js` 中添加短信发送代码。