// ===== 人生模拟游戏模块 =====

const Game = {
    init() {
        this.updateDisplay();
        this.bindEvents();
    },

    // 更新显示
    updateDisplay() {
        const char = AppData.character;

        // 更新角色信息
        document.getElementById('character-name').textContent = char.name || '未命名角色';
        document.getElementById('character-age').textContent = char.age;
        document.querySelector('#character-avatar .avatar-placeholder').textContent = char.avatar;

        // 更新属性条
        this.updateAttribute('health', char.health);
        this.updateAttribute('wealth', char.wealth);
        this.updateAttribute('happiness', char.happiness);
        this.updateAttribute('wisdom', char.wisdom);
        this.updateAttribute('social', char.social);
    },

    // 更新单个属性
    updateAttribute(attr, value) {
        value = Math.max(0, Math.min(100, value));
        const bar = document.getElementById(`attr-${attr}`);
        const val = document.getElementById(`val-${attr}`);
        if (bar) bar.style.width = value + '%';
        if (val) val.textContent = value;
    },

    // 创建角色
    createCharacter(name, avatar, age) {
        AppData.character = {
            name,
            avatar,
            age: parseInt(age),
            health: 50 + Math.floor(Math.random() * 20),
            wealth: 20 + Math.floor(Math.random() * 20),
            happiness: 50 + Math.floor(Math.random() * 20),
            wisdom: 30 + Math.floor(Math.random() * 20),
            social: 40 + Math.floor(Math.random() * 20)
        };
        AppData.save();
        this.updateDisplay();
        this.addEventLog(`🎉 角色 "${name}" 已创建！开始你的人生旅程吧。`, 'positive');
        App.showToast('角色创建成功！', 'success');
    },

    // 推进时间（增加年龄）
    advanceTime() {
        if (!AppData.character.name) {
            App.showToast('请先创建角色！', 'warning');
            return;
        }

        AppData.character.age += 1;
        
        // 年龄增长的自然影响
        const ageEffects = this.getAgeEffects(AppData.character.age);
        this.applyEffects(ageEffects);

        // 根据时间线规划给予奖励
        this.checkTimelineProgress();

        // 30%概率触发随机事件
        if (Math.random() < 0.3) {
            this.triggerRandomEvent();
        }

        this.addEventLog(`📅 时间推进到 ${AppData.character.age} 岁。${ageEffects.message}`, 'neutral');
        
        AppData.save();
        this.updateDisplay();
        App.updateUserInfo();
        Achievements.checkAchievements();
    },

    // 获取年龄相关效果
    getAgeEffects(age) {
        if (age < 18) {
            return { 
                effects: { wisdom: 3, health: 1, social: 2 },
                message: '年轻就是资本，各方面都在成长。'
            };
        } else if (age < 30) {
            return {
                effects: { wisdom: 2, wealth: 3, social: 1 },
                message: '事业起步期，财富和经验在积累。'
            };
        } else if (age < 50) {
            return {
                effects: { wisdom: 2, wealth: 2, health: -1 },
                message: '人生黄金期，但要注意健康。'
            };
        } else if (age < 65) {
            return {
                effects: { wisdom: 3, health: -2, happiness: 1 },
                message: '阅历丰富，但身体需要更多关注。'
            };
        } else {
            return {
                effects: { wisdom: 2, health: -3, happiness: 2 },
                message: '享受人生的智慧与宁静。'
            };
        }
    },

    // 应用效果
    applyEffects(data) {
        const effects = data.effects || data;
        Object.keys(effects).forEach(attr => {
            if (AppData.character[attr] !== undefined) {
                AppData.character[attr] = Math.max(0, Math.min(100, 
                    AppData.character[attr] + effects[attr]
                ));
            }
        });
    },

    // 检查时间线进度
    checkTimelineProgress() {
        const age = AppData.character.age;
        let currentStageIds = [];
        
        // 根据年龄找到对应的细分阶段
        if (age <= 3) currentStageIds = ['baby'];
        else if (age <= 6) currentStageIds = ['preschool'];
        else if (age <= 12) currentStageIds = ['primary'];
        else if (age <= 15) currentStageIds = ['middle-school'];
        else if (age <= 18) currentStageIds = ['high-school'];
        else if (age <= 22) currentStageIds = ['college'];
        else if (age <= 27) currentStageIds = ['career-start'];
        else if (age <= 35) currentStageIds = ['career-growth', 'family-build'];
        else if (age <= 40) currentStageIds = ['career-stable', 'family-build'];
        else if (age <= 45) currentStageIds = ['career-peak'];
        else if (age <= 50) currentStageIds = ['mid-transition'];
        else if (age <= 55) currentStageIds = ['life-balance'];
        else if (age <= 60) currentStageIds = ['pre-retire'];
        else if (age <= 65) currentStageIds = ['retire-transition'];
        else if (age <= 70) currentStageIds = ['active-retire'];
        else if (age <= 75) currentStageIds = ['enjoy-life'];
        else if (age <= 80) currentStageIds = ['golden-years'];
        else currentStageIds = ['wise-elder'];

        const hasPlans = currentStageIds.some(id => 
            (AppData.timelineData[id] || []).length > 0
        );
        
        if (hasPlans) {
            AppData.character.happiness = Math.min(100, AppData.character.happiness + 2);
            AppData.character.wisdom = Math.min(100, AppData.character.wisdom + 1);
        }
    },

    // 触发随机事件
    triggerRandomEvent() {
        const events = AppData.randomEvents;
        const event = events[Math.floor(Math.random() * events.length)];

        this.applyEffects(event);
        this.addEventLog(event.text, event.type);

        AppData.save();
        this.updateDisplay();

        // 奖励
        AppData.addExp(15);
        AppData.addCoins(event.type === 'positive' ? 10 : 3);
        App.updateUserInfo();

        return event;
    },

    // 添加事件日志
    addEventLog(text, type = 'neutral') {
        const log = document.getElementById('event-log');
        const item = document.createElement('div');
        item.className = `event-item ${type}`;
        item.innerHTML = `
            <div class="event-age">${AppData.character.age}岁</div>
            <div>${text}</div>
        `;
        log.insertBefore(item, log.firstChild);

        // 限制日志数量
        while (log.children.length > 50) {
            log.removeChild(log.lastChild);
        }
    },

    // 绑定事件
    bindEvents() {
        // 创建角色按钮
        document.getElementById('btn-create-character').addEventListener('click', () => {
            document.getElementById('character-modal').classList.add('active');
        });

        // 角色弹窗
        document.getElementById('btn-confirm-char').addEventListener('click', () => {
            const name = document.getElementById('char-name-input').value.trim();
            const avatar = document.querySelector('.avatar-option.selected').dataset.avatar;
            const age = document.getElementById('char-age-input').value;

            if (!name) {
                App.showToast('请输入角色名称', 'warning');
                return;
            }

            this.createCharacter(name, avatar, age);
            document.getElementById('character-modal').classList.remove('active');
        });

        document.getElementById('btn-cancel-char').addEventListener('click', () => {
            document.getElementById('character-modal').classList.remove('active');
        });

        document.getElementById('char-modal-close').addEventListener('click', () => {
            document.getElementById('character-modal').classList.remove('active');
        });

        // 角色形象选择
        document.querySelectorAll('.avatar-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        // 推进时间
        document.getElementById('btn-advance-time').addEventListener('click', () => {
            this.advanceTime();
        });

        // 随机事件
        document.getElementById('btn-random-event').addEventListener('click', () => {
            if (!AppData.character.name) {
                App.showToast('请先创建角色！', 'warning');
                return;
            }
            this.triggerRandomEvent();
        });
    }
};
