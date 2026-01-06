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
    if (!decoded || decoded.role !== 'faculty') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const courseCode = searchParams.get('courseCode');

    // If no month/year provided, return empty results
    if (!month || !year) {
      return NextResponse.json({ 
        success: true, 
        data: {
          results: [],
          summary: {
            totalCourses: 0,
            totalStudents: 0,
            passedStudents: 0,
            averagePassRate: 0
          }
        }
      });
    }

    // Parse month-year (e.g., "July-2025")
    const [monthName, yearNum] = month.split('-');
    const monthMap = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
      'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    const monthNum = monthMap[monthName];

    let whereClause = 'WHERE MONTH(er.result_date) = ? AND YEAR(er.result_date) = ?';
    let params = [monthNum, yearNum];

    if (courseCode) {
      whereClause += ' AND c.course_code = ?';
      params.push(courseCode);
    }

    // Get exam results with course and faculty information
    const results = await executeQuery(`
      SELECT 
        c.course_code,
        c.course_name,
        COUNT(DISTINCT er.student_id) as total_count,
        SUM(CASE WHEN er.marks_obtained >= 40 THEN 1 ELSE 0 END) as pass_count,
        AVG(er.marks_obtained) as theory_average,
        STDDEV(er.marks_obtained) as theory_standard_deviation,
        AVG(er.marks_obtained + COALESCE(asub.marks_obtained, 0)) as grand_total_average,
        STDDEV(er.marks_obtained + COALESCE(asub.marks_obtained, 0)) as grand_total_standard_deviation,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        ROUND((SUM(CASE WHEN er.marks_obtained >= 40 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT er.student_id)), 1) as pass_percentage
      FROM exam_results er
      JOIN examinations e ON er.exam_id = e.exam_id
      JOIN courses c ON e.course_code = c.course_code
      JOIN enrollments en ON c.course_code = en.course_code
      JOIN faculty f ON en.faculty_id = f.faculty_id
      JOIN users u ON f.user_id = u.id
      LEFT JOIN (
        SELECT 
          a.course_code,
          asub.student_id,
          AVG(asub.marks_obtained) as marks_obtained
        FROM assignment_submissions asub
        JOIN assignments a ON asub.assignment_id = a.assignment_id
        GROUP BY a.course_code, asub.student_id
      ) asub ON c.course_code = asub.course_code AND er.student_id = asub.student_id
      ${whereClause}
      GROUP BY c.course_code, c.course_name, u.first_name, u.last_name
      ORDER BY c.course_code
    `, params);

    // Calculate summary statistics
    const summary = {
      totalCourses: results.length,
      totalStudents: results.reduce((sum, row) => sum + row.total_count, 0),
      passedStudents: results.reduce((sum, row) => sum + row.pass_count, 0),
      averagePassRate: results.length > 0 
        ? Math.round(results.reduce((sum, row) => sum + row.pass_percentage, 0) / results.length)
        : 0
    };

    // Format results for frontend
    const formattedResults = results.map((row, index) => ({
      sno: index + 1,
      code: row.course_code,
      name: row.course_name,
      totalCount: row.total_count,
      passCount: row.pass_count,
      theoryAverage: Math.round(row.theory_average || 0),
      theoryStandardDeviation: row.theory_standard_deviation ? Math.round(row.theory_standard_deviation * 10) / 10 : 'null',
      grandTotal: Math.round(row.grand_total_average || 0),
      grandTotalStandardDeviation: row.grand_total_standard_deviation ? Math.round(row.grand_total_standard_deviation * 10) / 10 : 'null',
      facultyName: row.faculty_name,
      passPercentage: row.pass_percentage
    }));

    return NextResponse.json({ 
      success: true, 
      data: {
        results: formattedResults,
        summary: summary
      }
    });
  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}