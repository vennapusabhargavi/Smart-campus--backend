import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';

// GET - Fetch allocation requests
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const facultyId = searchParams.get('faculty_id');
    const date = searchParams.get('date');

    let sql = `
      SELECT 
        ar.*, 
        f.faculty_id, 
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        c.course_name,
        ad.decision_type,
        ad.confidence_score,
        ad.reasoning,
        ad.suggested_room_id,
        ad.suggested_time_start,
        ad.suggested_time_end
      FROM allocation_requests ar
      LEFT JOIN faculty f ON ar.faculty_id = f.faculty_id
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN courses c ON ar.course_code = c.course_code
      LEFT JOIN agent_decisions ad ON ar.request_id = ad.request_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += ' AND ar.status = ?';
      params.push(status);
    }

    if (facultyId) {
      sql += ' AND ar.faculty_id = ?';
      params.push(facultyId);
    }

    if (date) {
      sql += ' AND ar.requested_date = ?';
      params.push(date);
    }

    sql += ' ORDER BY ar.requested_at DESC';

    const requests = await executeQuery(sql, params);

    return NextResponse.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Error fetching allocation requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch allocation requests' },
      { status: 500 }
    );
  }
}

// POST - Create new allocation request
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      faculty_id,
      course_code,
      requested_date,
      start_time,
      end_time,
      expected_strength,
      required_equipment,
      purpose,
      priority = 'medium'
    } = body;

    // Generate request ID
    const requestId = `REQ${Date.now()}`;

    // Insert allocation request
    await executeQuery(
      `INSERT INTO allocation_requests 
       (request_id, faculty_id, course_code, requested_date, start_time, end_time, 
        expected_strength, required_equipment, purpose, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [requestId, faculty_id, course_code, requested_date, start_time, end_time,
       expected_strength, JSON.stringify(required_equipment), purpose, priority]
    );

    // Trigger agent processing
    await processAllocationRequest(requestId);

    return NextResponse.json({
      success: true,
      message: 'Allocation request submitted successfully',
      request_id: requestId
    });

  } catch (error) {
    console.error('Error creating allocation request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create allocation request' },
      { status: 500 }
    );
  }
}

// Agent processing function
async function processAllocationRequest(requestId) {
  try {
    // Get request details
    const [request] = await executeQuery(
      'SELECT * FROM allocation_requests WHERE request_id = ?',
      [requestId]
    );

    if (!request) return;

    // Check for conflicts
    const conflicts = await checkConflicts(request);
    
    // Find suitable rooms
    const suitableRooms = await findSuitableRooms(request);
    
    // Generate agent decision
    const decision = await generateAgentDecision(request, conflicts, suitableRooms);
    
    // Log agent decision
    await logAgentDecision(requestId, decision);
    
    // If auto-approved, create allocation
    if (decision.decision_type === 'auto_approve' && decision.suggested_room_id) {
      await createAllocation(request, decision.suggested_room_id);
      await sendNotification(request.faculty_id, 'allocation_approved', 
        'Classroom Allocated', 
        `Your request for ${request.purpose} has been approved and allocated to room ${decision.suggested_room_id}`);
    } else {
      // Log conflicts if any
      if (conflicts.room_conflicts.length > 0 || conflicts.faculty_conflicts.length > 0 || conflicts.maintenance_conflicts.length > 0) {
        await logConflicts(requestId, conflicts);
      }
      
      // Send detailed notification to faculty about conflicts and manual review
      await sendConflictNotificationToFaculty(request, decision, conflicts);
      
      // Send notification for manual review to admin
      await sendNotification('admin', 'manual_review_required',
        'Manual Review Required',
        `Allocation request ${requestId} requires manual review due to conflicts`);
    }

  } catch (error) {
    console.error('Error processing allocation request:', error);
  }
}

async function checkConflicts(request) {
  const conflicts = [];

  // Check room conflicts
  const roomConflicts = await executeQuery(`
    SELECT ca.*, cr.room_name 
    FROM classroom_allocations ca
    JOIN classrooms cr ON ca.room_id = cr.room_id
    WHERE ca.allocated_date = ? 
    AND ((ca.start_time <= ? AND ca.end_time > ?) 
         OR (ca.start_time < ? AND ca.end_time >= ?))
    AND ca.status IN ('scheduled', 'ongoing')
  `, [request.requested_date, request.start_time, request.start_time, 
      request.end_time, request.end_time]);

  // Check faculty conflicts
  const facultyConflicts = await executeQuery(`
    SELECT ca.*, cr.room_name 
    FROM classroom_allocations ca
    JOIN classrooms cr ON ca.room_id = cr.room_id
    WHERE ca.faculty_id = ? 
    AND ca.allocated_date = ? 
    AND ((ca.start_time <= ? AND ca.end_time > ?) 
         OR (ca.start_time < ? AND ca.end_time >= ?))
    AND ca.status IN ('scheduled', 'ongoing')
  `, [request.faculty_id, request.requested_date, request.start_time, request.start_time,
      request.end_time, request.end_time]);

  // Check maintenance conflicts
  const maintenanceConflicts = await executeQuery(`
    SELECT ms.*, cr.room_name 
    FROM maintenance_schedule ms
    JOIN classrooms cr ON ms.room_id = cr.room_id
    WHERE ms.scheduled_date = ? 
    AND ((ms.start_time <= ? AND ms.end_time > ?) 
         OR (ms.start_time < ? AND ms.end_time >= ?))
    AND ms.status IN ('scheduled', 'in_progress')
  `, [request.requested_date, request.start_time, request.start_time,
      request.end_time, request.end_time]);

  return {
    room_conflicts: roomConflicts,
    faculty_conflicts: facultyConflicts,
    maintenance_conflicts: maintenanceConflicts
  };
}

async function findSuitableRooms(request) {
  const requiredEquipment = JSON.parse(request.required_equipment || '{}');
  
  let sql = `
    SELECT * FROM classrooms 
    WHERE capacity >= ? 
    AND status = 'available'
  `;
  
  const params = [request.expected_strength];
  
  // Add equipment filtering logic here based on required_equipment
  
  const rooms = await executeQuery(sql, params);
  
  // Filter rooms based on equipment availability
  return rooms.filter(room => {
    const roomEquipment = JSON.parse(room.equipment || '{}');
    return Object.keys(requiredEquipment).every(key => 
      roomEquipment[key] === true || roomEquipment[key] >= requiredEquipment[key]
    );
  });
}

async function generateAgentDecision(request, conflicts, suitableRooms) {
  let decision = {
    decision_type: 'manual_review',
    confidence_score: 0.5,
    reasoning: 'Default manual review',
    suggested_room_id: null,
    suggested_time_start: request.start_time,
    suggested_time_end: request.end_time
  };

  // If no conflicts and suitable rooms available
  if (conflicts.room_conflicts.length === 0 && 
      conflicts.faculty_conflicts.length === 0 && 
      conflicts.maintenance_conflicts.length === 0 && 
      suitableRooms.length > 0) {
    
    // Auto-approve with best room
    const bestRoom = suitableRooms.sort((a, b) => {
      // Prefer rooms with capacity closest to requirement
      const aDiff = Math.abs(a.capacity - request.expected_strength);
      const bDiff = Math.abs(b.capacity - request.expected_strength);
      return aDiff - bDiff;
    })[0];

    decision = {
      decision_type: 'auto_approve',
      confidence_score: 0.95,
      reasoning: `Automatically approved. No conflicts detected. Allocated to ${bestRoom.room_name} (capacity: ${bestRoom.capacity})`,
      suggested_room_id: bestRoom.room_id,
      suggested_time_start: request.start_time,
      suggested_time_end: request.end_time
    };
  } else if (suitableRooms.length > 0) {
    // Suggest alternative
    decision = {
      decision_type: 'suggest_alternative',
      confidence_score: 0.7,
      reasoning: `Conflicts detected but alternatives available. Suggested room: ${suitableRooms[0].room_name}`,
      suggested_room_id: suitableRooms[0].room_id,
      suggested_time_start: request.start_time,
      suggested_time_end: request.end_time
    };
  } else {
    // No suitable rooms
    decision = {
      decision_type: 'conflict_detected',
      confidence_score: 0.2,
      reasoning: 'No suitable rooms available for the requested time slot and requirements',
      suggested_room_id: null,
      suggested_time_start: request.start_time,
      suggested_time_end: request.end_time
    };
  }

  return decision;
}

async function logAgentDecision(requestId, decision) {
  const decisionId = `DEC${Date.now()}`;
  
  await executeQuery(`
    INSERT INTO agent_decisions 
    (decision_id, request_id, decision_type, suggested_room_id, suggested_time_start, 
     suggested_time_end, confidence_score, reasoning)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [decisionId, requestId, decision.decision_type, decision.suggested_room_id,
      decision.suggested_time_start, decision.suggested_time_end, 
      decision.confidence_score, decision.reasoning]);
}

async function createAllocation(request, roomId) {
  const allocationId = `ALLOC${Date.now()}`;
  
  await executeQuery(`
    INSERT INTO classroom_allocations 
    (allocation_id, request_id, room_id, faculty_id, course_code, allocated_date, 
     start_time, end_time, status, allocation_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 'regular')
  `, [allocationId, request.request_id, roomId, request.faculty_id, 
      request.course_code, request.requested_date, request.start_time, request.end_time]);

  // Update request status
  await executeQuery(
    'UPDATE allocation_requests SET status = ?, processed_at = NOW() WHERE request_id = ?',
    ['approved', request.request_id]
  );
}

async function logConflicts(requestId, conflicts) {
  // Log room conflicts
  for (const conflict of conflicts.room_conflicts) {
    const conflictId = `CONF${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await executeQuery(`
      INSERT INTO allocation_conflicts 
      (conflict_id, request_id, conflicting_allocation_id, conflict_type, severity, description, resolution_status)
      VALUES (?, ?, ?, 'room_overlap', 'high', ?, 'unresolved')
    `, [conflictId, requestId, conflict.allocation_id, 
        `Room ${conflict.room_name} is already allocated from ${conflict.start_time} to ${conflict.end_time}`]);
  }

  // Log faculty conflicts
  for (const conflict of conflicts.faculty_conflicts) {
    const conflictId = `CONF${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await executeQuery(`
      INSERT INTO allocation_conflicts 
      (conflict_id, request_id, conflicting_allocation_id, conflict_type, severity, description, resolution_status)
      VALUES (?, ?, ?, 'faculty_clash', 'medium', ?, 'unresolved')
    `, [conflictId, requestId, conflict.allocation_id,
        `Faculty already has a class in ${conflict.room_name} from ${conflict.start_time} to ${conflict.end_time}`]);
  }

  // Log maintenance conflicts
  for (const conflict of conflicts.maintenance_conflicts) {
    const conflictId = `CONF${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await executeQuery(`
      INSERT INTO allocation_conflicts 
      (conflict_id, request_id, conflict_type, severity, description, resolution_status)
      VALUES (?, ?, ?, 'maintenance_scheduled', 'high', ?, 'unresolved')
    `, [conflictId, requestId, 'maintenance_scheduled', 'high',
        `Room ${conflict.room_name} has scheduled maintenance from ${conflict.start_time} to ${conflict.end_time}`]);
  }
}

async function sendConflictNotificationToFaculty(request, decision, conflicts) {
  // Only send simple notification to faculty, no conflict details to students
  let title = '';
  let message = '';

  // Determine notification type and message based on decision
  switch (decision.decision_type) {
    case 'conflict_detected':
    case 'suggest_alternative':
    case 'manual_review':
    default:
      title = '📋 Classroom Request - Under Review';
      message = `Your classroom request for "${request.purpose}" is being reviewed by administration.

📋 Request Details:
• Course: ${request.course_code}
• Date & Time: ${request.requested_date}, ${request.start_time}-${request.end_time}
• Expected Students: ${request.expected_strength}

⏳ What happens next:
1. Administration will review your request within 1-2 business days
2. You'll receive a notification once a decision is made
3. If approved, students will be automatically notified of the schedule

Please wait for approval. Contact administration if urgent.`;
      break;
  }

  // Send notification to faculty (no conflict details exposed)
  await sendNotification(request.faculty_id, 'under_review', title, message);
}

async function sendNotification(recipientId, type, title, message, relatedRequestId = null) {
  // Determine recipient type
  let recipientType = 'faculty';
  if (recipientId === 'admin') {
    recipientType = 'admin';
  }

  // Check if a similar notification already exists for this recipient in the last hour
  const existingNotifications = await executeQuery(`
    SELECT notification_id FROM agent_notifications 
    WHERE recipient_id = ? 
    AND recipient_type = ? 
    AND notification_type = ? 
    AND title = ?
    AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
  `, [recipientId, recipientType, type, title]);

  // If notification already exists, don't create duplicate
  if (existingNotifications.length > 0) {
    console.log(`Skipping duplicate notification for ${recipientType} ${recipientId}: ${title}`);
    return;
  }

  const notificationId = `NOT${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  await executeQuery(`
    INSERT INTO agent_notifications 
    (notification_id, recipient_id, recipient_type, notification_type, title, message, related_request_id, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'medium')
  `, [notificationId, recipientId, recipientType, type, title, message, relatedRequestId]);
}