import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getEnvStatus() {
  const envCheck = {
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    AUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
  };

  const missing = Object.entries(envCheck)
    .filter(([key, value]) => key !== 'NEXTAUTH_URL' && value === false)
    .map(([key]) => key);

  return {
    status: missing.length === 0 ? 'OK' : 'MISSING_VARIABLES',
    missing,
    envCheck,
  };
}

export default async function CheckEnvPage() {
  const envStatus = await getEnvStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Verifica Variabili d'Ambiente</h1>
        
        <div className={`p-6 rounded-lg mb-6 ${
          envStatus.status === 'OK' 
            ? 'bg-green-100 border-2 border-green-500' 
            : 'bg-red-100 border-2 border-red-500'
        }`}>
          <h2 className="text-xl font-semibold mb-2">
            Stato: {envStatus.status === 'OK' ? '✅ Tutte le variabili configurate' : '❌ Variabili mancanti'}
          </h2>
          {envStatus.missing.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold text-red-700">Variabili mancanti:</p>
              <ul className="list-disc list-inside mt-2">
                {envStatus.missing.map((key) => (
                  <li key={key} className="text-red-700">{key}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Dettaglio Variabili</h2>
          <div className="space-y-2">
            {Object.entries(envStatus.envCheck).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-mono text-sm">{key}</span>
                <span className={`px-3 py-1 rounded ${
                  value === true || (typeof value === 'string' && value !== 'not set')
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
                }`}>
                  {value === true ? '✅ Configurata' : value === false ? '❌ Mancante' : `ℹ️ ${value}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Come configurare le variabili:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Vai su Vercel Dashboard → taskflow-v2 → Settings → Environment Variables</li>
            <li>Aggiungi tutte le variabili mancanti</li>
            <li>Fai un <strong>Redeploy</strong> (importante!)</li>
            <li>Ricarica questa pagina per verificare</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
