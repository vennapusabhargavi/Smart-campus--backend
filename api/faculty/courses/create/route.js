import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../lib/db.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      courseCode,
      courseName,
      type,
      subjectCategory,
      prerequisiteCourse,
      slot,
      maxSlotCount,
      courseCategory,
      faculty_id
    } = body;

    // Validate required fields
    if (!courseCode || !courseName || !slot || !maxSlotCount || !faculty_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: courseCode, courseName, slot, maxSlotCount, faculty_id' },
        { status: 400 }
      );
    }

    // Check if course code already exists
    const [existingCourse] = await executeQuery(
      'SELECT course_code FROM courses WHERE course_code = ?',
      [courseCode]
    );

    if (existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course code already exists' },
        { status: 400 }
      );
    }

    // Get faculty department
    const [faculty] = await executeQuery(`
      SELECT f.department 
      FROM faculty f 
      WHERE f.faculty_id = ?
    `, [faculty_id]);

    const department = faculty ? faculty.department : 'Computer Science';

    // Insert new course
    await executeQuery(`
      INSERT INTO courses (
        course_code, 
        course_name, 
        department, 
        credits, 
        semester, 
        year, 
        course_type, 
        slot, 
        max_capacity, 
        current_enrolled, 
        faculty_id,
        description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `, [
      courseCode,
      courseName,
      department,
      3, // Default credits
      1, // Default semester
      2024, // Default year
      type === 'Contact Course' ? 'core' : 'elective',
      slot,
      parseInt(maxSlotCount),
      faculty_id,
      `${courseName} - ${subjectCategory || 'Course'} created by faculty`
    ]);

    // Get the created course details
    const [newCourse] = await executeQuery(`
      SELECT c.*, CONCAT(u.first_name, ' ', u.last_name) as faculty_name
      FROM courses c
      LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE c.course_code = ?
    `, [courseCode]);

    return NextResponse.json({
      success: true,
      message: 'Course created successfully',
      course: newCourse
    });

  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create course: ' + error.message },
      { status: 500 }
    );
  }
}