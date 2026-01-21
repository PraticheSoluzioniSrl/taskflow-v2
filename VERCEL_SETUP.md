# Setup Vercel - TaskFlow V2

## Variabili d'Ambiente Richieste

Configura le seguenti variabili d'ambiente su Vercel (Settings → Environment Variables):

### 1. Autenticazione NextAuth
```
NEXTAUTH_SECRET=<genera-un-secret-random-di-32-caratteri>
AUTH_SECRET=<stesso-valore-di-NEXTAUTH_SECRET>
```

**Come generare NEXTAUTH_SECRET:**
```bash
# Su Linux/Mac
openssl rand -base64 32

# Su Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 2. Google OAuth
```
GOOGLE_CLIENT_ID=<il-tuo-client-id-da-google-cloud-console>
GOOGLE_CLIENT_SECRET=<il-tuo-client-secret-da-google-cloud-console>
AUTH_GOOGLE_ID=<stesso-valore-di-GOOGLE_CLIENT_ID>
AUTH_GOOGLE_SECRET=<stesso-valore-di-GOOGLE_CLIENT_SECRET>
```

### 3. Database
```
DATABASE_URL=<la-tua-connection-string-neon>
```

### 4. URL Base (Opzionale ma Consigliato)
```
NEXTAUTH_URL=https://taskflow-v2-nu.vercel.app
```

## Configurazione Google Cloud Console

1. Vai su https://console.cloud.google.com
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita "Google Calendar API"
4. Vai su "Credenziali" → "Crea credenziali" → "ID client OAuth 2.0"
5. Configura:
   - Tipo applicazione: Applicazione web
   - Nome: TaskFlow V2
   - URI di reindirizzamento autorizzati:
     ```
     https://taskflow-v2-nu.vercel.app/api/auth/callback/google
     ```
6. Copia Client ID e Client Secret nelle variabili d'ambiente su Vercel

## Dopo il Deployment

1. Chiama `/api/init-db` per inizializzare/aggiornare lo schema del database:
   ```
   https://taskflow-v2-nu.vercel.app/api/init-db
   ```
   (Devi essere autenticato)

2. Verifica che tutte le variabili d'ambiente siano configurate correttamente

3. Prova ad accedere con Google

## Troubleshooting

### Errore "Configuration"
- Verifica che `NEXTAUTH_SECRET` sia configurato
- Verifica che `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` siano corretti
- Verifica che il redirect URI in Google Cloud Console corrisponda esattamente a quello su Vercel

### Errore 500 nella creazione task
- Chiama `/api/init-db` per aggiornare lo schema del database
- Verifica che `DATABASE_URL` sia configurato correttamente

### Token non funzionanti
- Verifica che lo scope Calendar sia abilitato in Google Cloud Console
- Verifica che `access_type: 'offline'` e `prompt: 'consent'` siano configurati (già fatto nel codice)
