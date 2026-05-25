Write-Host "=== DroneMon - Запуск ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Откройте ДВА отдельных окна PowerShell:" -ForegroundColor Yellow
Write-Host ""
Write-Host "--- ТЕРМИНАЛ 1 (Backend) ---" -ForegroundColor Green
Write-Host "cd D:\test\dronemon\backend" -ForegroundColor White
Write-Host '$env:PYTHONUNBUFFERED = "1"; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000' -ForegroundColor White
Write-Host ""
Write-Host "--- ТЕРМИНАЛ 2 (Frontend) ---" -ForegroundColor Green
Write-Host "cd D:\test\dronemon\frontend" -ForegroundColor White
Write-Host "npx vite --host 0.0.0.0 --port 3000" -ForegroundColor White
Write-Host ""
Write-Host "--- ТЕРМИНАЛ 3 (Mini App) ---" -ForegroundColor Green
Write-Host "cd D:\dronradamap-main\mini_app" -ForegroundColor White
Write-Host "npx vite --host 0.0.0.0 --port 5173" -ForegroundColor White
Write-Host ""
Write-Host "После запуска откройте:" -ForegroundColor Cyan
Write-Host "  Основной сайт: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Mini App:      http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend API:   http://localhost:8000/api/health" -ForegroundColor Cyan
Write-Host "  Scraper:       http://localhost:8000/api/scrape (POST)" -ForegroundColor Cyan
