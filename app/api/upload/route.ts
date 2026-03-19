import { NextRequest, NextResponse } from 'next/server'

// TODO: Integrate with Supabase storage and database
// - Upload file to Supabase Storage bucket
// - Create upload record in uploads table
// - Parse file and insert companies into companies table

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Only .xlsx files are accepted' },
        { status: 400 }
      )
    }

    // TODO: Parse file, upload to Supabase, insert rows
    const uploadId = crypto.randomUUID()

    return NextResponse.json({
      uploadId,
      rowCount: 0,
      status: 'pending',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
