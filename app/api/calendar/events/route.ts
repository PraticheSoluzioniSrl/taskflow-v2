import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const accessToken = (session as any).accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: 'Token di accesso non disponibile' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Parametri start e end richiesti' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || '',
      process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || ''
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return NextResponse.json({ events: response.data.items || [] });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    
    if (error.code === 401) {
      return NextResponse.json({ error: 'Token scaduto' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Errore recupero eventi', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const accessToken = (session as any).accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: 'Token di accesso non disponibile' }, { status: 401 });
    }

    const body = await request.json();
    const { summary, description, start, end, taskId } = body;

    if (!summary || !start || !end) {
      return NextResponse.json({ error: 'Parametri summary, start e end richiesti' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || '',
      process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || ''
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary,
      description,
      start,
      end,
      extendedProperties: taskId ? { private: { taskId } } : undefined,
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return NextResponse.json({
      eventId: response.data.id,
      event: response.data,
    });
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    
    if (error.code === 401) {
      return NextResponse.json({ error: 'Token scaduto' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Errore creazione evento', details: error.message }, { status: 500 });
  }
}
