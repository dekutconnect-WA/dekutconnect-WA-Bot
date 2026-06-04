const { getAllSettings } = require("./database/settings");

const originalConsoleInfo = console.info;
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const suppressedPatterns = [
    /Closing session/i,
    /Closing open session/i,
    /Removing old closed session/i,
    /Decrypted message with closed session/i,
    /in favor of incoming/i,
    /prekey bundle/i,
    /SessionEntry/i,
    /failed to decrypt/i,
    /Bad MAC/i,
    /Session error/i,
    /libsignal/i,
    /session_cipher/i,
    /_chains/i,
    /ephemeralKeyPair/i,
    /rootKey/i,
    /baseKey/i,
    /pendingPreKey/i,
    /indexInfo/i,
    /currentRatchet/i,
    /registrationId/i,
    /remoteIdentityKey/i,
    /lastRemoteEphemeralKey/i,
    /verifyMAC/i,
    /decryptWithSessions/i,
    /doDecryptWhisperMessage/i,
    /_asyncQueueExecutor/i,
    /Interactive send/i,
];

const argToString = (a) => {
    if (typeof a === "string") return a;
    if (a instanceof Error) return a.message + " " + (a.stack || "");
    if (a && typeof a === "object") {
        try { return JSON.stringify(a); } catch (_) {}
        try { return String(a); } catch (_) {}
    }
    return String(a ?? "");
};

const shouldSuppress = (args) => {
    const str = args.map(argToString).join(" ");
    if (suppressedPatterns.some((p) => p.test(str))) return true;
    if (args.some((a) => a && typeof a === "object" && (a._chains || a.indexInfo || a.currentRatchet))) return true;
    return false;
};

function setupConsoleFilters() {
    console.info = (...args) => {
        if (shouldSuppress(args)) return;
        originalConsoleInfo.apply(console, args);
    };

    console.log = (...args) => {
        if (shouldSuppress(args)) return;
        originalConsoleLog.apply(console, args);
    };

    console.error = (...args) => {
        if (shouldSuppress(args)) return;
        originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
        if (shouldSuppress(args)) return;
        originalConsoleWarn.apply(console, args);
    };
}

setupConsoleFilters();

const createContext = async (userJid, options = {}) => {
    const s = await getAllSettings();
    const botName    = s.BOT_NAME        || "DEKUTCONNECT WA-Bot";
    const botPic     = s.BOT_PIC         || "https://i.postimg.cc/CxN0RKcD/dekutconnectdp.jpg";
    const allowed = ["120363394804979643@newsletter", "120363421875175434@newsletter", "120363401987465231@newsletter"];
    const newsletterJid = allowed.includes(s.NEWSLETTER_JID) ? s.NEWSLETTER_JID : "120363394804979643@newsletter";
    const newsletterUrl = s.NEWSLETTER_URL || "";

    const contextInfo = {
        mentionedJid: [userJid],
        forwardingScore: 1,
        isForwarded: true,
        externalAdReply: {
            title: options.title || botName,
            body: options.body || "Powered by DEKUTCONNECT WA-Bot",
            thumbnailUrl: botPic,
            mediaType: 1,
            mediaUrl: options.mediaUrl || botPic,
            showAdAttribution: true,
            renderLargerThumbnail: false,
        },
    };

    if (newsletterJid) {
        contextInfo.businessMessageForwardInfo = {
            businessOwnerJid: newsletterJid,
        };
        contextInfo.forwardedNewsletterMessageInfo = {
            newsletterJid: newsletterJid,
            newsletterName: botName,
            serverMessageId: Math.floor(100000 + Math.random() * 900000),
        };
    }
    if (newsletterUrl || options.sourceUrl) {
        contextInfo.externalAdReply.sourceUrl = options.sourceUrl || newsletterUrl;
    }

    return { contextInfo };
};

const createContext2 = async (userJid, options = {}) => {
    const s = await getAllSettings();
    const botName       = s.BOT_NAME        || "DEKUTCONNECT WA-Bot";
    const botPic        = s.BOT_PIC         || "https://i.postimg.cc/CxN0RKcD/dekutconnectdp.jpg";
    const allowed = ["120363394804979643@newsletter", "120363421875175434@newsletter", "120363401987465231@newsletter"];
    const newsletterJid = allowed.includes(s.NEWSLETTER_JID) ? s.NEWSLETTER_JID : "120363394804979643@newsletter";

    const contextInfo = {
        mentionedJid: [userJid],
        forwardingScore: 1,
        isForwarded: true,
        externalAdReply: {
            title: options.title || botName,
            body: options.body || "Powered by DEKUTCONNECT WA-Bot",
            thumbnailUrl: botPic,
            mediaType: 1,
            showAdAttribution: true,
            renderLargerThumbnail: true,
        },
    };

    if (newsletterJid) {
        contextInfo.forwardedNewsletterMessageInfo = {
            newsletterJid: newsletterJid,
            newsletterName: botName,
            serverMessageId: Math.floor(100000 + Math.random() * 900000),
        };
    }

    return { contextInfo };
};

module.exports = {
    createContext,
    createContext2,
};
