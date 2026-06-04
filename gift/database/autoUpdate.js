const { DATABASE } = require('./database');
const { DataTypes, QueryTypes } = require('sequelize');

const UpdateDB = DATABASE.define('UpdateInfo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false,
        defaultValue: 1,
    },
    commitHash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    syncDate: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'update_info',
    timestamps: false,
    hooks: {
        beforeCreate: (record) => { record.id = 1; },
        beforeBulkCreate: (records) => {
            records.forEach(record => { record.id = 1; });
        },
    },
});

/** Auto-migrate: add syncDate column if it doesn't exist yet */
async function migrateSyncDate() {
    try {
        const qi = DATABASE.getQueryInterface();
        const tableDesc = await qi.describeTable('update_info');
        if (!tableDesc.syncDate) {
            await qi.addColumn('update_info', 'syncDate', {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: null,
            });
        }
    } catch (_) {
        // table may not exist yet — sync() below will create it
    }
}

async function initializeUpdateDB() {
    await migrateSyncDate();
    await UpdateDB.sync();
    const [record] = await UpdateDB.findOrCreate({
        where: { id: 1 },
        defaults: { commitHash: 'unknown', syncDate: null },
    });
    return record;
}

/**
 * @param {string} hash - The latest commit SHA
 * @param {string} [date] - ISO date string from the commit author date
 */
async function setCommitHash(hash, date) {
    await initializeUpdateDB();
    const record = await UpdateDB.findByPk(1);
    record.commitHash = hash;
    if (date) {
        record.syncDate = new Date(date).toLocaleString();
    }
    await record.save();
}

async function getCommitHash() {
    await initializeUpdateDB();
    const record = await UpdateDB.findByPk(1);
    return record ? record.commitHash : 'unknown';
}

async function getSyncDate() {
    await initializeUpdateDB();
    const record = await UpdateDB.findByPk(1);
    return record && record.syncDate ? record.syncDate : 'Never synced';
}

module.exports = {
    UpdateDB,
    setCommitHash,
    getCommitHash,
    getSyncDate,
};
