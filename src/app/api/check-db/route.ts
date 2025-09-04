import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check if users table exists and get its structure
    const usersTableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    // Check tasks table structure
    const tasksTableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      ORDER BY ordinal_position;
    `);

    // Check goals table structure
    const goalsTableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'goals' 
      ORDER BY ordinal_position;
    `);

    // Check if other tables exist
    const tablesInfo = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `);

    return NextResponse.json({ 
      success: true,
      tables: tablesInfo.rows,
      usersTableStructure: usersTableInfo.rows,
      tasksTableStructure: tasksTableInfo.rows,
      goalsTableStructure: goalsTableInfo.rows
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