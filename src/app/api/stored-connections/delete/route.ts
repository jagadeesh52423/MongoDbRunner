import { NextResponse } from 'next/server';
import { ConnectionStore } from '@/utils/ConnectionStore';

export async function DELETE(request: Request) {
  try {
    // Get the connection name from the URL query parameter
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    
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