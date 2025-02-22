import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { uri } = await request.json();
    
    const client = await MongoClient.connect(uri, { serverSelectionTimeoutMS: 5000 });
    await client.db().admin().ping();
    await client.close();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to connect' 
    });
  }
}
