import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';
import { z } from 'zod';

// Validation schema for creating calendar events
const createEventSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  endTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
}).refine((data) => {
  // Validate that end time is after start time
  const start = new Date(`${data.date}T${data.startTime}`);
  const end = new Date(`${data.date}T${data.endTime}`);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime']
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    const result = query(
      'SELECT id, title, description, start_date, end_date, created_at FROM calendar_events WHERE user_id = ? ORDER BY start_date',
      [user.id]
    ) as any[];

    // Transform the data to match the frontend format
    const events = result.map(row => ({
      id: row.id.toString(),
      title: row.title,
      description: row.description,
      date: new Date(row.start_date).toISOString().split('T')[0], // YYYY-MM-DD
      startTime: new Date(row.start_date).toTimeString().slice(0, 5), // HH:MM
      endTime: new Date(row.end_date).toTimeString().slice(0, 5), // HH:MM
      createdAt: new Date(row.created_at).toISOString()
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

    const body = await request.json();
    
    // Validate input with Zod
    const validation = createEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { title, date, startTime, endTime, description } = validation.data;

    // Combine date and time into timestamps
    const startDate = new Date(`${date}T${startTime}`);
    const endDate = new Date(`${date}T${endTime}`);

    // Additional validation for date ranges
    const now = new Date();
    if (startDate < now) {
      return NextResponse.json({
        error: 'Cannot create events in the past'
      }, { status: 400 });
    }

    const result = query(
      'INSERT INTO calendar_events (user_id, title, description, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
      [user.id, title, description || null, startDate.toISOString(), endDate.toISOString()]
    ) as any;

    // Get the inserted record
    const insertedEvent = query(
      'SELECT * FROM calendar_events WHERE id = ?',
      [result.lastInsertRowid]
    ) as any[];

    return NextResponse.json(insertedEvent[0], { status: 201 });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}