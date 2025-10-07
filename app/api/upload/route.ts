import { NextResponse } from "next/server"

// Proxy upload route to avoid exposing the storage API key to the client.
// Expects multipart/form-data with field name `file`.
// Environment variables expected:
//   STORAGE_API_BASE (default: https://storage-api-six.vercel.app)
//   STORAGE_API_KEY  (API key for Authorization header)

export const runtime = 'edge'

export async function POST(request: Request) {
    try {
        const apiBase = process.env.STORAGE_API_BASE || 'https://storage-api-six.vercel.app'
        const apiKey = process.env.STORAGE_API_KEY
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'Storage API key not configured (STORAGE_API_KEY).' }, { status: 500 })
        }

        const contentType = request.headers.get('content-type') || ''
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ success: false, error: 'Content-Type must be multipart/form-data' }, { status: 400 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        if (!file) {
            return NextResponse.json({ success: false, error: 'Missing file field' }, { status: 400 })
        }

        if (file.size > 15 * 1024 * 1024) { // 15MB client rule (their API max 50MB, but we enforce 15MB per requirement)
            return NextResponse.json({ success: false, error: 'File exceeds 15MB limit' }, { status: 413 })
        }

        const upstreamForm = new FormData()
        upstreamForm.append('file', file, file.name)

        const upstreamRes = await fetch(`${apiBase}/api/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: upstreamForm
        })

        const data = await upstreamRes.json().catch(() => ({}))
        if (!upstreamRes.ok || !data?.success) {
            return NextResponse.json({ success: false, error: data?.error || data?.message || 'Upload failed' }, { status: 502 })
        }

        // Normalize URL we will store in products.photos. Prefer telegramDirectUrl if present, else build from fileUrl.
        const normalizedUrl = data.data?.telegramDirectUrl || (data.data?.fileUrl ? `${apiBase}${data.data.fileUrl}` : null)

        return NextResponse.json({
            success: true,
            url: normalizedUrl,
            raw: data.data || null,
        })
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || 'Unexpected upload error' }, { status: 500 })
    }
}
