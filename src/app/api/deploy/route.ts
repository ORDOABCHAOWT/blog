import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  cmsMutationOriginResponse,
  cmsUnavailableResponse,
  isCmsAvailable,
} from '@/lib/cms-access';

const execFileAsync = promisify(execFile);

export async function POST(request: NextRequest) {
  if (!isCmsAvailable()) return cmsUnavailableResponse();
  const originResponse = cmsMutationOriginResponse(request);
  if (originResponse) return originResponse;

  try {
    // 检查是否有未提交的更改（使用参数化命令防止注入）
    const { stdout: status } = await execFileAsync('git', ['status', '--porcelain']);

    if (!status.trim()) {
      return NextResponse.json({
        success: true,
        unchanged: true,
        message: '内容已是最新状态'
      });
    }

    // 添加所有更改（参数化执行）
    await execFileAsync('git', ['add', 'posts/', '.']);

    // 创建提交（参数化执行，commit message 作为单独参数传递）
    const commitMessage = `博客更新 - ${new Date().toLocaleString('zh-CN')}`;
    await execFileAsync('git', ['commit', '-m', commitMessage]);

    // 推送到远程仓库（参数化执行）
    await execFileAsync('git', ['push', 'origin', 'main']);

    return NextResponse.json({
      success: true,
      message: '成功发布到 GitHub！Vercel 将自动部署。'
    });
  } catch (error) {
    console.error('Deploy error:', error);
    return NextResponse.json({
      success: false,
      error: '发布失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
