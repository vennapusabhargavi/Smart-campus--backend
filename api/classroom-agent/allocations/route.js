import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';

// GET - Fetch classroom allocations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const roomId = searchParams.get('room_id');
    const facultyId = searchParams.get('faculty_id');
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        ca.*,
        cr.room_name,
        cr.building,
        cr.floor,
        cr.capacity,
        cr.room_type,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        c.course_name,
        c.course_code
      FROM classroom_allocations ca
      JOIN classrooms cr ON ca.room_id = cr.room_id
      LEFT JOIN faculty f ON ca.faculty_id = f.faculty_id
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN courses c ON ca.course_code = c.course_code
      WHERE 1=1
    `;

    const params = [];

    if (date) {
      sql += ' AND ca.allocated_date = ?';
      params.push(date);
    }

    if (roomId) {
      sql += ' AND ca.room_id = ?';
      params.push(roomId);
    }

    if (facultyId) {
      sql += ' AND ca.faculty_id = ?';
      params.push(facultyId);
    }

    if (status) {
      sql += ' AND ca.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY ca.allocated_date DESC, ca.start_time ASC';

    const allocations = await executeQuery(sql, params);

    return NextResponse.json({
      success: true,
      data: allocations
    });

  } catch (error) {
    console.error('Error fetching allocations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch allocations' },
      { status: 500 }
    );
  }
}

// POST - Create manual allocation (admin override)
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      room_id,
      faculty_id,
      course_code,
      allocated_date,
      start_time,
      end_time,
      allocation_type = 'regular',
      admin_override = false
    } = body;

    // Check for conflicts if not admin override
    if (!admin_override) {
      const conflicts = await checkAllocationConflicts({
        room_id,
        faculty_id,
        allocated_date,
        start_time,
        end_time
      });

      if (conflicts.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Conflicts detected',
          conflicts: conflicts
        }, { status: 409 });
      }
    }

    const allocationId = `ALLOC${Date.now()}`;

    await executeQuery(`
      INSERT INTO classroom_allocations 
      (allocation_id, room_id, faculty_id, course_code, allocated_date, 
       start_time, end_time, status, allocation_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
    `, [allocationId, room_id, faculty_id, course_code, allocated_date, 
        start_time, end_time, allocation_type]);

    // Send notification to faculty
    await sendAllocationNotification(faculty_id, allocationId, 'allocation_approved');

    return NextResponse.json({
      success: true,
      message: 'Allocation created successfully',
      allocation_id: allocationId
    });

  } catch (error) {
    console.error('Error creating allocation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create allocation' },
      { status: 500 }
    );
  }
}

// PUT - Update allocation
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      allocation_id,
      room_id,
      allocated_date,
      start_time,
      end_time,
      status,
      actual_strength
    } = body;

    let sql = 'UPDATE classroom_allocations SET updated_at = NOW()';
    const params = [];

    if (room_id) {
      sql += ', room_id = ?';
      params.push(room_id);
    }

    if (allocated_date) {
      sql += ', allocated_date = ?';
      params.push(allocated_date);
    }

    if (start_time) {
      sql += ', start_time = ?';
      params.push(start_time);
    }

    if (end_time) {
      sql += ', end_time = ?';
      params.push(end_time);
    }

    if (status) {
      sql += ', status = ?';
      params.push(status);
    }

    if (actual_strength) {
      sql += ', actual_strength = ?';
      params.push(actual_strength);
    }

    sql += ' WHERE allocation_id = ?';
    params.push(allocation_id);

    await executeQuery(sql, params);

    // Get allocation details for notification
    const [allocation] = await executeQuery(`
      SELECT ca.*, cr.room_name, CONCAT(u.first_name, ' ', u.last_name) as faculty_name
      FROM classroom_allocations ca
      JOIN classrooms cr ON ca.room_id = cr.room_id
      JOIN faculty f ON ca.faculty_id = f.faculty_id
      JOIN users u ON f.user_id = u.id
      WHERE ca.allocation_id = ?
    `, [allocation_id]);

    if (allocation && room_id && room_id !== allocation.room_id) {
      // Room changed - notify faculty
      await sendAllocationNotification(allocation.faculty_id, allocation_id, 'room_changed');
    }

    return NextResponse.json({
      success: true,
      message: 'Allocation updated successfully'
    });

  } catch (error) {
    console.error('Error updating allocation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update allocation' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel allocation
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const allocationId = searchParams.get('allocation_id');

    if (!allocationId) {
      return NextResponse.json(
        { success: false, error: 'Allocation ID is required' },
        { status: 400 }
      );
    }

    // Get allocation details before deletion
    const [allocation] = await executeQuery(
      'SELECT * FROM classroom_allocations WHERE allocation_id = ?',
      [allocationId]
    );

    if (!allocation) {
      return NextResponse.json(
        { success: false, error: 'Allocation not found' },
        { status: 404 }
      );
    }

    // Update status to cancelled instead of deleting
    await executeQuery(
      'UPDATE classroom_allocations SET status = ?, updated_at = NOW() WHERE allocation_id = ?',
      ['cancelled', allocationId]
    );

    // Notify faculty about cancellation
    await sendAllocationNotification(allocation.faculty_id, allocationId, 'allocation_cancelled');

    return NextResponse.json({
      success: true,
      message: 'Allocation cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling allocation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel allocation' },
      { status: 500 }
    );
  }
}

async function checkAllocationConflicts(allocation) {
  const conflicts = [];

  // Check room conflicts
  const roomConflicts = await executeQuery(`
    SELECT * FROM classroom_allocations 
    WHERE room_id = ? 
    AND allocated_date = ? 
    AND ((start_time <= ? AND end_time > ?) 
         OR (start_time < ? AND end_time >= ?))
    AND status IN ('scheduled', 'ongoing')
  `, [allocation.room_id, allocation.allocated_date, 
      allocation.start_time, allocation.start_time,
      allocation.end_time, allocation.end_time]);

  // Check faculty conflicts
  const facultyConflicts = await executeQuery(`
    SELECT * FROM classroom_allocations 
    WHERE faculty_id = ? 
    AND allocated_date = ? 
    AND ((start_time <= ? AND end_time > ?) 
         OR (start_time < ? AND end_time >= ?))
    AND status IN ('scheduled', 'ongoing')
  `, [allocation.faculty_id, allocation.allocated_date,
      allocation.start_time, allocation.start_time,
      allocation.end_time, allocation.end_time]);

  return [...roomConflicts, ...facultyConflicts];
}

async function sendAllocationNotification(facultyId, allocationId, type) {
  const notificationId = `NOT${Date.now()}`;
  
  let title, message;
  
  switch (type) {
    case 'allocation_approved':
      title = 'Classroom Allocated';
      message = `Your classroom allocation ${allocationId} has been approved.`;
      break;
    case 'room_changed':
      title = 'Room Changed';
      message = `Your classroom allocation ${allocationId} room has been changed.`;
      break;
    case 'allocation_cancelled':
      title = 'Allocation Cancelled';
      message = `Your classroom allocation ${allocationId} has been cancelled.`;
      break;
    default:
      title = 'Allocation Update';
      message = `Your classroom allocation ${allocationId} has been updated.`;
  }
  
  await executeQuery(`
    INSERT INTO agent_notifications 
    (notification_id, recipient_id, recipient_type, notification_type, title, message, related_allocation_id)
    VALUES (?, ?, 'faculty', ?, ?, ?, ?)
  `, [notificationId, facultyId, type, title, message, allocationId]);
}