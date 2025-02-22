import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { MongoConnection } from '@/types/connection';

const ADMIN_URI = "mongodb+srv://Cluster32312:bGB6T1l9XFVb@cluster32312.ww1bo.mongodb.net/mongodb_runner";
const DB_NAME = 'mongodb_runner';
const COLLECTION_NAME = 'connections';

async function getMongoClient() {
  return await MongoClient.connect(ADMIN_URI);
}

export async function GET() {
  let client;

  try {
    client = await getMongoClient();
    const db = client.db(DB_NAME);
    
    // Create collection if it doesn't exist
    const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collections.length === 0) {
      await db.createCollection(COLLECTION_NAME);
    }

    const connections = await db.collection(COLLECTION_NAME)
      .find({}, { projection: { _id: 0 } })
      .toArray();

    return NextResponse.json({ success: true, data: connections });
  } catch (error) {
    console.error('Failed to fetch connections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connections' },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}

export async function POST(request: Request) {
  let client;

  try {
    const connection = await request.json();
    
    // Basic validation
    if (!connection.name || !connection.id) {
      return NextResponse.json(
        { success: false, error: 'Name and ID are required' },
        { status: 400 }
      );
    }

    client = await getMongoClient();
    const db = client.db(DB_NAME);
    
    // Remove MongoDB internal fields and runtime state
    const { _id, status, error, ...connectionToStore } = connection;
    
    await db.collection(COLLECTION_NAME).insertOne(connectionToStore);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save connection' },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}

export async function DELETE(request: Request) {
  let client;

  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    client = await getMongoClient();
    const db = client.db(DB_NAME);
    
    const result = await db.collection(COLLECTION_NAME).deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete connection' },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}
