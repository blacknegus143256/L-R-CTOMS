# Render Deployment - Critical Environment Variables

## ⚠️ CRITICAL: APP_KEY Must Be Set in Render Dashboard

Your Docker entrypoint script **does NOT generate** the APP_KEY. This is intentional.

**Why?** Docker containers are ephemeral. If Render restarts your container (which happens regularly for updates, crashes, or scaling), a newly generated APP_KEY will:
- ❌ Log out every single user
- ❌ Make all encrypted database data permanently unreadable
- ❌ Break session tokens across the platform

**The Solution:** Set `APP_KEY` as a permanent environment variable in Render's dashboard. It never changes unless you manually update it.

---

## Step 1: Generate APP_KEY Locally

Run this command in your local terminal:

```bash
php artisan key:generate --show
```

Copy the output. It will look like:
```
base64:xyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ
```

---

## Step 2: Add to Render Dashboard

1. Go to **Render.com** → Your Service (CTOMS-LR)
2. Click **Environment** (in the left sidebar)
3. Click **Add Environment Variable**
4. Set:
   - **Key:** `APP_KEY`
   - **Value:** Paste the `base64:xyz...` string from Step 1
5. Click **Save**

---

## Step 3: Verify PostgreSQL Configuration

In the same **Environment** tab, ensure you have:

| Key | Value | Notes |
|-----|-------|-------|
| `APP_ENV` | `production` | Disables debug mode |
| `APP_DEBUG` | `false` | Don't expose errors to users |
| `DB_CONNECTION` | `pgsql` | PostgreSQL, not MySQL |
| `DB_HOST` | `<your-render-postgres-host>` | From Render PostgreSQL service |
| `DB_PORT` | `5432` | Standard PostgreSQL port |
| `DB_DATABASE` | `<your-postgres-dbname>` | From Render PostgreSQL service |
| `DB_USERNAME` | `<your-postgres-user>` | From Render PostgreSQL service |
| `DB_PASSWORD` | `<your-postgres-password>` | From Render PostgreSQL service |
| `APP_KEY` | `base64:xyz...` | Generated above |
| `SANCTUM_STATEFUL_DOMAINS` | `l-r-ctoms.onrender.com` | Your Render domain |
| `VITE_API_URL` | `https://l-r-ctoms.onrender.com` | Frontend API calls |
| `QUEUE_CONNECTION` | `database` | Use database for queues |

---

## Step 4: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click **Clear build cache** (forces clean rebuild)
3. Click the three-dot menu on the latest deployment → **Redeploy**

Render will rebuild the Docker image with your environment variables now accessible to the entrypoint script.

---

## Why the New Entrypoint Script is Better

### ✅ Before (Broken):
```bash
if [ -z "$APP_KEY" ]; then php artisan key:generate --force; fi  # BAD!
php artisan config:cache || true                                  # HIDES ERRORS!
```

### ✅ After (Correct):
```bash
set -e                        # Exit on first error (no hiding!)
php artisan config:cache      # Fails loudly if something breaks
exec apache2-foreground       # PID 1 receives signals properly
```

**What `set -e` does:**
- If ANY command fails, the entire script stops
- Errors are NOT hidden
- Render's logs show the exact failure
- You can debug instead of guessing

---

## Debugging 500 Errors

If you still see 500 errors after deploying:

1. **Check Render Logs:**
   - Render dashboard → Logs tab
   - Look for red error messages from docker-entrypoint.sh
   - Find the exact command that failed

2. **Common Issues:**
   - Missing `DB_*` environment variables → migrations fail
   - Wrong `APP_KEY` → encryption fails
   - Missing PostgreSQL credentials → can't connect to database
   - Typo in `SANCTUM_STATEFUL_DOMAINS` → CORS blocks requests

3. **Test Locally First:**
   ```bash
   # Simulate production environment locally
   DB_CONNECTION=pgsql php artisan migrate --force
   DB_CONNECTION=pgsql php artisan config:cache
   ```

---

## LINE ENDINGS: LF vs CRLF

⚠️ **CRITICAL for Windows developers:**

The `docker-entrypoint.sh` script must use **LF** (Linux) line endings, not **CRLF** (Windows).

### Check in VS Code:
1. Open `docker-entrypoint.sh`
2. Look at **bottom-right corner** of editor
3. If it says **CRLF**, click it and select **LF**
4. Save the file

If you don't do this, Docker will crash with:
```
/bin/bash^M: bad interpreter: No such file or directory
```

The `^M` is a hidden Windows carriage return that Linux can't read.

---

## Checklist Before Deploying

- [ ] Generated APP_KEY locally with `php artisan key:generate --show`
- [ ] Added APP_KEY to Render Environment tab
- [ ] Verified all DB_* variables are set in Render
- [ ] docker-entrypoint.sh line endings are set to LF
- [ ] Dockerfile removed the `php artisan key:generate` command
- [ ] Pushed all changes to GitHub (git push)
- [ ] Triggered Render redeploy
- [ ] Checked Render logs for errors
- [ ] Tested health check: `curl https://l-r-ctoms.onrender.com/`

---

## Testing the Fix

Once deployed, test these endpoints:

```bash
# Should return 200 OK
curl https://l-r-ctoms.onrender.com/

# Should return JSON (API working)
curl https://l-r-ctoms.onrender.com/api/status

# Should show login form (Inertia working)
curl https://l-r-ctoms.onrender.com/login
```

If you're still seeing 500 errors, check Render logs and look for the exact error message that `set -e` is now forcing to surface.
