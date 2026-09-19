# ==============================================================================
# Script Backup Otomatis Database MariaDB Bappeda Halut
# Lokasi: C:\bappeda-halut\scripts\auto-backup-db.ps1
# ==============================================================================

$backupDir = "C:\bappeda-halut\backups\database"
$mysqldump = "C:\xampp\mysql\bin\mysqldump.exe"
$dbName = "db_bappeda_halut"
$dbPort = "3308"
$dbHost = "127.0.0.1"
$dbUser = "root"

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$sqlFile = "$backupDir\backup_${dbName}_$timestamp.sql"
$zipFile = "$backupDir\backup_${dbName}_$timestamp.zip"

# 1. Pastikan folder backup tersedia
if (!(Test-Path -Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

# 2. Eksekusi mysqldump
try {
    & $mysqldump -h $dbHost -P $dbPort -u $dbUser --single-transaction --routines --triggers $dbName | Out-File -FilePath $sqlFile -Encoding utf8
    
    # 3. Kompres ke format .ZIP untuk menghemat 90% kapasitas disk
    if ((Test-Path -Path $sqlFile) -and ((Get-Item $sqlFile).Length -gt 0)) {
        Compress-Archive -Path $sqlFile -DestinationPath $zipFile -Force
        Remove-Item -Path $sqlFile -Force
        Write-Output "[$timestamp] SUKSES: Database tersimpan di $zipFile"
    } else {
        Write-Error "[$timestamp] GAGAL: File SQL kosong atau tidak ditemukan."
    }
} catch {
    Write-Error "[$timestamp] ERROR saat menjalankan mysqldump: $_"
}

# 4. Rotasi Retensi Otomatis (Hapus backup yang lebih tua dari 14 hari)
$retentionDays = 14
$limitDate = (Get-Date).AddDays(-$retentionDays)
Get-ChildItem -Path $backupDir -Filter "*.zip" | Where-Object { $_.LastWriteTime -lt $limitDate } | ForEach-Object {
    Remove-Item $_.FullName -Force
    Write-Output "[$timestamp] Membersihkan backup usang: $($_.Name)"
}
