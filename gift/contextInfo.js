const { getSetting } = require("./database/settings");

async function getContextInfo(mentionedJid = []) {
    const botName = await getSetting("BOT_NAME") || "DEKUTCONNECT WA-Bot";
    const dbJid = await getSetting("NEWSLETTER_JID");
    const allowed = ["120363394804979643@newsletter", "120363421875175434@newsletter", "120363401987465231@newsletter"];
    const channelJid = allowed.includes(dbJid) ? dbJid : "120363394804979643@newsletter";
    const info = {
        mentionedJid,
        forwardingScore: 1,
        isForwarded: true
    };
    if (channelJid) {
        info.forwardedNewsletterMessageInfo = {
            newsletterJid: channelJid,
            newsletterName: botName,
            serverMessageId: -1
        };
    }
    return info;
}

module.exports = { getContextInfo };
