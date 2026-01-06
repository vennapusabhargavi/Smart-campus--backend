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

    // Use registration number for direct lookup - simpler and faster
    const registrationNumber = decoded.registration_number || decoded.student_id;
    
    // Get student's enrolled courses from both old enrollments table and new enrollment system
    const courses = await executeQuery(`
      SELECT 
        c.course_code, 
        c.course_name, 
        c.credits, 
        c.semester,
        c.year,
        c.course_type,
        c.description,
        c.slot,
        COALESCE(e.status, 'enrolled') as status, 
        e.grade, 
        e.grade_points,
        COALESCE(e.enrollment_date, NOW()) as enrollment_date,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        f.designation,
        f.department as faculty_department,
        'enrollment_system' as source
      FROM enrollments e
      JOIN courses c ON e.course_code = c.course_code
      LEFT JOIN faculty f ON e.faculty_id = f.faculty_id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE e.student_id = ? AND e.status = 'enrolled'
      
      UNION ALL
      
      SELECT 
        c.course_code, 
        c.course_name, 
        c.credits, 
        c.semester,
        c.year,
        c.course_type,
        c.description,
        c.slot,
        'enrolled' as status, 
        NULL as grade, 
        NULL as grade_points,
        NOW() as enrollment_date,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        f.designation,
        f.department as faculty_department,
        'legacy_system' as source
      FROM courses c
      JOIN faculty f ON c.faculty_id = f.faculty_id
      JOIN users u ON f.user_id = u.id
      WHERE c.course_code IN (
        SELECT DISTINCT course_code 
        FROM enrollment_requests 
        WHERE student_id = ? AND status = 'approved'
      )
      AND c.course_code NOT IN (
        SELECT course_code FROM enrollments WHERE student_id = ?
      )
      
      ORDER BY course_code
    `, [registrationNumber, registrationNumber, registrationNumber]);

    // Get attendance summary for each course
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        // Get attendance data using registration number
        const attendanceData = await executeQuery(`
          SELECT 
            COUNT(*) as total_classes,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count
          FROM attendance 
          WHERE student_id = ? AND course_code = ?
        `, [registrationNumber, course.course_code]);

        const attendance = attendanceData[0] || { total_classes: 0, present_count: 0, absent_count: 0, late_count: 0 };
        const attendancePercentage = attendance.total_classes > 0 
          ? Math.round((attendance.present_count / attendance.total_classes) * 100)
          : 0;

        // Get assignment count
        const assignmentData = await executeQuery(`
          SELECT COUNT(*) as total_assignments
          FROM assignments 
          WHERE course_code = ?
        `, [course.course_code]);

        // Get submitted assignments count using registration number
        const submissionData = await executeQuery(`
          SELECT COUNT(*) as submitted_assignments
          FROM assignment_submissions asub
          JOIN assignments a ON asub.assignment_id = a.assignment_id
          WHERE a.course_code = ? AND asub.student_id = ?
        `, [course.course_code, registrationNumber]);

        return {
          ...course,
          attendance: {
            total_classes: attendance.total_classes,
            present: attendance.present_count,
            absent: attendance.absent_count,
            late: attendance.late_count,
            percentage: attendancePercentage
          },
          assignments: {
            total: assignmentData[0]?.total_assignments || 0,
            submitted: submissionData[0]?.submitted_assignments || 0
          }
        };
      })
    );

    return NextResponse.json({ success: true, data: coursesWithDetails });
  } catch (error) {
    console.error('Courses fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}