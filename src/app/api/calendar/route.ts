import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    const result = await query(
      'SELECT id, title, description, start_date, end_date, created_at FROM calendar_events WHERE user_id = $1 ORDER BY start_date',
      [user.id]
    );

    // Transform the data to match the frontend format
    const events = result.rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      description: row.description,
      date: row.start_date.toISOString().split('T')[0], // YYYY-MM-DD
      startTime: row.start_date.toTimeString().slice(0, 5), // HH:MM
      endTime: row.end_date.toTimeString().slice(0, 5), // HH:MM
      createdAt: row.created_at.toISOString()
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    const { title, date, startTime, endTime, description } = await request.json();

    if (!title || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Combine date and time into timestamps
    const startDate = new Date(`${date}T${startTime}`);
    const endDate = new Date(`${date}T${endTime}`);

    const result = await query(
      'INSERT INTO calendar_events (user_id, title, description, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, title, description || null, startDate, endDate]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}