# Déploiement BailBot sur Scaleway

## 1. Prérequis Scaleway

- Compte Scaleway avec projet créé
- Scaleway CLI installé : `curl -s https://raw.githubusercontent.com/scaleway/scaleway-cli/master/scripts/get.sh | sh`
- Authentifié : `scw init`

## 2. Créer le Container Registry Scaleway

```bash
scw registry namespace create name=bailbot region=fr-par
# Note l'endpoint : rg.fr-par.scw.cloud/bailbot
```

## 3. Créer la base de données PostgreSQL managée

```bash
scw rdb instance create \
  name=bailbot-db \
  engine=PostgreSQL-15 \
  node-type=DB-DEV-S \
  region=fr-par \
  is-ha-cluster=false
# Récupère l'endpoint et les credentials
```

## 4. Créer le bucket Object Storage (pour les fichiers)

```bash
scw object bucket create name=bailbot-files region=fr-par
```

## 5. Créer l'instance Redis (pour rate limiting)

Utiliser Upstash (externe) ou Scaleway Managed Redis :

```bash
scw redis cluster create name=bailbot-redis region=fr-par node-type=RED1-XS
```

## 6. Créer le Serverless Container

```bash
# D'abord builder et pusher l'image localement
docker build -t rg.fr-par.scw.cloud/bailbot/bailbot-app:latest .
docker push rg.fr-par.scw.cloud/bailbot/bailbot-app:latest

# Créer le container
scw container container create \
  name=bailbot-app \
  namespace-id=<NAMESPACE_ID> \
  registry-image=rg.fr-par.scw.cloud/bailbot/bailbot-app:latest \
  port=3000 \
  min-scale=1 \
  max-scale=5 \
  memory-limit=1024 \
  cpu-limit=1000 \
  privacy=public \
  region=fr-par
```

## 7. Variables d'environnement à configurer dans le container Scaleway

Toutes les variables de `.env.local` doivent être ajoutées dans le container :

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (= `https://ton-container.scw.cloud`)
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `YOUSIGN_API_KEY`
- `YOUSIGN_ENV=production`
- `ENCRYPTION_KEY`
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_GA_ID` (optionnel)

## 8. Secrets GitHub Actions à configurer

Dans **Settings > Secrets > Actions** de ton repo GitHub :

- `SCW_ACCESS_KEY` : clé d'accès Scaleway
- `SCW_SECRET_KEY` : clé secrète Scaleway
- `SCW_PROJECT_ID` : ID du projet Scaleway
- `SCW_CONTAINER_ID` : ID du container créé à l'étape 6
- `NEXT_PUBLIC_GA_ID` : ID Google Analytics (optionnel)

## 9. Configurer le domaine custom (optionnel)

```bash
scw container domain create \
  container-id=<CONTAINER_ID> \
  hostname=app.bailbot.fr
# Puis configurer le CNAME chez ton registrar
```

## Dimensionnement recommandé

- **Lancement** : min-scale=1, max-scale=3, memory=1024Mo, cpu=1000m → ~30€/mois
- **Croissance** : min-scale=2, max-scale=10, memory=2048Mo → ~60€/mois
- **DB** : DB-DEV-S (1vCPU/1Go) → ~15€/mois → passer à DB-GP-XS à 500+ users
- **Object Storage** : ~2€/mois pour 50Go

## Coût total estimé

| Service | Prix |
|---|---|
| Serverless Container | ~15-30€ |
| Managed PostgreSQL DB-DEV-S | ~15€ |
| Object Storage 50Go | ~2€ |
| Upstash Redis (externe) | 0-3€ |
| Resend emails | 0-20€ |
| **Total** | **~32-70€/mois** |
