export function exportCSV(data, filename = 'export.csv') {
    if (!data || data.length === 0) return alert('No data to export')
    const headers = Object.keys(data[0])
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            headers.map(h => {
                let val = row[h] ?? ''
                val = String(val).replace(/"/g, '""')
                return `"${val}"`
            }).join(',')
        ),
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export function exportPDF(title, data) {
    if (!data || data.length === 0) return alert('No data to export')
    const headers = Object.keys(data[0])
    let html = `<html><head><title>${title}</title><style>
    body { font-family: Inter, Arial, sans-serif; padding: 40px; color: #1a1a2e; }
    h1 { font-size: 24px; margin-bottom: 8px; color: #7c3aed; }
    .date { font-size: 12px; color: #666; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #7c3aed; color: white; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 9px 14px; border-bottom: 1px solid #eee; font-size: 13px; }
    tr:nth-child(even) { background: #f8f7ff; }
    .footer { margin-top: 24px; font-size: 10px; color: #999; }
  </style></head><body>
  <h1>${title}</h1>
  <div class="date">Generated: ${new Date().toLocaleString('en-IN')}</div>
  <table><thead><tr>${headers.map(h => `<th>${h.replace(/_/g, ' ')}</th>`).join('')}</tr></thead>
  <tbody>${data.map(row => `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <div class="footer">FleetFlow — Fleet Management System</div>
  </body></html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    setTimeout(() => { win.print() }, 500)
}
