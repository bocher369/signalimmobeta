# Signalimmo — Instructions pour Claude Code

## Projet
Application immobilière SaaS AI-powered (GEO Estate Agent).
- **Stack** : React 19, TypeScript, Vite, Tailwind CSS 4, Supabase, Google Gemini
- **Auth** : Supabase Auth + Google OAuth
- **Déploiement** : Firebase Hosting

## gws CLI — Google Workspace

`gws` est installé globalement (`gws --version` → 0.11.1) et authentifié avec le compte `bcherblanc@gmail.com`.

### Utilisation
Quand tu proposes des fonctionnalités impliquant Google Workspace, utilise `gws` pour les implémenter ou les tester :

```bash
# Drive
gws drive files list --params '{"pageSize": 10}'
gws drive files create --json '{"name": "rapport.pdf"}' --upload ./fichier.pdf

# Gmail
gws gmail users messages list --params '{"userId": "me", "maxResults": 5}'
gws gmail users messages send --params '{"userId": "me"}' --json '{"raw": "..."}'

# Sheets
gws sheets spreadsheets values get --params '{"spreadsheetId": "ID", "range": "Sheet1!A1:Z100"}'
gws sheets spreadsheets values append --params '{"spreadsheetId": "ID", "range": "Sheet1!A1", "valueInputOption": "USER_ENTERED"}' --json '{"values": [[...]]}'

# Calendar
gws calendar events list --params '{"calendarId": "primary", "maxResults": 10}'
gws calendar events insert --params '{"calendarId": "primary"}' --json '{"summary": "...", "start": {...}, "end": {...}}'
```

### APIs activées (projet GCP : signalimmo-19c5e)
- Google Drive API
- Gmail API
- Google Calendar API
- Google Sheets API
- Google Docs API
- Google Slides API
- Google Forms API
- Google Tasks API
- Google Chat API
- Google People API (Contacts)

### Cas d'usage pour Signalimmo
- **Alertes acheteurs** : envoyer des emails Gmail quand un bien correspond à leurs critères
- **Rapports** : exporter les données de biens vers Google Sheets
- **Visites** : créer des événements Calendar pour les rendez-vous
- **Documents** : générer des rapports de biens dans Google Docs/Drive
- **Contacts** : synchroniser les contacts agents/acheteurs

## Structure du projet
- `components/` — composants React (SignIn, SignUp, Dashboard, etc.)
- `src/components/` — nouveaux composants (AcquisitionStudio, LandingPage, etc.)
- `src/supabaseClient.js` — client Supabase
- `supabase/migrations/` — schéma BDD
- `supabase/functions/` — Edge Functions (gemini-generate, generate-slides)
- `types.ts` — types TypeScript partagés

## Base de données Supabase
- `agent_profiles` — profils agents (agence, couleurs, spécialisations)
- `acquisitions` — analyses d'acquisition immobilière
- Toutes les tables ont RLS activé (isolation par `user_id`)
