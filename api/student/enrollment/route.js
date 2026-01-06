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

    // Get student's current semester and year
    const student = await executeQuery(
      'SELECT year, semester, department FROM students WHERE student_id = ?',
      [decoded.student_id]
    );

    if (student.length === 0) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const { year, semester, department } = student[0];

    // Get available courses for enrollment
    const availableCourses = await executeQuery(`
      SELECT 
        c.course_code, c.course_name, c.credits, c.course_type, c.description,
        CASE WHEN e.id IS NOT NULL THEN 'enrolled' ELSE 'available' END as enrollment_status
      FROM courses c
      LEFT JOIN enrollments e ON c.course_code = e.course_code AND e.student_id = ?
      WHERE c.department = ? AND c.year = ? AND c.semester = ?
      ORDER BY c.course_type, c.course_code
    `, [decoded.student_id, department, year, semester]);

    // Get enrollment history
    const enrollmentHistory = await executeQuery(`
      SELECT 
        c.course_code, c.course_name, c.credits, c.semester, c.year,
        e.enrollment_date, e.status, e.grade, e.grade_points
      FROM enrollments e
      JOIN courses c ON e.course_code = c.course_code
      WHERE e.student_id = ?
      ORDER BY c.year DESC, c.semester DESC, c.course_code
    `, [decoded.student_id]);

    return NextResponse.json({ 
      success: true, 
      data: {
        available: availableCourses,
        history: enrollmentHistory,
        current: { year, semester, department }
      }
    });
  } catch (error) {
    console.error('Enrollment fetch error:', error);
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

    const { course_code } = await request.json();

    // Check if already enrolled
    const existing = await executeQuery(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_code = ?',
      [decoded.student_id, course_code]
    );

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Already enrolled in this course' }, { status: 400 });
    }

    // Enroll student
    await executeQuery(
      'INSERT INTO enrollments (student_id, course_code, status) VALUES (?, ?, "enrolled")',
      [decoded.student_id, course_code]
    );

    return NextResponse.json({ success: true, message: 'Enrolled successfully' });
  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}