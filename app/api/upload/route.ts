import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const companiesJson = formData.get('companies') as string | null

    if (!file || !companiesJson) {
      return NextResponse.json(
        { error: 'File and companies data required' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Only .xlsx files are accepted' },
        { status: 400 }
      )
    }

    const companies = JSON.parse(companiesJson)

    // Upload file to Supabase Storage
    const fileName = `${user.id}/${Date.now()}_${file.name}`
    const buffer = await file.arrayBuffer()

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-uploads')
      .upload(fileName, new Uint8Array(buffer), {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Create upload record
    const { data: uploadRecord, error: uploadRecordError } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        filename: file.name,
        storage_path: uploadData.path,
        row_count: companies.length,
        status: 'done',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (uploadRecordError) {
      console.error('Upload record error:', uploadRecordError)
      return NextResponse.json(
        { error: 'Failed to create upload record' },
        { status: 500 }
      )
    }

    // Insert companies
    const companiesWithUser = companies.map((company: any) => ({
      ...company,
      user_id: user.id,
      upload_id: uploadRecord.id,
      country: company.country || 'Belgium',
      province: company.province || company.region,
    }))

    const { data: insertedCompanies, error: companiesError } = await supabase
      .from('companies')
      .insert(companiesWithUser)
      .select()

    if (companiesError) {
      console.error('Companies insert error:', companiesError)
      return NextResponse.json(
        { error: 'Failed to save companies' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      uploadId: uploadRecord.id,
      filename: file.name,
      rowCount: companies.length,
      status: 'done',
      companies: insertedCompanies,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
