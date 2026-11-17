$dir = Join-Path $PSScriptRoot 'mods'
$jars = @(Get-ChildItem -Path $dir -Filter *.jar | Sort-Object Name)
if ($jars.Count -eq 0) { Write-Host 'Put your .jar files into the mods folder first.'; exit 1 }
$zip = Join-Path $dir 'mods.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path ($jars | ForEach-Object { $_.FullName }) -DestinationPath $zip -Force
$names = @($jars | ForEach-Object { $_.BaseName })
$json = ConvertTo-Json -InputObject $names -Compress
[IO.File]::WriteAllText((Join-Path $dir 'list.js'), "window.MODS_LIST=$json;", (New-Object Text.UTF8Encoding($false)))
Write-Host ("Done: " + $jars.Count + " mods packed into mods\mods.zip")
