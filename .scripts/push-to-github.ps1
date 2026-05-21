$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$env:GH_TOKEN = $args[0]
$user = "sandeepbanerjee63DEV"
$email = "$user@users.noreply.github.com"

Set-Location "c:\Users\Sandeep\Desktop\Demo Project"

Write-Host "=== git init ==="
git init -b main 2>&1
git config user.name $user
git config user.email $email

Write-Host "=== git add ==="
git add .

Write-Host "=== files to commit ==="
$count = (git diff --cached --name-only | Measure-Object).Count
Write-Host "$count files staged"

Write-Host "=== git commit ==="
$msg = "Initial commit: AETHER OS - AI Business Command Center"
git commit -m $msg

Write-Host "=== creating GitHub repo ==="
$desc = "AETHER OS - Enterprise AI-powered CRM, lead management, and workflow automation platform built with Next.js 15, Prisma, and TypeScript."
gh repo create aether-os --public --description $desc

Write-Host "=== configuring remote with token for push ==="
$pushUrl = "https://x-access-token:$($env:GH_TOKEN)@github.com/$user/aether-os.git"
git remote add origin $pushUrl 2>&1
if ($LASTEXITCODE -ne 0) {
    git remote set-url origin $pushUrl
}

Write-Host "=== pushing to origin/main ==="
git push -u origin main 2>&1

Write-Host "=== sanitizing remote URL (removing token) ==="
git remote set-url origin "https://github.com/$user/aether-os.git"

Write-Host "=== final remote ==="
git remote -v

Write-Host "=== DONE ==="
Write-Host "Repo URL: https://github.com/$user/aether-os"
