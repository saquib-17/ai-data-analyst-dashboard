const crypto = require('crypto');
const { getDb } = require('../database/db');

function formatConversationRecord(row) {
    if (!row) return null;
    return {
        id: row.id,
        userId: row.user_id,
        datasetId: row.dataset_id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function formatMessageRecord(row) {
    if (!row) return null;
    return {
        id: row.id,
        conversationId: row.conversation_id,
        role: row.role,
        content: row.content,
        operation: row.operation_json ? JSON.parse(row.operation_json) : null,
        chartConfig: row.chart_config_json ? JSON.parse(row.chart_config_json) : null,
        transparency: row.transparency_json ? JSON.parse(row.transparency_json) : null,
        suggestions: row.suggestions_json ? JSON.parse(row.suggestions_json) : [],
        sequenceNumber: row.sequence_number,
        createdAt: row.created_at
    };
}

class ConversationRepository {
    constructor(db = null) {
        this._customDb = db;
    }

    get db() {
        return this._customDb || getDb();
    }

    createConversation({ id = null, title, datasetId = null, userId = 'local-user' }) {
        const conversationId = id || crypto.randomUUID();
        const now = new Date().toISOString();
        const cleanTitle = (title && typeof title === 'string' && title.trim())
            ? title.trim().slice(0, 100)
            : 'New Data Analysis';

        const stmt = this.db.prepare(`
            INSERT INTO conversations (id, user_id, dataset_id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(conversationId, userId, datasetId, cleanTitle, now, now);
        return this.getConversationById(conversationId, userId);
    }

    getConversationById(conversationId, userId = null) {
        let query = 'SELECT * FROM conversations WHERE id = ?';
        const params = [conversationId];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        const row = this.db.prepare(query).get(...params);
        if (!row) return null;

        const conv = formatConversationRecord(row);
        conv.messages = this.getMessages(conversationId);
        return conv;
    }

    listConversations(userId = null, datasetId = null) {
        let query = 'SELECT c.*, COUNT(m.id) as message_count FROM conversations c LEFT JOIN messages m ON c.id = m.conversation_id';
        const conditions = [];
        const params = [];

        if (userId) {
            conditions.push('c.user_id = ?');
            params.push(userId);
        }

        if (datasetId) {
            conditions.push('c.dataset_id = ?');
            params.push(datasetId);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY c.id ORDER BY c.updated_at DESC';

        const rows = this.db.prepare(query).all(...params);
        return rows.map(r => ({
            ...formatConversationRecord(r),
            messageCount: r.message_count || 0
        }));
    }

    updateConversationTitle(conversationId, title, userId = null) {
        let query = 'UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?';
        const params = [title.trim().slice(0, 100), new Date().toISOString(), conversationId];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        const info = this.db.prepare(query).run(...params);
        return info.changes > 0 ? this.getConversationById(conversationId, userId) : null;
    }

    updateConversationDataset(conversationId, datasetId, userId = null) {
        let query = 'UPDATE conversations SET dataset_id = ?, updated_at = ? WHERE id = ?';
        const params = [datasetId, new Date().toISOString(), conversationId];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        const info = this.db.prepare(query).run(...params);
        return info.changes > 0 ? this.getConversationById(conversationId, userId) : null;
    }

    deleteConversation(conversationId, userId = null) {
        let query = 'DELETE FROM conversations WHERE id = ?';
        const params = [conversationId];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        const info = this.db.prepare(query).run(...params);
        return info.changes > 0;
    }

    getNextSequenceNumber(conversationId) {
        const row = this.db.prepare(
            'SELECT COALESCE(MAX(sequence_number), 0) + 1 AS nextSeq FROM messages WHERE conversation_id = ?'
        ).get(conversationId);
        return row ? row.nextSeq : 1;
    }

    appendMessage({
        id = null,
        conversationId,
        role,
        content,
        operation = null,
        chartConfig = null,
        transparency = null,
        suggestions = null,
        createdAt = null
    }) {
        const messageId = id || crypto.randomUUID();
        const now = createdAt || new Date().toISOString();
        const seq = this.getNextSequenceNumber(conversationId);

        const stmt = this.db.prepare(`
            INSERT INTO messages (
                id, conversation_id, role, content, operation_json,
                chart_config_json, transparency_json, suggestions_json,
                sequence_number, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            messageId,
            conversationId,
            role,
            content || '',
            operation ? JSON.stringify(operation) : null,
            chartConfig ? JSON.stringify(chartConfig) : null,
            transparency ? JSON.stringify(transparency) : null,
            suggestions ? JSON.stringify(suggestions) : null,
            seq,
            now
        );

        // Update conversation's updated_at timestamp
        this.db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId);

        return {
            id: messageId,
            conversationId,
            role,
            content,
            operation,
            chartConfig,
            transparency,
            suggestions,
            sequenceNumber: seq,
            createdAt: now
        };
    }

    getMessages(conversationId) {
        const rows = this.db.prepare(
            'SELECT * FROM messages WHERE conversation_id = ? ORDER BY sequence_number ASC'
        ).all(conversationId);
        return rows.map(formatMessageRecord);
    }
}

module.exports = {
    ConversationRepository,
    conversationRepository: new ConversationRepository()
};

