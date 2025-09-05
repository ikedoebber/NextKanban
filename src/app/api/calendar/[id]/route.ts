import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';
import { z } from 'zod';

// Validation schema for updating calendar events
const updateEventSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  startTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format')
    .optional(),
  endTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format')
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
}).refine((data) => {
  // If both date and times are provided, validate that end time is after start time
  if (data.date && data.startTime && data.endTime) {
    const start = new Date(`${data.date}T${data.startTime}`);
    const end = new Date(`${data.date}T${data.endTime}`);
    return end > start;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['endTime']
});

const eventIdSchema = z.object({
  id: z.string().min(1, 'Event ID is required')
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request);

    // Validate event ID
    const idValidation = eventIdSchema.safeParse({ id: params.id });
    if (!idValidation.success) {
      return NextResponse.json({
        error: 'Invalid event ID',
        details: idValidation.error.errors
      }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate input with Zod
    const validation = updateEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { title, date, startTime, endTime, description } = validation.data;

    // Build dynamic update query
    let updateFields = [];
    let updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (date && startTime) {
      const startDate = new Date(`${date}T${startTime}`);
      updateFields.push('start_date = ?');
      updateValues.push(startDate.toISOString());
    }
    if (date && endTime) {
      const endDate = new Date(`${date}T${endTime}`);
      updateFields.push('end_date = ?');
      updateValues.push(endDate.toISOString());
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(params.id, user.id);

    const result = query(
      `UPDATE calendar_events SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    ) as any;

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 });
    }

    // Get the updated record
    const updatedEvent = query(
      'SELECT * FROM calendar_events WHERE id = ?',
      [params.id]
    ) as any[];

    return NextResponse.json(updatedEvent[0]);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request);

    // Validate event ID
    const idValidation = eventIdSchema.safeParse({ id: params.id });
    if (!idValidation.success) {
      return NextResponse.json({
        error: 'Invalid event ID',
        details: idValidation.error.errors
      }, { status: 400 });
    }

    const { id: eventId } = idValidation.data;

    const result = query(
      'DELETE FROM calendar_events WHERE id = ? AND user_id = ?',
      [eventId, user.id]
    ) as any;

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}