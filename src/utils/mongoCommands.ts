export async function handleMongoResult(result: any) {
  // Handle cursor results
  if (result && typeof result.toArray === 'function') {
    return await result.toArray();
  }
  
  // Handle command results
  if (result && typeof result === 'object') {
    // Convert MongoDB objects to plain objects
    return JSON.parse(JSON.stringify(result, replaceCircularRefs()));
  }

  return result;
}

function replaceCircularRefs() {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (key === 'client' || key === 'topology' || key === 'sessionPool') {
      return '[CircularReference]';
    }
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
}

export function parseMongoCommand(input: string) {
  const trimmed = input.trim();
  
  // Handle show collections
  if (/^show collections/i.test(trimmed)) {
    return {
      type: 'listCollections',
      code: 'db.listCollections().toArray()'
    };
  }

  // Handle show dbs
  if (/^show dbs/i.test(trimmed)) {
    return {
      type: 'listDatabases',
      code: 'db.adminCommand({ listDatabases: 1 })'
    };
  }

  // Handle use db
  const useDbMatch = trimmed.match(/^use\s+(\w+)/i);
  if (useDbMatch) {
    return {
      type: 'useDatabase',
      database: useDbMatch[1],
      code: `db = client.db('${useDbMatch[1]}')`
    };
  }

  // Default - treat as raw MongoDB command
  return {
    type: 'raw',
    code: trimmed
  };
}
