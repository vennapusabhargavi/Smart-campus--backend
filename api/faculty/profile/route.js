import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';
import { verifyToken } from '../../../../lib/auth.js';

export async function GET(request) {
  try {
    console.log('🔍 Faculty profile API called');
    
    // Try to get faculty_id from URL params first (for debugging)
    const { searchParams } = new URL(request.url);
    const facultyIdParam = searchParams.get('faculty_id');
    
    let facultyId = facultyIdParam;
    
    // If no faculty_id param, try to get from token
    if (!facultyId) {
      const token = request.cookies.get('token')?.value;
      console.log('🔍 Token from cookies:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.log('❌ No token found in cookies');
        return NextResponse.json({ success: false, message: 'Unauthorized - No token' }, { status: 401 });
      }

      const decoded = verifyToken(token);
      console.log('🔍 Decoded token:', decoded);
      
      if (!decoded || decoded.role !== 'faculty') {
        console.log('❌ Invalid token or not faculty role');
        return NextResponse.json({ success: false, message: 'Unauthorized - Invalid token' }, { status: 401 });
      }

      facultyId = decoded.registration_number || decoded.faculty_id;
    }
    
    console.log('📊 Using faculty ID:', facultyId);
    
    if (!facultyId) {
      return NextResponse.json({ success: false, message: 'Faculty ID not found' }, { status: 400 });
    }
    
    const profile = await executeQuery(`
      SELECT 
        u.first_name, u.last_name, u.email, u.phone,
        f.faculty_id, f.department, f.designation, f.qualification,
        f.experience_years, f.specialization, f.office_room, f.joining_date
      FROM faculty f
      JOIN users u ON f.user_id = u.id
      WHERE f.faculty_id = ?
    `, [facultyId]);

    console.log('📊 Profile query result:', profile.length, 'records found');

    if (profile.length === 0) {
      return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile[0] });
  } catch (error) {
    console.error('Faculty profile fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}