import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // 检查是否有未提交的更改
    const { stdout: status } = await execAsync('git status --porcelain');

    if (!status.trim()) {
      return NextResponse.json({
        success: false,
        message: '没有需要提交的更改'
      });
    }

    // 添加所有更改
    await execAsync('git add posts/ .');

    // 创建提交
    const commitMessage = `博客更新 - ${new Date().toLocaleString('zh-CN')}`;
    await execAsync(`git commit -m "${commitMessage}"`);

    // 推送到远程仓库
    await execAsync('git push origin main');

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
