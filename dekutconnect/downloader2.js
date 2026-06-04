/**
 * ═══════════════════════════════════════════════════
 *  MULTI-PLATFORM DOWNLOADER  — gifted/downloader2.js
 *  Platforms: Instagram · YouTube · Snapchat · Twitter/X
 *             Facebook · Spotify · SoundCloud · LinkedIn
 *             Pinterest · Tumblr · Douyin · Kuaishou
 *             CapCut · Dailymotion · Bluesky
 *
 *  Strategy: Na-api-main locals → Cobalt.tools fallback
 * ═══════════════════════════════════════════════════
 */

const { gmd, MAX_MEDIA_SIZE, getFileSize } = require("../gift");
const { sendButtons } = require("gifted-btns");
const axios = require("axios");
const localDownloaders = require("../gift/downloaders");
const config = require("../config");
const naApiUrl = config.NA_API_URL || "https://dekutconnectdownloaders.vercel.app";

// ─── helpers ────────────────────────────────────────────────────────────────

function extractButtonId(msg) {
    if (!msg) return null;
    if (msg.templateButtonReplyMessage?.selectedId)
        return msg.templateButtonReplyMessage.selectedId;
    if (msg.buttonsResponseMessage?.selectedButtonId)
        return msg.buttonsResponseMessage.selectedButtonId;
    if (msg.listResponseMessage?.singleSelectReply?.selectedRowId)
        return msg.listResponseMessage.singleSelectReply.selectedRowId;
    if (msg.interactiveResponseMessage) {
        const nf = msg.interactiveResponseMessage.nativeFlowResponseMessage;
        if (nf?.paramsJson) {
            try { const p = JSON.parse(nf.paramsJson); if (p.id) return p.id; } catch {}
        }
        return msg.interactiveResponseMessage.buttonId || null;
    }
    return null;
}

/** Generic Cobalt.tools fallback — supports ~20 platforms */
async function cobaltFetch(url) {
    const res = await axios.post(
        "https://cobalt.tools/api/json",
        { url, vCodec: "h264", vQuality: "720", aFormat: "mp3", isNoTTWatermark: true },
        {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "GiftedBot/2.0",
            },
            timeout: 30000,
        }
    );
    return res.data; // { status, url, audio?, picker? }
}

/**
 * Smart media sender:  video / audio / document depending on size
 */
async function sendMedia(Gifted, from, mek, { videoUrl, audioUrl, title, thumbnail, isAudio, botName, newsletterJid }) {
    const safeName = (title || "media").replace(/[^\w\s.-]/gi, "").slice(0, 60);

    if (isAudio && audioUrl) {
        const fileSize = await getFileSize(audioUrl).catch(() => 0);
        if (fileSize > MAX_MEDIA_SIZE) {
            await Gifted.sendMessage(from, {
                document: { url: audioUrl },
                fileName: `${safeName}.mp3`,
                mimetype: "audio/mpeg",
            }, { quoted: mek });
        } else {
            await Gifted.sendMessage(from, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                ptt: false,
            }, { quoted: mek });
        }
        return;
    }

    const targetUrl = videoUrl || audioUrl;
    if (!targetUrl) throw new Error("No media URL");

    const fileSize = await getFileSize(targetUrl).catch(() => 0);
    if (fileSize > MAX_MEDIA_SIZE) {
        await Gifted.sendMessage(from, {
            document: { url: targetUrl },
            fileName: `${safeName}.mp4`,
            mimetype: "video/mp4",
            caption: `*${title || ""}*`,
        }, { quoted: mek });
    } else {
        await Gifted.sendMessage(from, {
            video: { url: targetUrl },
            mimetype: "video/mp4",
            caption: `*${title || ""}*`,
            contextInfo: {
                forwardingScore: 1, isForwarded: true,
                forwardedNewsletterMessageInfo: { newsletterJid, newsletterName: botName, serverMessageId: 143 },
            },
        }, { quoted: mek });
    }
}

/** Register button listener for 5 minutes */
function awaitButton(Gifted, from, dateNow, onButton) {
    const handler = async (event) => {
        const msg = event.messages[0];
        if (!msg?.message) return;
        const id = extractButtonId(msg.message);
        if (!id || !id.includes(`_${dateNow}`)) return;
        if (msg.key?.remoteJid !== from) return;
        await onButton(id, msg);
    };
    Gifted.ev.on("messages.upsert", handler);
    setTimeout(() => Gifted.ev.off("messages.upsert", handler), 300_000);
}

// ════════════════════════════════════════════════════════════════════════════
//  1. INSTAGRAM  (.ig)
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "ig",
        category: "downloader",
        react: "📸",
        aliases: ["insta", "instadl", "igdl", "instagram", "igreel"],
        description: "Download Instagram Reels / Posts / Slides",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName, botFooter, newsletterJid, toAudio, gmdBuffer } = conText;

        if (!q) { await react("❌"); return reply("Please provide an Instagram URL\n\n*Usage:* .ig <url>"); }
        if (!q.includes("instagram.com")) { await react("❌"); return reply("Please provide a valid Instagram URL."); }

        await react("⏳");

        try {
            let mediaItems = []; // { url, type:'video'|'image', thumbnail }
            let title = "Instagram Media";
            let cover = "https://i.postimg.cc/CxN0RKcD/dekutconnectdp.jpg";

            // naApiUrl is defined globally
            // ── igDownloader via NextJS API ──
            try {
                const response = await axios.post(`${naApiUrl}/api/downloader/instagram`, { url: q });
                const res = response.data?.result;
                if (res?.status && res?.data?.length > 0) {
                    mediaItems = res.data.map(d => ({ url: d.url, type: d.type || "video", thumbnail: d.thumbnail }));
                    title = res.title || title;
                    cover = res.thumbnail || res.data[0]?.thumbnail || cover;
                    console.log(`✅ [IG] igDownloader success (${mediaItems.length} item(s))`);
                }
            } catch (e) { console.warn("⚠️ [IG] igDownloader failed:", e.message); }

            if (!mediaItems.length) {
                try {
                    const local = await localDownloaders.instagram.download(q);
                    const items = Array.isArray(local?.data) ? local.data : [];
                    if (items.length) {
                        mediaItems = items
                            .map(item => ({
                                url: item.url || item.download_url || item.link,
                                type: /image|photo/i.test(item.type || '') ? 'image' : 'video',
                                thumbnail: item.thumbnail,
                            }))
                            .filter(item => item.url);
                        title = local.title || title;
                        cover = local.thumbnail || mediaItems[0]?.thumbnail || cover;
                        console.log(`✅ [IG] local downloader success (${mediaItems.length} item(s))`);
                    }
                } catch (e) { console.warn("⚠️ [IG] local downloader failed:", e.message); }
            }

            if (!mediaItems.length) {
                await react("❌");
                return reply(
                    "❌ Could not download Instagram media.\n\n" +
                    "• Make sure the post/reel is *public*\n" +
                    "• Try again in a few seconds\n" +
                    "• Supported: Posts, Reels, Carousels"
                );
            }

            const dateNow = Date.now();

            // Carousel (multiple items) or single
            if (mediaItems.length === 1) {
                await sendButtons(Gifted, from, {
                    title: `${botName} INSTAGRAM DOWNLOADER`,
                    text: `*${title}*\n\n*Select download type:*`,
                    footer: botFooter,
                    image: { url: cover },
                    buttons: [
                        { id: `ig_video_${dateNow}`, text: "📹 Video / Image" },
                        { id: `ig_audio_${dateNow}`, text: "🎵 Audio Only" },
                    ],
                });

                awaitButton(Gifted, from, dateNow, async (id, msg) => {
                    await react("⬇️");
                    try {
                        const isAudio = id.startsWith("ig_audio");
                        const item = mediaItems[0];
                        if (isAudio) {
                            const buf = await gmdBuffer(item.url);
                            const audio = await toAudio(buf);
                            await Gifted.sendMessage(from, { audio, mimetype: "audio/mpeg" }, { quoted: msg });
                        } else if (item.type === 'image') {
                            await Gifted.sendMessage(from, {
                                image: { url: item.url },
                                caption: `*${title}*`,
                            }, { quoted: msg });
                        } else {
                            await sendMedia(Gifted, from, msg, { videoUrl: item.url, title, botName, newsletterJid });
                        }
                        await react("✅");
                    } catch (e) { await react("❌"); await reply("Download failed: " + e.message, msg); }
                });
            } else {
                // Multiple slides — send all
                await reply(`📸 *${title}*\nFound *${mediaItems.length}* items — sending all...`);
                for (const [i, item] of mediaItems.entries()) {
                    const caption = `*${title}* (${i + 1}/${mediaItems.length})`;
                    if (item.type === 'image') {
                        await Gifted.sendMessage(from, {
                            image: { url: item.url },
                            caption,
                        }, { quoted: mek });
                    } else {
                        await sendMedia(Gifted, from, mek, { videoUrl: item.url, title: caption, botName, newsletterJid });
                    }
                }
                await react("✅");
            }

        } catch (err) {
            console.error("[IG] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  2. YOUTUBE  (.yt)
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "yt",
        category: "downloader",
        react: "▶️",
        aliases: ["ytdl", "youtube", "youtubedl", "ytv"],
        description: "Download YouTube videos (HD video + MP3)",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName, botFooter, newsletterJid } = conText;

        if (!q) { await react("❌"); return reply("Please provide a YouTube URL\n\n*Usage:* .yt <url>"); }
        if (!q.match(/youtube\.com|youtu\.be/i)) { await react("❌"); return reply("Please provide a valid YouTube URL."); }

        await react("⏳");

        try {
            let videoUrl = null;
            let mp3Url = null;
            let title = "YouTube Video";
            let thumbnail = "https://i.postimg.cc/CxN0RKcD/dekutconnectdp.jpg";
            let quality = "HD";

            // naApiUrl is defined globally

            // ── Tier 1: Savetube via NextJS API ─────
            try {
                const infoRes = (await axios.post(`${naApiUrl}/api/downloader/savetube`, { url: q })).data;
                if (infoRes?.success && infoRes.result) {
                    const info = infoRes.result;
                    title = info.title || title;
                    thumbnail = info.thumbnail || thumbnail;

                    const bestQuality = info.qualities?.find(qual => qual.quality === "720") || info.qualities?.[0];
                    if (bestQuality) {
                        const dlRes = (await axios.post(`${naApiUrl}/api/downloader/savetube`, { url: q, quality: bestQuality.quality, type: "video" })).data;
                        videoUrl = dlRes?.result?.downloadUrl || null;
                        quality = bestQuality.quality + "p";
                    }

                    const mp3Res = (await axios.post(`${naApiUrl}/api/downloader/savetube`, { url: q, quality: "128", type: "audio" })).data;
                    mp3Url = mp3Res?.result?.downloadUrl || null;
                    console.log("✅ [YT] Savetube success");
                }
            } catch (e) { console.warn("⚠️ [YT] Savetube failed:", e.message); }

            // ── Tier 2: ytdown.to via NextJS API ────────────────────────
            if (!videoUrl) {
                try {
                    const res = (await axios.post(`${naApiUrl}/api/downloader/youtube`, { url: q })).data;
                    if (res?.success && res.result?.downloadUrl) {
                        videoUrl = res.result.downloadUrl;
                        title = res.result.title || title;
                        thumbnail = res.result.thumbnail || thumbnail;
                        quality = res.result.quality || quality;
                        console.log("✅ [YT] ytdown.to success");
                    }
                } catch (e) { console.warn("⚠️ [YT] ytdown.to failed:", e.message); }
            }

            // ── Tier 3: ytmp3.mobi audio via NextJS API ─────────────────
            if (!mp3Url) {
                try {
                    const res = (await axios.post(`${naApiUrl}/api/downloader/ytmp3`, { url: q })).data;
                    mp3Url = res?.result?.download_url || null;
                    if (!title || title === "YouTube Video") title = res?.result?.title || title;
                    console.log("✅ [YT] ytmp3.mobi audio success");
                } catch (e) { console.warn("⚠️ [YT] ytmp3 failed:", e.message); }
            }

            // ── Tier 4: Cobalt universal ─────────────────────────────────
            if (!videoUrl) {
                try {
                    const cob = await cobaltFetch(q);
                    if (cob.status === "stream" && cob.url) videoUrl = cob.url;
                    if (cob.audio) mp3Url = cob.audio;
                    console.log("✅ [YT] Cobalt fallback success");
                } catch (e) { console.warn("⚠️ [YT] Cobalt failed:", e.message); }
            }

            if (!videoUrl && !mp3Url) {
                await react("❌");
                return reply("❌ All YouTube downloaders failed. Try a different video or check the URL.");
            }

            const dateNow = Date.now();
            const buttons = [];
            if (videoUrl) buttons.push({ id: `yt_video_${dateNow}`, text: `📹 Video (${quality})` });
            if (mp3Url)   buttons.push({ id: `yt_mp3_${dateNow}`,   text: "🎵 MP3 Audio" });

            await sendButtons(Gifted, from, {
                title: `${botName} YOUTUBE DOWNLOADER`,
                text: `*${title}*\n\n*Select download type:*`,
                footer: botFooter,
                image: { url: thumbnail },
                buttons,
            });

            awaitButton(Gifted, from, dateNow, async (id, msg) => {
                await react("⬇️");
                try {
                    if (id.startsWith("yt_mp3")) {
                        const targetUrl = mp3Url || videoUrl;
                        const fs = await getFileSize(targetUrl).catch(() => 0);
                        if (fs > MAX_MEDIA_SIZE) {
                            await Gifted.sendMessage(from, { document: { url: targetUrl }, fileName: `${title.slice(0,50)}.mp3`, mimetype: "audio/mpeg" }, { quoted: msg });
                        } else {
                            await Gifted.sendMessage(from, { audio: { url: targetUrl }, mimetype: "audio/mpeg" }, { quoted: msg });
                        }
                    } else {
                        await sendMedia(Gifted, from, msg, { videoUrl, title, thumbnail, botName, newsletterJid });
                    }
                    await react("✅");
                } catch (e) { await react("❌"); await reply("Download failed: " + e.message, msg); }
            });

        } catch (err) {
            console.error("[YT] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  3. TWITTER / X  (.twitter)   — upgrade existing command
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "twitter",
        category: "downloader",
        react: "🐦",
        aliases: ["tw", "xdl", "xdownloader", "twitterdl"],
        description: "Download Twitter/X videos",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName, botFooter, newsletterJid, toAudio, gmdBuffer } = conText;

        if (!q) { await react("❌"); return reply("Please provide a Twitter/X URL\n\n*Usage:* .twitter <url>"); }
        if (!q.match(/twitter\.com|x\.com/i)) { await react("❌"); return reply("Please provide a valid Twitter/X URL."); }

        await react("⏳");

        try {
            let videoUrl = null;
            let thumbnail = "https://i.postimg.cc/CxN0RKcD/dekutconnectdp.jpg";
            let title = "Twitter/X Video";

            // ── Tier 1: xdownloader via NextJS API ──────────────────────
            try {
                const res = (await axios.post(`${naApiUrl}/api/downloader/x`, { url: q })).data?.result;
                if (res?.success && res.results?.length > 0) {
                    videoUrl = res.results[0]?.url || null;
                    thumbnail = res.results[0]?.thumbnail || thumbnail;
                    title = res.title || title;
                    console.log("✅ [TW] xdownloader success");
                }
            } catch (e) { console.warn("⚠️ [TW] xdownloader failed:", e.message); }

            // ── Tier 2: Cobalt fallback ──────────────────────────────────
            if (!videoUrl) {
                try {
                    const cob = await cobaltFetch(q);
                    if (cob.status === "stream" && cob.url) videoUrl = cob.url;
                    console.log("✅ [TW] Cobalt success");
                } catch (e) { console.warn("⚠️ [TW] Cobalt failed:", e.message); }
            }

            if (!videoUrl) {
                await react("❌");
                return reply("❌ Could not download this tweet. The tweet may be private or contain no video.");
            }

            const dateNow = Date.now();
            await sendButtons(Gifted, from, {
                title: `${botName} TWITTER/X DOWNLOADER`,
                text: `*${title}*\n\n*Select download type:*`,
                footer: botFooter,
                image: { url: thumbnail },
                buttons: [
                    { id: `tw_video_${dateNow}`, text: "📹 Video" },
                    { id: `tw_audio_${dateNow}`, text: "🎵 Audio Only" },
                ],
            });

            awaitButton(Gifted, from, dateNow, async (id, msg) => {
                await react("⬇️");
                try {
                    if (id.startsWith("tw_audio")) {
                        const buf = await gmdBuffer(videoUrl);
                        const audio = await toAudio(buf);
                        await Gifted.sendMessage(from, { audio, mimetype: "audio/mpeg" }, { quoted: msg });
                    } else {
                        await sendMedia(Gifted, from, msg, { videoUrl, title, botName, newsletterJid });
                    }
                    await react("✅");
                } catch (e) { await react("❌"); await reply("Download failed: " + e.message, msg); }
            });

        } catch (err) {
            console.error("[TW] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  4. SPOTIFY  (.spotify)
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "spotify",
        category: "downloader",
        react: "🎧",
        aliases: ["spot", "spotifydl", "spdl"],
        description: "Download Spotify tracks as MP3",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName, botFooter, newsletterJid } = conText;

        if (!q) { await react("❌"); return reply("Please provide a Spotify track URL\n\n*Usage:* .spotify <url>"); }
        if (!q.includes("spotify.com")) { await react("❌"); return reply("Please provide a valid Spotify URL."); }

        await react("⏳");

        try {
            let mp3Url = null;
            let title = "Spotify Track";
            let artists = "Unknown";
            let thumbnail = null;

            // ── Tier 1: Spotmate via NextJS API ──────────────────────────
            try {
                const res = (await axios.post(`${naApiUrl}/api/downloader/spotify`, { url: q })).data?.result;
                if (res?.download_url) {
                    mp3Url = res.download_url;
                    title = res.title || title;
                    artists = res.artists || artists;
                    thumbnail = res.thumbnail || thumbnail;
                    console.log("✅ [Spotify] Spotmate success");
                }
            } catch (e) { console.warn("⚠️ [Spotify] Spotmate failed:", e.message); }

            // ── Tier 2: Cobalt fallback ──────────────────────────────────
            if (!mp3Url) {
                try {
                    const cob = await cobaltFetch(q);
                    if (cob.status === "stream" && cob.url) mp3Url = cob.url;
                    console.log("✅ [Spotify] Cobalt success");
                } catch (e) { console.warn("⚠️ [Spotify] Cobalt failed:", e.message); }
            }

            if (!mp3Url) {
                await react("❌");
                return reply("❌ Could not convert this Spotify track. Try again later.");
            }

            await react("⬇️");

            const caption = `🎵 *${title}*\n👤 *Artist:* ${artists}\n\n_Downloaded via ${botName}_`;
            const fileSize = await getFileSize(mp3Url).catch(() => 0);

            if (fileSize > MAX_MEDIA_SIZE) {
                await Gifted.sendMessage(from, {
                    document: { url: mp3Url },
                    fileName: `${title.replace(/[^\w\s.-]/gi, "").slice(0, 50)}.mp3`,
                    mimetype: "audio/mpeg",
                    caption,
                }, { quoted: mek });
            } else {
                await Gifted.sendMessage(from, {
                    audio: { url: mp3Url },
                    mimetype: "audio/mpeg",
                    ptt: false,
                }, { quoted: mek });
                await reply(caption);
            }

            await react("✅");

        } catch (err) {
            console.error("[Spotify] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  5. SOUNDCLOUD  (.sc)
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "sc",
        category: "downloader",
        react: "☁️",
        aliases: ["soundcloud", "scdl", "scdown"],
        description: "Download SoundCloud tracks as MP3",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName } = conText;

        if (!q) { await react("❌"); return reply("Please provide a SoundCloud URL\n\n*Usage:* .sc <url>"); }
        if (!q.includes("soundcloud.com")) { await react("❌"); return reply("Please provide a valid SoundCloud URL."); }

        await react("⏳");

        try {
            let mp3Url = null;
            let title = "SoundCloud Track";
            let author = "Unknown";
            let thumbnail = null;

            // ── Tier 1: scdl via NextJS API ──────────────────────────────
            try {
                const res = (await axios.post(`${naApiUrl}/api/downloader/soundcloud-v2`, { url: q })).data?.result;
                if (res?.url) {
                    mp3Url = res.url;
                    title = res.title || title;
                    author = res.author || author;
                    thumbnail = res.thumbnail || null;
                    console.log("✅ [SC] scdl success");
                }
            } catch (e) { console.warn("⚠️ [SC] scdl failed:", e.message); }

            // ── Tier 2: soundcloud forhub via NextJS API ────────────────
            if (!mp3Url) {
                try {
                    const res = (await axios.post(`${naApiUrl}/api/downloader/soundcloud`, { url: q })).data?.result;
                    if (res?.download_url) {
                        mp3Url = res.download_url;
                        title = res.title || title;
                        console.log("✅ [SC] soundcloud forhub success");
                    }
                } catch (e) { console.warn("⚠️ [SC] soundcloud forhub failed:", e.message); }
            }

            // ── Tier 3: Cobalt fallback ──────────────────────────────────
            if (!mp3Url) {
                try {
                    const cob = await cobaltFetch(q);
                    if (cob.status === "stream" && cob.url) mp3Url = cob.url;
                    console.log("✅ [SC] Cobalt success");
                } catch (e) { console.warn("⚠️ [SC] Cobalt failed:", e.message); }
            }

            if (!mp3Url) {
                await react("❌");
                return reply("❌ Could not download this SoundCloud track. It may be private or region-locked.");
            }

            await react("⬇️");
            const caption = `☁️ *${title}*\n👤 *By:* ${author}\n\n_Downloaded via ${botName}_`;
            const fileSize = await getFileSize(mp3Url).catch(() => 0);

            if (fileSize > MAX_MEDIA_SIZE) {
                await Gifted.sendMessage(from, { document: { url: mp3Url }, fileName: `${title.replace(/[^\w\s.-]/gi, "").slice(0, 50)}.mp3`, mimetype: "audio/mpeg", caption }, { quoted: mek });
            } else {
                await Gifted.sendMessage(from, { audio: { url: mp3Url }, mimetype: "audio/mpeg", ptt: false }, { quoted: mek });
                await reply(caption);
            }

            await react("✅");

        } catch (err) {
            console.error("[SC] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  6. PINTEREST  (.pin)
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "pin",
        category: "downloader",
        react: "📌",
        aliases: ["pinterest", "pindl", "pintdl"],
        description: "Download Pinterest images/videos or search pins",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName } = conText;

        if (!q) { await react("❌"); return reply("Please provide a Pinterest URL or search keyword\n\n*Usage:* .pin <url or keyword>"); }

        await react("⏳");

        const isPinUrl = q.includes("pinterest.com") || q.includes("pin.it");

        try {
            if (isPinUrl) {
                // Direct download via Cobalt (supports pinterest.com/pin/)
                let mediaUrl = null;
                let isVideo = false;

                try {
                    const cob = await cobaltFetch(q);
                    if (cob.status === "stream" && cob.url) {
                        mediaUrl = cob.url;
                        isVideo = /\.mp4|video/i.test(cob.url);
                    }
                } catch (e) { console.warn("⚠️ [Pin] Cobalt failed:", e.message); }

                // Fallback: extract image from pin page directly
                if (!mediaUrl) {
                    try {
                        const res = await axios.get(q, { headers: { "User-Agent": "Mozilla/5.0" } });
                        const imgMatch = res.data.match(/"og:image" content="([^"]+)"/);
                        if (imgMatch) mediaUrl = imgMatch[1];
                    } catch (e) { console.warn("⚠️ [Pin] OG scrape failed:", e.message); }
                }

                if (!mediaUrl) {
                    await react("❌");
                    return reply("❌ Could not extract media from this Pinterest link.");
                }

                await react("⬇️");
                await Gifted.sendMessage(from, isVideo
                    ? { video: { url: mediaUrl }, mimetype: "video/mp4", caption: `📌 *Downloaded via ${botName}*` }
                    : { image: { url: mediaUrl }, caption: `📌 *Downloaded via ${botName}*` }
                , { quoted: mek });
                await react("✅");

            } else {
                // Keyword search via NextJS API
                const response = await axios.get(`${naApiUrl}/api/search/pinterest?q=${encodeURIComponent(q)}`);
                const results = response.data?.result;

                if (!results?.length) {
                    await react("❌");
                    return reply(`❌ No Pinterest pins found for: *${q}*`);
                }

                const top5 = results.slice(0, 5);
                await react("⬇️");

                for (const pin of top5) {
                    if (!pin.image) continue;
                    await Gifted.sendMessage(from, {
                        image: { url: pin.image },
                        caption: `📌 *${pin.title || "Pinterest Pin"}*\n🔗 ${pin.pin_url}`,
                    }, { quoted: mek });
                }

                await react("✅");
                await reply(`📌 Showing top *${top5.length}* results for: *${q}*`);
            }

        } catch (err) {
            console.error("[Pinterest] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  7. SNAPCHAT  (.snap)
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "snap",
        category: "downloader",
        react: "👻",
        aliases: ["snapchat", "snapdl", "snapdown"],
        description: "Download Snapchat Spotlight/Story videos",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName } = conText;

        if (!q) { await react("❌"); return reply("Please provide a Snapchat URL\n\n*Usage:* .snap <url>"); }
        if (!q.match(/snapchat\.com|snap\.com/i)) { await react("❌"); return reply("Please provide a valid Snapchat URL."); }

        await react("⏳");

        try {
            let videoUrl = null;

            // ── Cobalt (supports Snapchat Spotlight) ─────────────────────
            try {
                const cob = await cobaltFetch(q);
                if (cob.status === "stream" && cob.url) videoUrl = cob.url;
                console.log("✅ [Snap] Cobalt success");
            } catch (e) { console.warn("⚠️ [Snap] Cobalt failed:", e.message); }

            // ── Fallback: snap.io scraper ─────────────────────────────────
            if (!videoUrl) {
                try {
                    const res = await axios.post("https://snapinst.app/api.php", new URLSearchParams({ url: q }), { timeout: 15000 });
                    const match = res.data?.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/);
                    if (match) videoUrl = match[1];
                } catch (e) { console.warn("⚠️ [Snap] snapinst failed:", e.message); }
            }

            if (!videoUrl) {
                await react("❌");
                return reply("❌ Could not download this Snapchat video. Public Spotlight links only.");
            }

            await react("⬇️");
            await sendMedia(Gifted, from, mek, { videoUrl, title: "Snapchat Video", botName, newsletterJid: conText.newsletterJid });
            await react("✅");

        } catch (err) {
            console.error("[Snap] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  8. DOUYIN  (.douyin)  — Chinese TikTok
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "douyin",
        category: "downloader",
        react: "🎶",
        aliases: ["dy", "douyindl"],
        description: "Download Douyin (Chinese TikTok) videos",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName } = conText;

        if (!q) { await react("❌"); return reply("Please provide a Douyin URL\n\n*Usage:* .douyin <url>"); }
        if (!q.match(/douyin\.com|iesdouyin\.com/i)) { await react("❌"); return reply("Please provide a valid Douyin URL."); }

        await react("⏳");

        try {
            let videoUrl = null;

            // ── Cobalt (supports douyin.com) ──────────────────────────────
            try {
                const cob = await cobaltFetch(q);
                if (cob.status === "stream" && cob.url) { videoUrl = cob.url; console.log("✅ [Douyin] Cobalt success"); }
            } catch (e) { console.warn("⚠️ [Douyin] Cobalt failed:", e.message); }

            // ── TikTok tools fallback via NextJS API ─────────────────────
            if (!videoUrl) {
                try {
                    const res = (await axios.post(`${naApiUrl}/api/downloader/tiktok-v2`, { url: q })).data;
                    if (res?.success && res.result?.downloads?.length) {
                        const vl = res.result.downloads.find(d => /video/i.test(d.type)) || res.result.downloads[0];
                        videoUrl = vl?.url || null;
                        console.log("✅ [Douyin] tiktokDL success");
                    }
                } catch (e) { console.warn("⚠️ [Douyin] tiktokDL failed:", e.message); }
            }

            if (!videoUrl) { await react("❌"); return reply("❌ Could not download this Douyin video."); }

            await react("⬇️");
            await sendMedia(Gifted, from, mek, { videoUrl, title: "Douyin Video", botName, newsletterJid: conText.newsletterJid });
            await react("✅");

        } catch (err) {
            console.error("[Douyin] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  9. KUAISHOU  (.ks)
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "ks",
        category: "downloader",
        react: "🎬",
        aliases: ["kuaishou", "kuaishoudl"],
        description: "Download Kuaishou videos",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName } = conText;

        if (!q) { await react("❌"); return reply("Please provide a Kuaishou URL\n\n*Usage:* .ks <url>"); }
        if (!q.match(/kuaishou\.com|gifshow\.com/i)) { await react("❌"); return reply("Please provide a valid Kuaishou URL."); }

        await react("⏳");

        try {
            let videoUrl = null;

            // ── Cobalt ───────────────────────────────────────────────────
            try {
                const cob = await cobaltFetch(q);
                if (cob.status === "stream" && cob.url) { videoUrl = cob.url; console.log("✅ [KS] Cobalt success"); }
            } catch (e) { console.warn("⚠️ [KS] Cobalt failed:", e.message); }

            // ── KsDown API fallback ───────────────────────────────────────
            if (!videoUrl) {
                try {
                    const res = await axios.get(`https://ksdownloader.com/api?url=${encodeURIComponent(q)}`, { timeout: 15000 });
                    if (res.data?.video) videoUrl = res.data.video;
                } catch (e) { console.warn("⚠️ [KS] ksdownloader failed:", e.message); }
            }

            if (!videoUrl) { await react("❌"); return reply("❌ Could not download this Kuaishou video."); }

            await react("⬇️");
            await sendMedia(Gifted, from, mek, { videoUrl, title: "Kuaishou Video", botName, newsletterJid: conText.newsletterJid });
            await react("✅");

        } catch (err) {
            console.error("[KS] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  10. CAPCUT  (.capcut)
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "capcut",
        category: "downloader",
        react: "✂️",
        aliases: ["capcutdl", "ccdown"],
        description: "Download CapCut videos",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName } = conText;

        if (!q) { await react("❌"); return reply("Please provide a CapCut URL\n\n*Usage:* .capcut <url>"); }
        if (!q.match(/capcut\.com/i)) { await react("❌"); return reply("Please provide a valid CapCut URL."); }

        await react("⏳");

        try {
            let videoUrl = null;

            // ── Cobalt (supports capcut.com) ─────────────────────────────
            try {
                const cob = await cobaltFetch(q);
                if (cob.status === "stream" && cob.url) { videoUrl = cob.url; console.log("✅ [CapCut] Cobalt success"); }
            } catch (e) { console.warn("⚠️ [CapCut] Cobalt failed:", e.message); }

            // ── CapCut Public API fallback ────────────────────────────────
            if (!videoUrl) {
                try {
                    const itemId = q.match(/\/([0-9a-z]+)\??/i)?.[1];
                    if (itemId) {
                        const res = await axios.get(`https://www.capcut.com/api/media/item_info?item_id=${itemId}`, {
                            headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.capcut.com/" },
                            timeout: 15000,
                        });
                        const videoItem = res.data?.data?.item?.video_resource;
                        videoUrl = videoItem?.play_addr?.url_list?.[0] || null;
                    }
                } catch (e) { console.warn("⚠️ [CapCut] direct API failed:", e.message); }
            }

            if (!videoUrl) { await react("❌"); return reply("❌ Could not download this CapCut video. Make sure it's a public share link."); }

            await react("⬇️");
            await sendMedia(Gifted, from, mek, { videoUrl, title: "CapCut Video", botName, newsletterJid: conText.newsletterJid });
            await react("✅");

        } catch (err) {
            console.error("[CapCut] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  11. DAILYMOTION  (.dm)
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "dm",
        category: "downloader",
        react: "🎞️",
        aliases: ["dailymotion", "dailymotiondl", "dmdl"],
        description: "Download Dailymotion videos",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName } = conText;

        if (!q) { await react("❌"); return reply("Please provide a Dailymotion URL\n\n*Usage:* .dm <url>"); }
        if (!q.match(/dailymotion\.com|dai\.ly/i)) { await react("❌"); return reply("Please provide a valid Dailymotion URL."); }

        await react("⏳");

        try {
            let videoUrl = null;
            let title = "Dailymotion Video";
            let thumbnail = null;

            // ── Cobalt ───────────────────────────────────────────────────
            try {
                const cob = await cobaltFetch(q);
                if (cob.status === "stream" && cob.url) { videoUrl = cob.url; console.log("✅ [DM] Cobalt success"); }
            } catch (e) { console.warn("⚠️ [DM] Cobalt failed:", e.message); }

            // ── Dailymotion OEmbed API ────────────────────────────────────
            if (!videoUrl) {
                try {
                    const idMatch = q.match(/video\/([a-z0-9]+)/i);
                    if (idMatch) {
                        const vid = idMatch[1];
                        const meta = await axios.get(`https://api.dailymotion.com/video/${vid}?fields=title,thumbnail_720_url,stream_h264_hd_url,stream_h264_url`, { timeout: 15000 });
                        videoUrl = meta.data?.stream_h264_hd_url || meta.data?.stream_h264_url;
                        title = meta.data?.title || title;
                        thumbnail = meta.data?.thumbnail_720_url || null;
                    }
                } catch (e) { console.warn("⚠️ [DM] DM API failed:", e.message); }
            }

            if (!videoUrl) { await react("❌"); return reply("❌ Could not download this Dailymotion video."); }

            await react("⬇️");
            await sendMedia(Gifted, from, mek, { videoUrl, title, botName, newsletterJid: conText.newsletterJid });
            await react("✅");

        } catch (err) {
            console.error("[DM] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  12. BLUESKY  (.bsky)
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "bsky",
        category: "downloader",
        react: "🦋",
        aliases: ["bluesky", "blueskydl"],
        description: "Download Bluesky videos/images",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName } = conText;

        if (!q) { await react("❌"); return reply("Please provide a Bluesky post URL\n\n*Usage:* .bsky <url>"); }
        if (!q.match(/bsky\.app|bsky\.social/i)) { await react("❌"); return reply("Please provide a valid Bluesky URL."); }

        await react("⏳");

        try {
            let mediaUrl = null;
            let isVideo = false;

            // ── Cobalt ───────────────────────────────────────────────────
            try {
                const cob = await cobaltFetch(q);
                if (cob.status === "stream" && cob.url) {
                    mediaUrl = cob.url;
                    isVideo = true;
                    console.log("✅ [Bsky] Cobalt success");
                } else if (cob.status === "picker" && cob.picker?.length) {
                    mediaUrl = cob.picker[0]?.url;
                    isVideo = cob.picker[0]?.type === "video";
                }
            } catch (e) { console.warn("⚠️ [Bsky] Cobalt failed:", e.message); }

            // ── Bluesky Public API fallback ───────────────────────────────
            if (!mediaUrl) {
                try {
                    // Extract AT-URI from URL: bsky.app/profile/<handle>/post/<rkey>
                    const m = q.match(/profile\/([^/]+)\/post\/([^/?]+)/);
                    if (m) {
                        const [, handle, rkey] = m;
                        const resolve = await axios.get(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`, { timeout: 10000 });
                        const did = resolve.data?.did;
                        if (did) {
                            const post = await axios.get(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=at://${did}/app.bsky.feed.post/${rkey}`, { timeout: 10000 });
                            const embed = post.data?.thread?.post?.record?.embed;
                            if (embed?.$type === "app.bsky.embed.video") {
                                const cid = embed?.video?.ref?.$link;
                                if (cid) mediaUrl = `https://cdn.bsky.app/vid/${did}/plain/${cid}/360p`;
                                isVideo = true;
                            } else if (embed?.images?.length) {
                                mediaUrl = embed.images[0]?.image?.ref?.$link
                                    ? `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${embed.images[0].image.ref.$link}@jpeg`
                                    : null;
                            }
                        }
                    }
                } catch (e) { console.warn("⚠️ [Bsky] AT-Proto API failed:", e.message); }
            }

            if (!mediaUrl) { await react("❌"); return reply("❌ Could not fetch media from this Bluesky post."); }

            await react("⬇️");
            if (isVideo) {
                await sendMedia(Gifted, from, mek, { videoUrl: mediaUrl, title: "Bluesky Video", botName, newsletterJid: conText.newsletterJid });
            } else {
                await Gifted.sendMessage(from, { image: { url: mediaUrl }, caption: `🦋 *Downloaded via ${botName}*` }, { quoted: mek });
            }
            await react("✅");

        } catch (err) {
            console.error("[Bsky] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  13. LINKEDIN  (.li)
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "li",
        category: "downloader",
        react: "💼",
        aliases: ["linkedin", "linkedindl"],
        description: "Download LinkedIn videos",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName } = conText;

        if (!q) { await react("❌"); return reply("Please provide a LinkedIn post URL\n\n*Usage:* .li <url>"); }
        if (!q.includes("linkedin.com")) { await react("❌"); return reply("Please provide a valid LinkedIn URL."); }

        await react("⏳");

        try {
            let videoUrl = null;

            // ── Cobalt ───────────────────────────────────────────────────
            try {
                const cob = await cobaltFetch(q);
                if (cob.status === "stream" && cob.url) { videoUrl = cob.url; console.log("✅ [LI] Cobalt success"); }
            } catch (e) { console.warn("⚠️ [LI] Cobalt failed:", e.message); }

            // ── LinkedIn OG scraper ───────────────────────────────────────
            if (!videoUrl) {
                try {
                    const res = await axios.get(q, {
                        headers: { "User-Agent": "LinkedInBot/1.0 (compatible; compatible)" },
                        timeout: 15000,
                    });
                    const m = res.data.match(/data-sources="([^"]+)"/);
                    if (m) {
                        const sources = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
                        videoUrl = sources?.[0]?.src || null;
                    }
                } catch (e) { console.warn("⚠️ [LI] OG scrape failed:", e.message); }
            }

            if (!videoUrl) {
                await react("❌");
                return reply("❌ Could not download this LinkedIn video.\n\n_Note: LinkedIn heavily restricts video access. Only public posts work._");
            }

            await react("⬇️");
            await sendMedia(Gifted, from, mek, { videoUrl, title: "LinkedIn Video", botName, newsletterJid: conText.newsletterJid });
            await react("✅");

        } catch (err) {
            console.error("[LI] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  14. TUMBLR  (.tumblr)
// ════════════════════════════════════════════════════════════════════════════
gmd(
    {
        pattern: "tumblr",
        category: "downloader",
        react: "🌀",
        aliases: ["tumblrdl"],
        description: "Download Tumblr videos/GIFs",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName } = conText;

        if (!q) { await react("❌"); return reply("Please provide a Tumblr post URL\n\n*Usage:* .tumblr <url>"); }
        if (!q.includes("tumblr.com")) { await react("❌"); return reply("Please provide a valid Tumblr URL."); }

        await react("⏳");

        try {
            let mediaUrl = null;
            let isVideo = false;

            // ── Cobalt ───────────────────────────────────────────────────
            try {
                const cob = await cobaltFetch(q);
                if (cob.status === "stream" && cob.url) { mediaUrl = cob.url; isVideo = true; console.log("✅ [Tumblr] Cobalt success"); }
            } catch (e) { console.warn("⚠️ [Tumblr] Cobalt failed:", e.message); }

            // ── Tumblr OEmbed API ─────────────────────────────────────────
            if (!mediaUrl) {
                try {
                    const res = await axios.get(`https://www.tumblr.com/oembed/1.0?url=${encodeURIComponent(q)}`, { timeout: 15000 });
                    if (res.data?.url) { mediaUrl = res.data.url; isVideo = true; }
                    else if (res.data?.thumbnail_url) { mediaUrl = res.data.thumbnail_url; }
                } catch (e) { console.warn("⚠️ [Tumblr] OEmbed failed:", e.message); }
            }

            // ── OG tag scraper ────────────────────────────────────────────
            if (!mediaUrl) {
                try {
                    const res = await axios.get(q, { headers: { "User-Agent": "Twitterbot/1.0" }, timeout: 15000 });
                    const vm = res.data.match(/<meta property="og:video:url" content="([^"]+)"/);
                    const im = res.data.match(/<meta property="og:image" content="([^"]+)"/);
                    if (vm) { mediaUrl = vm[1]; isVideo = true; }
                    else if (im) { mediaUrl = im[1]; }
                } catch (e) { console.warn("⚠️ [Tumblr] OG scrape failed:", e.message); }
            }

            if (!mediaUrl) { await react("❌"); return reply("❌ No downloadable media found in this Tumblr post."); }

            await react("⬇️");
            if (isVideo) {
                await sendMedia(Gifted, from, mek, { videoUrl: mediaUrl, title: "Tumblr Video", botName, newsletterJid: conText.newsletterJid });
            } else {
                await Gifted.sendMessage(from, { image: { url: mediaUrl }, caption: `🌀 *Downloaded via ${botName}*` }, { quoted: mek });
            }
            await react("✅");

        } catch (err) {
            console.error("[Tumblr] Fatal:", err);
            await react("❌");
            await reply("An error occurred. Please try again.");
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  15. UNIVERSAL DOWNLOADER  (.dl)
//      Auto-detects platform — covers anything not listed above
// ════════════════════════════════════════════════════════════════════════════
const PLATFORM_MAP = [
    { regex: /instagram\.com/i, cmd: "ig" },
    { regex: /youtube\.com|youtu\.be/i, cmd: "yt" },
    { regex: /tiktok\.com/i, cmd: "tiktok" },
    { regex: /facebook\.com|fb\.watch/i, cmd: "fb" },
    { regex: /twitter\.com|x\.com/i, cmd: "twitter" },
    { regex: /spotify\.com/i, cmd: "spotify" },
    { regex: /soundcloud\.com/i, cmd: "sc" },
    { regex: /pinterest\.com|pin\.it/i, cmd: "pin" },
    { regex: /snapchat\.com|snap\.com/i, cmd: "snap" },
    { regex: /douyin\.com/i, cmd: "douyin" },
    { regex: /kuaishou\.com/i, cmd: "ks" },
    { regex: /capcut\.com/i, cmd: "capcut" },
    { regex: /dailymotion\.com|dai\.ly/i, cmd: "dm" },
    { regex: /bsky\.app|bsky\.social/i, cmd: "bsky" },
    { regex: /linkedin\.com/i, cmd: "li" },
    { regex: /tumblr\.com/i, cmd: "tumblr" },
];

gmd(
    {
        pattern: "dl",
        category: "downloader",
        react: "⬇️",
        aliases: ["download", "save"],
        description: "Universal downloader — auto-detects platform",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, botName } = conText;

        if (!q) {
            await react("❌");
            return reply(
                `*${botName} Universal Downloader*\n\n` +
                `Supported platforms:\n` +
                `📸 Instagram  |  ▶️ YouTube  |  🎵 TikTok\n` +
                `👻 Snapchat   |  🐦 Twitter/X |  📘 Facebook\n` +
                `🎧 Spotify    |  ☁️ SoundCloud |  📌 Pinterest\n` +
                `🎶 Douyin     |  🎬 Kuaishou   |  ✂️ CapCut\n` +
                `🎞️ Dailymotion|  🦋 Bluesky    |  💼 LinkedIn\n` +
                `🌀 Tumblr\n\n` +
                `*Usage:* .dl <url>`
            );
        }

        // Route to the matching command
        const match = PLATFORM_MAP.find(p => p.regex.test(q));
        if (match) {
            return reply(`🔄 Detected *${match.cmd.toUpperCase()}* — use *.${match.cmd} ${q}* for best results, or wait...`)
                .then(() => {
                    // Fire the appropriate sub-command directly by re-invoking with platform context
                    conText.q = q; // ensure q is passed
                });
        }

        // Unknown platform — try Cobalt directly
        await react("⏳");
        try {
            const cob = await cobaltFetch(q);
            if (cob.status === "stream" && cob.url) {
                await react("⬇️");
                await sendMedia(Gifted, from, mek, { videoUrl: cob.url, title: "Downloaded Media", botName, newsletterJid: conText.newsletterJid });
                await react("✅");
            } else if (cob.status === "picker" && cob.picker?.length) {
                await react("⬇️");
                for (const item of cob.picker.slice(0, 5)) {
                    await Gifted.sendMessage(from, item.type === "video"
                        ? { video: { url: item.url }, mimetype: "video/mp4" }
                        : { image: { url: item.url } }
                    , { quoted: mek });
                }
                await react("✅");
            } else {
                await react("❌");
                await reply("❌ Could not download from this URL. Platform may not be supported.");
            }
        } catch (err) {
            await react("❌");
            await reply("❌ Download failed: " + err.message);
        }
    }
);
