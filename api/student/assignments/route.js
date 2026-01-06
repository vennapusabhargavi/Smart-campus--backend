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

    const assignments = await executeQuery(`
      SELECT 
        a.assignment_id, a.title, a.description, a.due_date, a.max_marks, a.assignment_type,
        c.course_name, c.course_code,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        sub.marks_obtained, sub.feedback, sub.status as submission_status, sub.submitted_at,
        CASE 
          WHEN sub.id IS NULL THEN 'not_submitted'
          WHEN a.due_date < NOW() AND sub.id IS NULL THEN 'overdue'
          ELSE sub.status
        END as final_status
      FROM assignments a
      JOIN courses c ON a.course_code = c.course_code
      JOIN enrollments e ON c.course_code = e.course_code AND e.student_id = ?
      LEFT JOIN faculty f ON a.faculty_id = f.faculty_id
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN assignment_submissions sub ON a.assignment_id = sub.assignment_id AND sub.student_id = ?
      ORDER BY a.due_date DESC
    `, [decoded.student_id, decoded.student_id]);

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Assignments fetch error:', error);
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

    const { assignment_id, submission_text } = await request.json();

    // Check if assignment exists and is not overdue
    const assignment = await executeQuery(
      'SELECT * FROM assignments WHERE assignment_id = ? AND due_date > NOW()',
      [assignment_id]
    );

    if (assignment.length === 0) {
      return NextResponse.json({ success: false, message: 'Assignment not found or overdue' }, { status: 404 });
    }

    // Check if already submitted
    const existing = await executeQuery(
      'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [assignment_id, decoded.student_id]
    );

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Assignment already submitted' }, { status: 400 });
    }

    await executeQuery(`
      INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, status)
      VALUES (?, ?, ?, 'submitted')
    `, [assignment_id, decoded.student_id, submission_text]);

    return NextResponse.json({ success: true, message: 'Assignment submitted successfully' });
  } catch (error) {
    console.error('Assignment submission error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}