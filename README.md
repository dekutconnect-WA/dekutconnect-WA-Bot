# 𝐃𝐄𝐊𝐔𝐓𝐂𝐎𝐍𝐍𝐄𝐂𝐓 𝐖𝐀-𝐁𝐨𝐭 𝐕𝐞𝐫𝐬𝐢𝐨𝐧 𝟏.𝟎.𝟎

DEKUTCONNECT WA-Bot is a high-performance, feature-rich Multi-Device WhatsApp bot designed to enhance and automate your WhatsApp communication experience.

---

## 𝟏. 𝐒𝐄𝐓 𝐔𝐏

### 𝐀. 𝐅𝐎𝐑𝐊 𝐑𝐄𝐏𝐎𝐒𝐈𝐓𝐎𝐑𝐘
Fork this repository to your GitHub account to get your own deployable instance of the bot.

---

### 𝐁. 𝐋𝐈𝐍𝐊 𝐖𝐈𝐓𝐇 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏
Get your `SESSION_ID` by linking your WhatsApp account:
1. Go to the pairing session service page.
2. Link using your phone number to receive your session ID (usually prefixed with `DEKUTCONNECT~`).

---

## 𝟐. 𝐃𝐄𝐏𝐋𝐎𝐘𝐌𝐄𝐍𝐓 𝐎𝐏𝐓𝐈𝐎𝐍𝐒

### (A) HEROKU DEPLOYMENT
- PostgreSQL is auto-provisioned via the `heroku-postgresql:essential-0` addon.
- Environment variables are automatically populated. Fill in your `SESSION_ID`.

---

### (B) RENDER DEPLOYMENT
1. Create an account on Render.
2. Connect your forked GitHub repository.
3. Render automatically provisions the PostgreSQL database linked to the bot using the `render.yaml` configuration.
4. Set the `SESSION_ID` environment variable when prompted.

---

### (C) RAILWAY DEPLOYMENT
1. Connect your repository to Railway.
2. Provision a PostgreSQL instance in the same Railway project. Railway automatically sets `DATABASE_URL` for your bot service.
3. Add the following environment variables:
   - `SESSION_ID`
   - `MODE` (e.g. `public` or `private`)
   - `TIME_ZONE` (e.g. `Africa/Nairobi`)

---

### (D) KOYEB DEPLOYMENT
1. Connect your repository to Koyeb.
2. Set up a free external PostgreSQL database (e.g., via [neon.tech](https://neon.tech)) and set the connection string as `DATABASE_URL`.
3. Set your `SESSION_ID`, `MODE`, and `TIME_ZONE` environment variables.

---

### (E) VPS / SELF-HOSTED DEPLOYMENT

Make sure Node.js (version 20+) and Git are installed on your Linux server.

**1. Clone the repository**
```bash
git clone https://github.com/dekutconnect/DEKUTCONNECT-WA-Bot.git
cd DEKUTCONNECT-WA-Bot
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**
Create a `.env` file in the root directory:
```env
SESSION_ID=DEKUTCONNECT~your_session_id_here
MODE=public
TIME_ZONE=Africa/Nairobi
AUTO_LIKE_STATUS=true
AUTO_READ_STATUS=true
DATABASE_URL=
```

**4. Install FFmpeg (required for media commands)**
```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y ffmpeg
```

**5. Start the bot**
```bash
npm start
```

**6. PM2 Process Management**
Keep the process running continuously in the background:
```bash
npm install -g pm2
pm2 start index.js --name dekutconnect-wa-bot
pm2 save
pm2 startup
```

**7. Stopping and Restarting**
```bash
pm2 stop dekutconnect-wa-bot
pm2 restart dekutconnect-wa-bot && pm2 logs
```

---

## 𝟑. 𝐂𝐎𝐍𝐅𝐈𝐆𝐔𝐑𝐀𝐓𝐈𝐎𝐍𝐒

The bot uses database settings that can be customized dynamically using commands or database entries.

| Key | Description | Default |
|---|---|---|
| `PREFIX` | Command prefix | `.` |
| `OWNER_NAME` | Owner name | `ceo.eduniapps.com` |
| `BOT_NAME` | Name of the bot | `DEKUTCONNECT WA-Bot` |
| `MODE` | Worktype mode | `private` |
| `TIME_ZONE` | Timezone location | `Africa/Nairobi` |
| `AUTO_READ_STATUS` | Auto view statuses | `false` |
| `AUTO_LIKE_STATUS` | Auto like statuses | `false` |

---

## 𝟒. 𝐋𝐈𝐂𝐄𝐍𝐒𝐄
This project is licensed under the MIT License.
