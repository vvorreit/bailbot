# Règles de développement OptiBot

## ⛔ CHECKLIST OBLIGATOIRE AVANT TOUT CODE

Avant d'écrire ou modifier du code, je dois vérifier ces points dans l'ordre :

1. **Fichier `"use server"` modifié ?** → Toutes les fonctions exportées sont-elles `async` ?
2. **Nouveau SDK tiers instancié ?** → Instanciation lazy obligatoire (pas au niveau module)
3. **Nouvelle page Server Component avec Prisma ou session ?** → `export const dynamic = "force-dynamic"` en première ligne
4. **Nouvelle variable d'environnement ?** → Jamais `NEXT_PUBLIC_` pour des secrets. Mise à jour `.env.example`.
5. **Modification du Dockerfile ?** → Format `ENV key=value` uniquement
6. **Nouvelle migration Prisma ?** → Uniquement `ALTER TABLE` / `CREATE INDEX`, jamais `CREATE TABLE`
7. **Bookmarklet / code inline minifié ?** → Zéro commentaire `//`, uniquement `/* */`
8. **Adresse email dans le code ?** → Toujours `contact@optibot.fr`, jamais une autre adresse

---

## 🚨 ERREURS DE BUILD CONNUES — NE PAS REPRODUIRE

### 1. "Failed to collect page data" — page avec DB/session sans dynamic

**Cause** : Next.js tente un pré-rendu statique au build. La DB n'existe pas au build.
**Fix obligatoire** : première ligne de toute page Server Component qui touche Prisma ou `getServerSession` :

```typescript
export const dynamic = "force-dynamic";
```

Pages déjà concernées : `/join/[token]`, `/dashboard/*`, `/admin/*`, `/dashboard/account`.

### 2. "Missing API key" / crash SDK au build

**Cause** : SDK instancié au niveau module → évalué au build → variable d'env absente → crash.

```typescript
// ❌ INTERDIT — crash garanti au build Docker
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ OBLIGATOIRE — instanciation lazy
let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
```

### 3. "Server Actions must be async functions"

**Cause** : fonction exportée depuis un fichier `"use server"` non marquée `async`.
**Règle** : dans tout fichier `"use server"`, **100% des fonctions exportées** sont `async`, sans exception.

### 4. next.config.ts — clés non reconnues par Next.js 16

Clés **supprimées** dans Next.js 16, ne pas les remettre :
- `eslint` → n'existe plus
- `serverExternalPackages` → déplacé, ne pas utiliser sauf si Next.js l'accepte explicitement

### 5. Bookmarklet — commentaires `//` qui cassent tout

Le bookmarklet est minifié avec `.replace(/\n/g, '')`. Un commentaire `//` devient un commentaire de fin de fichier qui neutralise tout le code suivant.

**Règle** : zéro `//` dans le code de `lib/autofill.ts`. Uniquement `/* */`.

---

## Prisma & Migrations

### Règle absolue
**Ne jamais créer de migration qui recrée des tables existantes.**
La base de données de production a été provisionnée avant l'introduction des migrations Prisma.
Les tables `User`, `Account`, `Session`, `Team`, `Invitation`, `VerificationToken` existent déjà.

- ✅ `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "newField" TEXT;`
- ✅ `CREATE UNIQUE INDEX IF NOT EXISTS ...`
- ❌ `CREATE TABLE` → jamais
- ❌ `npx prisma migrate dev` en production
- ❌ Supprimer `prisma/migrations`
- ❌ `prisma db push` dans le Dockerfile

### Commandes utiles en cas de problème P3009
```bash
docker exec optibot-app npx prisma migrate resolve --rolled-back <nom_migration>
docker exec optibot-app npx prisma migrate resolve --applied <nom_migration>
```

---

## Docker & Déploiement

- Déploiement automatique via GitHub Actions au push sur `main`
- L'image est buildée sur GitHub Actions → poussée sur GHCR → le serveur tire l'image
- Le serveur ne build **jamais** localement
- `prisma migrate deploy` tourne au démarrage du conteneur

### Dockerfile — format ENV

```dockerfile
# ✅ Correct
ENV NODE_ENV=production
ENV PORT=3000

# ❌ Déprécié — warning Docker, ne pas utiliser
ENV NODE_ENV production
```

---

## Variables d'environnement

- **Jamais** `NEXT_PUBLIC_` pour des secrets (exposé dans le bundle JS)
- Variables serveur (ex: `LBO_LOGIN`, `RESEND_API_KEY`) → sans préfixe
- Toute nouvelle variable → mise à jour de `.env.example`

---

## Stack

- **Framework** : Next.js 16 (App Router, standalone output)
- **Auth** : NextAuth v4 avec PrismaAdapter, Google OAuth + Credentials
- **DB** : PostgreSQL via Prisma (docker service `db`)
- **Mail** : Resend SDK — `contact@optibot.fr` — clé `RESEND_API_KEY`
- **Paiement** : Stripe (checkout + portal)
- **Infra** : CentOS + Docker Compose + GitHub Actions CI/CD
