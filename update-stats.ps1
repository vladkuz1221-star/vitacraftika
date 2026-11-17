param([string]$Server = "C:\minecraft-server")
$statsDir = Join-Path $Server 'world\stats'
if (-not (Test-Path $statsDir)) { Write-Host "Not found: $statsDir"; exit 1 }
$names = @{}
$cacheFile = Join-Path $Server 'usercache.json'
if (Test-Path $cacheFile) { foreach ($c in (Get-Content $cacheFile -Raw -Encoding UTF8 | ConvertFrom-Json)) { $names[$c.uuid] = $c.name } }
$rows = @()
foreach ($f in Get-ChildItem $statsDir -Filter *.json) {
  $j = Get-Content $f.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
  $cu = $j.stats.'minecraft:custom'
  $t = 0
  if ($cu.'minecraft:play_time') { $t = $cu.'minecraft:play_time' } elseif ($cu.'minecraft:play_one_minute') { $t = $cu.'minecraft:play_one_minute' }
  $name = $names[$f.BaseName]; if (-not $name) { $name = $f.BaseName.Substring(0, 8) }
  $rows += [pscustomobject]@{ n = $name; h = [math]::Round($t / 72000, 1); k = [int]$cu.'minecraft:mob_kills'; d = [int]$cu.'minecraft:deaths' }
}
$top = @($rows | Sort-Object h -Descending | Select-Object -First 10)
$json = ConvertTo-Json -InputObject $top -Compress
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'stats.js'), "window.STATS=$json;", (New-Object Text.UTF8Encoding($false)))
Write-Host ("Done: " + $top.Count + " players written to stats.js")
