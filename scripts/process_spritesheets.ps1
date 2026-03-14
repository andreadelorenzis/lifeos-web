param (
    [Parameter(Mandatory=$true)]
    [string]$Directory
)

$targetDir = Resolve-Path $Directory
if (-not (Test-Path $targetDir)) {
    Write-Error "Directory $targetDir does not exist."
    exit
}

$zipFiles = Get-ChildItem -Path $targetDir -Filter "*.zip"

foreach ($zip in $zipFiles) {
    $baseName = $zip.BaseName
    $tempDir = Join-Path $targetDir "$baseName`_temp"
    
    Write-Host "Processing $baseName..."

    # Create temp directory
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

    # Extract
    Expand-Archive -Path $zip.FullName -DestinationPath $tempDir -Force

    # Files we expect
    $jsonFile = Join-Path $tempDir "spritesheet.json"
    $pngFile = Join-Path $tempDir "spritesheet.png"

    if ((Test-Path $jsonFile) -And (Test-Path $pngFile)) {
        $newJsonFile = Join-Path $targetDir "$baseName.json"
        $newPngFile = Join-Path $targetDir "$baseName.png"

        # Update JSON content
        $jsonContent = Get-Content $jsonFile -Raw
        $updatedJson = $jsonContent -replace '"image":\s*"spritesheet.png"', "`"image`": `"$baseName.png`""
        $updatedJson | Set-Content $newJsonFile

        # Move PNG
        Move-Item -Path $pngFile -Destination $newPngFile -Force
        
        # Cleanup
        Remove-Item -Recurse $tempDir -Force
        Remove-Item $zip.FullName -Force
        
        Write-Host "Successfully processed $baseName."
    } else {
        Write-Warning "Required files (spritesheet.json/png) not found in $($zip.Name). Skipping cleanup."
        # Keep temp dir for inspection if something went wrong
    }
}
