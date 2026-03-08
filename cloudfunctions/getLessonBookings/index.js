// 云函数：getLessonBookings
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { weekStart, date, type, lessonIndex } = event
  
  try {
    // 查询预约记录
    const bookingRes = await db.collection('booking')
      .where({
        weekStart: weekStart,
        courseDate: date,
        courseType: type,
        lessonIndex: lessonIndex
      })
      .get()
    
    if (bookingRes.data.length === 0) {
      return { success: true, data: [] }
    }
    
    // 获取学生ID列表
    const studentIds = [...new Set(bookingRes.data.map(booking => booking.studentId))]
    
    // 查询学生信息
    const peopleRes = await db.collection('people')
      .where({
        _id: db.command.in(studentIds)
      })
      .get()
    
    // 创建学生信息映射
    const studentMap = {}
    peopleRes.data.forEach(student => {
      studentMap[student._id] = student
    })
    
    // 组合数据
    const students = bookingRes.data.map(booking => {
      const student = studentMap[booking.studentId]
      return {
        studentId: booking.studentId,
        name: student ? student.name : '未知用户',
        cardLabel: booking.cardLabel
      }
    })
    
    return { success: true, data: students }
  } catch (error) {
    console.error('获取课程预约名单失败:', error)
    return { success: false, error: error.message }
  }
}