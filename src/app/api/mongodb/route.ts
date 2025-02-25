import { MongoClient, ServerApiVersion } from 'mongodb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let client;
  try {
    const { uri, options } = await request.json();
    console.log('Attempting connection to:', uri.replace(/:[^/:]+@/, ':****@'));

    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true
      },
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 1,
      minPoolSize: 0,
      ...options,
      // Required for browser compatibility
      monitorCommands: false,
      serverSelectionTimeoutMS: 30000,
    });

    // Test connection
    await client.connect();
    const adminDb = client.db('admin');
    const result = await adminDb.command({ ping: 1 });

    if (result.ok !== 1) {
      throw new Error('Database ping failed');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Successfully connected to MongoDB'
    });

  } catch (error) {
    console.error('MongoDB connection error details:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to MongoDB',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  } finally {
    if (client) {
      try {
        await client.close(true);
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get('id');
  
  if (!connectionId) {
    return NextResponse.json({ 
      success: false, 
      error: 'Connection ID required' 
    }, { status: 400 });
  }

  // Return connection status
  return NextResponse.json({ 
    success: true,
    status: 'connected' 
  });
}
