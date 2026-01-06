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

    // Get courses that need feedback
    const coursesForFeedback = await executeQuery(`
      SELECT 
        c.course_code, c.course_name,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        e.faculty_id,
        cf.rating, cf.teaching_quality, cf.course_content, cf.assignments_quality,
        cf.comments, cf.feedback_date
      FROM enrollments e
      JOIN courses c ON e.course_code = c.course_code
      LEFT JOIN faculty f ON e.faculty_id = f.faculty_id
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN course_feedback cf ON c.course_code = cf.course_code AND cf.student_id = ?
      WHERE e.student_id = ? AND e.status = 'enrolled'
      ORDER BY c.course_code
    `, [decoded.student_id, decoded.student_id]);

    return NextResponse.json({ success: true, data: coursesForFeedback });
  } catch (error) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { course_code, faculty_id, rating, teaching_quality, course_content, assignments_quality, comments } = await request.json();

    // Check if feedback already exists
    const existing = await executeQuery(
      'SELECT id FROM course_feedback WHERE student_id = ? AND course_code = ?',
      [decoded.student_id, course_code]
    );

    if (existing.length > 0) {
      // Update existing feedback
      await executeQuery(`
        UPDATE course_feedback 
        SET rating = ?, teaching_quality = ?, course_content = ?, assignments_quality = ?, comments = ?, feedback_date = CURDATE()
        WHERE student_id = ? AND course_code = ?
      `, [rating, teaching_quality, course_content, assignments_quality, comments, decoded.student_id, course_code]);
    } else {
      // Insert new feedback
      await executeQuery(`
        INSERT INTO course_feedback (student_id, course_code, faculty_id, rating, teaching_quality, course_content, assignments_quality, comments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [decoded.student_id, course_code, faculty_id, rating, teaching_quality, course_content, assignments_quality, comments]);
    }

    return NextResponse.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}