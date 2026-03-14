# Guide de Déploiement OptiBot sur CentOS (Scaleway Instance)

## 1. Préparation du serveur (Une seule fois)
Connectez-vous en SSH à votre serveur et installez Docker :
```bash
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

Préparez le dossier de l'app :
```bash
mkdir -p /app/optibot
git clone https://github.com/vvorreit/optibot.git /app/optibot
```

## 2. Mise en place de la CI/CD (GitHub Actions)
Votre dépôt contient un fichier `.github/workflows/deploy.yml`. Ajoutez ces 3 secrets dans votre GitHub (**Settings > Secrets and variables > Actions**) :

| Nom du Secret | Valeur |
| :--- | :--- |
| `SERVER_IP` | L'IP publique de votre serveur Scaleway. |
| `SSH_PRIVATE_KEY` | Votre clé SSH privée (celle qui permet de se connecter en root). |

## 3. Configuration des Variables d'Environnement
Sur le serveur, créez un fichier `.env` dans `/app/optibot` pour stocker vos secrets :
```bash
NEXTAUTH_URL=https://votre-domaine.fr
NEXTAUTH_SECRET=une-phrase-longue-et-aleatoire
NEXT_PUBLIC_APP_URL=https://votre-domaine.fr
```

---
Désormais, chaque `git push origin main` mettra à jour votre serveur CentOS automatiquement !
