import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';
import ClassroomAIAgent from '../../../../lib/classroom-ai-agent.js';

const aiAgent = new ClassroomAIAgent();

// POST - Process pending requests with AI
export async function POST(request) {
  try {
    const { action, date } = await request.json();
    const processDate = date || new Date().toISOString().split('T')[0];

    switch (action) {
      case 'analyze_conflicts':
        return await analyzeConflicts(processDate);
      
      case 'process_allocations':
        return await processAllocations(processDate);
      
      case 'generate_notifications':
        return await generateNotifications(processDate);
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI processing error:', error);
    return NextResponse.json(
      { success: false, error: 'AI processing failed' },
      { status: 500 }
    );
  }
}

async function analyzeConflicts(date) {
  try {
    // Get unresolved conflicts
    const conflicts = await executeQuery(`
      SELECT * FROM allocation_conflicts 
      WHERE resolution_status = 'unresolved'
      ORDER BY priority DESC, created_at ASC
    `);

    // Get available rooms
    const availableRooms = await executeQuery(`
      SELECT c.*, 
        COALESCE(utilization.utilization_percentage, 0) as utilization_percentage
      FROM classrooms c
      LEFT JOIN (
        SELECT room_id,
          ROUND((SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)) / (8 * 60)) * 100, 2) as utilization_percentage
        FROM classroom_allocations 
        WHERE allocated_date = ? AND status IN ('scheduled', 'ongoing')
        GROUP BY room_id
      ) utilization ON c.room_id = utilization.room_id
      WHERE c.status = 'available'
      ORDER BY utilization_percentage ASC
    `, [date]);

    // Get related requests
    const requests = await executeQuery(`
      SELECT ar.*, 
        CONCAT(uf.first_name, ' ', uf.last_name) as faculty_name,
        c.course_name
      FROM allocation_requests ar
      LEFT JOIN faculty f ON ar.faculty_id = f.faculty_id
      LEFT JOIN users uf ON f.user_id = uf.id
      LEFT JOIN courses c ON ar.course_code = c.course_code
      WHERE ar.status = 'pending' AND ar.requested_date = ?
      ORDER BY ar.priority DESC, ar.created_at ASC
    `, [date]);

    // Use AI to analyze conflicts
    const aiAnalysis = await aiAgent.analyzeConflicts(conflicts, availableRooms, requests);

    // Store AI analysis results
    for (const conflictAnalysis of aiAnalysis.conflicts) {
      await executeQuery(`
        INSERT INTO agent_decisions (
          decision_id, request_id, decision_type, reasoning, 
          confidence_score, alternative_options, created_at
        ) VALUES (?, ?, 'conflict_analysis', ?, ?, ?, NOW())
      `, [
        `DECISION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conflictAnalysis.conflict_id,
        conflictAnalysis.resolution_strategy,
        conflictAnalysis.priority_score / 10,
        JSON.stringify(conflictAnalysis.alternative_rooms)
      ]);
    }

    return NextResponse.json({
      success: true,
      data: {
        conflicts_analyzed: conflicts.length,
        ai_analysis: aiAnalysis,
        recommendations: aiAnalysis.recommendations
      }
    });

  } catch (error) {
    console.error('Conflict analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Conflict analysis failed' },
      { status: 500 }
    );
  }
}

async function processAllocations(date) {
  try {
    // Get pending requests
    const pendingRequests = await executeQuery(`
      SELECT ar.*, 
        CONCAT(uf.first_name, ' ', uf.last_name) as faculty_name,
        c.course_name
      FROM allocation_requests ar
      LEFT JOIN faculty f ON ar.faculty_id = f.faculty_id
      LEFT JOIN users uf ON f.user_id = uf.id
      LEFT JOIN courses c ON ar.course_code = c.course_code
      WHERE ar.status = 'pending' AND ar.requested_date = ?
      ORDER BY ar.priority DESC, ar.created_at ASC
    `, [date]);

    // Get available rooms with current utilization
    const availableRooms = await executeQuery(`
      SELECT c.*, 
        COALESCE(utilization.utilization_percentage, 0) as utilization_percentage,
        COALESCE(utilization.allocations_count, 0) as allocations_count
      FROM classrooms c
      LEFT JOIN (
        SELECT room_id,
          COUNT(*) as allocations_count,
          ROUND((SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)) / (8 * 60)) * 100, 2) as utilization_percentage
        FROM classroom_allocations 
        WHERE allocated_date = ? AND status IN ('scheduled', 'ongoing')
        GROUP BY room_id
      ) utilization ON c.room_id = utilization.room_id
      WHERE c.status = 'available'
      ORDER BY utilization_percentage ASC
    `, [date]);

    // Get existing allocations
    const existingAllocations = await executeQuery(`
      SELECT * FROM classroom_allocations 
      WHERE allocated_date = ? AND status IN ('scheduled', 'ongoing')
      ORDER BY start_time ASC
    `, [date]);

    // Use AI to make allocation decisions
    const aiDecisions = await aiAgent.makeAllocationDecisions(
      pendingRequests, 
      availableRooms, 
      existingAllocations
    );

    let processedCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    // Process AI decisions
    for (const decision of aiDecisions.decisions) {
      const request = pendingRequests.find(r => r.request_id === decision.request_id);
      if (!request) continue;

      processedCount++;

      if (decision.decision === 'approve' && decision.allocated_room) {
        // Create allocation
        const allocationId = `ALLOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await executeQuery(`
          INSERT INTO classroom_allocations (
            allocation_id, room_id, faculty_id, course_code, 
            allocated_date, start_time, end_time, status, 
            allocation_type, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', 'ai_allocated', NOW())
        `, [
          allocationId,
          decision.allocated_room,
          request.faculty_id,
          request.course_code,
          request.requested_date,
          request.start_time,
          request.end_time
        ]);

        // Update request status
        await executeQuery(`
          UPDATE allocation_requests 
          SET status = 'approved', processed_at = NOW() 
          WHERE request_id = ?
        `, [request.request_id]);

        approvedCount++;

      } else {
        // Reject or defer request
        await executeQuery(`
          UPDATE allocation_requests 
          SET status = ?, processed_at = NOW() 
          WHERE request_id = ?
        `, [decision.decision === 'reject' ? 'rejected' : 'deferred', request.request_id]);

        if (decision.decision === 'reject') rejectedCount++;
      }

      // Store AI decision
      await executeQuery(`
        INSERT INTO agent_decisions (
          decision_id, request_id, decision_type, reasoning, 
          confidence_score, alternative_options, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        `DECISION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        request.request_id,
        decision.decision,
        decision.reasoning,
        decision.confidence_score,
        JSON.stringify(decision.alternative_options)
      ]);
    }

    return NextResponse.json({
      success: true,
      data: {
        processed_requests: processedCount,
        approved: approvedCount,
        rejected: rejectedCount,
        deferred: processedCount - approvedCount - rejectedCount,
        ai_insights: {
          optimization_notes: aiDecisions.optimization_notes,
          utilization_impact: aiDecisions.utilization_impact
        }
      }
    });

  } catch (error) {
    console.error('Allocation processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Allocation processing failed' },
      { status: 500 }
    );
  }
}

async function generateNotifications(date) {
  try {
    // Get recent allocations
    const recentAllocations = await executeQuery(`
      SELECT ca.*, c.room_name, c.building,
        CONCAT(uf.first_name, ' ', uf.last_name) as faculty_name,
        co.course_name
      FROM classroom_allocations ca
      JOIN classrooms c ON ca.room_id = c.room_id
      LEFT JOIN faculty f ON ca.faculty_id = f.faculty_id
      LEFT JOIN users uf ON f.user_id = uf.id
      LEFT JOIN courses co ON ca.course_code = co.course_code
      WHERE ca.allocated_date = ? AND ca.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      ORDER BY ca.created_at DESC
    `, [date]);

    // Get active conflicts
    const activeConflicts = await executeQuery(`
      SELECT * FROM allocation_conflicts 
      WHERE resolution_status = 'unresolved'
      ORDER BY priority DESC
    `);

    // Get recent decisions
    const recentDecisions = await executeQuery(`
      SELECT * FROM agent_decisions 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      ORDER BY created_at DESC
    `);

    // Use AI to generate notifications
    const aiNotifications = await aiAgent.generateNotifications(
      recentAllocations,
      activeConflicts,
      recentDecisions
    );

    let notificationCount = 0;

    // Store generated notifications
    for (const notification of aiNotifications.notifications) {
      const notificationId = `NOT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await executeQuery(`
        INSERT INTO agent_notifications (
          notification_id, recipient_id, recipient_type, 
          notification_type, title, message, priority, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        notificationId,
        notification.recipient_id,
        notification.recipient_type,
        notification.type,
        notification.title,
        notification.message,
        notification.priority
      ]);

      notificationCount++;
    }

    return NextResponse.json({
      success: true,
      data: {
        notifications_generated: notificationCount,
        allocations_processed: recentAllocations.length,
        conflicts_addressed: activeConflicts.length
      }
    });

  } catch (error) {
    console.error('Notification generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Notification generation failed' },
      { status: 500 }
    );
  }
}

// GET - Get AI processing status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get AI processing statistics
    const [stats] = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM agent_decisions WHERE DATE(created_at) = ?) as decisions_today,
        (SELECT COUNT(*) FROM agent_decisions WHERE decision_type = 'approve' AND DATE(created_at) = ?) as approved_today,
        (SELECT COUNT(*) FROM agent_decisions WHERE decision_type = 'reject' AND DATE(created_at) = ?) as rejected_today,
        (SELECT AVG(confidence_score) FROM agent_decisions WHERE DATE(created_at) = ?) as avg_confidence,
        (SELECT COUNT(*) FROM agent_notifications WHERE DATE(created_at) = ?) as notifications_sent
    `, [date, date, date, date, date]);

    return NextResponse.json({
      success: true,
      data: {
        ai_enabled: !!process.env.OPENAI_API_KEY,
        processing_stats: stats,
        last_processing: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get AI status' },
      { status: 500 }
    );
  }
}