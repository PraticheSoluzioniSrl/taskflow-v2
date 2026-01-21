import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Questo endpoint aiuta a verificare quali variabili d'ambiente sono configurate
  // NON esporre valori sensibili in produzione!
  
  const envCheck = {
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    AUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
    // Mostra solo i primi caratteri per sicurezza
    NEXTAUTH_SECRET_PREVIEW: process.env.NEXTAUTH_SECRET ? `${process.env.NEXTAUTH_SECRET.substring(0, 10)}...` : 'not set',
    GOOGLE_CLIENT_ID_PREVIEW: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'not set',
    DATABASE_URL_PREVIEW: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'not set',
  };

  const missing = Object.entries(envCheck)
    .filter(([key, value]) => !key.includes('PREVIEW') && !key.includes('URL') && value === false)
    .map(([key]) => key);

  return NextResponse.json({
    status: missing.length === 0 ? 'OK' : 'MISSING_VARIABLES',
    missing,
    envCheck,
    timestamp: new Date().toISOString(),
  });
}
