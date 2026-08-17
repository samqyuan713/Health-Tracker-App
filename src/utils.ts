import { MetricLog, DailyGoals } from './types';

// Helper to generate dates relative to today
export function getRelativeDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export const DEFAULT_GOALS: DailyGoals = {
  steps: 10000,
  water: 2500, // 2500 ml
  calories: 500, // 500 kcal active burn
  sleep: 8, // 8 hours
  food: 2000, // 2000 kcal food intake target
};

export const SEED_LOGS: MetricLog[] = [];

export function getStatsForDay(logs: MetricLog[], dateStr: string) {
  const dayLogs = logs.filter(l => l.date === dateStr);
  
  const steps = dayLogs.filter(l => l.type === 'steps').reduce((sum, l) => sum + l.value, 0);
  const water = dayLogs.filter(l => l.type === 'water').reduce((sum, l) => sum + l.value, 0);
  const calories = dayLogs.filter(l => l.type === 'calories').reduce((sum, l) => sum + l.value, 0);
  const sleepLog = dayLogs.filter(l => l.type === 'sleep').sort((a,b) => b.timestamp.localeCompare(a.timestamp))[0];
  const sleep = sleepLog ? sleepLog.value : 0;
  
  const moodLog = dayLogs.filter(l => l.type === 'mood').sort((a,b) => b.timestamp.localeCompare(a.timestamp))[0];
  const mood = moodLog ? moodLog.value : 0;

  const weightLog = dayLogs.filter(l => l.type === 'weight').sort((a,b) => b.timestamp.localeCompare(a.timestamp))[0];
  const weight = weightLog ? weightLog.value : 0;

  const food = dayLogs.filter(l => l.type === 'food').reduce((sum, l) => sum + l.value, 0);

  return { steps, water, calories, sleep, mood, weight, food };
}

export function formatDatePretty(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export const MOOD_DETAILS: Record<number, { emoji: string; label: string; bg: string; text: string }> = {
  1: { emoji: '😩', label: 'Stressed', bg: 'bg-red-50', text: 'text-red-600' },
  2: { emoji: '🙁', label: 'Tired', bg: 'bg-orange-50', text: 'text-orange-600' },
  3: { emoji: '😐', label: 'Okay', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  4: { emoji: '🙂', label: 'Good', bg: 'bg-green-50', text: 'text-green-600' },
  5: { emoji: '😆', label: 'Excellent', bg: 'bg-emerald-50', text: 'text-emerald-500' },
};

// Advanced Body Readiness & Recovery Score (0 - 100)
export function calculateReadinessScore(stats: ReturnType<typeof getStatsForDay>, goals: DailyGoals = DEFAULT_GOALS): {
  score: number;
  level: 'peak' | 'steady' | 'rest';
  color: string;
} {
  const sleepRatio = Math.min(1, (stats.sleep || 0) / goals.sleep);
  const waterRatio = Math.min(1, (stats.water || 0) / goals.water);
  const moodScore = ((stats.mood || 0) / 5);
  
  // If no metrics logged at all, score is 0
  if (stats.sleep === 0 && stats.water === 0 && stats.mood === 0) {
    return { score: 0, level: 'rest', color: 'amber' };
  }

  // Weighted score calculation
  const totalScore = Math.round((sleepRatio * 40) + (waterRatio * 30) + (moodScore * 30));
  const finalScore = Math.max(0, Math.min(100, totalScore));

  if (finalScore >= 82) {
    return { score: finalScore, level: 'peak', color: 'emerald' };
  } else if (finalScore >= 65) {
    return { score: finalScore, level: 'steady', color: 'sky' };
  } else {
    return { score: finalScore, level: 'rest', color: 'amber' };
  }
}

// Biometric Anomaly Detection
export function getBiometricAlerts(stats: ReturnType<typeof getStatsForDay>, goals: DailyGoals = DEFAULT_GOALS): string[] {
  const alerts: string[] = [];
  if (stats.sleep > 0 && stats.sleep < 6.0) {
    alerts.push('sleepDeficitAlert');
  }
  if (stats.water < goals.water * 0.4) {
    alerts.push('hydrationAlert');
  }
  return alerts;
}

// Client-side image optimizer for fast & reliable AI Vision uploads across all mobile & desktop browsers
export async function optimizeImageForUpload(file: File): Promise<string> {
  const maxDim = 800;
  const quality = 0.75;

  // Try ImageBitmap first (standard for modern browsers including mobile Safari & Chrome, handles EXIF orientation)
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      let width = bitmap.width;
      let height = bitmap.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        return canvas.toDataURL('image/jpeg', quality);
      }
    } catch (e) {
      console.warn("createImageBitmap failed, falling back to standard canvas renderer:", e);
    }
  }

  // Fallback to FileReader + HTMLImageElement + Canvas
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readEvent) => {
      const src = readEvent.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(src);
        }
      };
      img.onerror = () => {
        resolve(src);
      };
      img.src = src;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// CSV Health Data Exporter
export function exportHealthDataCSV(logs: MetricLog[]) {
  const headers = ['ID', 'Timestamp', 'Date', 'Type', 'Value', 'Notes'];
  const rows = logs.map(l => [
    l.id,
    l.timestamp,
    l.date,
    l.type,
    l.value,
    `"${(l.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Vitalstream_Health_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Printable Medical Doctor Summary Report
export function generatePrintableHealthPDF(logs: MetricLog[], selectedDate: string) {
  const stats = getStatsForDay(logs, selectedDate);
  const readiness = calculateReadinessScore(stats);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Vitalstream Health & Biometric Medical Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
          h1 { color: #059669; font-size: 24px; margin-bottom: 4px; }
          .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; }
          .metric-val { font-size: 20px; font-weight: 800; color: #0f172a; }
          .metric-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
          .score-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 800; font-size: 14px; background: #d1fae5; color: #065f46; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
          th { background: #f1f5f9; text-transform: uppercase; font-size: 10px; color: #475569; }
          .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <h1>Vitalstream Biometric Health Summary</h1>
        <div class="subtitle">Generated on ${new Date().toLocaleDateString()} | Patient Log Date: ${selectedDate}</div>

        <div class="card" style="margin-bottom: 20px; text-align: center; background: #ecfdf5; border-color: #a7f3d0;">
          <div class="metric-label">Daily Body Readiness & Recovery Index</div>
          <div style="font-size: 36px; font-weight: 900; color: #047857;">${readiness.score} / 100</div>
          <div class="score-badge">${readiness.level.toUpperCase()} READINESS</div>
        </div>

        <div class="grid">
          <div class="card"><div class="metric-label">Steps Walked</div><div class="metric-val">${stats.steps.toLocaleString()} steps</div></div>
          <div class="card"><div class="metric-label">Hydration Logged</div><div class="metric-val">${(stats.water/1000).toFixed(1)} L</div></div>
          <div class="card"><div class="metric-label">Active Calories Burned</div><div class="metric-val">${stats.calories} kcal</div></div>
          <div class="card"><div class="metric-label">Sleep Rest Duration</div><div class="metric-val">${stats.sleep} hrs</div></div>
        </div>

        <h3>Detailed Log Entries (${selectedDate})</h3>
        <table>
          <thead>
            <tr><th>Time</th><th>Metric Type</th><th>Value</th><th>Notes</th></tr>
          </thead>
          <tbody>
            ${logs.filter(l => l.date === selectedDate).map(l => `
              <tr>
                <td>${new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td style="text-transform: capitalize; font-weight: 600;">${l.type}</td>
                <td style="font-weight: 700;">${l.value}</td>
                <td>${l.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">Vitalstream AI Biometric Platform &copy; ${new Date().getFullYear()} — Confidential Medical Health Record</div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

