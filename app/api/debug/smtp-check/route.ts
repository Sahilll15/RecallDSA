import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.nextUrl.searchParams.get('secret') === secret;
}

/**
 * Temporary diagnostic: verifies the SMTP transport in isolation and returns
 * the real error, since Vercel's log tail truncates the message that
 * console.error prints for the cron route.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    hasPass: Boolean(process.env.SMTP_PASS),
    from: process.env.SMTP_FROM,
  };

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transporter.verify();
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      config,
      error: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      command: (error as any)?.command,
      responseCode: (error as any)?.responseCode,
    });
  }
}
