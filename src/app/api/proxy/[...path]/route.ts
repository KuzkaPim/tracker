import { NextResponse } from 'next/server';

const API_URL = 'https://hubnity.automatonsoft.de/api';

async function proxy(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathString = resolvedParams.path.join('/');
  const query = new URL(req.url).search; 
  const targetUrl = `${API_URL}/${pathString}${query}`;

  console.log(`[Proxy] -> ${targetUrl}`);

  try {
    const body = req.method !== 'GET' && req.method !== 'HEAD' 
      ? await req.blob() 
      : null;

    const res = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers.get('Content-Type') || 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
        'Accept': 'application/json',
      },
      body: body,
	  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
	  // @ts-expect-error
      duplex: 'half', 
    });

    const data = await res.blob(); 
    return new NextResponse(data, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
      },
    });

  } catch (error: unknown) {
	console.error('[Proxy Error]:', error);

	if (error instanceof Error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	} else {
		return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
	}
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;