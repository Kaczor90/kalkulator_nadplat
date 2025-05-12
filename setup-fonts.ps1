# Script to download and set up Roboto fonts for the mortgage calculator
Write-Host "Setting up Roboto fonts for PDF generation..." -ForegroundColor Cyan

# Create fonts directory if it doesn't exist
$fontsDir = "frontend/public/fonts"
if (-not (Test-Path $fontsDir)) {
    New-Item -ItemType Directory -Path $fontsDir -Force
    Write-Host "Created fonts directory at $fontsDir" -ForegroundColor Green
}

# Font URLs
$fonts = @{
    "Roboto-Regular.ttf" = "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf"
    "Roboto-Bold.ttf" = "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Bold.ttf"
}

# Download fonts
foreach ($font in $fonts.GetEnumerator()) {
    $fontPath = Join-Path $fontsDir $font.Key
    if (-not (Test-Path $fontPath)) {
        Write-Host "Downloading $($font.Key)..." -ForegroundColor Yellow
        try {
            Invoke-WebRequest -Uri $font.Value -OutFile $fontPath
            Write-Host "Successfully downloaded $($font.Key)" -ForegroundColor Green
        } catch {
            Write-Host "Error downloading $($font.Key): $_" -ForegroundColor Red
        }
    } else {
        Write-Host "$($font.Key) already exists" -ForegroundColor Yellow
    }
}

Write-Host "Font setup complete!" -ForegroundColor Green 