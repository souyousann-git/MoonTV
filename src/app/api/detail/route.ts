import { NextResponse } from 'next/server';

import { getAvailableApiSites, getCacheTime } from '@/lib/config';
import { getDetailFromApi } from '@/lib/downstream';
import { sanitizeString, validateVideoId } from '@/lib/validation';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const sourceCode = searchParams.get('source');

  if (!id || !sourceCode) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  // 验证视频ID
  const idValidation = validateVideoId(id);
  if (!idValidation.valid) {
    return NextResponse.json({ error: idValidation.error }, { status: 400 });
  }

  // 清理source参数
  const cleanSourceCode = sanitizeString(sourceCode, 50);

  try {
    const apiSites = await getAvailableApiSites();
    const apiSite = apiSites.find((site) => site.key === cleanSourceCode);

    if (!apiSite) {
      return NextResponse.json({ error: '无效的API来源' }, { status: 400 });
    }

    const result = await getDetailFromApi(apiSite, id);
    const cacheTime = await getCacheTime();

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': `public, max-age=${cacheTime}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
