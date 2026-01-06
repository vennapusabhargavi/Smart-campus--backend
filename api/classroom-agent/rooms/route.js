import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';

// GET - Fetch classrooms with availability
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startTime = searchParams.get('start_time');
    const endTime = searchParams.get('end_time');
    const capacity = searchParams.get('capacity');
    const roomType = searchParams.get('room_type');
    const building = searchParams.get('building');

    let sql = `
      SELECT 
        c.*,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM classroom_allocations ca 
            WHERE ca.room_id = c.room_id 
            AND ca.allocated_date = COALESCE(?, CURDATE())
            AND ((ca.start_time <= COALESCE(?, '23:59:59') AND ca.end_time > COALESCE(?, '00:00:00'))
                 OR (ca.start_time < COALESCE(?, '23:59:59') AND ca.end_time >= COALESCE(?, '00:00:00')))
            AND ca.status IN ('scheduled', 'ongoing')
          ) THEN 'occupied'
          WHEN EXISTS (
            SELECT 1 FROM maintenance_schedule ms 
            WHERE ms.room_id = c.room_id 
            AND ms.scheduled_date = COALESCE(?, CURDATE())
            AND ((ms.start_time <= COALESCE(?, '23:59:59') AND ms.end_time > COALESCE(?, '00:00:00'))
                 OR (ms.start_time < COALESCE(?, '23:59:59') AND ms.end_time >= COALESCE(?, '00:00:00')))
            AND ms.status IN ('scheduled', 'in_progress')
          ) THEN 'maintenance'
          ELSE 'available'
        END as availability_status
      FROM classrooms c
      WHERE c.status = 'available'
    `;

    const params = [
      date, startTime, startTime, endTime, endTime,  // allocation check params
      date, startTime, startTime, endTime, endTime   // maintenance check params
    ];

    if (capacity) {
      sql += ' AND c.capacity >= ?';
      params.push(parseInt(capacity));
    }

    if (roomType) {
      sql += ' AND c.room_type = ?';
      params.push(roomType);
    }

    if (building) {
      sql += ' AND c.building = ?';
      params.push(building);
    }

    sql += ' ORDER BY c.building, c.floor, c.room_name';

    const rooms = await executeQuery(sql, params);

    // Get current allocations for the specified date/time
    let allocations = [];
    if (date) {
      allocations = await executeQuery(`
        SELECT 
          ca.*,
          cr.room_name,
          CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
          c.course_name
        FROM classroom_allocations ca
        JOIN classrooms cr ON ca.room_id = cr.room_id
        LEFT JOIN faculty f ON ca.faculty_id = f.faculty_id
        LEFT JOIN users u ON f.user_id = u.id
        LEFT JOIN courses c ON ca.course_code = c.course_code
        WHERE ca.allocated_date = ?
        AND ca.status IN ('scheduled', 'ongoing')
        ORDER BY ca.start_time
      `, [date]);
    }

    return NextResponse.json({
      success: true,
      data: {
        rooms: rooms,
        allocations: allocations
      }
    });

  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

// POST - Add new classroom
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      room_id,
      room_name,
      building,
      floor,
      capacity,
      room_type,
      equipment = {}
    } = body;

    // Check if room_id already exists
    const [existingRoom] = await executeQuery(
      'SELECT room_id FROM classrooms WHERE room_id = ?',
      [room_id]
    );

    if (existingRoom) {
      return NextResponse.json(
        { success: false, error: 'Room ID already exists' },
        { status: 409 }
      );
    }

    await executeQuery(`
      INSERT INTO classrooms 
      (room_id, room_name, building, floor, capacity, room_type, equipment, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
    `, [room_id, room_name, building, floor, capacity, room_type, JSON.stringify(equipment)]);

    return NextResponse.json({
      success: true,
      message: 'Classroom added successfully'
    });

  } catch (error) {
    console.error('Error adding classroom:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add classroom' },
      { status: 500 }
    );
  }
}

// PUT - Update classroom
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      room_id,
      room_name,
      building,
      floor,
      capacity,
      room_type,
      equipment,
      status
    } = body;

    let sql = 'UPDATE classrooms SET updated_at = NOW()';
    const params = [];

    if (room_name) {
      sql += ', room_name = ?';
      params.push(room_name);
    }

    if (building) {
      sql += ', building = ?';
      params.push(building);
    }

    if (floor !== undefined) {
      sql += ', floor = ?';
      params.push(floor);
    }

    if (capacity) {
      sql += ', capacity = ?';
      params.push(capacity);
    }

    if (room_type) {
      sql += ', room_type = ?';
      params.push(room_type);
    }

    if (equipment) {
      sql += ', equipment = ?';
      params.push(JSON.stringify(equipment));
    }

    if (status) {
      sql += ', status = ?';
      params.push(status);
    }

    sql += ' WHERE room_id = ?';
    params.push(room_id);

    const result = await executeQuery(sql, params);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Classroom not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Classroom updated successfully'
    });

  } catch (error) {
    console.error('Error updating classroom:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update classroom' },
      { status: 500 }
    );
  }
}