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

    const records = await executeQuery(`
      SELECT 
        da.action_id, da.violation_type, da.description, da.action_taken,
        da.severity, da.date_reported, da.status,
        CONCAT(u.first_name, ' ', u.last_name) as reported_by_name
      FROM disciplinary_actions da
      LEFT JOIN faculty f ON da.faculty_id = f.faculty_id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE da.student_id = ?
      ORDER BY da.date_reported DESC
    `, [decoded.student_id]);

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Disciplinary records fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}