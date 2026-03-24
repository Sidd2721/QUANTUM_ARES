function Upload-JsonFile {
    param([string]$Uri, [string]$Token, [string]$FilePath)
    $boundary  = [System.Guid]::NewGuid().ToString()
    $fileName  = [System.IO.Path]::GetFileName($FilePath)
    $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes("--$boundary`r`nContent-Disposition: form-data; name=`"file`"; filename=`"$fileName`"`r`nContent-Type: application/json`r`n`r`n")
    $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")
    $bodyBytes = New-Object byte[] ($headerBytes.Length + $fileBytes.Length + $footerBytes.Length)
    [System.Buffer]::BlockCopy($headerBytes, 0, $bodyBytes, 0, $headerBytes.Length)
    [System.Buffer]::BlockCopy($fileBytes, 0, $bodyBytes, $headerBytes.Length, $fileBytes.Length)
    [System.Buffer]::BlockCopy($footerBytes, 0, $bodyBytes, $headerBytes.Length + $fileBytes.Length, $footerBytes.Length)
    $headers = @{"Authorization"="Bearer $Token"}
    return Invoke-RestMethod -Uri $Uri -Method POST -Headers $headers -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyBytes
}

$r = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@demo.com","password":"Admin@1234"}'
$TOKEN = $r.access_token

Write-Host "`n=== GATE 5 - FULL VERIFICATION ==="

$SCAN = Upload-JsonFile -Uri "http://localhost:8000/api/v1/validate" -Token $TOKEN -FilePath "C:\Users\avadu\OneDrive\Desktop\Quantum_Ares\demo\demo_hospital.json"
$SID = $SCAN.scan_id
Write-Host "Gate scan_id: $SID"

for ($i=0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    $headers = @{"Authorization"="Bearer $TOKEN"}
    $s = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/scans/$SID/status" -Headers $headers
    if ($s.status -eq "complete") { Write-Host "Scan complete: index=$($s.security_index)"; break }
}

$headers = @{"Authorization"="Bearer $TOKEN"}
$patches_res = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/scans/$SID/patches" -Headers $headers
$patches = $patches_res.patches
$impact = ($patches | Measure-Object -Property score_impact -Sum).Sum

if ($patches.Count -ge 4) { $c1 = "PASS - $($patches.Count)" } else { $c1 = "FAIL - $($patches.Count)" }
Write-Host "[1] patches >= 4:          $c1"

if ($impact -ge 80) { $c2 = "PASS - $impact" } else { $c2 = "FAIL - $impact" }
Write-Host "[2] score_impact >= 80:    $c2"

$rep = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/reports/$SID/generate" -Method POST -Headers $headers
$RID = $rep.report_id
if ($RID) { $c3 = "PASS" } else { $c3 = "FAIL" }
Write-Host "[3] report generated:      $c3"

if ($rep.sha256.Length -eq 64) { $c4 = "PASS" } else { $c4 = "FAIL - length=$($rep.sha256.Length)" }
Write-Host "[4] sha256 length=64:      $c4"

$pdf = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/reports/$RID" -Headers $headers -UseBasicParsing
$pdfHdr = [System.Text.Encoding]::ASCII.GetString($pdf.Content[0..3])

if ($pdf.StatusCode -eq 200) { $c5 = "PASS" } else { $c5 = "FAIL" }
Write-Host "[5] PDF downloads:         $c5"

if ($pdfHdr -eq "%PDF") { $c6 = "PASS" } else { $c6 = "FAIL - got: $pdfHdr" }
Write-Host "[6] valid %PDF header:     $c6"

if ($pdf.Content.Length -gt 2000) { $c7 = "PASS - $($pdf.Content.Length) bytes" } else { $c7 = "FAIL - $($pdf.Content.Length) bytes" }
Write-Host "[7] PDF size > 2KB:        $c7"

$pdf.Content | Set-Content -Path ".\gate5_final.pdf" -Encoding Byte
Write-Host "    Saved: gate5_final.pdf - open it to verify visual content"

$chat1 = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat" -Method POST -ContentType "application/json" -Headers $headers -Body '{"question":"Why is our zero trust score low?"}'
if ($chat1.tier -eq "rule_engine") { $c8 = "PASS" } else { $c8 = "FAIL - tier=$($chat1.tier)" }
Write-Host "[8] /chat tier=rule_engine: $c8"

$chat2 = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat" -Method POST -ContentType "application/json" -Headers $headers -Body '{"question":"xyzzy purple elephant nonsense 99999"}'
if ($chat2.tier) { $c9 = "PASS - tier=$($chat2.tier)" } else { $c9 = "FAIL" }
Write-Host "[9] /chat fallback no 500:  $c9"

$spec = Invoke-RestMethod -Uri "http://localhost:8000/openapi.json"
$cnt = $spec.paths.PSObject.Properties.Name.Count
if ($cnt -ge 10) { $c10 = "PASS - $cnt" } else { $c10 = "FAIL - $cnt" }
Write-Host "[10] Swagger paths >= 10:  $c10"

Write-Host "`nAll Gate 5 checks done."
