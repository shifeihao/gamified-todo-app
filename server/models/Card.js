import mongoose from 'mongoose';

// 卡片模型架构
const cardSchema = new mongoose.Schema(
    {
        // 拥有者
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        // 卡片种类：空白 or 特殊
        type: {
            type: String,
            enum: ['blank', 'special'],
            default: 'blank',
            required: true,
        },
        // 卡片标题
        title: {
            type: String,
            required: [true, '请提供卡片标题'],
            trim: true,
        },
        // 卡片描述
        description: {
            type: String,
            trim: true,
        },
        // 奖励倍率等信息
        bonus: {
            experienceMultiplier: {
                type: Number,
                default: 1.0,
            },
            goldMultiplier: {
                type: Number,
                default: 1.0,
            },
            specialEffect: {
                type: String,
                default: '',
            },
        },
        // 本字段表示这张卡片只能用来创建哪种持续时长的任务
        taskDuration: {
            type: String,
            enum: ['短期', '长期'],
            required: true,
        },
        // 是否可重复使用
        reusable: {
            type: Boolean,
            default: false,
        },
        // 发放时间
        issuedAt: {
            type: Date,
            default: Date.now,
        },
        // 过期时间（可选）
        expiresAt: {
            type: Date,
        },
        // 标记是否已使用
        used: {
            type: Boolean,
            default: false,
        },
        // 周期卡片的冷却截止
        cooldownUntil: {
            type: Date,
        },
    },
    {
        timestamps: true, // 自动添加 createdAt 和 updatedAt
    }
);

// 索引以提升查询效率
cardSchema.index({ user: 1, type: 1 });
cardSchema.index({ user: 1, used: 1 });
cardSchema.index({ user: 1, taskDuration: 1 });

const Card = mongoose.model('Card', cardSchema);

export default Card;
