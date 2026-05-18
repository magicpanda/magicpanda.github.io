// ===== 打卡模块 - 日积月累，小步前进 =====

const Checkin = {
    selectedHabitId: null,

    init() {
        this.migrateData();
        this.renderCheckinPage();
        this.bindEvents();
    },

    // 数据迁移（确保habits字段存在）
    migrateData() {
        if (!AppData.habits) {
            AppData.habits = [];
        }
        if (!AppData.checkinHistory) {
            AppData.checkinHistory = {};
        }
    },

    // 保存打卡数据
    saveData() {
        AppData.save();
    },

    // 获取今天的日期字符串
    getToday() {
        return new Date().toISOString().split('T')[0];
    },

    // 获取本周日期
    getWeekDates() {
        const today = new Date();
        const dayOfWeek = today.getDay() || 7; // 周日=7
        const monday = new Date(today);
        monday.setDate(today.getDate() - dayOfWeek + 1);
        
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    },

    // 计算习惯连续打卡天数
    getHabitStreak(habitId) {
        const history = AppData.checkinHistory[habitId] || {};
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            if (history[dateStr]) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    },

    // 计算习惯总打卡次数
    getHabitTotal(habitId) {
        const history = AppData.checkinHistory[habitId] || {};
        return Object.keys(history).filter(k => history[k]).length;
    },

    // 计算本周完成率
    getWeekCompletion(habitId) {
        const weekDates = this.getWeekDates();
        const history = AppData.checkinHistory[habitId] || {};
        const today = this.getToday();
        
        let daysToCheck = 0;
        let daysCompleted = 0;
        
        weekDates.forEach(date => {
            if (date <= today) {
                daysToCheck++;
                if (history[date]) daysCompleted++;
            }
        });
        
        return daysToCheck > 0 ? Math.round((daysCompleted / daysToCheck) * 100) : 0;
    },

    // 今天是否已打卡
    isCheckedToday(habitId) {
        const history = AppData.checkinHistory[habitId] || {};
        return !!history[this.getToday()];
    },

    // 执行打卡
    doCheckin(habitId) {
        const today = this.getToday();
        if (!AppData.checkinHistory[habitId]) {
            AppData.checkinHistory[habitId] = {};
        }
        
        if (AppData.checkinHistory[habitId][today]) {
            // 取消打卡
            delete AppData.checkinHistory[habitId][today];
            this.saveData();
            App.showToast('已取消今日打卡', 'info');
        } else {
            // 打卡
            AppData.checkinHistory[habitId][today] = true;
            this.saveData();
            
            const streak = this.getHabitStreak(habitId);
            const habit = AppData.habits.find(h => h.id === habitId);
            
            // 奖励
            let coins = 2;
            let exp = 5;
            if (streak >= 7) { coins = 5; exp = 10; }
            if (streak >= 30) { coins = 10; exp = 20; }
            
            AppData.addCoins(coins);
            const leveledUp = AppData.addExp(exp);
            App.updateUserInfo();
            
            if (streak === 7) {
                App.showMilestone('🔥', '连续7天！', '坚持一周了，好习惯正在养成', 50);
                AppData.addCoins(50);
            } else if (streak === 30) {
                App.showMilestone('🏆', '连续30天！', '一个月的坚持，你已经超越了90%的人', 200);
                AppData.addCoins(200);
            } else if (streak === 100) {
                App.showMilestone('👑', '连续100天！', '传奇成就！这个习惯已经成为你的一部分', 500);
                AppData.addCoins(500);
            } else {
                App.showToast(`✅ 打卡成功！连续${streak}天`, 'success');
            }
            
            if (leveledUp) {
                App.showToast(`🎉 升级了！Lv.${AppData.user.level}`, 'success');
            }
            
            Achievements.checkAchievements();
        }
        
        this.renderCheckinPage();
        App.renderMotivationBanner();
        App.renderFamilyLeaderboard();
    },

    // 添加习惯
    addHabit(data) {
        const habit = {
            id: 'habit_' + Date.now(),
            name: data.name,
            icon: data.icon || '⭐',
            frequency: data.frequency || 'daily', // daily, weekday, custom
            targetPerDay: data.targetPerDay || '完成1次',
            category: data.category || 'life',
            createdAt: new Date().toISOString(),
            linkedGoalId: data.linkedGoalId || null, // 关联的目标
            reminder: data.reminder || ''
        };
        AppData.habits.push(habit);
        this.saveData();
        return habit;
    },

    // 删除习惯
    deleteHabit(habitId) {
        AppData.habits = AppData.habits.filter(h => h.id !== habitId);
        delete AppData.checkinHistory[habitId];
        this.saveData();
    },

    // 渲染打卡页面
    renderCheckinPage() {
        const container = document.getElementById('checkin-content');
        if (!container) return;

        const today = this.getToday();
        const todayChecked = AppData.habits.filter(h => this.isCheckedToday(h.id)).length;
        const totalHabits = AppData.habits.length;
        const overallStreak = AppData.user.streakDays || 0;

        // 鼓励语
        const encouragements = [
            { emoji: '🌱', text: '每一天的坚持，都是未来的你在感谢现在的你' },
            { emoji: '🐢', text: '不必跑得快，重要的是不停下来' },
            { emoji: '💧', text: '水滴石穿，日积月累的力量超乎想象' },
            { emoji: '🌟', text: '今天的一小步，是人生的一大步' },
            { emoji: '🎯', text: '把大目标拆成小习惯，每天进步一点点' },
            { emoji: '🔥', text: '坚持的秘诀：不追求完美，只追求持续' },
            { emoji: '🌈', text: '即使只做5分钟，也比0分钟强100倍' },
            { emoji: '⛰️', text: '登山不在于速度，在于每一步都在向上' }
        ];
        const todayEncouragement = encouragements[new Date().getDate() % encouragements.length];

        container.innerHTML = `
            <!-- 今日概览 -->
            <div class="checkin-today">
                <div class="checkin-today-header">
                    <span class="checkin-date">${this.formatDate(today)}</span>
                    <span class="checkin-streak">🔥 连续${overallStreak}天</span>
                </div>
                <div class="checkin-summary">
                    <div class="checkin-stat">
                        <span class="checkin-stat-value">${todayChecked}/${totalHabits}</span>
                        <span class="checkin-stat-label">今日完成</span>
                    </div>
                    <div class="checkin-stat">
                        <span class="checkin-stat-value">${totalHabits > 0 ? Math.round((todayChecked / totalHabits) * 100) : 0}%</span>
                        <span class="checkin-stat-label">完成率</span>
                    </div>
                </div>
                ${this.renderMiniCalendar()}
            </div>

            <!-- 习惯列表 -->
            <div class="habits-list" id="habits-list">
                ${AppData.habits.length === 0 ? `
                    <div class="encouragement">
                        <span class="emoji">🎯</span>
                        <p>还没有打卡习惯<br>把大目标拆成每天能做到的小事吧</p>
                    </div>
                ` : AppData.habits.map(habit => this.renderHabitCard(habit)).join('')}
            </div>

            <!-- 添加习惯按钮 -->
            <div class="add-habit-btn" id="btn-add-habit">
                + 添加每日小习惯
            </div>

            <!-- 鼓励语 -->
            <div class="encouragement">
                <span class="emoji">${todayEncouragement.emoji}</span>
                <p>${todayEncouragement.text}</p>
            </div>
        `;

        this.bindCardEvents();
    },

    // 渲染迷你日历（最近4周）
    renderMiniCalendar() {
        const today = new Date();
        const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
        
        // 获取4周前的周一
        const startDate = new Date(today);
        const dayOfWeek = today.getDay() || 7;
        startDate.setDate(today.getDate() - dayOfWeek + 1 - 21); // 3周前的周一

        let html = '<div class="checkin-calendar">';
        
        // 星期标签
        dayLabels.forEach(label => {
            html += `<span class="calendar-day-label">${label}</span>`;
        });

        // 日期格子
        for (let i = 0; i < 28; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const todayStr = this.getToday();
            
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const isChecked = this.isDayFullyChecked(dateStr);
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isFuture) classes += ' future';
            if (isChecked && !isFuture) classes += ' checked';
            
            html += `<span class="${classes}">${d.getDate()}</span>`;
        }

        html += '</div>';
        return html;
    },

    // 判断某天是否所有习惯都打卡了
    isDayFullyChecked(dateStr) {
        if (AppData.habits.length === 0) return false;
        return AppData.habits.every(h => {
            const history = AppData.checkinHistory[h.id] || {};
            return !!history[dateStr];
        });
    },

    // 渲染单个习惯卡片
    renderHabitCard(habit) {
        const isChecked = this.isCheckedToday(habit.id);
        const streak = this.getHabitStreak(habit.id);
        const weekCompletion = this.getWeekCompletion(habit.id);
        const weekDates = this.getWeekDates();
        const today = this.getToday();
        const history = AppData.checkinHistory[habit.id] || {};

        // 周视图
        const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
        const weekView = weekDates.map((date, i) => {
            const checked = !!history[date];
            const isToday = date === today;
            const isFuture = date > today;
            let dotClass = 'week-day-dot';
            if (checked) dotClass += ' checked';
            if (isToday) dotClass += ' today';
            if (!checked && !isFuture && date < today) dotClass += ' missed';
            
            return `
                <div class="week-day">
                    <span class="week-day-label">${dayLabels[i]}</span>
                    <span class="${dotClass}">${checked ? '✓' : isFuture ? '' : ''}</span>
                </div>
            `;
        }).join('');

        // 进度环
        const circumference = 2 * Math.PI * 16;
        const offset = circumference - (weekCompletion / 100) * circumference;

        return `
            <div class="habit-card ${isChecked ? 'completed-today' : ''}" data-habit-id="${habit.id}">
                <span class="habit-icon">${habit.icon}</span>
                <div class="habit-info">
                    <div class="habit-name">${habit.name}</div>
                    <div class="habit-meta">
                        <span class="habit-frequency">${habit.targetPerDay}</span>
                        ${streak > 0 ? `<span class="habit-streak-badge">🔥 ${streak}天</span>` : ''}
                    </div>
                    <div class="week-checkin-view">
                        ${weekView}
                    </div>
                </div>
                <button class="habit-checkin-btn ${isChecked ? 'checked' : ''}" 
                        data-habit-id="${habit.id}"
                        aria-label="${isChecked ? '已打卡' : '打卡'}">
                </button>
            </div>
        `;
    },

    // 绑定卡片事件
    bindCardEvents() {
        // 打卡按钮
        document.querySelectorAll('.habit-checkin-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const habitId = btn.dataset.habitId;
                this.doCheckin(habitId);
            });
        });

        // 卡片点击进入详情
        document.querySelectorAll('.habit-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.habit-checkin-btn')) return;
                const habitId = card.dataset.habitId;
                this.openHabitDetail(habitId);
            });
        });

        // 添加习惯按钮
        const addBtn = document.getElementById('btn-add-habit');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddHabitModal());
        }
    },

    // 打开添加习惯弹窗
    openAddHabitModal() {
        const modal = document.getElementById('habit-modal');
        if (!modal) return;

        document.getElementById('habit-name-input').value = '';
        document.getElementById('habit-icon-input').value = '';
        document.getElementById('habit-target-input').value = '';
        document.getElementById('habit-reminder-input').value = '';
        
        // 重置频率选择
        document.querySelectorAll('.freq-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.freq === 'daily');
        });

        // 重置关联目标
        this.renderGoalLinkOptions();

        modal.classList.add('active');
        modal.dataset.editId = '';
    },

    // 渲染关联目标选项
    renderGoalLinkOptions() {
        const select = document.getElementById('habit-link-goal');
        if (!select) return;
        
        select.innerHTML = '<option value="">不关联目标</option>';
        AppData.goals.filter(g => g.status === 'active').forEach(goal => {
            select.innerHTML += `<option value="${goal.id}">${goal.icon || '🎯'} ${goal.name}</option>`;
        });
    },

    // 保存习惯
    saveHabit() {
        const modal = document.getElementById('habit-modal');
        const name = document.getElementById('habit-name-input').value.trim();
        const icon = document.getElementById('habit-icon-input').value.trim() || '⭐';
        const target = document.getElementById('habit-target-input').value.trim() || '完成1次';
        const reminder = document.getElementById('habit-reminder-input').value.trim();
        const linkedGoalId = document.getElementById('habit-link-goal').value;
        const frequency = document.querySelector('.freq-option.selected')?.dataset.freq || 'daily';

        if (!name) {
            App.showToast('请输入习惯名称', 'warning');
            return;
        }

        const editId = modal.dataset.editId;
        if (editId) {
            // 编辑模式
            const habit = AppData.habits.find(h => h.id === editId);
            if (habit) {
                habit.name = name;
                habit.icon = icon;
                habit.targetPerDay = target;
                habit.frequency = frequency;
                habit.reminder = reminder;
                habit.linkedGoalId = linkedGoalId;
                this.saveData();
            }
        } else {
            // 新增
            this.addHabit({ name, icon, targetPerDay: target, frequency, reminder, linkedGoalId });
        }

        modal.classList.remove('active');
        this.renderCheckinPage();
        App.showToast(editId ? '习惯已更新' : `习惯 "${name}" 已添加！每天坚持一点点 💪`, 'success');
        App.updateStats();
    },

    // 打开习惯详情
    openHabitDetail(habitId) {
        const habit = AppData.habits.find(h => h.id === habitId);
        if (!habit) return;

        const streak = this.getHabitStreak(habitId);
        const total = this.getHabitTotal(habitId);
        const weekCompletion = this.getWeekCompletion(habitId);
        const linkedGoal = habit.linkedGoalId ? AppData.goals.find(g => g.id === habit.linkedGoalId) : null;

        const modal = document.getElementById('habit-detail-modal');
        if (!modal) return;

        const content = document.getElementById('habit-detail-content');
        content.innerHTML = `
            <div class="habit-detail-header">
                <span class="habit-detail-icon">${habit.icon}</span>
                <div class="habit-detail-info">
                    <h3>${habit.name}</h3>
                    <p>${habit.targetPerDay} · ${this.getFrequencyLabel(habit.frequency)}</p>
                </div>
            </div>

            <div class="habit-stats-grid">
                <div class="habit-stat-card">
                    <div class="stat-num">${streak}</div>
                    <div class="stat-text">连续天数</div>
                </div>
                <div class="habit-stat-card">
                    <div class="stat-num">${total}</div>
                    <div class="stat-text">累计打卡</div>
                </div>
                <div class="habit-stat-card">
                    <div class="stat-num">${weekCompletion}%</div>
                    <div class="stat-text">本周完成</div>
                </div>
            </div>

            ${linkedGoal ? `
                <div style="background:var(--bg);border-radius:var(--radius-sm);padding:0.8rem;margin-bottom:1rem;font-size:0.8rem;">
                    <span style="color:var(--text-muted);">关联目标:</span> 
                    ${linkedGoal.icon || '🎯'} ${linkedGoal.name} 
                    <span style="color:var(--primary-light);">(${linkedGoal.progress}%)</span>
                </div>
            ` : ''}

            <div style="margin-bottom:1rem;">
                <h4 style="font-size:0.9rem;margin-bottom:0.5rem;">📅 最近30天</h4>
                ${this.renderMonthView(habitId)}
            </div>

            <div style="display:flex;gap:0.5rem;margin-top:1.5rem;">
                <button class="btn-secondary" id="btn-edit-habit" style="flex:1;">✏️ 编辑</button>
                <button class="btn-small" id="btn-delete-habit" style="flex:1;color:var(--danger);border-color:var(--danger);">🗑️ 删除</button>
            </div>
        `;

        modal.classList.add('active');

        // 绑定详情页按钮
        document.getElementById('btn-edit-habit').addEventListener('click', () => {
            modal.classList.remove('active');
            this.openEditHabitModal(habitId);
        });

        document.getElementById('btn-delete-habit').addEventListener('click', () => {
            if (confirm(`确定删除习惯 "${habit.name}" 吗？打卡记录也会被清除。`)) {
                this.deleteHabit(habitId);
                modal.classList.remove('active');
                this.renderCheckinPage();
                App.showToast('习惯已删除', 'warning');
            }
        });
    },

    // 编辑习惯
    openEditHabitModal(habitId) {
        const habit = AppData.habits.find(h => h.id === habitId);
        if (!habit) return;

        const modal = document.getElementById('habit-modal');
        document.getElementById('habit-name-input').value = habit.name;
        document.getElementById('habit-icon-input').value = habit.icon;
        document.getElementById('habit-target-input').value = habit.targetPerDay;
        document.getElementById('habit-reminder-input').value = habit.reminder || '';
        
        document.querySelectorAll('.freq-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.freq === habit.frequency);
        });

        this.renderGoalLinkOptions();
        const linkSelect = document.getElementById('habit-link-goal');
        if (linkSelect) linkSelect.value = habit.linkedGoalId || '';

        modal.classList.add('active');
        modal.dataset.editId = habitId;
    },

    // 渲染月视图
    renderMonthView(habitId) {
        const history = AppData.checkinHistory[habitId] || {};
        const today = new Date();
        let html = '<div class="checkin-calendar">';
        
        const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
        dayLabels.forEach(label => {
            html += `<span class="calendar-day-label">${label}</span>`;
        });

        // 最近4周
        const startDate = new Date(today);
        const dayOfWeek = today.getDay() || 7;
        startDate.setDate(today.getDate() - dayOfWeek + 1 - 21);

        for (let i = 0; i < 28; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const todayStr = this.getToday();
            
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const isChecked = !!history[dateStr];
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isFuture) classes += ' future';
            if (isChecked) classes += ' checked';
            
            html += `<span class="${classes}">${d.getDate()}</span>`;
        }

        html += '</div>';
        return html;
    },

    // 格式化日期
    formatDate(dateStr) {
        const d = new Date(dateStr);
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${months[d.getMonth()]}${d.getDate()}日 ${days[d.getDay()]}`;
    },

    // 获取频率标签
    getFrequencyLabel(freq) {
        const labels = { daily: '每天', weekday: '工作日', weekend: '周末', custom: '自定义' };
        return labels[freq] || '每天';
    },

    // 绑定全局事件
    bindEvents() {
        // 习惯弹窗保存
        const btnSave = document.getElementById('btn-save-habit');
        if (btnSave) {
            btnSave.addEventListener('click', () => this.saveHabit());
        }

        // 习惯弹窗取消
        const btnCancel = document.getElementById('btn-cancel-habit');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                document.getElementById('habit-modal').classList.remove('active');
            });
        }

        const closeBtn = document.getElementById('habit-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('habit-modal').classList.remove('active');
            });
        }

        // 详情弹窗关闭
        const detailClose = document.getElementById('habit-detail-close');
        if (detailClose) {
            detailClose.addEventListener('click', () => {
                document.getElementById('habit-detail-modal').classList.remove('active');
            });
        }

        // 频率选择
        document.querySelectorAll('.freq-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.freq-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        // 预设图标快速选择
        document.querySelectorAll('.icon-quick-pick').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('habit-icon-input').value = btn.textContent;
            });
        });
    }
};
