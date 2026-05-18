// ===== 数据层 - 管理所有应用状态 =====

const AppData = {
    // 用户数据
    user: {
        coins: 0,
        level: 1,
        exp: 0,
        streakDays: 0,
        lastVisit: null
    },

    // 时间线阶段定义 - 更细粒度
    stages: [
        { id: 'baby', name: '婴幼儿', ageRange: '0-3岁', color: '#dfe6e9', group: 'childhood', groupName: '童年' },
        { id: 'preschool', name: '学龄前', ageRange: '4-6岁', color: '#b8e0d2', group: 'childhood', groupName: '童年' },
        { id: 'primary', name: '小学', ageRange: '7-12岁', color: '#6c5ce7', group: 'childhood', groupName: '童年' },
        { id: 'middle-school', name: '初中', ageRange: '13-15岁', color: '#00cec9', group: 'youth', groupName: '青少年' },
        { id: 'high-school', name: '高中', ageRange: '16-18岁', color: '#0984e3', group: 'youth', groupName: '青少年' },
        { id: 'college', name: '大学', ageRange: '19-22岁', color: '#6c5ce7', group: 'youth', groupName: '青少年' },
        { id: 'career-start', name: '职场新人', ageRange: '23-27岁', color: '#e17055', group: 'adult', groupName: '青年' },
        { id: 'career-growth', name: '事业发展', ageRange: '28-35岁', color: '#fd79a8', group: 'adult', groupName: '青年' },
        { id: 'family-build', name: '成家立业', ageRange: '30-40岁', color: '#e84393', group: 'adult', groupName: '青年' },
        { id: 'career-stable', name: '事业稳定', ageRange: '36-40岁', color: '#fdcb6e', group: 'middle', groupName: '中年' },
        { id: 'career-peak', name: '事业巅峰', ageRange: '41-45岁', color: '#f39c12', group: 'middle', groupName: '中年' },
        { id: 'mid-transition', name: '中年转型', ageRange: '46-50岁', color: '#e58e26', group: 'middle', groupName: '中年' },
        { id: 'life-balance', name: '平衡成熟', ageRange: '51-55岁', color: '#d35400', group: 'middle', groupName: '中年' },
        { id: 'pre-retire', name: '退休准备', ageRange: '56-60岁', color: '#16a085', group: 'elder', groupName: '中老年' },
        { id: 'retire-transition', name: '退休过渡', ageRange: '61-65岁', color: '#00b894', group: 'elder', groupName: '中老年' },
        { id: 'active-retire', name: '活力退休', ageRange: '66-70岁', color: '#55a3a4', group: 'senior', groupName: '老年' },
        { id: 'enjoy-life', name: '享受生活', ageRange: '71-75岁', color: '#48a999', group: 'senior', groupName: '老年' },
        { id: 'golden-years', name: '金色年华', ageRange: '76-80岁', color: '#f9ca24', group: 'senior', groupName: '老年' },
        { id: 'wise-elder', name: '智慧长者', ageRange: '81岁+', color: '#f0932b', group: 'senior', groupName: '老年' }
    ],

    // 阶段分组（用于折叠显示）
    stageGroups: [
        { id: 'childhood', name: '童年', ageRange: '0-12岁', color: '#6c5ce7', icon: '💒' },
        { id: 'youth', name: '青少年', ageRange: '13-22岁', color: '#00cec9', icon: '📖' },
        { id: 'adult', name: '青年', ageRange: '23-35岁', color: '#fd79a8', icon: '💼' },
        { id: 'middle', name: '中年', ageRange: '36-55岁', color: '#fdcb6e', icon: '⭐' },
        { id: 'elder', name: '中老年', ageRange: '56-65岁', color: '#00b894', icon: '🌅' },
        { id: 'senior', name: '老年', ageRange: '66岁+', color: '#f9ca24', icon: '🌟' }
    ],

    // 预设事件卡片
    eventCards: [
        // 学习类
        { id: 'learn-piano', name: '学习钢琴', icon: '🎹', category: 'study' },
        { id: 'learn-coding', name: '学习编程', icon: '💻', category: 'study' },
        { id: 'learn-language', name: '学习外语', icon: '🌍', category: 'study' },
        { id: 'learn-painting', name: '学习绘画', icon: '🎨', category: 'study' },
        { id: 'learn-cooking', name: '学习烹饪', icon: '👨‍🍳', category: 'study' },
        { id: 'get-degree', name: '获取学位', icon: '🎓', category: 'study' },
        { id: 'read-100-books', name: '阅读100本书', icon: '📚', category: 'study' },
        { id: 'learn-music', name: '学习音乐制作', icon: '🎵', category: 'study' },
        { id: 'learn-ai', name: '学习AI技术', icon: '🤖', category: 'study' },
        { id: 'learn-invest', name: '学习投资理财', icon: '📊', category: 'study' },

        // 工作类
        { id: 'first-job', name: '第一份工作', icon: '💼', category: 'work' },
        { id: 'start-business', name: '创业', icon: '🚀', category: 'work' },
        { id: 'get-promotion', name: '升职加薪', icon: '📈', category: 'work' },
        { id: 'freelance', name: '自由职业', icon: '🏠', category: 'work' },
        { id: 'side-project', name: '副业项目', icon: '💡', category: 'work' },
        { id: 'career-change', name: '转行', icon: '🔄', category: 'work' },
        { id: 'retire', name: '退休', icon: '🌅', category: 'work' },
        { id: 'mentor', name: '成为导师', icon: '🧑‍🏫', category: 'work' },
        { id: 'patent', name: '获得专利', icon: '📜', category: 'work' },

        // 生活类
        { id: 'travel-world', name: '环游世界', icon: '✈️', category: 'life' },
        { id: 'buy-house', name: '买房', icon: '🏡', category: 'life' },
        { id: 'get-married', name: '结婚', icon: '💒', category: 'life' },
        { id: 'have-kids', name: '养育孩子', icon: '👶', category: 'life' },
        { id: 'move-city', name: '搬到新城市', icon: '🏙️', category: 'life' },
        { id: 'volunteer', name: '志愿服务', icon: '🤝', category: 'life' },
        { id: 'adopt-pet', name: '养宠物', icon: '🐕', category: 'life' },
        { id: 'buy-car', name: '买车', icon: '🚗', category: 'life' },
        { id: 'garden', name: '打理花园', icon: '🌻', category: 'life' },

        // 娱乐类
        { id: 'learn-guitar', name: '学吉他', icon: '🎸', category: 'entertainment' },
        { id: 'gaming', name: '电竞达人', icon: '🎮', category: 'entertainment' },
        { id: 'photography', name: '摄影', icon: '📷', category: 'entertainment' },
        { id: 'write-novel', name: '写小说', icon: '✍️', category: 'entertainment' },
        { id: 'make-film', name: '拍电影', icon: '🎬', category: 'entertainment' },
        { id: 'dj', name: '学DJ', icon: '🎧', category: 'entertainment' },
        { id: 'dance', name: '学跳舞', icon: '💃', category: 'entertainment' },
        { id: 'travel-photo', name: '旅行摄影', icon: '🗺️', category: 'entertainment' },

        // 健康类
        { id: 'marathon', name: '跑马拉松', icon: '🏃', category: 'health' },
        { id: 'cycling', name: '骑行500公里', icon: '🚴', category: 'health' },
        { id: 'yoga', name: '坚持瑜伽', icon: '🧘', category: 'health' },
        { id: 'weight-goal', name: '达到目标体重', icon: '⚖️', category: 'health' },
        { id: 'swimming', name: '学游泳', icon: '🏊', category: 'health' },
        { id: 'meditation', name: '冥想习惯', icon: '🧠', category: 'health' },
        { id: 'quit-smoking', name: '戒烟', icon: '🚭', category: 'health' },
        { id: 'sleep-routine', name: '规律作息', icon: '😴', category: 'health' },
        { id: 'nutrition', name: '健康饮食', icon: '🥗', category: 'health' }
    ],

    // 成就定义
    achievements: [
        { id: 'first-goal', name: '初心者', desc: '设定第一个人生目标', icon: '🌱', reward: 10, category: '基础', condition: 'goals >= 1' },
        { id: 'planner', name: '规划师', desc: '设定10个人生目标', icon: '📋', reward: 50, category: '基础', condition: 'goals >= 10' },
        { id: 'achiever', name: '成就达人', desc: '完成5个目标', icon: '⭐', reward: 100, category: '基础', condition: 'completed >= 5' },
        { id: 'finance-master', name: '理财大师', desc: '财富属性达到80', icon: '💰', reward: 200, category: '财富', condition: 'wealth >= 80' },
        { id: 'health-guru', name: '健康达人', desc: '健康属性达到80', icon: '💪', reward: 200, category: '健康', condition: 'health >= 80' },
        { id: 'music-master', name: '音乐达人', desc: '完成3个音乐相关目标', icon: '🎵', reward: 150, category: '才艺', condition: 'music >= 3' },
        { id: 'lifelong-learner', name: '终身学习者', desc: '在每个阶段组都有学习目标', icon: '📖', reward: 300, category: '学习', condition: 'allStagesStudy' },
        { id: 'social-butterfly', name: '社交达人', desc: '社交属性达到80', icon: '🦋', reward: 200, category: '社交', condition: 'social >= 80' },
        { id: 'wise-sage', name: '智慧贤者', desc: '智慧属性达到90', icon: '🧙', reward: 250, category: '智慧', condition: 'wisdom >= 90' },
        { id: 'happy-life', name: '幸福人生', desc: '幸福属性达到90', icon: '🌈', reward: 250, category: '幸福', condition: 'happiness >= 90' },
        { id: 'streak-7', name: '坚持一周', desc: '连续7天登录', icon: '🔥', reward: 70, category: '坚持', condition: 'streak >= 7' },
        { id: 'streak-30', name: '月度坚持', desc: '连续30天登录', icon: '🏆', reward: 300, category: '坚持', condition: 'streak >= 30' },
        { id: 'all-rounder', name: '全能选手', desc: '所有属性达到60以上', icon: '🌟', reward: 500, category: '综合', condition: 'allAttrs >= 60' },
        { id: 'explorer', name: '探索者', desc: '使用所有功能模块', icon: '🗺️', reward: 80, category: '探索', condition: 'allModules' },
        { id: 'time-master', name: '时间管理大师', desc: '在时间线上安排20个事件', icon: '⏰', reward: 200, category: '规划', condition: 'timelineEvents >= 20' }
    ],

    // 随机事件库
    randomEvents: [
        { text: '🎉 你中了彩票！获得一笔意外之财。', type: 'positive', effects: { wealth: 15, happiness: 10 } },
        { text: '📚 你发现了一本改变人生的书，智慧大增。', type: 'positive', effects: { wisdom: 12, happiness: 5 } },
        { text: '🏃 你参加了马拉松并完赛，身体素质提升！', type: 'positive', effects: { health: 15, happiness: 8 } },
        { text: '👥 你结识了一位良师益友，社交圈扩大。', type: 'positive', effects: { social: 12, wisdom: 5 } },
        { text: '💼 你获得了一次重要的晋升机会！', type: 'positive', effects: { wealth: 10, happiness: 8 } },
        { text: '🎨 你的创作获得了大众认可，名声大增。', type: 'positive', effects: { happiness: 15, social: 8 } },
        { text: '🏡 你搬进了梦想中的新家。', type: 'positive', effects: { happiness: 12, wealth: -5 } },
        { text: '🌍 一次旅行让你开阔了眼界。', type: 'positive', effects: { wisdom: 8, happiness: 10, social: 5 } },
        { text: '😷 你生了一场病，需要休养一段时间。', type: 'negative', effects: { health: -15, happiness: -5 } },
        { text: '💸 一次投资失败，损失了一些积蓄。', type: 'negative', effects: { wealth: -12, happiness: -8 } },
        { text: '😔 你经历了一次失业危机。', type: 'negative', effects: { wealth: -10, happiness: -10, social: -5 } },
        { text: '💔 一段重要的关系结束了。', type: 'negative', effects: { happiness: -15, social: -8 } },
        { text: '🏚️ 房屋需要大修，花费不少。', type: 'negative', effects: { wealth: -8, happiness: -3 } },
        { text: '📉 经济不景气影响了你的收入。', type: 'negative', effects: { wealth: -8, happiness: -5 } },
        { text: '🔄 你决定转换职业方向，开始新的学习。', type: 'neutral', effects: { wisdom: 8, wealth: -3, happiness: 3 } },
        { text: '🏙️ 你搬到了一个新城市，一切重新开始。', type: 'neutral', effects: { social: -5, happiness: 3, wisdom: 5 } },
        { text: '👶 家里迎来了新成员！', type: 'neutral', effects: { happiness: 10, wealth: -5, social: 5 } },
        { text: '📱 你开始了一个副业项目。', type: 'neutral', effects: { wealth: 5, health: -3, wisdom: 5 } }
    ],

    // 用户的时间线数据（按细分阶段）
    timelineData: {},

    // 用户的目标数据
    goals: [],

    // 角色数据
    character: {
        name: '',
        avatar: '👤',
        age: 0,
        health: 50,
        wealth: 30,
        happiness: 60,
        wisdom: 40,
        social: 45
    },

    // 已解锁成就
    unlockedAchievements: [],

    // 访问过的模块
    visitedModules: [],

    // 打卡习惯
    habits: [],

    // 打卡历史 { habitId: { '2026-05-18': true } }
    checkinHistory: {},

    // 初始化时间线数据结构
    initTimelineData() {
        this.stages.forEach(stage => {
            if (!this.timelineData[stage.id]) {
                this.timelineData[stage.id] = [];
            }
        });
    },

    // 保存数据到localStorage
    save() {
        const data = {
            user: this.user,
            timelineData: this.timelineData,
            goals: this.goals,
            character: this.character,
            unlockedAchievements: this.unlockedAchievements,
            visitedModules: this.visitedModules,
            habits: this.habits,
            checkinHistory: this.checkinHistory
        };
        localStorage.setItem('8bitslife_data', JSON.stringify(data));
    },

    // 从localStorage加载数据
    load() {
        const saved = localStorage.getItem('8bitslife_data');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(this.user, data.user || {});
            if (data.timelineData) {
                Object.assign(this.timelineData, data.timelineData);
            }
            this.goals = data.goals || [];
            Object.assign(this.character, data.character || {});
            this.unlockedAchievements = data.unlockedAchievements || [];
            this.visitedModules = data.visitedModules || [];
            this.habits = data.habits || [];
            this.checkinHistory = data.checkinHistory || {};
        }
        this.initTimelineData();
        this.checkStreak();
    },

    // 检查连续登录
    checkStreak() {
        const today = new Date().toDateString();
        if (this.user.lastVisit) {
            const lastDate = new Date(this.user.lastVisit);
            const diff = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
                this.user.streakDays++;
            } else if (diff > 1) {
                this.user.streakDays = 1;
            }
        } else {
            this.user.streakDays = 1;
        }
        this.user.lastVisit = today;
        this.save();
    },

    // 添加经验值
    addExp(amount) {
        this.user.exp += amount;
        const expNeeded = this.user.level * 100;
        if (this.user.exp >= expNeeded) {
            this.user.exp -= expNeeded;
            this.user.level++;
            return true;
        }
        return false;
    },

    // 添加金币
    addCoins(amount) {
        this.user.coins += amount;
        this.save();
    },

    // 获取目标by ID
    getGoalById(goalId) {
        return this.goals.find(g => g.id === goalId);
    },

    // 更新目标
    updateGoal(goalId, updates) {
        const index = this.goals.findIndex(g => g.id === goalId);
        if (index >= 0) {
            Object.assign(this.goals[index], updates);
            this.goals[index].updatedAt = new Date().toISOString();
            this.save();
            return this.goals[index];
        }
        return null;
    },

    // 添加目标
    addGoal(goalData) {
        const goal = {
            id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            progress: 0,
            status: 'active', // active, paused, completed, abandoned
            subtasks: [],
            logs: [], // 进展日志
            ...goalData
        };
        this.goals.push(goal);
        this.save();
        return goal;
    },

    // 添加目标日志
    addGoalLog(goalId, logText) {
        const goal = this.getGoalById(goalId);
        if (goal) {
            goal.logs = goal.logs || [];
            goal.logs.push({
                id: Date.now(),
                text: logText,
                date: new Date().toISOString(),
                progress: goal.progress
            });
            this.save();
        }
    },

    // 删除目标
    deleteGoal(goalId) {
        this.goals = this.goals.filter(g => g.id !== goalId);
        this.save();
    }
};

// 初始化加载
AppData.load();
