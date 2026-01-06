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

    // Get student details for fee structure
    const student = await executeQuery(
      'SELECT department, year, semester FROM students WHERE student_id = ?',
      [decoded.student_id]
    );

    if (student.length === 0) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const { department, year, semester } = student[0];

    // Get fee structure
    const feeStructure = await executeQuery(`
      SELECT fee_type, amount, due_date, academic_year
      FROM fee_structure 
      WHERE department = ? AND year = ? AND semester = ?
      ORDER BY due_date
    `, [department, year, semester]);

    // Get payment history
    const paymentHistory = await executeQuery(`
      SELECT payment_id, fee_type, amount, payment_date, payment_method, 
             transaction_id, status, receipt_number
      FROM fee_payments 
      WHERE student_id = ?
      ORDER BY payment_date DESC
    `, [decoded.student_id]);

    // Calculate pending fees
    const paidFees = paymentHistory
      .filter(p => p.status === 'completed')
      .reduce((acc, payment) => {
        acc[payment.fee_type] = (acc[payment.fee_type] || 0) + parseFloat(payment.amount);
        return acc;
      }, {});

    const pendingFees = feeStructure.map(fee => ({
      ...fee,
      paid_amount: paidFees[fee.fee_type] || 0,
      pending_amount: parseFloat(fee.amount) - (paidFees[fee.fee_type] || 0),
      status: (paidFees[fee.fee_type] || 0) >= parseFloat(fee.amount) ? 'paid' : 'pending'
    }));

    return NextResponse.json({ 
      success: true, 
      data: {
        structure: pendingFees,
        payments: paymentHistory
      }
    });
  } catch (error) {
    console.error('Fees fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}