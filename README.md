# MongoDB Runner

A powerful web-based MongoDB query runner and connection manager with a modern interface, built with Next.js and Express.js.

## Features

- **Connection Management**: Store, edit, and delete multiple MongoDB connections securely
- **Query Editor**: Execute MongoDB queries with syntax highlighting powered by Monaco Editor
- **Real-time Results**: View query results in an interactive table or JSON format
- **Connection Security**: Safely store connection strings with encrypted passwords
- **Dark Mode Support**: Automatic theme switching based on system preferences
- **Modern UI**: Clean interface built with Radix UI components and TailwindCSS

## Architecture

The application consists of two parts:

1. **Frontend**: Next.js application with React components for the UI
2. **Backend**: Express.js server for managing connections and executing queries

## Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB (local or remote instance)

## Installation

### Clone the repository

```bash
git clone https://github.com/yourusername/mongodb-runner.git
cd mongodb-runner
```

### Install dependencies for both frontend and backend

```bash
# Install frontend dependencies
npm install

# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Return to root directory
cd ..
```

### Environment Setup

1. Create `.env` file in the root directory:

```
BACKEND_URL=http://localhost:3001
```

2. Create `.env` file in the `backend` directory:

```
PORT=3001
NODE_ENV=development
```

## Running the Application

### Development Mode

Start both the frontend and backend in development mode:

```bash
# Start the backend
npm run dev:backend

# In a new terminal, start the frontend
npm run dev
```

### Production Mode

Build and start the application for production:

```bash
# Build the frontend
npm run build

# Build the backend
cd backend
npm run build
cd ..

# Start the backend
npm run start:backend

# In a new terminal, start the frontend
npm run start
```

## Usage Guide

### Managing Connections

1. **Add a Connection**:
   - Click the "New" button in the Connections panel
   - Fill in connection details (name, host, port, credentials)
   - Choose between standard form or connection URI input
   - Click "Add" to save

2. **Connect to a Database**:
   - Right-click on a saved connection and select "Connect"
   - Or use the context menu to edit or delete the connection

3. **Select Active Connection**:
   - Once connected, choose the connection from the dropdown in the top-right

### Running Queries

1. **Write Query**:
   - Enter MongoDB commands in the Query Editor
   - Use syntax like `db.collection('users').find({})` or helper commands like `show dbs`

2. **Execute Query**:
   - Click the "Execute" button to run the query against the selected connection

3. **View Results**:
   - Toggle between Table and JSON view modes
   - Click "View" on a row to see detailed JSON data

## Example Queries

```javascript
// List all databases
show dbs

// Switch to a specific database
use myDatabase

// List collections in current database
show collections

// Find documents
db.collection('users').find({ age: { $gt: 21 } })

// Insert a document
db.collection('users').insertOne({ name: "John", age: 30 })

// Update documents
db.collection('users').updateMany({ status: "inactive" }, { $set: { status: "active" } })

// Delete documents
db.collection('users').deleteOne({ _id: ObjectId("...") })

// Aggregation pipeline
db.collection('orders').aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } }
])
```

## Connection Storage

Connection details are stored securely in the user's home directory at `~/.db_connections/` as JSON files.

## Tech Stack

- **Frontend**:
  - Next.js 15+
  - React 19
  - TypeScript
  - TailwindCSS
  - Monaco Editor
  - Radix UI Components

- **Backend**:
  - Express.js
  - MongoDB Node.js Driver
  - TypeScript

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.