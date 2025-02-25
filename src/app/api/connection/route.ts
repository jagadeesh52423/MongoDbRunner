import { MongoClient, ServerApiVersion } from 'mongodb';
import { NextResponse } from 'next/server';

// Store active connections in memory using global to share across API routes
// For production, you'd want a more robust solution like a database
declare global {
  var activeConnections: Map<string, any>;
}

// Initialize the global connections map if it doesn't exist
if (!global.activeConnections) {
  global.activeConnections = new Map();
}

// Use the global connections map
const activeConnections = global.activeConnections;

export async function POST(request: Request) {
  let client;
  try {
    const { uri } = await request.json();
    
    if (!uri) {
      return NextResponse.json({ 
        success: false, 
        error: 'Connection URI is required' 
      }, { status: 400 });
    }
    
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
    
    // Generate a unique connection ID
    const connectionId = Date.now().toString();
    
    // Store the connection
    activeConnections.set(connectionId, { client, uri });

    return NextResponse.json({ 
      success: true,
      connectionId,
      message: 'Successfully connected to MongoDB'
    });

  } catch (error) {
    console.error('MongoDB connection error details:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to MongoDB',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { connectionId } = await request.json();
    
    if (!connectionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Connection ID is required' 
      }, { status: 400 });
    }
    
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return NextResponse.json({ 
        success: false, 
        error: 'Connection not found' 
      }, { status: 404 });
    }
    
    try {
      await connection.client.close(true);
      activeConnections.delete(connectionId);
      console.log(`Closed connection: ${connectionId}`);
      
      return NextResponse.json({ 
        success: true,
        message: 'Connection closed successfully'
      });
    } catch (closeError) {
      console.error('Error closing connection:', closeError);
      return NextResponse.json({
        success: false,
        error: closeError instanceof Error ? closeError.message : 'Failed to close connection'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing disconnect request:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process disconnect request'
    }, { status: 500 });
  }
}