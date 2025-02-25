import { NextResponse } from 'next/server';
import { ConnectionStore } from '../../../utils/ConnectionStore';


const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/connections/list`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch connections');
    }

    // Ensure we return an array of connections
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Failed to fetch connections:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/connections/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save connection');
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const connection = await request.json();
    
    // Validate required fields
    if (!connection.name) {
      return NextResponse.json(
        { error: 'Connection name is required' },
        { status: 400 }
      );
    }

    // Get existing connection
    const existing = await ConnectionStore.getConnection(connection.name);
    if (!existing) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Update the connection
    await ConnectionStore.saveConnection(
      connection.name,
      connection.uri || existing.uri,
      {
        host: connection.host || existing.config.host,
        port: connection.port || existing.config.port,
        database: connection.database || existing.config.database,
        username: connection.username || existing.config.username,
        password: connection.password || existing.config.password,
        options: {
          ...existing.config.options,
          ...connection.options
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update connection error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update connection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;
    
    if (!name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Connection name is required' 
      }, { status: 400 });
    }

    console.log(`Attempting to delete connection: ${name}`);
    
    const success = await ConnectionStore.deleteConnection(name);
    
    if (!success) {
      console.log(`Connection not found: ${name}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Connection not found' 
      }, { status: 404 });
    }
    
    console.log(`Successfully deleted connection: ${name}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete connection'
    }, { status: 500 });
  }
}