import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';

// GET - Fetch enrollment requests (for faculty)
export async function GET(request) {
  try {
    console.log('🔍 Enrollment requests API called');
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('faculty_id');
    const status = searchParams.get('status');
    const studentId = searchParams.get('student_id');
    
    console.log('📊 Parameters:', { facultyId, status, studentId });
    console.log('📊 Request URL:', request.url);

    let sql = `
      SELECT 
        er.request_id,
        er.student_id,
        CONCAT(us.first_name, ' ', us.last_name) as student_name,
        us.email as student_email,
        s.department as student_department,
        s.year as student_year,
        s.semester as student_semester,
        s.cgpa as student_cgpa,
        er.course_code,
        c.course_name,
        er.slot,
        er.faculty_id,
        CONCAT(uf.first_name, ' ', uf.last_name) as faculty_name,
        er.status,
        er.request_date,
        er.faculty_notes,
        er.processed_at,
        c.max_capacity,
        c.current_enrolled,
        (c.max_capacity - c.current_enrolled) as available_slots
      FROM enrollment_requests er
      JOIN courses c ON er.course_code = c.course_code
      JOIN students s ON er.student_id = s.student_id
      JOIN users us ON s.user_id = us.id
      JOIN faculty f ON er.faculty_id = f.faculty_id
      JOIN users uf ON f.user_id = uf.id
      WHERE 1=1
    `;

    let params = [];

    if (status === 'enrolled') {
      // For enrolled tab, get students from enrollments table
      sql = `
        SELECT 
          e.id as request_id,
          e.student_id,
          CONCAT(us.first_name, ' ', us.last_name) as student_name,
          us.email as student_email,
          s.department as student_department,
          s.year as student_year,
          s.semester as student_semester,
          s.cgpa as student_cgpa,
          e.course_code,
          c.course_name,
          c.slot,
          e.faculty_id,
          CONCAT(uf.first_name, ' ', uf.last_name) as faculty_name,
          e.status,
          e.enrollment_date,
          e.enrollment_date as processed_at,
          c.max_capacity,
          c.current_enrolled,
          (c.max_capacity - c.current_enrolled) as available_slots
        FROM enrollments e
        JOIN courses c ON e.course_code = c.course_code
        JOIN students s ON e.student_id = s.student_id
        JOIN users us ON s.user_id = us.id
        JOIN faculty f ON e.faculty_id = f.faculty_id
        JOIN users uf ON f.user_id = uf.id
        WHERE e.status = 'enrolled'
      `;
      
      if (facultyId) {
        sql += ' AND e.faculty_id = ?';
        params.push(facultyId);
      }
      
      sql += ' ORDER BY e.enrollment_date DESC';
    } else {
      // For other tabs, use enrollment_requests table
      if (facultyId) {
        sql += ' AND er.faculty_id = ?';
        params.push(facultyId);
      }

      if (status) {
        sql += ' AND er.status = ?';
        params.push(status);
      }
      
      // Add student_id filter for enrollment_requests table
      if (studentId) {
        sql += ' AND er.student_id = ?';
        params.push(studentId);
      }
      
      sql += ' ORDER BY er.request_date DESC';
    }

    // Add student_id filter for enrollments table (enrolled status)
    if (studentId && status === 'enrolled') {
      // This is already handled above in the enrolled section
    }

    console.log('📊 Final SQL Query:', sql);
    console.log('📊 Final Parameters:', params);
    console.log('📊 Status being queried:', status);

    const requests = await executeQuery(sql, params);
    
    console.log('📊 Query Results:', requests.length, 'records found');
    
    if (status === 'enrolled') {
      console.log('🎯 ENROLLED STUDENTS QUERY RESULTS:');
      requests.forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.student_name} (${req.student_id}) - ${req.course_code} - ${req.status}`);
      });
    }

    return NextResponse.json({
      success: true,
      data: requests,
      debug: {
        sql: sql,
        params: params,
        status: status,
        facultyId: facultyId,
        recordCount: requests.length
      }
    });

  } catch (error) {
    console.error('Error fetching enrollment requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollment requests' },
      { status: 500 }
    );
  }
}

// DELETE - Remove enrollment request
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('request_id');
    const studentId = searchParams.get('student_id');
    const courseCode = searchParams.get('course_code');

    if (!studentId || !courseCode) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Delete the enrollment request (only if it's pending)
    const result = await executeQuery(`
      DELETE FROM enrollment_requests 
      WHERE student_id = ? AND course_code = ? AND status = 'pending'
    `, [studentId, courseCode]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'No pending enrollment request found to delete' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment request removed successfully'
    });

  } catch (error) {
    console.error('Error removing enrollment request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove enrollment request' },
      { status: 500 }
    );
  }
}

// POST - Process enrollment request (approve/reject)
export async function POST(request) {
  try {
    const body = await request.json();
    const { request_id, action, faculty_notes, faculty_id, student_id, course_code } = body;

    if (!action || !faculty_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'reject_enrolled'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Handle rejecting enrolled students
    if (action === 'reject_enrolled') {
      if (!student_id || !course_code) {
        return NextResponse.json(
          { success: false, error: 'Missing student_id or course_code for reject_enrolled action' },
          { status: 400 }
        );
      }

      try {
        // Update enrollment status to dropped
        await executeQuery(`
          UPDATE enrollments 
          SET status = 'dropped'
          WHERE student_id = ? AND course_code = ? AND faculty_id = ? AND status = 'enrolled'
        `, [student_id, course_code, faculty_id]);

        // IMPORTANT: Also update the original enrollment request to 'rejected'
        // This ensures the student doesn't appear in the "Approved" tab anymore
        await executeQuery(`
          UPDATE enrollment_requests 
          SET status = 'rejected', 
              faculty_notes = CONCAT(COALESCE(faculty_notes, ''), ' [REJECTED FROM ENROLLED - ', NOW(), ']'),
              processed_at = NOW()
          WHERE student_id = ? AND course_code = ? AND faculty_id = ? AND status = 'approved'
        `, [student_id, course_code, faculty_id]);

        // Decrease course enrollment count
        await executeQuery(`
          UPDATE courses 
          SET current_enrolled = current_enrolled - 1
          WHERE course_code = ? AND current_enrolled > 0
        `, [course_code]);

        return NextResponse.json({
          success: true,
          message: 'Student removed from course successfully'
        });

      } catch (error) {
        console.error('Error removing enrolled student:', error);
        throw error;
      }
    }

    // Handle regular approve/reject actions
    if (!request_id) {
      return NextResponse.json(
        { success: false, error: 'Missing request_id for approve/reject action' },
        { status: 400 }
      );
    }

    // Get enrollment request details
    const [enrollmentRequest] = await executeQuery(`
      SELECT er.*, c.max_capacity, c.current_enrolled
      FROM enrollment_requests er
      JOIN courses c ON er.course_code = c.course_code
      WHERE er.request_id = ? AND er.faculty_id = ? AND er.status = 'pending'
    `, [request_id, faculty_id]);

    if (!enrollmentRequest) {
      return NextResponse.json(
        { success: false, error: 'Enrollment request not found or already processed' },
        { status: 404 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    if (action === 'approve') {
      // Check if course is still available
      if (enrollmentRequest.current_enrolled >= enrollmentRequest.max_capacity) {
        return NextResponse.json(
          { success: false, error: 'Course is now full' },
          { status: 400 }
        );
      }

      // Check if student is already enrolled (double-check)
      const [existingEnrollment] = await executeQuery(`
        SELECT id FROM enrollments 
        WHERE student_id = ? AND course_code = ?
      `, [enrollmentRequest.student_id, enrollmentRequest.course_code]);

      if (existingEnrollment) {
        return NextResponse.json(
          { success: false, error: 'Student is already enrolled in this course' },
          { status: 400 }
        );
      }

      try {
        // Update enrollment request status
        await executeQuery(`
          UPDATE enrollment_requests 
          SET status = ?, faculty_notes = ?, processed_at = NOW(), processed_by = ?
          WHERE request_id = ?
        `, [newStatus, faculty_notes, faculty_id, request_id]);

        // Create enrollment record
        await executeQuery(`
          INSERT INTO enrollments (student_id, course_code, faculty_id, enrollment_date, status)
          VALUES (?, ?, ?, NOW(), 'enrolled')
        `, [enrollmentRequest.student_id, enrollmentRequest.course_code, enrollmentRequest.faculty_id]);

        // Update course enrollment count
        await executeQuery(`
          UPDATE courses 
          SET current_enrolled = current_enrolled + 1
          WHERE course_code = ?
        `, [enrollmentRequest.course_code]);

        return NextResponse.json({
          success: true,
          message: 'Enrollment request approved successfully'
        });

      } catch (error) {
        console.error('Error in approval transaction:', error);
        throw error;
      }

    } else {
      // Reject the request
      await executeQuery(`
        UPDATE enrollment_requests 
        SET status = ?, faculty_notes = ?, processed_at = NOW(), processed_by = ?
        WHERE request_id = ?
      `, [newStatus, faculty_notes, faculty_id, request_id]);

      return NextResponse.json({
        success: true,
        message: 'Enrollment request rejected'
      });
    }

  } catch (error) {
    console.error('Error processing enrollment request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process enrollment request' },
      { status: 500 }
    );
  }
}