import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';
import { verifyToken } from '../../../../lib/auth.js';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get attendance summary by course
    const attendanceSummary = await executeQuery(`
      SELECT 
        c.course_code, c.course_name,
        COUNT(*) as total_classes,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_percentage
      FROM attendance a
      JOIN courses c ON a.course_code = c.course_code
      WHERE a.student_id = ?
      GROUP BY c.course_code, c.course_name
      ORDER BY c.course_code
    `, [decoded.student_id]);

    // Get recent attendance records
    const recentAttendance = await executeQuery(`
      SELECT 
        c.course_name, a.date, a.status, a.session_type, a.remarks
      FROM attendance a
      JOIN courses c ON a.course_code = c.course_code
      WHERE a.student_id = ?
      ORDER BY a.date DESC, a.marked_at DESC
      LIMIT 20
    `, [decoded.student_id]);

    return NextResponse.json({ 
      success: true, 
      data: {
        summary: attendanceSummary,
        recent: recentAttendance
      }
    });
  } catch (error) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}