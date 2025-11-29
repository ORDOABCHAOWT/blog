import { NextRequest, NextResponse } from 'next/server';
import { getOSSClient, generateFileName, getFullUrl } from '@/lib/oss';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    // 验证文件大小 (最大 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成文件名
    const fileName = generateFileName(file.name);

    // 上传到 OSS
    const client = getOSSClient();
    const result = await client.put(fileName, buffer);

    if (result.res.status === 200) {
      const url = getFullUrl(fileName);
      return NextResponse.json({
        success: true,
        url,
        fileName,
        markdown: `![${file.name}](${url})`,
      });
    } else {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
