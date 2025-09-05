import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check if users table exists and get its structure
    const usersTableInfo = query(`
      PRAGMA table_info(users);
    `);

    // Check tasks table structure
    const tasksTableInfo = query(`
      PRAGMA table_info(tasks);
    `);

    // Check goals table structure
    const goalsTableInfo = query(`
      PRAGMA table_info(goals);
    `);

    // Check calendar_events table structure
    const calendarTableInfo = query(`
      PRAGMA table_info(calendar_events);
    `);

    // Check if tables exist
    const tablesInfo = query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
    `);

    return NextResponse.json({ 
      success: true,
      tables: tablesInfo,
      usersTableStructure: usersTableInfo,
      tasksTableStructure: tasksTableInfo,
      goalsTableStructure: goalsTableInfo,
      calendarTableStructure: calendarTableInfo
    });
  } catch (error) {
    console.error('Error checking database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}