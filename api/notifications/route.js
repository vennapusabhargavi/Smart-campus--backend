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

    // Get notifications for the user
    const notifications = await executeQuery(`
      SELECT 
        n.notification_id, n.title, n.message, n.priority, n.has_attachment,
        n.attachment_path, n.created_at, n.expires_at,
        un.is_read, un.read_at
      FROM notifications n
      LEFT JOIN user_notifications un ON n.notification_id = un.notification_id AND un.user_id = ?
      WHERE (
        n.target_audience = 'all' OR
        n.target_audience = ? OR
        (n.target_audience = 'individual' AND n.target_filter = ?)
      )
      AND (n.expires_at IS NULL OR n.expires_at > NOW())
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [decoded.user_id, decoded.role, decoded.user_id]);

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { notification_id } = await request.json();

    // Mark notification as read
    await executeQuery(`
      INSERT INTO user_notifications (notification_id, user_id, is_read, read_at)
      VALUES (?, ?, TRUE, NOW())
      ON DUPLICATE KEY UPDATE is_read = TRUE, read_at = NOW()
    `, [notification_id, decoded.user_id]);

    return NextResponse.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}