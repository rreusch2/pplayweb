# PowerShell script to update all imports from AuthContext to SimpleAuthContext

$files = @(
    "app\(auth)\force-onboarding.tsx",
    "app\admin\components\AdminChat.tsx",
    "app\admin\components\AdminCommandPanel.tsx",
    "app\admin\components\PredictionsCenter.tsx",
    "app\admin\components\QuickActions.tsx",
    "app\admin\page-old.tsx",
    "app\admin\page.tsx",
    "app\admin\page_clean.tsx",
    "app\admin\picks-management\page.tsx",
    "app\admin\picks\page.tsx",
    "app\admin\users-management\page.tsx",
    "app\admin\users\page.tsx",
    "app\dashboard\page.tsx",
    "app\page.tsx",
    "app\predictions\page.tsx",
    "app\professor-lock\test\page.tsx",
    "app\settings\page.tsx",
    "app\trends\page.tsx",
    "components\AuthModal.tsx",
    "components\OnboardingFlow.tsx",
    "components\PredictionsPreview.tsx",
    "components\TieredSubscriptionModal.tsx",
    "components\UpgradeSubscriptionModal.tsx",
    "components\UserPreferencesModal.tsx",
    "components\professor-lock\ChatKitProfessorLock.tsx",
    "components\professor-lock\ProfessorLockShell.tsx",
    "hooks\useChatKit.ts",
    "hooks\useOnboarding.ts"
)

foreach ($file in $files) {
    $fullPath = "C:\Users\reidr\parleyapp\pplayweb\$file"
    
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $newContent = $content -replace "from '@/contexts/AuthContext'", "from '@/contexts/SimpleAuthContext'"
        
        if ($content -ne $newContent) {
            Set-Content -Path $fullPath -Value $newContent
            Write-Host "Updated: $file" -ForegroundColor Green
        } else {
            Write-Host "No changes needed: $file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nAll imports updated!" -ForegroundColor Cyan
