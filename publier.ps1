# Script de publication automatique GEO Estate
Write-Host "🚀 Préparation de la mise à jour..." -ForegroundColor Cyan

# 1. On récupère les éventuels changements sur GitHub
git pull origin main

# 2. On prépare tous tes changements
git add .

# 3. On demande un message de sauvegarde (ou on en met un par défaut)
$message = Read-Host "Que voulez-vous dire à propos de cette modification ? (ou appuyez sur Entrée)"
if ($message -eq "") { $message = "Mise à jour automatique GEO" }

# 4. On valide et on envoie
git commit -m "$message"
git push origin main

Write-Host "✅ Terminé ! GitHub et Firebase s'occupent du reste. Votre site sera à jour dans 2 min." -ForegroundColor Green
pause