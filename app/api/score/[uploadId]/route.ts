import { NextRequest, NextResponse } from 'next/server'

// TODO: Integrate with Python scraper / scoring pipeline
// - Read companies for this upload from Supabase
// - Trigger scoring job (queue or direct call)
// - Update upload status to 'processing'
// - On completion, update companies with scores and set upload status to 'done'

export async function POST(
  request: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  const { uploadId } = params

  if (!uploadId) {
    return NextResponse.json(
      { error: 'Upload ID is required' },
      { status: 400 }
    )
  }

  // TODO: Validate upload exists and belongs to user
  // TODO: Trigger scoring pipeline

  return NextResponse.json({
    uploadId,
    status: 'processing',
    message: 'Scoring started',
  })
}
