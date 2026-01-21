# Variabili d'Ambiente Vercel - TaskFlow V2

## Variabili Richieste

Configura queste variabili su Vercel Dashboard → taskflow-v2 → Settings → Environment Variables

### 1. NEXTAUTH_SECRET (OBBLIGATORIO)
```
NEXTAUTH_SECRET=gt0KLuzTLB/WnIBK7MwC+29RynaBkqzZjUiH1kR11FY=
```
**Importante:** Usa questo valore esatto per evitare errori di configurazione.

### 2. AUTH_SECRET (OBBLIGATORIO - Fallback)
```
AUTH_SECRET=gt0KLuzTLB/WnIBK7MwC+29RynaBkqzZjUiH1kR11FY=
```
**Nota:** Stesso valore di NEXTAUTH_SECRET (usato come fallback nel codice).

### 3. GOOGLE_CLIENT_ID (OBBLIGATORIO)
```
GOOGLE_CLIENT_ID=<il-tuo-client-id-da-google-cloud-console>
```
**Come ottenerlo:**
1. Vai su https://console.cloud.google.com
2. Seleziona il tuo progetto (o creane uno nuovo)
3. Vai su "API e servizi" → "Credenziali"
4. Clicca "Crea credenziali" → "ID client OAuth 2.0"
5. Tipo applicazione: "Applicazione web"
6. Nome: "TaskFlow V2"
7. URI di reindirizzamento autorizzati: `https://taskflow-v2-nu.vercel.app/api/auth/callback/google`
8. Copia il "ID client" (sembra: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

### 4. GOOGLE_CLIENT_SECRET (OBBLIGATORIO)
```
GOOGLE_CLIENT_SECRET=<il-tuo-client-secret-da-google-cloud-console>
```
**Come ottenerlo:**
- Nella stessa pagina delle credenziali Google Cloud Console
- Copia il "Segreto client" (sembra: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

### 5. AUTH_GOOGLE_ID (OBBLIGATORIO - Fallback)
```
AUTH_GOOGLE_ID=<stesso-valore-di-GOOGLE_CLIENT_ID>
```
**Nota:** Stesso valore di GOOGLE_CLIENT_ID (usato come fallback nel codice).

### 6. AUTH_GOOGLE_SECRET (OBBLIGATORIO - Fallback)
```
AUTH_GOOGLE_SECRET=<stesso-valore-di-GOOGLE_CLIENT_SECRET>
```
**Nota:** Stesso valore di GOOGLE_CLIENT_SECRET (usato come fallback nel codice).

### 7. DATABASE_URL (OBBLIGATORIO)
```
DATABASE_URL=<la-tua-connection-string-neon>
```
**Come ottenerlo:**
1. Vai su https://console.neon.tech (o il tuo provider database)
2. Seleziona il tuo progetto/database
3. Vai su "Connection Details" o "Connection String"
4. Copia la connection string (sembra: `postgresql://user:password@host/database?sslmode=require`)

### 8. NEXTAUTH_URL (OPZIONALE ma CONSIGLIATO)
```
NEXTAUTH_URL=https://taskflow-v2-nu.vercel.app
```
**Nota:** Questo è l'URL pubblico della tua applicazione su Vercel.

---

## Checklist Configurazione

- [ ] NEXTAUTH_SECRET configurato
- [ ] AUTH_SECRET configurato (stesso valore di NEXTAUTH_SECRET)
- [ ] GOOGLE_CLIENT_ID configurato
- [ ] GOOGLE_CLIENT_SECRET configurato
- [ ] AUTH_GOOGLE_ID configurato (stesso valore di GOOGLE_CLIENT_ID)
- [ ] AUTH_GOOGLE_SECRET configurato (stesso valore di GOOGLE_CLIENT_SECRET)
- [ ] DATABASE_URL configurato
- [ ] NEXTAUTH_URL configurato (opzionale)
- [ ] Google Calendar API abilitata su Google Cloud Console
- [ ] Redirect URI configurato su Google Cloud Console: `https://taskflow-v2-nu.vercel.app/api/auth/callback/google`

---

## Dopo la Configurazione

1. **Redeploy su Vercel:**
   - Vai su Vercel Dashboard → taskflow-v2 → Deployments
   - Clicca sui tre puntini del deployment più recente → "Redeploy"
   - Oppure fai un commit vuoto per triggerare un nuovo deployment

2. **Inizializza il Database:**
   - Dopo il deployment, vai su: `https://taskflow-v2-nu.vercel.app/api/init-db`
   - Dovresti vedere: `{"message":"Database initialized successfully",...}`

3. **Testa l'Autenticazione:**
   - Vai su: `https://taskflow-v2-nu.vercel.app`
   - Clicca "Accedi con Google"
   - Dovresti essere reindirizzato a Google per l'autenticazione

---

## Troubleshooting

### Errore "Configuration"
- Verifica che NEXTAUTH_SECRET sia configurato correttamente
- Verifica che GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET siano corretti
- Verifica che il redirect URI su Google Cloud Console corrisponda esattamente

### Errore 500 nella creazione task
- Chiama `/api/init-db` per inizializzare il database
- Verifica che DATABASE_URL sia configurato correttamente

### Token Google non funzionanti
- Verifica che Google Calendar API sia abilitata su Google Cloud Console
- Verifica che `access_type: 'offline'` e `prompt: 'consent'` siano configurati (già fatto nel codice)
