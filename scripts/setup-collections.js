import PocketBase from 'pocketbase';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';
const pb = new PocketBase(POCKETBASE_URL);

async function setupCollections() {
  console.log('\n🚀 Setting up PocketBase collections...\n');
  console.log(`Connecting to: ${POCKETBASE_URL}\n`);

  // Get admin credentials
  const email = await question('Admin email: ');
  const password = await question('Admin password: ');
  console.log('');

  try {
    // Authenticate as admin
    await pb.admins.authWithPassword(email, password);
    console.log('✅ Authenticated as admin\n');

    // Check if collections already exist
    const existing = await pb.collections.getFullList();
    const existingNames = existing.map(c => c.name);
    
    if (existingNames.includes('users') || existingNames.includes('activities')) {
      console.log('⚠️  Some collections already exist!');
      const overwrite = await question('Delete existing collections and recreate? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ Cancelled. Exiting.');
        process.exit(0);
      }
      
      // Delete existing collections (in reverse order due to relations)
      for (const name of ['signups', 'roles', 'activities', 'users']) {
        if (existingNames.includes(name)) {
          try {
            const coll = existing.find(c => c.name === name);
            await pb.collections.delete(coll.id);
            console.log(`🗑️  Deleted existing collection: ${name}`);
          } catch (e) {
            // Ignore if doesn't exist
          }
        }
      }
      console.log('');
    }

    // 1. Create users collection (Auth)
    console.log('📦 Creating users collection (Auth)...');
    const usersCollection = await pb.collections.create({
      name: 'users',
      type: 'auth',
      options: {
        allowEmailAuth: true,
        allowOAuth2Auth: false,
        allowUsernameAuth: false,
        exceptEmailDomains: [],
        onlyEmailDomains: [],
        requireEmail: true,
      },
    });

    // Add name field
    await pb.collections.update(usersCollection.id, {
      schema: [
        {
          name: 'name',
          type: 'text',
          required: true,
          options: { min: null, max: null, pattern: '' },
        },
        {
          name: 'username',
          type: 'text',
          required: true,
          options: { min: null, max: null, pattern: '' },
        },
      ],
    });

    // Set API rules for users
    await pb.collections.update(usersCollection.id, {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id = ""',
      updateRule: '@request.auth.id = id',
      deleteRule: '@request.auth.id = id',
    });
    console.log('✅ users collection created\n');

    // 2. Create activities collection
    console.log('📦 Creating activities collection...');
    const activitiesCollection = await pb.collections.create({
      name: 'activities',
      type: 'base',
    });

    // First, add the schema (fields)
    await pb.collections.update(activitiesCollection.id, {
      schema: [
        {
          name: 'name',
          type: 'text',
          required: true,
          options: { min: null, max: null, pattern: '' },
        },
        {
          name: 'date',
          type: 'date',
          required: true,
          options: { min: '', max: '' },
        },
        {
          name: 'description',
          type: 'text',
          required: true,
          options: { min: null, max: null, pattern: '' },
        },
        {
          name: 'creator',
          type: 'relation',
          required: true,
          options: {
            collectionId: usersCollection.id,
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['name'],
          },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: {
            values: ['recruiting', 'full', 'running'],
            maxSelect: 1,
          },
        },
        {
          name: 'zone',
          type: 'text',
          required: false,
          options: { min: null, max: null, pattern: '' },
        },
        {
          name: 'minIP',
          type: 'number',
          required: false,
          options: { min: null, max: null, noDecimal: true },
        },
        {
          name: 'minFame',
          type: 'number',
          required: false,
          options: { min: null, max: null, noDecimal: true },
        },
      ],
    });

    // Then, set the API rules (after schema exists)
    await pb.collections.update(activitiesCollection.id, {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != "" && @request.auth.id = creator',
      updateRule: '@request.auth.id = creator',
      deleteRule: '@request.auth.id = creator',
    });
    console.log('✅ activities collection created\n');

    // 3. Create roles collection
    console.log('📦 Creating roles collection...');
    const rolesCollection = await pb.collections.create({
      name: 'roles',
      type: 'base',
    });

    // First, add the schema (fields)
    await pb.collections.update(rolesCollection.id, {
      schema: [
        {
          name: 'activity',
          type: 'relation',
          required: true,
          options: {
            collectionId: activitiesCollection.id,
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['name'],
          },
        },
        {
          name: 'name',
          type: 'text',
          required: true,
          options: { min: null, max: null, pattern: '' },
        },
        {
          name: 'slots',
          type: 'number',
          required: true,
          options: { min: 1, max: null, noDecimal: true },
        },
        {
          name: 'attributes',
          type: 'json',
          required: false,
          options: {},
        },
      ],
    });

    // Then, set the API rules (after schema exists)
    await pb.collections.update(rolesCollection.id, {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != "" && @request.auth.id = activity.creator',
      updateRule: '@request.auth.id = activity.creator',
      deleteRule: '@request.auth.id = activity.creator',
    });
    console.log('✅ roles collection created\n');

    // 4. Create signups collection
    console.log('📦 Creating signups collection...');
    const signupsCollection = await pb.collections.create({
      name: 'signups',
      type: 'base',
    });

    // First, add the schema (fields)
    await pb.collections.update(signupsCollection.id, {
      schema: [
        {
          name: 'activity',
          type: 'relation',
          required: true,
          options: {
            collectionId: activitiesCollection.id,
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['name'],
          },
        },
        {
          name: 'role',
          type: 'relation',
          required: true,
          options: {
            collectionId: rolesCollection.id,
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['name'],
          },
        },
        {
          name: 'player',
          type: 'relation',
          required: true,
          options: {
            collectionId: usersCollection.id,
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['name'],
          },
        },
        {
          name: 'attributes',
          type: 'json',
          required: false,
          options: {},
        },
        {
          name: 'comment',
          type: 'text',
          required: false,
          options: { min: null, max: null, pattern: '' },
        },
      ],
    });

    // Then, set the API rules (after schema exists)
    await pb.collections.update(signupsCollection.id, {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != "" && @request.auth.id = player',
      updateRule: '@request.auth.id = player || @request.auth.id = activity.creator',
      deleteRule: '@request.auth.id = player || @request.auth.id = activity.creator',
    });
    console.log('✅ signups collection created\n');

    console.log('🎉 All collections created successfully!\n');
    console.log('✅ users (Auth)');
    console.log('✅ activities');
    console.log('✅ roles');
    console.log('✅ signups');
    console.log('\nYou can now start the frontend with: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', JSON.stringify(error.response, null, 2));
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupCollections();
