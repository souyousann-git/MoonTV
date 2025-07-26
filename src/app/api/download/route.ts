import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * 处理视频下载请求
 * 支持HLS流转换为MP4格式
 */
export async function POST(request: NextRequest) {
  try {
    const { videoUrl, fileName } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: '缺少视频URL参数' }, { status: 400 });
    }

    const safeFileName = (fileName || '视频').replace(/[^\w\s-]/g, '') + '.mp4';
    const isHLS = videoUrl.includes('.m3u8');

    if (!isHLS) {
      // 对于非HLS视频，直接返回下载链接
      return NextResponse.json({
        success: true,
        directDownload: true,
        url: videoUrl,
        fileName: safeFileName,
      });
    }

    // 对于HLS流，尝试使用FFmpeg转换
    try {
      const outputPath = await convertHLSToMP4(videoUrl, safeFileName);

      // 读取转换后的文件
      const fileBuffer = await fs.readFile(outputPath);

      // 清理临时文件
      await fs.unlink(outputPath).catch(() => {
        // 忽略删除失败的错误
      });

      // 返回文件流
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${safeFileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch (ffmpegError) {
      // FFmpeg转换失败

      // 如果FFmpeg转换失败，返回工具建议
      return NextResponse.json({
        success: false,
        error: 'HLS视频流转换失败',
        suggestion: '建议使用以下方法下载HLS视频流',
        methods: [
          {
            name: 'yt-dlp',
            description: '强大的视频下载工具，支持多种格式',
            command: `yt-dlp "${videoUrl}" -o "${safeFileName}"`,
            install:
              'pip install yt-dlp 或从 https://github.com/yt-dlp/yt-dlp/releases 下载',
          },
          {
            name: 'FFmpeg',
            description: '专业的音视频处理工具',
            command: `ffmpeg -i "${videoUrl}" -c copy "${safeFileName}"`,
            install:
              '从 https://ffmpeg.org/download.html 下载或使用包管理器安装',
          },
          {
            name: 'IDM (Internet Download Manager)',
            description: 'Windows平台的下载管理器',
            note: '直接粘贴链接即可下载',
          },
          {
            name: '迅雷',
            description: '国内常用的下载工具',
            note: '支持HLS流下载',
          },
        ],
        videoUrl,
        fileName: safeFileName,
      });
    }
  } catch (error) {
    // 下载API错误
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * 使用FFmpeg将HLS流转换为MP4
 * @param hlsUrl HLS流地址
 * @param fileName 输出文件名
 * @returns 转换后的文件路径
 */
async function convertHLSToMP4(
  hlsUrl: string,
  fileName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = join(tmpdir(), `${randomUUID()}_${fileName}`);

    // FFmpeg命令参数
    const args = [
      '-i',
      hlsUrl,
      '-c',
      'copy',
      '-bsf:a',
      'aac_adtstoasc',
      '-movflags',
      'faststart',
      '-y', // 覆盖输出文件
      outputPath,
    ];

    // 开始FFmpeg转换

    const ffmpeg = spawn('ffmpeg', args);

    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        // FFmpeg转换成功
        resolve(outputPath);
      } else {
        // FFmpeg转换失败
        reject(new Error(`FFmpeg转换失败，退出码: ${code}\n${stderr}`));
      }
    });

    ffmpeg.on('error', (error) => {
      // FFmpeg进程错误
      reject(new Error(`FFmpeg进程错误: ${error.message}`));
    });

    // 设置超时（10分钟）
    setTimeout(() => {
      ffmpeg.kill('SIGKILL');
      reject(new Error('FFmpeg转换超时'));
    }, 10 * 60 * 1000);
  });
}

/**
 * 获取下载状态
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: '缺少任务ID参数' }, { status: 400 });
  }

  // 这里可以实现任务状态查询逻辑
  // 目前返回简单的响应
  return NextResponse.json({
    taskId,
    status: 'completed',
    message: '下载完成',
  });
}
