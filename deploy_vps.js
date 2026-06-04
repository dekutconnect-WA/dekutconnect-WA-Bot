const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: 'panel.bwmxmd.co.ke',
    port: 2022,
    username: 'wwin.150c4c42',
    password: '0712345678@Aa',
    readyTimeout: 45000
};

const excludeFromDelete = [
    'node_modules',
    '.npm',
    '.cache',
    'gifted-baileys-main',
    'dekutconnect',
    'Na-api-main',
    'session'
];

const filesToUpload = [
    'index.js',
    'package.json',
    'config.js',
    '.env',
    '.gitignore'
];

const dirsToUpload = [
    'gift',
    'gifted-session-main',
    'gifted-baileys-main'
];

function isDirLocal(p) {
    try {
        return fs.statSync(p).isDirectory();
    } catch (_) {
        return false;
    }
}

async function deleteRemoteDirRecursive(sftp, remotePath) {
    return new Promise((resolve, reject) => {
        sftp.readdir(remotePath, async (err, list) => {
            if (err) {
                return resolve();
            }
            try {
                for (const item of list) {
                    const itemPath = remotePath + '/' + item.filename;
                    const isDir = item.attrs.isDirectory();
                    if (isDir) {
                        await deleteRemoteDirRecursive(sftp, itemPath);
                    } else {
                        await new Promise((res, rej) => {
                            sftp.unlink(itemPath, (err) => {
                                if (err) rej(err);
                                else res();
                            });
                        });
                    }
                }
                sftp.rmdir(remotePath, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function ensureRemoteDir(sftp, remotePath) {
    return new Promise((resolve) => {
        sftp.mkdir(remotePath, () => {
            resolve();
        });
    });
}

async function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function uploadDirRecursive(sftp, localPath, remotePath) {
    await ensureRemoteDir(sftp, remotePath);
    const items = fs.readdirSync(localPath);
    for (const item of items) {
        // Skip node_modules, .git, and session directories (session, session_BOT_UID) but NOT files like sessionStore.js
        const localItemFullPath = path.join(localPath, item);
        const isItemDir = isDirLocal(localItemFullPath);
        if (item === 'node_modules' || item === '.git') continue;
        if (isItemDir && (item === 'session' || item.startsWith('session_'))) continue;
        const localItemPath = path.join(localPath, item);
        const remoteItemPath = remotePath + '/' + item;
        if (isDirLocal(localItemPath)) {
            await uploadDirRecursive(sftp, localItemPath, remoteItemPath);
        } else {
            await uploadFile(sftp, localItemPath, remoteItemPath);
        }
    }
}

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ SFTP Connected! Beginning deployment operations...');
    
    conn.sftp((err, sftp) => {
        if (err) {
            console.error('❌ SFTP Init Error:', err.message);
            conn.end();
            return;
        }

        console.log('🧹 Scanning remote directory to purge old files...');
        sftp.readdir('.', async (err, list) => {
            if (err) {
                console.error('❌ Remote Scan Error:', err.message);
                conn.end();
                return;
            }

            const itemsToDelete = list.filter(item => !excludeFromDelete.includes(item.filename) && item.filename !== '.' && item.filename !== '..');
            
            console.log(`🧹 Found ${itemsToDelete.length} items to delete. Excluded: ${excludeFromDelete.join(', ')}`);

            for (const item of itemsToDelete) {
                const isDir = item.attrs.isDirectory();
                const name = item.filename;
                try {
                    if (isDir) {
                        console.log(`🗑️ Deleting remote folder: ${name}...`);
                        await deleteRemoteDirRecursive(sftp, name);
                    } else {
                        console.log(`🗑️ Deleting remote file: ${name}...`);
                        await new Promise((res, rej) => {
                            sftp.unlink(name, (err) => {
                                if (err) rej(err);
                                else res();
                            });
                        });
                    }
                } catch (delErr) {
                    console.warn(`⚠️ Failed to delete ${name}: ${delErr.message}`);
                }
            }

            console.log('🚀 Starting uploads...');
            for (const file of filesToUpload) {
                try {
                    console.log(`📤 Uploading root file: ${file}...`);
                    await uploadFile(sftp, file, file);
                } catch (upErr) {
                    console.error(`❌ Failed to upload file ${file}: ${upErr.message}`);
                }
            }

            for (const dir of dirsToUpload) {
                try {
                    console.log(`📤 Uploading directory: ${dir}...`);
                    await uploadDirRecursive(sftp, dir, dir);
                } catch (upErr) {
                    console.error(`❌ Failed to upload directory ${dir}: ${upErr.message}`);
                }
            }

            console.log('🎉 Deployment operations completed successfully!');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('❌ SSH Connection Error:', err.message);
});

conn.connect(config);