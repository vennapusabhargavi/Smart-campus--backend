import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';

// GET - Fetch notifications for users
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipient_id');
    const recipientType = searchParams.get('recipient_type');
    const isRead = searchParams.get('is_read');
    const limit = searchParams.get('limit') || 20;

    let sql = `
      SELECT 
        an.*
      FROM agent_notifications an
      WHERE 1=1
    `;

    const params = [];

    if (recipientId) {
      sql += ' AND an.recipient_id = ?';
      params.push(recipientId);
    }

    if (recipientType) {
      sql += ' AND an.recipient_type = ?';
      params.push(recipientType);
    }

    if (isRead !== null) {
      sql += ' AND an.is_read = ?';
      params.push(isRead === 'true');
    }

    sql += ' ORDER BY an.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const notifications = await executeQuery(sql, params);

    return NextResponse.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Create new notification
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      recipient_id,
      recipient_type,
      notification_type,
      title,
      message,
      related_allocation_id,
      related_request_id,
      priority = 'medium'
    } = body;

    const notificationId = `NOT${Date.now()}`;

    await executeQuery(`
      INSERT INTO agent_notifications 
      (notification_id, recipient_id, recipient_type, notification_type, title, message, 
       related_allocation_id, related_request_id, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [notificationId, recipient_id, recipient_type, notification_type, title, message,
        related_allocation_id, related_request_id, priority]);

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      notification_id: notificationId
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PUT - Mark notifications as read
export async function PUT(request) {
  try {
    const body = await request.json();
    const { notification_ids, recipient_id, mark_all_read } = body;

    if (mark_all_read && recipient_id) {
      // Mark all notifications as read for a user
      await executeQuery(
        'UPDATE agent_notifications SET is_read = TRUE, read_at = NOW() WHERE recipient_id = ? AND is_read = FALSE',
        [recipient_id]
      );
    } else if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications as read
      const placeholders = notification_ids.map(() => '?').join(',');
      await executeQuery(
        `UPDATE agent_notifications SET is_read = TRUE, read_at = NOW() WHERE notification_id IN (${placeholders})`,
        notification_ids
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}