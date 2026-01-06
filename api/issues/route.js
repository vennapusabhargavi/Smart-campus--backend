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

    const issues = await executeQuery(`
      SELECT 
        issue_id, issue_type, location, description, priority, status,
        reported_date, resolved_date, assigned_to, resolution_notes
      FROM infrastructure_issues
      WHERE reported_by = ?
      ORDER BY reported_date DESC
    `, [decoded.user_id]);

    return NextResponse.json({ success: true, data: issues });
  } catch (error) {
    console.error('Issues fetch error:', error);
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
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { issue_type, location, description, priority } = await request.json();

    // Generate issue ID
    const issueId = `ISS${Date.now()}`;

    await executeQuery(`
      INSERT INTO infrastructure_issues 
      (issue_id, reported_by, reporter_type, issue_type, location, description, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
    `, [issueId, decoded.user_id, decoded.role, issue_type, location, description, priority]);

    return NextResponse.json({ success: true, message: 'Issue reported successfully', issue_id: issueId });
  } catch (error) {
    console.error('Issue creation error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}