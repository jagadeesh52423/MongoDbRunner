This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# MongoDB Runner

A powerful web-based MongoDB query runner and connection manager built with Next.js.

## Features

- Manage multiple MongoDB connections
- Execute MongoDB queries and commands with syntax highlighting
- Real-time query results
- Connection persistence
- Dark mode support
- Modern UI with Radix UI components

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up your environment variables:
```env
MONGODB_URI=your_default_mongodb_uri
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) to start using the application

## Usage

1. Add a new MongoDB connection using the "New" button in the Connections panel
2. Write your MongoDB queries in the query editor
3. Click "Execute" to run the query
4. View results in the results panel

## Query Examples

```javascript
// List all databases
db.adminCommand({ listDatabases: 1 })

// List collections in current database
db.getCollectionNames()

// Find documents
db.collection('users').find({ age: { $gt: 21 } })
```

## Tech Stack

- Next.js 13+ with App Router
- TypeScript
- Tailwind CSS
- Monaco Editor
- MongoDB Node.js Driver
- Radix UI Components

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
