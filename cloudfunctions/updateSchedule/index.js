const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { weekStart, type, date, lessonIndex, action, student } = event
  const db = cloud.database()
  const _ = db.command

  console.log('updateSchedule 接收到参数:', event)

  // 查询本周课表
  const res = await db.collection('schedules').where({ weekStart }).get()
  if (!res.data.length) {
    console.log('课表不存在，weekStart:', weekStart)
    return { success: false, msg: '课表不存在' }
  }
  
  const doc = res.data[0]
  console.log('找到课表文档:', doc._id)
  
  // 深拷贝courses数组
  const courses = JSON.parse(JSON.stringify(doc.courses))
  console.log('课程数量:', courses.length)

  // 找到对应课程和课时
  const courseIdx = courses.findIndex(c => c.type == type && c.date == date)
  if (courseIdx === -1) {
    console.log('当天无课，date:', date, 'type:', type)
    return { success: false, msg: '当天无课' }
  }
  
  const lessonsObj = courses[courseIdx].lessons
  // 检查课程ID是否存在
  if (!lessonsObj || !lessonsObj.hasOwnProperty(lessonIndex)) {
    console.log('课时不存在，lessonIndex:', lessonIndex)
    return { success: false, msg: '课时不存在' }
  }
  
  const lesson = lessonsObj[lessonIndex]
  // console.log('找到课时，原学生列表:', lesson.students)

  // 操作逻辑
  const isForce = action.includes('force')
  
  if (action === 'book' || action === 'forceBook') {
    // 非强制预约时检查人数限制
    if (!isForce && lesson.bookedCount >= lesson.maxCount) {
      console.log('课程已约满')
      return { success: false, msg: '已约满' }
    }

    // 增加预约人数
    lesson.bookedCount += 1

  // 在updateSchedule云函数中修改取消逻辑
  } else if (action === 'cancel' || action === 'forceCancel') {
    // 减少预约人数
    lesson.bookedCount -= 1
    if (lesson.bookedCount < 0) lesson.bookedCount = 0
  }
  // 更新整个courses数组
  try {
    await db.collection('schedules').doc(doc._id).update({ 
      data: { 
        courses: courses
      } 
    })
    console.log('更新数据库成功')
  } catch (error) {
    console.error('更新数据库失败:', error)
    return { success: false, msg: '更新数据库失败' }
  }
  
  return { success: true }
}