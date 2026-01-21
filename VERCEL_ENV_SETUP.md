# Variabili d'Ambiente Vercel - TaskFlow V2

## Variabili da Configurare su Vercel

Copia e incolla queste variabili su Vercel Dashboard → taskflow-v2 → Settings → Environment Variables

### 1. NEXTAUTH_SECRET
```
Nome: NEXTAUTH_SECRET
Valore: gt0KLuzTLB/WnIBK7MwC+29RynaBkqzZjUiH1kR11FY=
Ambienti: Production, Preview, Development
```

### 2. AUTH_SECRET
```
Nome: AUTH_SECRET
Valore: gt0KLuzTLB/WnIBK7MwC+29RynaBkqzZjUiH1kR11FY=
Ambienti: Production, Preview, Development
```

### 3. GOOGLE_CLIENT_ID
```
Nome: GOOGLE_CLIENT_ID
Valore: [Dal tuo file JSON: client_id]
Ambienti: Production, Preview, Development
```

### 4. GOOGLE_CLIENT_SECRET
```
Nome: GOOGLE_CLIENT_SECRET
Valore: [Dal tuo file JSON: client_secret]
Ambienti: Production, Preview, Development
```

### 5. AUTH_GOOGLE_ID
```
Nome: AUTH_GOOGLE_ID
Valore: [Stesso valore di GOOGLE_CLIENT_ID]
Ambienti: Production, Preview, Development
```

### 6. AUTH_GOOGLE_SECRET
```
Nome: AUTH_GOOGLE_SECRET
Valore: [Stesso valore di GOOGLE_CLIENT_SECRET]
Ambienti: Production, Preview, Development
```

### 7. DATABASE_URL
```
Nome: DATABASE_URL
Valore: <INSERISCI_LA_TUA_CONNECTION_STRING_NEON>
Ambienti: Production, Preview, Development
```
**Nota:** Devi ancora aggiungere la tua connection string del database Neon.

### 8. NEXTAUTH_URL (Opzionale)
```
Nome: NEXTAUTH_URL
Valore: https://taskflow-v2-nu.vercel.app
Ambienti: Production, Preview, Development
```

---

## Checklist

- [x] NEXTAUTH_SECRET configurato
- [x] AUTH_SECRET configurato
- [x] GOOGLE_CLIENT_ID configurato
- [x] GOOGLE_CLIENT_SECRET configurato
- [x] AUTH_GOOGLE_ID configurato
- [x] AUTH_GOOGLE_SECRET configurato
- [ ] DATABASE_URL configurato (da aggiungere)
- [x] NEXTAUTH_URL configurato

---

## Dopo aver aggiunto tutte le variabili:

1. **Fai un Redeploy:**
   - Vai su Vercel Dashboard → taskflow-v2 → Deployments
   - Clicca sui tre puntini del deployment più recente
   - Seleziona "Redeploy"

2. **Verifica:**
   - Apri: https://taskflow-v2-nu.vercel.app/check-env
   - Dovresti vedere "✅ Tutte le variabili configurate"

3. **Inizializza il Database:**
   - Apri: https://taskflow-v2-nu.vercel.app/api/init-db
   - Dovresti vedere: `{"message":"Database initialized successfully",...}`

4. **Testa l'Applicazione:**
   - Vai su: https://taskflow-v2-nu.vercel.app
   - Clicca "Accedi con Google"
   - Dovresti essere reindirizzato a Google per l'autenticazione
