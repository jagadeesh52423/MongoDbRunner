import { NextResponse } from 'next/server';

// Access the same activeConnections map from the connection endpoint
// Note: In a production app, you'd use a more robust solution like a database
// or a shared module for this.
declare global {
  var activeConnections: Map<string, any>;
}

export async function POST() {
  try {
    console.log('Disconnecting all MongoDB connections');
    
    // Access the global activeConnections
    const connections = global.activeConnections || new Map();
    const promises = [];
    
    // Close all active connections
    for (const [connectionId, connection] of connections.entries()) {
      try {
        promises.push(connection.client.close(true));
        console.log(`Closed connection: ${connectionId}`);
      } catch (closeError) {
        console.error(`Error closing connection ${connectionId}:`, closeError);
      }
    }
    
    // Wait for all connections to close
    await Promise.all(promises);
    
    // Clear the connections map
    connections.clear();
    
    return NextResponse.json({ 
      success: true,
      message: 'All connections disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting all connections:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect all connections'
    }, { status: 500 });
  }
}