const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'gift/session', 'store.json');

function safeStringify(obj) {
    return JSON.stringify(obj, (_, v) => {
        if (v instanceof Uint8Array || Buffer.isBuffer(v)) {
            return { __type: 'Buffer', data: Buffer.from(v).toString('base64') };
        }
        return v;
    });
}

function safeParse(str) {
    return JSON.parse(str, (_, v) => {
        if (v && typeof v === 'object' && v.__type === 'Buffer' && v.data) {
            return Buffer.from(v.data, 'base64');
        }
        return v;
    });
}

let _store = { msg_store: {}, antidelete_store: {} };
try {
    if (fs.existsSync(DB_PATH)) {
        _store = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        if (!_store.msg_store) _store.msg_store = {};
        if (!_store.antidelete_store) _store.antidelete_store = {};
    }
} catch (e) {
    _store = { msg_store: {}, antidelete_store: {} };
}

function saveStore() {
    try {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        fs.writeFileSync(DB_PATH, JSON.stringify(_store, null, 2), 'utf8');
    } catch (e) {}
}

function saveMsg(jid, message) {
    try {
        if (!_store.msg_store[jid]) _store.msg_store[jid] = {};
        _store.msg_store[jid][message.key.id] = {
            data: safeStringify(message),
            ts: Math.floor(Date.now() / 1000)
        };
        
        // Trim to 200
        const keys = Object.keys(_store.msg_store[jid]);
        if (keys.length > 200) {
            const sorted = keys.map(k => ({ k, ts: _store.msg_store[jid][k].ts }))
                              .sort((a, b) => b.ts - a.ts);
            const keep = sorted.slice(0, 200).map(x => x.k);
            const newJidStore = {};
            keep.forEach(k => {
                newJidStore[k] = _store.msg_store[jid][k];
            });
            _store.msg_store[jid] = newJidStore;
        }
        saveStore();
    } catch (e) {
        console.error('[msgStore] save:', e.message);
    }
}

function loadMsg(jid, id) {
    try {
        const row = _store.msg_store[jid] && _store.msg_store[jid][id];
        return row ? safeParse(row.data) : null;
    } catch (e) {
        return null;
    }
}

function saveAntiDelete(jid, message) {
    try {
        if (!_store.antidelete_store[jid]) _store.antidelete_store[jid] = {};
        _store.antidelete_store[jid][message.key.id] = {
            sender: message.originalSender || null,
            push_name: message.originalPushName || null,
            data: safeStringify(message),
            ts: Math.floor(Date.now() / 1000)
        };

        // Trim to 100
        const keys = Object.keys(_store.antidelete_store[jid]);
        if (keys.length > 100) {
            const sorted = keys.map(k => ({ k, ts: _store.antidelete_store[jid][k].ts }))
                              .sort((a, b) => b.ts - a.ts);
            const keep = sorted.slice(0, 100).map(x => x.k);
            const newJidStore = {};
            keep.forEach(k => {
                newJidStore[k] = _store.antidelete_store[jid][k];
            });
            _store.antidelete_store[jid] = newJidStore;
        }
        saveStore();
    } catch (e) {
        console.error('[antiDeleteStore] save:', e.message);
    }
}

function findAntiDelete(jid, id) {
    try {
        const row = _store.antidelete_store[jid] && _store.antidelete_store[jid][id];
        return row ? safeParse(row.data) : null;
    } catch (e) {
        return null;
    }
}

function removeAntiDelete(jid, id) {
    try {
        if (_store.antidelete_store[jid]) {
            delete _store.antidelete_store[jid][id];
            saveStore();
        }
    } catch (e) {}
}

function startCleanup() {
    setInterval(() => {
        try {
            const now = Math.floor(Date.now() / 1000);
            
            // Clean older than 24h antidelete
            for (const jid in _store.antidelete_store) {
                for (const id in _store.antidelete_store[jid]) {
                    if (_store.antidelete_store[jid][id].ts < now - 86400) {
                        delete _store.antidelete_store[jid][id];
                    }
                }
            }

            // Clean older than 7d msg_store
            for (const jid in _store.msg_store) {
                for (const id in _store.msg_store[jid]) {
                    if (_store.msg_store[jid][id].ts < now - 604800) {
                        delete _store.msg_store[jid][id];
                    }
                }
            }
            saveStore();
        } catch (e) {}
    }, 300000);
}

class SQLiteStore {
    constructor() {
    }

    loadMessage(jid, id) {
        return loadMsg(jid, id);
    }

    saveMessage(jid, message) {
        saveMsg(jid, message);
    }

    bind(ev) {
        this._handler = ({ messages }) => {
            setImmediate(() => {
                for (const msg of messages) {
                    if (msg.key?.remoteJid && msg.key?.id) {
                        this.saveMessage(msg.key.remoteJid, msg);
                    }
                }
            });
        };
        ev.on('messages.upsert', this._handler);
    }

    destroy() {
    }
}

module.exports = {
    saveMsg,
    loadMsg,
    saveAntiDelete,
    findAntiDelete,
    removeAntiDelete,
    startCleanup,
    SQLiteStore,
};
