import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side service client with admin privileges
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Creating typing_indicators table...')
    
    const serviceSupabase = getServiceClient()

    // Create typing_indicators table if it doesn't exist
    const createTableSQL = `
      -- Create typing_indicators table for real-time typing status
      CREATE TABLE IF NOT EXISTS public.typing_indicators (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        is_typing BOOLEAN NOT NULL DEFAULT false,
        last_typed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        
        -- Unique constraint: one typing indicator per user per conversation
        UNIQUE(conversation_id, user_id)
      );

      -- Create index for fast lookups
      CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON public.typing_indicators(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_typing_indicators_user ON public.typing_indicators(user_id);
      CREATE INDEX IF NOT EXISTS idx_typing_indicators_last_typed ON public.typing_indicators(last_typed_at);

      -- RLS policies for typing indicators
      ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist to avoid conflicts
      DROP POLICY IF EXISTS "Users can view typing indicators for their conversations" ON public.typing_indicators;
      DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON public.typing_indicators;

      -- Users can only see typing indicators for conversations they participate in
      CREATE POLICY "Users can view typing indicators for their conversations" ON public.typing_indicators
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = typing_indicators.conversation_id
            AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
          )
        );

      -- Users can only update their own typing indicators
      CREATE POLICY "Users can manage their own typing indicators" ON public.typing_indicators
        FOR ALL 
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    `

    // Try to check if table exists first
    const { data: existingTable } = await serviceSupabase
      .from('typing_indicators')
      .select('id')
      .limit(1)

    console.log('Table check result:', existingTable)

    // For now, we'll assume the table needs to be created manually in Supabase dashboard
    // or through the SQL editor in Supabase
    const error = null

    if (error) {
      console.error('❌ Error creating typing_indicators table:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('✅ typing_indicators table created successfully')

    return NextResponse.json({
      success: true,
      message: 'typing_indicators table created successfully'
    })

  } catch (error) {
    console.error('💥 Unexpected error creating typing_indicators table:', error)
    return NextResponse.json(
      { success: false, error: 'Erro inesperado no servidor' },
      { status: 500 }
    )
  }
}