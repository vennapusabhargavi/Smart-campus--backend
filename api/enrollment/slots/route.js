import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';

// GET - Fetch courses by slot
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot');
    const studentId = searchParams.get('student_id');

    if (!slot) {
      return NextResponse.json(
        { success: false, error: 'Slot parameter is required' },
        { status: 400 }
      );
    }

    // Get ALL courses available in the specified slot (visible to all students)
    // Include pending requests in capacity calculation to prevent overbooking
    const courses = await executeQuery(`
      SELECT 
        c.course_code,
        c.course_name,
        c.slot,
        c.max_capacity,
        c.current_enrolled,
        -- Count pending requests for this course
        COALESCE(pending_requests.pending_count, 0) as pending_requests,
        -- Calculate available slots considering both enrolled and pending requests
        (c.max_capacity - c.current_enrolled - COALESCE(pending_requests.pending_count, 0)) as available_slots,
        c.faculty_id,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        c.department,
        c.credits,
        c.course_type,
        c.description,
        -- Check if THIS student is already enrolled (only if studentId provided)
        CASE 
          WHEN ? IS NOT NULL AND e.student_id IS NOT NULL AND e.status = 'enrolled' THEN 'enrolled'
          WHEN ? IS NOT NULL AND er.student_id IS NOT NULL THEN er.status
          ELSE 'available'
        END as enrollment_status
      FROM courses c
      LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN enrollments e ON c.course_code = e.course_code AND e.student_id = ? AND e.status = 'enrolled'
      LEFT JOIN enrollment_requests er ON c.course_code = er.course_code AND er.student_id = ? AND er.status = 'pending'
      -- Count all pending requests for each course
      LEFT JOIN (
        SELECT course_code, COUNT(*) as pending_count
        FROM enrollment_requests 
        WHERE status = 'pending'
        GROUP BY course_code
      ) pending_requests ON c.course_code = pending_requests.course_code
      WHERE c.slot = ? AND c.faculty_id IS NOT NULL
      ORDER BY c.course_code
    `, [studentId, studentId, studentId, studentId, slot]);

    return NextResponse.json({
      success: true,
      data: courses,
      slot: slot
    });

  } catch (error) {
    console.error('Error fetching courses by slot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST - Submit enrollment request
export async function POST(request) {
  try {
    const body = await request.json();
    const { student_id, course_code, slot } = body;

    if (!student_id || !course_code || !slot) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get course details and faculty with pending requests count
    const [course] = await executeQuery(`
      SELECT 
        c.course_code, 
        c.faculty_id, 
        c.max_capacity, 
        c.current_enrolled, 
        c.slot,
        COALESCE(pending_requests.pending_count, 0) as pending_requests,
        (c.max_capacity - c.current_enrolled - COALESCE(pending_requests.pending_count, 0)) as available_slots
      FROM courses c
      LEFT JOIN (
        SELECT course_code, COUNT(*) as pending_count
        FROM enrollment_requests 
        WHERE status = 'pending'
        GROUP BY course_code
      ) pending_requests ON c.course_code = pending_requests.course_code
      WHERE c.course_code = ? AND c.slot = ?
    `, [course_code, slot]);

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course is full (including pending requests)
    if (course.available_slots <= 0) {
      return NextResponse.json(
        { success: false, error: `Course is full. Capacity: ${course.max_capacity}, Enrolled: ${course.current_enrolled}, Pending: ${course.pending_requests}` },
        { status: 400 }
      );
    }

    // Check if student is already enrolled (only active enrollments)
    const [existingEnrollment] = await executeQuery(`
      SELECT id FROM enrollments 
      WHERE student_id = ? AND course_code = ? AND status = 'enrolled'
    `, [student_id, course_code]);

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Check if student has pending request
    const [existingRequest] = await executeQuery(`
      SELECT id FROM enrollment_requests 
      WHERE student_id = ? AND course_code = ? AND status = 'pending'
    `, [student_id, course_code]);

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Enrollment request already pending' },
        { status: 400 }
      );
    }

    // Generate request ID
    const requestId = `ENR_REQ_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Insert enrollment request
    await executeQuery(`
      INSERT INTO enrollment_requests 
      (request_id, student_id, course_code, faculty_id, slot, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [requestId, student_id, course_code, course.faculty_id, slot]);

    return NextResponse.json({
      success: true,
      message: 'Enrollment request submitted successfully',
      request_id: requestId
    });

  } catch (error) {
    console.error('Error submitting enrollment request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit enrollment request' },
      { status: 500 }
    );
  }
}