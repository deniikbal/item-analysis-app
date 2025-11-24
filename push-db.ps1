# Load .env.local file
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^DATABASE_URL=(.+)$') {
        $env:DATABASE_URL = $matches[1].Trim("'").Trim('"')
    }
}

# Run drizzle-kit push
npx drizzle-kit push
