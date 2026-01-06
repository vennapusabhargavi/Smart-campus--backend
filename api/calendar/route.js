import { NextResponse } from 'next/server';
import { executeQuery } from '../../../lib/db.js';
import { verifyToken } from '../../../lib/auth.js';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query = `
      SELECT event_id, event_name, event_type, start_date, end_date, description
      FROM academic_calendar
      WHERE (target_audience = 'all' OR target_audience = ?)
    `;
    
    const params = [decoded.role];

    if (month && year) {
      query += ' AND MONTH(start_date) = ? AND YEAR(start_date) = ?';
      params.push(month, year);
    }

    query += ' ORDER BY start_date';

    const events = await executeQuery(query, params);

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('Calendar fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}