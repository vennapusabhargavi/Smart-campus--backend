import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';
import { verifyToken } from '../../../../lib/auth.js';

export async function GET(request) {
  try {
    console.log('🔍 Faculty courses API called');
    
    // Get faculty_id from URL params - skip authentication for debugging
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('faculty_id');
    
    console.log('📊 Faculty ID from params:', facultyId);
    
    if (!facultyId) {
      return NextResponse.json({ success: false, message: 'Faculty ID required' }, { status: 400 });
    }

    const courses = await executeQuery(`
      SELECT 
        c.course_code, 
        c.course_name, 
        c.credits, 
        c.semester, 
        c.year, 
        c.course_type,
        c.slot,
        c.max_capacity,
        c.current_enrolled,
        COALESCE(pending_requests.pending_count, 0) as pending_requests,
        (c.max_capacity - c.current_enrolled - COALESCE(pending_requests.pending_count, 0)) as available_slots,
        COUNT(e.student_id) as enrolled_students
      FROM courses c
      LEFT JOIN enrollments e ON c.course_code = e.course_code AND e.faculty_id = ?
      LEFT JOIN (
        SELECT course_code, COUNT(*) as pending_count
        FROM enrollment_requests 
        WHERE status = 'pending'
        GROUP BY course_code
      ) pending_requests ON c.course_code = pending_requests.course_code
      WHERE c.faculty_id = ?
      GROUP BY c.course_code, c.course_name, c.credits, c.semester, c.year, c.course_type, c.slot, c.max_capacity, c.current_enrolled, pending_requests.pending_count
      ORDER BY c.slot, c.course_code
    `, [facultyId, facultyId]);

    return NextResponse.json({ success: true, data: courses });
  } catch (error) {
    console.error('Faculty courses fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}