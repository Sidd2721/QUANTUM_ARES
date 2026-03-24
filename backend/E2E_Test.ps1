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
if ($TOKEN) { Write-Host "Login: PASS" } else { Write-Host "Login: FAIL" }

$DEMO_DIR = "C:\Users\avadu\OneDrive\Desktop\Quantum_Ares\demo"
$expected = @{
    "demo_hospital.json" = @{ index=28; findings=28 };
    "demo_bank.json" = @{ index=24; findings=5 };
    "demo_govt.json" = @{ index=30; findings=15 };
}

$demos = @("demo_hospital.json", "demo_bank.json", "demo_govt.json")
foreach ($demo in $demos) {
    Write-Host "`n--- $demo ---"
    
    $SCAN = Upload-JsonFile -Uri "http://localhost:8000/api/v1/validate" -Token $TOKEN -FilePath "$DEMO_DIR\$demo"
    $SID = $SCAN.scan_id
    Write-Host "  Upload: PASS - scan_id=$SID"

    $done = $false
    for ($i=0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        $headers = @{"Authorization"="Bearer $TOKEN"}
        $s = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/scans/$SID/status" -Headers $headers
        if ($s.status -eq "complete") { 
            $done = $true
            break 
        }
        if ($s.status -eq "failed") { 
            Write-Host "  Poll: FAIL - pipeline error"
            break 
        }
    }

    if (-not $done) { 
        Write-Host "  Poll: FAIL - did not complete in 30s"
        continue 
    }

    $headers = @{"Authorization"="Bearer $TOKEN"}
    $full = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/scans/$SID" -Headers $headers

    $exp_idx = $expected[$demo].index
    $exp_fin = $expected[$demo].findings

    $idx_ok = $full.security_index -eq $exp_idx
    $fin_ok = $full.findings.Count -eq $exp_fin
    $ai_ok = ($full.findings | Where-Object { $null -eq $_.ai_opinion }).Count -eq 0

    Write-Host "  status: $($full.status)"
    
    if ($idx_ok) { $idx_str = "OK" } else { $idx_str = "MISMATCH" }
    Write-Host "  index: $($full.security_index) (expect $exp_idx) $idx_str"
    
    if ($fin_ok) { $fin_str = "OK" } else { $fin_str = "MISMATCH" }
    Write-Host "  findings: $($full.findings.Count) (expect $exp_fin) $fin_str"

    if ($ai_ok) { $ai_str = "OK" } else { $ai_str = "MISSING on some findings" }
    Write-Host "  ai_opinion on all findings: $ai_str"
}
