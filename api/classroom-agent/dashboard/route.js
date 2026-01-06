import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';
import ClassroomAIAgent from '../../../../lib/classroom-ai-agent.js';

// Initialize AI agent
const aiAgent = new ClassroomAIAgent();

// GET - Fetch dashboard data for classroom allocation agent
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get summary statistics
    const [stats] = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM classrooms WHERE status = 'available') as total_rooms,
        (SELECT COUNT(*) FROM allocation_requests WHERE status = 'pending') as pending_requests,
        (SELECT COUNT(*) FROM classroom_allocations WHERE allocated_date = ? AND status IN ('scheduled', 'ongoing')) as todays_allocations,
        (SELECT COUNT(*) FROM allocation_conflicts WHERE resolution_status = 'unresolved') as unresolved_conflicts
    `, [date]);

    // Get room utilization for today
    const roomUtilization = await executeQuery(`
      SELECT 
        c.room_id,
        c.room_name,
        c.building,
        c.capacity,
        c.room_type,
        COUNT(ca.id) as allocations_count,
        COALESCE(SUM(TIMESTAMPDIFF(MINUTE, ca.start_time, ca.end_time)), 0) as total_minutes_allocated,
        ROUND((COALESCE(SUM(TIMESTAMPDIFF(MINUTE, ca.start_time, ca.end_time)), 0) / (8 * 60)) * 100, 2) as utilization_percentage
      FROM classrooms c
      LEFT JOIN classroom_allocations ca ON c.room_id = ca.room_id 
        AND ca.allocated_date = ? 
        AND ca.status IN ('scheduled', 'ongoing', 'completed')
      WHERE c.status = 'available'
      GROUP BY c.room_id, c.room_name, c.building, c.capacity, c.room_type
      ORDER BY utilization_percentage DESC
    `, [date]);

    // Get recent agent decisions
    const recentDecisions = await executeQuery(`
      SELECT 
        ad.*,
        ar.purpose,
        ar.requested_date,
        ar.start_time,
        ar.end_time,
        CONCAT(uf.first_name, ' ', uf.last_name) as faculty_name,
        c.course_name
      FROM agent_decisions ad
      JOIN allocation_requests ar ON ad.request_id = ar.request_id
      LEFT JOIN faculty f ON ar.faculty_id = f.faculty_id
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN courses c ON ar.course_code = c.course_code
      ORDER BY ad.created_at DESC
      LIMIT 10
    `);

    // Get pending requests requiring attention
    const pendingRequests = await executeQuery(`
      SELECT 
        ar.*,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        c.course_name,
        ad.decision_type,
        ad.confidence_score,
        ad.reasoning
      FROM allocation_requests ar
      LEFT JOIN faculty f ON ar.faculty_id = f.faculty_id
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN courses c ON ar.course_code = c.course_code
      LEFT JOIN agent_decisions ad ON ar.request_id = ad.request_id
      WHERE ar.status = 'pending'
      ORDER BY ar.priority DESC, ar.requested_at ASC
      LIMIT 20
    `);

    // Get conflicts requiring resolution
    const conflicts = await executeQuery(`
      SELECT 
        ac.*,
        ar.purpose,
        ar.requested_date,
        ar.start_time,
        ar.end_time,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name
      FROM allocation_conflicts ac
      JOIN allocation_requests ar ON ac.request_id = ar.request_id
      LEFT JOIN faculty f ON ar.faculty_id = f.faculty_id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE ac.resolution_status = 'unresolved'
      ORDER BY ac.severity DESC, ac.created_at ASC
      LIMIT 10
    `);

    // Get today's schedule overview
    const todaysSchedule = await executeQuery(`
      SELECT 
        ca.*,
        cr.room_name,
        cr.building,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        c.course_name
      FROM classroom_allocations ca
      JOIN classrooms cr ON ca.room_id = cr.room_id
      LEFT JOIN faculty f ON ca.faculty_id = f.faculty_id
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN courses c ON ca.course_code = c.course_code
      WHERE ca.allocated_date = ?
      AND ca.status IN ('scheduled', 'ongoing')
      ORDER BY ca.start_time ASC
    `, [date]);

    // Get maintenance schedule for today
    const maintenanceSchedule = await executeQuery(`
      SELECT 
        ms.*,
        cr.room_name,
        cr.building
      FROM maintenance_schedule ms
      JOIN classrooms cr ON ms.room_id = cr.room_id
      WHERE ms.scheduled_date = ?
      AND ms.status IN ('scheduled', 'in_progress')
      ORDER BY ms.start_time ASC
    `, [date]);

    // Calculate agent performance metrics
    const [agentMetrics] = await executeQuery(`
      SELECT 
        COUNT(*) as total_decisions,
        SUM(CASE WHEN decision_type = 'auto_approve' THEN 1 ELSE 0 END) as auto_approvals,
        SUM(CASE WHEN decision_type = 'suggest_alternative' THEN 1 ELSE 0 END) as alternatives_suggested,
        SUM(CASE WHEN decision_type = 'conflict_detected' THEN 1 ELSE 0 END) as conflicts_detected,
        SUM(CASE WHEN decision_type = 'manual_review' THEN 1 ELSE 0 END) as manual_reviews,
        AVG(confidence_score) as avg_confidence_score
      FROM agent_decisions 
      WHERE DATE(created_at) = ?
    `, [date]);

    return NextResponse.json({
      success: true,
      data: {
        stats: stats || {
          total_rooms: 0,
          pending_requests: 0,
          todays_allocations: 0,
          unresolved_conflicts: 0
        },
        room_utilization: roomUtilization,
        recent_decisions: recentDecisions,
        pending_requests: pendingRequests,
        conflicts: conflicts,
        todays_schedule: todaysSchedule,
        maintenance_schedule: maintenanceSchedule,
        agent_metrics: agentMetrics || {
          total_decisions: 0,
          auto_approvals: 0,
          alternatives_suggested: 0,
          conflicts_detected: 0,
          manual_reviews: 0,
          avg_confidence_score: 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// POST - Process manual admin actions
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, request_id, allocation_id, room_id, admin_notes } = body;

    switch (action) {
      case 'approve_request':
        await approveRequest(request_id, room_id, admin_notes);
        break;
      
      case 'reject_request':
        await rejectRequest(request_id, admin_notes);
        break;
      
      case 'resolve_conflict':
        await resolveConflict(request_id, admin_notes);
        break;
      
      case 'override_allocation':
        await overrideAllocation(allocation_id, room_id, admin_notes);
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} completed successfully`
    });

  } catch (error) {
    console.error('Error processing admin action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process admin action' },
      { status: 500 }
    );
  }
}

async function approveRequest(requestId, roomId, adminNotes) {
  // Get request details
  const [request] = await executeQuery(
    'SELECT * FROM allocation_requests WHERE request_id = ?',
    [requestId]
  );

  if (!request) throw new Error('Request not found');

  // Create allocation
  const allocationId = `ALLOC${Date.now()}`;
  
  await executeQuery(`
    INSERT INTO classroom_allocations 
    (allocation_id, request_id, room_id, faculty_id, course_code, allocated_date, 
     start_time, end_time, status, allocation_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 'regular')
  `, [allocationId, requestId, roomId, request.faculty_id, request.course_code,
      request.requested_date, request.start_time, request.end_time]);

  // Update request status
  await executeQuery(
    'UPDATE allocation_requests SET status = ?, processed_at = NOW(), notes = ? WHERE request_id = ?',
    ['approved', adminNotes, requestId]
  );

  // Update agent decision with admin override
  await executeQuery(
    'UPDATE agent_decisions SET admin_override = TRUE WHERE request_id = ?',
    [requestId]
  );

  // Get room details for notifications
  const [roomDetails] = await executeQuery(
    'SELECT room_name, building FROM classrooms WHERE room_id = ?',
    [roomId]
  );

  // Send notification to faculty
  await sendNotification(request.faculty_id, 'allocation_approved', 
    'Request Approved', 
    `Your classroom request has been approved and allocated to room ${roomId}`);

  // Send notification to students enrolled in this course
  await sendStudentNotifications(request, roomDetails, allocationId);
}

async function rejectRequest(requestId, adminNotes) {
  const [request] = await executeQuery(
    'SELECT * FROM allocation_requests WHERE request_id = ?',
    [requestId]
  );

  if (!request) throw new Error('Request not found');

  // Update request status
  await executeQuery(
    'UPDATE allocation_requests SET status = ?, processed_at = NOW(), notes = ? WHERE request_id = ?',
    ['rejected', adminNotes, requestId]
  );

  // Send notification
  await sendNotification(request.faculty_id, 'allocation_rejected',
    'Request Rejected',
    `Your classroom request has been rejected. Reason: ${adminNotes}`);
}

async function resolveConflict(requestId, adminNotes) {
  // Update conflict status
  await executeQuery(
    'UPDATE allocation_conflicts SET resolution_status = ?, resolved_at = NOW(), resolution_notes = ? WHERE request_id = ?',
    ['resolved', adminNotes, requestId]
  );
}

async function overrideAllocation(allocationId, newRoomId, adminNotes) {
  const [allocation] = await executeQuery(
    'SELECT * FROM classroom_allocations WHERE allocation_id = ?',
    [allocationId]
  );

  if (!allocation) throw new Error('Allocation not found');

  // Update allocation
  await executeQuery(
    'UPDATE classroom_allocations SET room_id = ?, updated_at = NOW() WHERE allocation_id = ?',
    [newRoomId, allocationId]
  );

  // Send notification
  await sendNotification(allocation.faculty_id, 'room_changed',
    'Room Changed',
    `Your allocated room has been changed. New room: ${newRoomId}. Reason: ${adminNotes}`);
}

async function sendStudentNotifications(request, roomDetails, allocationId) {
  try {
    // Get students enrolled in this course
    const students = await executeQuery(`
      SELECT DISTINCT s.student_id, u.id as user_id, u.first_name, u.last_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN enrollments e ON s.student_id = e.student_id
      WHERE e.course_code = ?
    `, [request.course_code]);

    // Send notification to each student
    for (const student of students) {
      const message = `📅 New Class Schedule

Your ${request.course_code} class has been scheduled:

📍 Location: ${roomDetails?.room_name || request.room_id} (${roomDetails?.building || 'Campus'})
📅 Date: ${new Date(request.requested_date).toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
⏰ Time: ${new Date(`2000-01-01T${request.start_time}`).toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
})} - ${new Date(`2000-01-01T${request.end_time}`).toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
})}

📚 Subject: ${request.purpose}

Please be on time and bring all necessary materials.`;

      await sendNotificationToStudent(
        student.user_id, 
        'class_scheduled', 
        '🏫 Class Schedule Update',
        message
      );
    }
  } catch (error) {
    console.error('Error sending student notifications:', error);
  }
}

async function sendNotificationToStudent(recipientId, type, title, message) {
  // Check if a similar notification already exists for this student in the last hour
  const existingNotifications = await executeQuery(`
    SELECT notification_id FROM agent_notifications 
    WHERE recipient_id = ? 
    AND recipient_type = 'student' 
    AND notification_type = ? 
    AND title = ?
    AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
  `, [recipientId, type, title]);

  // If notification already exists, don't create duplicate
  if (existingNotifications.length > 0) {
    console.log(`Skipping duplicate notification for student ${recipientId}: ${title}`);
    return;
  }

  const notificationId = `NOT${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  await executeQuery(`
    INSERT INTO agent_notifications 
    (notification_id, recipient_id, recipient_type, notification_type, title, message)
    VALUES (?, ?, 'student', ?, ?, ?)
  `, [notificationId, recipientId, type, title, message]);
}

async function sendNotification(recipientId, type, title, message) {
  // Check if a similar notification already exists for this faculty in the last hour
  const existingNotifications = await executeQuery(`
    SELECT notification_id FROM agent_notifications 
    WHERE recipient_id = ? 
    AND recipient_type = 'faculty' 
    AND notification_type = ? 
    AND title = ?
    AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
  `, [recipientId, type, title]);

  // If notification already exists, don't create duplicate
  if (existingNotifications.length > 0) {
    console.log(`Skipping duplicate notification for faculty ${recipientId}: ${title}`);
    return;
  }

  const notificationId = `NOT${Date.now()}`;
  
  await executeQuery(`
    INSERT INTO agent_notifications 
    (notification_id, recipient_id, recipient_type, notification_type, title, message)
    VALUES (?, ?, 'faculty', ?, ?, ?)
  `, [notificationId, recipientId, type, title, message]);
}