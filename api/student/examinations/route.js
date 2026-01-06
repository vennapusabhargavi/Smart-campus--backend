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

    // Get upcoming exams
    const upcomingExams = await executeQuery(`
      SELECT 
        ex.exam_id, ex.exam_name, ex.exam_type, ex.exam_date, ex.start_time, 
        ex.duration, ex.max_marks, ex.venue, ex.instructions,
        c.course_name, c.course_code
      FROM examinations ex
      JOIN courses c ON ex.course_code = c.course_code
      JOIN enrollments e ON c.course_code = e.course_code AND e.student_id = ?
      WHERE ex.exam_date >= CURDATE()
      ORDER BY ex.exam_date, ex.start_time
    `, [decoded.student_id]);

    // Get exam results
    const examResults = await executeQuery(`
      SELECT 
        ex.exam_name, ex.exam_type, ex.exam_date, ex.max_marks,
        c.course_name, c.course_code,
        er.marks_obtained, er.grade, er.remarks, er.result_date
      FROM exam_results er
      JOIN examinations ex ON er.exam_id = ex.exam_id
      JOIN courses c ON ex.course_code = c.course_code
      WHERE er.student_id = ?
      ORDER BY ex.exam_date DESC
    `, [decoded.student_id]);

    return NextResponse.json({ 
      success: true, 
      data: {
        upcoming: upcomingExams,
        results: examResults
      }
    });
  } catch (error) {
    console.error('Examinations fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}