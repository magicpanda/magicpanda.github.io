// ===== 成就系统模块 =====

const Achievements = {
    init() {
        this.renderAchievements();
    },

    // 渲染成就列表
    renderAchievements() {
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = '';

        AppData.achievements.forEach(achievement => {
            const isUnlocked = AppData.unlockedAchievements.includes(achievement.id);
            const progress = this.getAchievementProgress(achievement);

            const card = document.createElement('div');
            card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <span class="achievement-category">${achievement.category}</span>
                <span class="achievement-badge">${achievement.icon}</span>
                <div class="achievement-title">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
                <div class="achievement-reward">🪙 ${achievement.reward} 金币</div>
                ${!isUnlocked ? `
                    <div class="achievement-progress">
                        <div class="achievement-progress-bar">
                            <div class="achievement-progress-fill" style="width:${progress}%"></div>
                        </div>
                        <div class="achievement-progress-text">${Math.round(progress)}%</div>
                    </div>
                ` : ''}
            `;
            grid.appendChild(card);
        });
    },

    // 获取成就进度
    getAchievementProgress(achievement) {
        if (AppData.unlockedAchievements.includes(achievement.id)) return 100;

        const condition = achievement.condition;
        const char = AppData.character;
        const totalGoals = AppData.goals.length;
        const completedGoals = AppData.goals.filter(g => g.progress >= 100).length;
        const totalTimelineEvents = Object.values(AppData.timelineData).flat().length;

        // 解析条件
        if (condition.startsWith('goals >= ')) {
            const target = parseInt(condition.split('>= ')[1]);
            return Math.min(100, (totalGoals / target) * 100);
        }
        if (condition.startsWith('completed >= ')) {
            const target = parseInt(condition.split('>= ')[1]);
            return Math.min(100, (completedGoals / target) * 100);
        }
        if (condition.startsWith('health >= ')) {
            const target = parseInt(condition.split('>= ')[1]);
            return Math.min(100, (char.health / target) * 100);
        }
        if (condition.startsWith('wealth >= ')) {
            const target = parseInt(condition.split('>= ')[1]);
            return Math.min(100, (char.wealth / target) * 100);
        }
        if (condition.startsWith('happiness >= ')) {
            const target = parseInt(condition.split('>= ')[1]);
            return Math.min(100, (char.happiness / target) * 100);
        }
        if (condition.startsWith('wisdom >= ')) {
            const target = parseInt(condition.split('>= ')[1]);
            return Math.min(100, (char.wisdom / target) * 100);
        }
        if (condition.startsWith('social >= ')) {
            const target = parseInt(condition.split('>= ')[1]);
            return Math.min(100, (char.social / target) * 100);
        }
        if (condition.startsWith('streak >= ')) {
            const target = parseInt(condition.split('>= ')[1]);
            return Math.min(100, (AppData.user.streakDays / target) * 100);
        }
        if (condition.startsWith('timelineEvents >= ')) {
            const target = parseInt(condition.split('>= ')[1]);
            return Math.min(100, (totalTimelineEvents / target) * 100);
        }
        if (condition === 'allModules') {
            return Math.min(100, (AppData.visitedModules.length / 4) * 100);
        }
        if (condition === 'allStagesStudy') {
            const groupsWithStudy = new Set();
            AppData.stages.forEach(s => {
                if ((AppData.timelineData[s.id] || []).some(c => c.category === 'study')) {
                    groupsWithStudy.add(s.group);
                }
            });
            return Math.min(100, (groupsWithStudy.size / AppData.stageGroups.length) * 100);
        }
        if (condition.startsWith('music >= ')) {
            const target = parseInt(condition.split('>= ')[1]);
            const musicGoals = AppData.goals.filter(g => 
                g.name && (g.name.includes('音乐') || g.name.includes('钢琴') || g.name.includes('吉他') || g.name.includes('DJ'))
            ).filter(g => g.progress >= 100).length;
            return Math.min(100, (musicGoals / target) * 100);
        }
        if (condition.startsWith('allAttrs >= ')) {
            const target = parseInt(condition.split('>= ')[1]);
            const attrs = [char.health, char.wealth, char.happiness, char.wisdom, char.social];
            const qualifying = attrs.filter(a => a >= target).length;
            return Math.min(100, (qualifying / 5) * 100);
        }

        return 0;
    },

    // 检查成就解锁
    checkAchievements() {
        let newUnlocks = [];

        AppData.achievements.forEach(achievement => {
            if (AppData.unlockedAchievements.includes(achievement.id)) return;

            const progress = this.getAchievementProgress(achievement);
            if (progress >= 100) {
                AppData.unlockedAchievements.push(achievement.id);
                AppData.addCoins(achievement.reward);
                newUnlocks.push(achievement);
            }
        });

        if (newUnlocks.length > 0) {
            AppData.save();
            this.renderAchievements();
            
            newUnlocks.forEach(achievement => {
                App.showToast(`🏆 成就解锁: ${achievement.name}！获得 ${achievement.reward} 金币`, 'success');
            });

            App.updateUserInfo();
            App.updateStats();
        }
    }
};
