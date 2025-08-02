import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to run migrations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up users table for profile management...')

    // Step 1: Ensure users table exists with all necessary columns
    console.log('📝 Step 1: Creating/updating users table...')
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR UNIQUE NOT NULL,
        name VARCHAR,
        phone VARCHAR,
        role VARCHAR DEFAULT 'customer',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableSQL
    })

    if (createError) {
      console.error('❌ Error creating users table:', createError)
    } else {
      console.log('✅ Users table created/verified')
    }

    // Step 2: Add missing columns
    console.log('📝 Step 2: Adding missing columns...')
    
    const addColumnsSQL = `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'customer';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `

    const { error: columnsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: addColumnsSQL
    })

    if (columnsError) {
      console.error('❌ Error adding columns:', columnsError)
    } else {
      console.log('✅ Columns added/verified')
    }

    // Step 3: Create indexes
    console.log('📝 Step 3: Creating indexes...')
    
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
    `

    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: indexesSQL
    })

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError)
    } else {
      console.log('✅ Indexes created successfully')
    }

    // Step 4: Create test user if needed
    console.log('📝 Step 4: Creating test user...')
    
    // Check if any users exist
    const { data: existingUsers, error: countError } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact' })
      .limit(1)

    if (!countError && (!existingUsers || existingUsers.length === 0)) {
      // Create a test user
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert([{
          email: 'teste@wilnara.com',
          name: 'Usuário Teste',
          phone: '+351 912 345 678',
          role: 'customer',
          is_active: true
        }])

      if (insertError) {
        console.error('❌ Error creating test user:', insertError)
      } else {
        console.log('✅ Test user created: teste@wilnara.com')
      }
    } else {
      console.log('✅ Users already exist in table')
    }

    // Step 5: Create updated_at trigger function
    console.log('📝 Step 5: Creating trigger function...')
    
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `

    const { error: triggerError } = await supabaseAdmin.rpc('exec_sql', {
      sql: triggerSQL
    })

    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError)
    } else {
      console.log('✅ Trigger created successfully')
    }

    console.log('🎉 Users table setup completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Users table setup completed successfully',
      details: {
        testUserCreated: !countError && (!existingUsers || existingUsers.length === 0)
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error in setup-users-table:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro inesperado durante a configuração da tabela de usuários'
    }, { status: 500 })
  }
}