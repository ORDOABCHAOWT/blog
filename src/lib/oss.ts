import OSS from 'ali-oss';

// OSS 客户端配置
export function getOSSClient() {
  return new OSS({
    region: process.env.OSS_REGION || 'oss-ap-northeast-1',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.OSS_BUCKET || 'taffyblog',
  });
}

// 生成唯一文件名
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
  return `${timestamp}_${nameWithoutExt}${ext}`;
}

// 获取完整URL
export function getFullUrl(key: string): string {
  const domain = process.env.OSS_DOMAIN || 'https://taffyblog.oss-ap-northeast-1.aliyuncs.com';
  return `${domain.replace(/\/$/, '')}/${key}`;
}
