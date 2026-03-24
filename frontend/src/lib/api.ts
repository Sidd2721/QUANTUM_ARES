// src/lib/api.ts

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
let AUTH_TOKEN = '';

export async function login() {
  if (AUTH_TOKEN) return AUTH_TOKEN;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.com', password: 'Admin@1234' })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    AUTH_TOKEN = data.access_token;
    return AUTH_TOKEN;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function uploadScan(file: File) {
  const token = await login();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);
  formData.append('evidence_source', 'manual');

  const res = await fetch(`${BASE_URL}/api/v1/validate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function pollScanStatus(scanId: string) {
  const token = await login();
  while (true) {
    const res = await fetch(`${BASE_URL}/api/v1/scans/${scanId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.status === 'complete' || data.status === 'failed') {
      return data;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

export async function getScanResult(scanId: string) {
  const token = await login();
  const res = await fetch(`${BASE_URL}/api/v1/scans/${scanId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function chatQuery(question: string) {
  const token = await login();
  const res = await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ question })
  });
  return res.json();
}

export async function getPatches(scanId: string) {
  const token = await login();
  const res = await fetch(`${BASE_URL}/api/v1/scans/${scanId}/patches`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function downloadPatches(scanId: string) {
  const token = await login();
  window.open(`${BASE_URL}/api/v1/scans/${scanId}/patches?format=download&token=${token}`, '_blank');
}

export async function generateAndDownloadReport(scanId: string) {
  const token = await login();
  const res = await fetch(`${BASE_URL}/api/v1/reports/${scanId}/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  
  let reportId;
  if (res.status === 200) {
    const data = await res.json();
    reportId = data.report_id;
  } else if (res.status === 400) {
    // Already generated, we need to fetch the scans to find the report_id
    // But actually our backend endpoint returns report_id IF it was just generated,
    // If already generated we can just fetch the report_id from the scan details.
    // Let's assume the backend will return report_id or we get it from scan result.
    const scanRes = await getScanResult(scanId);
    reportId = scanRes.report_id; 
  }

  if (!reportId) throw new Error('Could not get report ID');

  // Download PDF
  const pdfRes = await fetch(`${BASE_URL}/api/v1/reports/${reportId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const blob = await pdfRes.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${reportId.substring(0,8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
