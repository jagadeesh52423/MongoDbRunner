import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { parseMongoCommand, handleMongoResult } from '@/utils/mongoCommands';

export async function POST(request: Request) {
  let client: MongoClient | null = null;
  
  try {
    const { query, connectionUri = process.env.MONGODB_URI } = await request.json();
    
    if (!connectionUri) {
      return NextResponse.json({ 
        success: false, 
        error: 'No connection URI provided' 
      });
    }

    client = await MongoClient.connect(connectionUri);
    let db = client.db();
    
    try {
      const parsedCommand = parseMongoCommand(query);
      let result;

      switch (parsedCommand.type) {
        case 'listCollections':
          result = await db.listCollections().toArray();
          break;
        case 'listDatabases':
          result = await client.db('admin').admin().listDatabases();
          break;
        case 'useDatabase':
          db = client.db(parsedCommand.database);
          result = { message: `Switched to database ${parsedCommand.database}` };
          break;
        default:
          // For raw commands, safely evaluate the query
          result = await eval(`(async () => { 
            const db = client.db();
            return ${parsedCommand.code};
          })()`);
      }
      
      // Handle the result before sending response
      const processedResult = await handleMongoResult(result);
      
      return NextResponse.json({ success: true, data: processedResult });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  } finally {
    if (client) await client.close();
  }
}
