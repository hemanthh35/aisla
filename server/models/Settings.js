// Settings model for admin-configurable application settings
import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: {
        type: String
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastModifiedAt: {
        type: Date,
        default: Date.now
    }
});

// Static method to get a setting by key
settingsSchema.statics.getSetting = async function (key, defaultValue = null) {
    const setting = await this.findOne({ key });
    return setting ? setting.value : defaultValue;
};

// Static method to set a setting
settingsSchema.statics.setSetting = async function (key, value, userId = null, description = null) {
    const update = {
        value,
        lastModifiedAt: new Date()
    };

    if (userId) update.lastModifiedBy = userId;
    if (description) update.description = description;

    return this.findOneAndUpdate(
        { key },
        update,
        { upsert: true, new: true }
    );
};

// Default AI settings
settingsSchema.statics.getAISettings = async function () {
    const defaults = {
        provider: 'ollama',  // 'ollama' or 'gemini'
        ollamaModel: 'gemma3:4b',
        ollamaUrl: 'http://localhost:11434',
        geminiModel: 'gemini-2.0-flash',
        temperature: 0.7,
        maxTokens: 1024
    };

    const settings = await this.findOne({ key: 'ai_settings' });
    return settings ? { ...defaults, ...settings.value } : defaults;
};

// Update AI settings
settingsSchema.statics.setAISettings = async function (settings, userId = null) {
    return this.setSetting('ai_settings', settings, userId, 'AI Provider Configuration');
};

export default mongoose.model('Settings', settingsSchema);
