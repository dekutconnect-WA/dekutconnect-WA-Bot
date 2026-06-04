const { DATABASE } = require("./database");
const { DataTypes } = require("sequelize");
const path = require("path");
const config = require("../../config");

const packageJson = require("../../package.json");

const SettingsDB = DATABASE.define(
    "BotSettings",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "bot_settings",
        timestamps: true,
    },
);

const DEFAULT_SETTINGS = {
    PREFIX: ".",
    OWNER_NAME: "ceo.eduniapps.com",
    OWNER_NUMBER: "254769486775",
    BOT_NAME: "DEKUTCONNECT WA-Bot",
    FOOTER: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ DEKUTCONNECT WA-Bot",
    CAPTION: "©𝟐𝟎𝟐6 DEKUTCONNECT WA-Bot V1",
    BOT_PIC: "https://i.postimg.cc/CxN0RKcD/dekutconnectdp.jpg",
    VERSION: packageJson.version || "1.0.0",
    MODE: config.MODE || "private",
    WARN_COUNT: "3",
    TIME_ZONE: config.TIME_ZONE || "Africa/Nairobi",
    DM_PRESENCE: "offline",
    GC_PRESENCE: "offline",
    CHATBOT: "false",
    CHATBOT_MODE: "inbox",
    STARTING_MESSAGE: "true",
    ANTIDELETE: "indm",
    ANTI_EDIT: "indm",
    ANTICALL: "false",
    ANTICALL_MSG: "*_📞 Auto Call Reject Mode Active. 📵 No Calls Allowed!_*",
    AUTO_LIKE_STATUS: config.AUTO_LIKE_STATUS || "false",
    AUTO_READ_STATUS: config.AUTO_READ_STATUS || "false",
    STATUS_LIKE_EMOJIS: "💛,❤️,💜,🤍,💙",
    AUTO_REPLY_STATUS: "false",
    STATUS_REPLY_TEXT: "*ʏᴏᴜʀ sᴛᴀᴛᴜs ᴠɪᴇᴡᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ,*",
    AUTO_REACT: "off",
    AUTO_REPLY: "false",
    AUTO_READ_MESSAGES: "off",
    AUTO_BIO: "false",
    AUTO_BLOCK: "",
    YT: "rizzrok.com/download",
    NEWSLETTER_JID: "",
    GC_JID: "KqVMAYzgQSXAKF4kNuKfWR",
    NEWSLETTER_URL: "https://www.whatsapp.com/channel/0029VbAb8L46WaKx34k8vU0S",
    BOT_REPO: "dekutconnect/DEKUTCONNECT-WA-Bot",
    PACK_NAME: "DEKUTCONNECT",
    PACK_AUTHOR: "ceo.eduniapps.com",
    SUDO_NUMBERS: "",
    PM_PERMIT: "false",
    PM_PERMIT_MSG: "*_⚠️ PM Permit Active. 📵 No Direct Messages!_*",
    ANTIVIEWONCE: "indm",
};

let initialized = false;
let _settingsCache = null;

const GROUP_ONLY_SETTINGS = [
    "WELCOME_MESSAGE",
    "GOODBYE_MESSAGE",
    "GROUP_EVENTS",
    "ANTILINK",
];

async function _loadCache() {
    const records = await SettingsDB.findAll();
    _settingsCache = {};
    for (const record of records) {
        _settingsCache[record.key] = record.value;
    }
}

async function initializeSettings() {
    if (initialized) return;

    await SettingsDB.sync();

    await SettingsDB.destroy({
        where: { key: GROUP_ONLY_SETTINGS },
    });

    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
        const [record, created] = await SettingsDB.findOrCreate({
            where: { key },
            defaults: { key, value: defaultValue },
        });
        if (!created && (key === 'NEWSLETTER_JID' || key === 'NEWSLETTER_URL')) {
            if (record.value && (record.value.includes('120363394804979643') || record.value.includes('120363421875175434') || record.value.includes('120363401987465231') || record.value.includes('0029VbAb8L46WaKx34k8vU0S'))) {
                record.value = defaultValue;
                await record.save();
            }
        }
    }

    initialized = true;
    console.log("Bot Settings Initialized");
    await _loadCache();
}

async function getSetting(key) {
    if (!initialized) await initializeSettings();
    if (!_settingsCache) await _loadCache();

    if (_settingsCache && key in _settingsCache) {
        return _settingsCache[key];
    }

    return DEFAULT_SETTINGS[key] || null;
}

async function setSetting(key, value) {
    if (!initialized) await initializeSettings();

    const [record, created] = await SettingsDB.findOrCreate({
        where: { key },
        defaults: { key, value },
    });

    if (!created) {
        record.value = value;
        await record.save();
    }

    if (!_settingsCache) _settingsCache = {};
    _settingsCache[key] = value;

    return true;
}

async function getAllSettings() {
    if (!initialized) await initializeSettings();
    if (!_settingsCache) await _loadCache();

    return { ..._settingsCache };
}

async function resetSetting(key) {
    if (!initialized) await initializeSettings();

    const defaultValue = DEFAULT_SETTINGS[key];
    if (defaultValue !== undefined) {
        await setSetting(key, defaultValue);
        return defaultValue;
    }
    return null;
}

async function resetAllSettings() {
    if (!initialized) await initializeSettings();

    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
        await setSetting(key, defaultValue);
    }
    return true;
}

module.exports = {
    SettingsDB,
    DEFAULT_SETTINGS,
    initializeSettings,
    getSetting,
    setSetting,
    getAllSettings,
    resetSetting,
    resetAllSettings,
};
