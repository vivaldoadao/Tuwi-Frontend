import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    let userId: string | undefined

    // Handle different content types
    const contentType = request.headers.get('content-type') || ''
    
    try {
      if (contentType.includes('application/json')) {
        const text = await request.text()
        if (text.trim()) {
          const body = JSON.parse(text)
          userId = body.userId
        }
      } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData()
        userId = formData.get('userId') as string
      } else {
        // Handle plain text or other formats (common with sendBeacon)
        const text = await request.text()
        if (text) {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(text)
            userId = parsed.userId
          } catch {
            // If not JSON, treat as plain text userId
            userId = text.trim()
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      // Don't fail on parsing errors for user presence - it's not critical
      return NextResponse.json({ success: true })
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()
    
    const { error } = await supabase.rpc('set_user_offline', {
      p_user_id: userId
    })

    if (error) {
      console.error('Error setting user offline:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in offline endpoint:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}