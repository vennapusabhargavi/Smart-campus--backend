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
    if (!decoded || decoded.role !== 'faculty') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      // Return list of all students for search
      const students = await executeQuery(`
        SELECT 
          s.student_id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          s.student_id as regNo,
          s.department
        FROM students s
        JOIN users u ON s.user_id = u.id
        ORDER BY u.first_name, u.last_name
      `);

      return NextResponse.json({ 
        success: true, 
        data: { students }
      });
    }

    // Get comprehensive student information
    const studentInfo = await executeQuery(`
      SELECT 
        s.*,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.phone,
        u.first_name,
        u.last_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.student_id = ?
    `, [studentId]);

    if (studentInfo.length === 0) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const student = studentInfo[0];

    // Get academic performance (semester-wise)
    const academicPerformance = await executeQuery(`
      SELECT 
        c.semester,
        AVG(CASE WHEN e.grade_points IS NOT NULL THEN e.grade_points ELSE 0 END) as cgpa,
        SUM(c.credits) as credits,
        CASE 
          WHEN COUNT(CASE WHEN e.status = 'completed' THEN 1 END) = COUNT(*) THEN 'Passed'
          WHEN COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) > 0 THEN 'Ongoing'
          ELSE 'Passed'
        END as status
      FROM enrollments e
      JOIN courses c ON e.course_code = c.course_code
      WHERE e.student_id = ?
      GROUP BY c.semester
      ORDER BY c.semester
    `, [studentId]);

    // Get attendance overview
    const attendanceData = await executeQuery(`
      SELECT 
        c.course_name,
        COUNT(*) as total_classes,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1) as attendance_percentage,
        CASE 
          WHEN (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) >= 90 THEN 'Excellent'
          WHEN (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) >= 75 THEN 'Good'
          ELSE 'Average'
        END as status
      FROM attendance a
      JOIN courses c ON a.course_code = c.course_code
      WHERE a.student_id = ?
      GROUP BY c.course_code, c.course_name
      ORDER BY c.course_name
    `, [studentId]);

    // Calculate overall attendance
    const overallAttendance = await executeQuery(`
      SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count
      FROM attendance
      WHERE student_id = ?
    `, [studentId]);

    const overall = overallAttendance[0];
    const overallPercentage = overall.total_classes > 0 
      ? Math.round((overall.present_count / overall.total_classes) * 100)
      : 0;

    // Get disciplinary records
    const disciplinaryRecords = await executeQuery(`
      SELECT 
        violation_type as type,
        description as reason,
        date_reported as date,
        status
      FROM disciplinary_actions
      WHERE student_id = ?
      ORDER BY date_reported DESC
    `, [studentId]);

    // Get placement status
    const placementData = await executeQuery(`
      SELECT 
        pa.status,
        po.company_name as company,
        po.package_amount,
        pa.application_date as offerDate
      FROM placement_applications pa
      JOIN placement_offers po ON pa.offer_id = po.offer_id
      WHERE pa.student_id = ?
      AND pa.status = 'selected'
      ORDER BY pa.application_date DESC
      LIMIT 1
    `, [studentId]);

    const placement = placementData[0] || {
      status: 'Not Placed',
      company: 'N/A',
      package_amount: 0,
      offerDate: null
    };

    // Format the response
    const studentDetails = {
      personalInfo: {
        name: student.name,
        regNo: student.student_id,
        department: student.department,
        year: `${student.year}${student.year === 1 ? 'st' : student.year === 2 ? 'nd' : student.year === 3 ? 'rd' : 'th'} Year`,
        email: student.email,
        phone: student.phone || 'Not provided',
        address: student.address || 'Not provided',
        cgpa: student.cgpa?.toString() || '0.00'
      },
      academicPerformance: academicPerformance.map(sem => ({
        semester: `Semester ${sem.semester}`,
        cgpa: sem.cgpa?.toFixed(1) || '0.0',
        credits: sem.credits || 0,
        status: sem.status
      })),
      attendance: {
        overall: `${overallPercentage}%`,
        subjects: attendanceData.map(att => ({
          name: att.course_name,
          attendance: `${att.attendance_percentage}%`,
          status: att.status
        }))
      },
      disciplinary: disciplinaryRecords.map(record => ({
        date: new Date(record.date).toLocaleDateString('en-GB'),
        type: record.type,
        reason: record.reason,
        status: record.status === 'resolved' ? 'Resolved' : 'Closed'
      })),
      placements: {
        status: placement.status === 'selected' ? 'Placed' : 'Not Placed',
        company: placement.company,
        package: placement.package_amount ? `₹${(placement.package_amount / 100000).toFixed(1)} LPA` : 'N/A',
        offerDate: placement.offerDate ? new Date(placement.offerDate).toLocaleDateString('en-GB') : 'N/A'
      }
    };

    return NextResponse.json({ 
      success: true, 
      data: studentDetails
    });
  } catch (error) {
    console.error('Student360 fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}