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

    // Get available placement offers
    const availableOffers = await executeQuery(`
      SELECT po.*, 
             CASE WHEN pa.id IS NOT NULL THEN pa.status ELSE 'not_applied' END as application_status
      FROM placement_offers po
      LEFT JOIN placement_applications pa ON po.offer_id = pa.offer_id AND pa.student_id = ?
      WHERE po.status = 'open' AND po.application_deadline >= CURDATE()
      ORDER BY po.application_deadline
    `, [decoded.student_id]);

    // Get student's applications
    const applications = await executeQuery(`
      SELECT po.company_name, po.job_title, po.package_amount, po.job_location,
             pa.application_date, pa.status, pa.interview_feedback
      FROM placement_applications pa
      JOIN placement_offers po ON pa.offer_id = po.offer_id
      WHERE pa.student_id = ?
      ORDER BY pa.application_date DESC
    `, [decoded.student_id]);

    return NextResponse.json({ 
      success: true, 
      data: {
        offers: availableOffers,
        applications: applications
      }
    });
  } catch (error) {
    console.error('Placement fetch error:', error);
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

    const { offer_id } = await request.json();

    // Check if offer exists and is open
    const offer = await executeQuery(
      'SELECT * FROM placement_offers WHERE offer_id = ? AND status = "open" AND application_deadline >= CURDATE()',
      [offer_id]
    );

    if (offer.length === 0) {
      return NextResponse.json({ success: false, message: 'Offer not found or expired' }, { status: 404 });
    }

    // Check if already applied
    const existing = await executeQuery(
      'SELECT id FROM placement_applications WHERE offer_id = ? AND student_id = ?',
      [offer_id, decoded.student_id]
    );

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Already applied for this position' }, { status: 400 });
    }

    await executeQuery(
      'INSERT INTO placement_applications (student_id, offer_id, status) VALUES (?, ?, "applied")',
      [decoded.student_id, offer_id]
    );

    return NextResponse.json({ success: true, message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Placement application error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}