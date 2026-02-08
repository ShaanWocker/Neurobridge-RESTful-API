#!/bin/bash

echo "🔧 Complete Authentication Reset"
echo "================================"

# 1. Stop the server if running
echo "Stopping server..."
pkill -f "nest start"

# 2. Rebuild the project
echo "Building project..."
npm run build

# 3. Create fresh user with Node.js
cat > temp-create-user.ts << 'ENDSCRIPT'
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '74947494', // UPDATE THIS!
  database: 'neurobridge',
});

async function create() {
  await dataSource.initialize();
  
  // Clean slate
  await dataSource.query(`DELETE FROM users WHERE email = 'super@neurobridge.edu'`);
  
  // Create with proper hash
  const hash = await bcrypt.hash('demo123', 10);
  
  await dataSource.query(
    `INSERT INTO users (id, email, password, "firstName", "lastName", role, status, "emailVerified", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, 'Super', 'Admin', 'super_admin', 'active', true, NOW(), NOW())`,
    ['super@neurobridge.edu', hash]
  );
  
  // Verify
  const [user] = await dataSource.query(`SELECT * FROM users WHERE email = 'super@neurobridge.edu'`);
  const valid = await bcrypt.compare('demo123', user.password);
  
  console.log(valid ? '✅ User created successfully!' : '❌ Failed');
  
  await dataSource.destroy();
}

create();
ENDSCRIPT

echo "Creating user..."
npx ts-node temp-create-user.ts

# Clean up
rm temp-create-user.ts

echo ""
echo "✅ Setup complete!"
echo "📧 Email: super@neurobridge.edu"
echo "🔑 Password: demo123"
echo "🔌 Port: 3001"
echo ""
echo "Now run: npm run start:dev"
echo "Then test: curl -X POST http://localhost:3001/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"super@neurobridge.edu\",\"password\":\"demo123\"}'"