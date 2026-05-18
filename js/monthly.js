// ===== 月度规划模块（12个月Slot） =====

const MonthlyPlan = {
    selectedMonthKey: null,

    init() {
        this.render();
        this.bindEvents();
    },

    // 获取当前成员
    getActiveMember() {
        const memberId = Family.getActiveMemberId();
        return Family.getMembers().find(m => m.id === memberId);
    },

    // 计算从某个起点开始的12个月
    getMonths() {
        const member = this.getActiveMember();
        if (!member) return [];

        const today = new Date();
        const months = [];

        // 起点：从当前月份开始
        const startYear = today.getFullYear();
        const startMonth = today.getMonth();

        for (let i = 0; i < 12; i++) {
            const year = startYear + Math.floor((startMonth + i) / 12);
            const month = (startMonth + i) % 12;
            const monthDate = new Date(year, month, 1);
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

            // 计算成员当时的年龄
            let age = null;
            if (member.birthDate) {
                const birth = new Date(member.birthDate);
                age = year - birth.getFullYear();
                if (month < birth.getMonth() || (month === birth.getMonth() && monthDate.getDate() < birth.getDate())) {
                    age--;
                }
            }

            months.push({
                key: monthKey,
                year,
                month: month + 1,
                date: monthDate,
                age,
                isCurrent: i === 0,
                label: this.formatMonth(year, month + 1),
                shortLabel: `${month + 1}月`
            });
        }

        return months;
    },

    formatMonth(year, month) {
        const today = new Date();
        if (year === today.getFullYear()) {
            return `${month}月`;
        }
        return `${year}年${month}月`;
    },

    // 获取月份的目标和习惯数据
    getMonthData(monthKey) {
        const goals = (AppData.goals || []).filter(g => g.targetMonth === monthKey);
        const habits = (AppData.habits || []).filter(h => h.targetMonth === monthKey || (!h.targetMonth && monthKey === this.getCurrentMonthKey()));
        return { goals, habits };
    },

    getCurrentMonthKey() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    },

    // 计算月份完成度
    getMonthCompletion(monthKey) {
        const { goals, habits } = this.getMonthData(monthKey);
        const totalItems = goals.length + habits.length;
        if (totalItems === 0) return 0;

        let completed = 0;
        goals.forEach(g => {
            if (g.status === 'completed' || g.progress >= 100) completed++;
        });
        habits.forEach(h => {
            // 习惯打卡率作为完成度
            const history = AppData.checkinHistory[h.id] || {};
            const monthChecks = Object.keys(history).filter(d => d.startsWith(monthKey) && history[d]).length;
            if (monthChecks >= 15) completed++; // 月内打卡15次算完成
        });

        return Math.round((completed / totalItems) * 100);
    },

    // 渲染主页
    render() {
        const container = document.getElementById('monthly-plan-content');
        if (!container) return;

        const member = this.getActiveMember();
        if (!member) {
            container.innerHTML = `
                <div class="monthly-empty">
                    <span class="empty-icon">👥</span>
                    <p>请先添加家庭成员</p>
                    <button class="btn-primary" id="btn-no-member-add">+ 添加成员</button>
                </div>
            `;
            document.getElementById('btn-no-member-add')?.addEventListener('click', () => {
                Family.openAddMemberModal();
            });
            return;
        }

        if (!member.birthDate) {
            container.innerHTML = `
                <div class="monthly-empty">
                    <span class="empty-icon">📅</span>
                    <p>请设置 <strong>${member.avatar} ${member.name}</strong> 的出生年月</p>
                    <p class="empty-hint">设置后将自动生成未来12个月的规划</p>
                    <button class="btn-primary" id="btn-set-birth">设置出生年月</button>
                </div>
            `;
            document.getElementById('btn-set-birth')?.addEventListener('click', () => {
                Family.openEditMemberModal(member);
            });
            return;
        }

        const months = this.getMonths();

        container.innerHTML = `
            <div class="monthly-header-info">
                <div class="member-info-block">
                    <span class="member-info-avatar" style="background:${member.color}">${member.avatar}</span>
                    <div>
                        <div class="member-info-name">${member.name} 的未来12个月</div>
                        <div class="member-info-birth">出生于 ${this.formatBirth(member.birthDate)}</div>
                    </div>
                </div>
            </div>

            <div class="month-grid">
                ${months.map((m, i) => this.renderMonthCard(m, i)).join('')}
            </div>
        `;

        this.bindCardEvents();
    },

    formatBirth(birthDate) {
        const d = new Date(birthDate);
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    },

    // 渲染单个月份卡片
    renderMonthCard(month, index) {
        const { goals, habits } = this.getMonthData(month.key);
        const completion = this.getMonthCompletion(month.key);
        const totalItems = goals.length + habits.length;

        return `
            <div class="month-card ${month.isCurrent ? 'current-month' : ''}" data-month-key="${month.key}">
                <div class="month-card-header">
                    <div class="month-card-title">
                        <span class="month-num">${month.month}月</span>
                        ${month.year !== new Date().getFullYear() ? `<span class="month-year">${month.year}</span>` : ''}
                        ${month.isCurrent ? '<span class="month-badge-current">本月</span>' : ''}
                    </div>
                    ${month.age !== null ? `<span class="month-age">${month.age}岁</span>` : ''}
                </div>

                ${totalItems > 0 ? `
                    <div class="month-progress-bar">
                        <div class="month-progress-fill" style="width:${completion}%"></div>
                    </div>
                ` : ''}

                <div class="month-card-body">
                    ${goals.length > 0 ? `
                        <div class="month-section">
                            <div class="month-section-label">🎯 目标</div>
                            ${goals.slice(0, 3).map(g => `
                                <div class="month-item ${g.status === 'completed' || g.progress >= 100 ? 'done' : ''}">
                                    <span class="month-item-icon">${g.icon || '🎯'}</span>
                                    <span class="month-item-name">${g.name}</span>
                                    <span class="month-item-progress">${g.progress}%</span>
                                </div>
                            `).join('')}
                            ${goals.length > 3 ? `<div class="month-more">+${goals.length - 3} 更多</div>` : ''}
                        </div>
                    ` : ''}

                    ${habits.length > 0 ? `
                        <div class="month-section">
                            <div class="month-section-label">✅ 习惯</div>
                            ${habits.slice(0, 3).map(h => {
                                const history = AppData.checkinHistory[h.id] || {};
                                const monthChecks = Object.keys(history).filter(d => d.startsWith(month.key) && history[d]).length;
                                return `
                                    <div class="month-item">
                                        <span class="month-item-icon">${h.icon}</span>
                                        <span class="month-item-name">${h.name}</span>
                                        <span class="month-item-progress">✓${monthChecks}</span>
                                    </div>
                                `;
                            }).join('')}
                            ${habits.length > 3 ? `<div class="month-more">+${habits.length - 3} 更多</div>` : ''}
                        </div>
                    ` : ''}

                    ${totalItems === 0 ? `
                        <div class="month-empty-slot">
                            <span class="empty-slot-icon">＋</span>
                            <span class="empty-slot-text">添加目标或习惯</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // 绑定月份卡片点击
    bindCardEvents() {
        document.querySelectorAll('.month-card').forEach(card => {
            card.addEventListener('click', () => {
                const monthKey = card.dataset.monthKey;
                this.openMonthDetail(monthKey);
            });
        });
    },

    // 打开月份详情
    openMonthDetail(monthKey) {
        this.selectedMonthKey = monthKey;
        const months = this.getMonths();
        const month = months.find(m => m.key === monthKey);
        if (!month) return;

        const modal = document.getElementById('month-detail-modal');
        const content = document.getElementById('month-detail-content');

        const { goals, habits } = this.getMonthData(monthKey);

        document.getElementById('month-detail-title').textContent = 
            `${month.year}年${month.month}月${month.age !== null ? ` · ${month.age}岁` : ''}`;

        content.innerHTML = `
            <div class="month-detail-section">
                <div class="month-detail-section-header">
                    <h4>🎯 本月目标</h4>
                    <button class="btn-small" id="btn-add-month-goal">+ 添加目标</button>
                </div>
                <div class="month-detail-list">
                    ${goals.length === 0 ? '<p class="empty-hint">还没有目标，添加一个吧</p>' : 
                        goals.map(g => `
                            <div class="month-detail-item ${g.status === 'completed' || g.progress >= 100 ? 'done' : ''}" data-goal-id="${g.id}">
                                <span class="month-item-icon">${g.icon || '🎯'}</span>
                                <div class="month-item-info">
                                    <div class="month-item-name">${g.name}</div>
                                    <div class="month-item-meta">
                                        <span>${g.progress}%</span>
                                        ${(g.subtasks || []).length > 0 ? `<span>· 子任务 ${(g.subtasks || []).filter(t => t.done).length}/${g.subtasks.length}</span>` : ''}
                                    </div>
                                </div>
                                <button class="month-item-action btn-small" data-remove-goal="${g.id}">×</button>
                            </div>
                        `).join('')
                    }
                </div>
            </div>

            <div class="month-detail-section">
                <div class="month-detail-section-header">
                    <h4>✅ 本月习惯</h4>
                    <button class="btn-small" id="btn-add-month-habit">+ 添加习惯</button>
                </div>
                <div class="month-detail-list">
                    ${habits.length === 0 ? '<p class="empty-hint">还没有习惯，把大目标拆成每天能做的小事</p>' : 
                        habits.map(h => {
                            const history = AppData.checkinHistory[h.id] || {};
                            const monthChecks = Object.keys(history).filter(d => d.startsWith(monthKey) && history[d]).length;
                            const today = new Date().toISOString().split('T')[0];
                            const checkedToday = !!history[today];
                            const isCurrent = month.isCurrent;
                            return `
                                <div class="month-detail-item" data-habit-id="${h.id}">
                                    <span class="month-item-icon">${h.icon}</span>
                                    <div class="month-item-info">
                                        <div class="month-item-name">${h.name}</div>
                                        <div class="month-item-meta">
                                            <span>${h.targetPerDay || ''}</span>
                                            <span>· 本月打卡 ${monthChecks} 次</span>
                                        </div>
                                    </div>
                                    ${isCurrent ? `
                                        <button class="month-checkin-btn ${checkedToday ? 'checked' : ''}" data-checkin-habit="${h.id}">
                                            ${checkedToday ? '✓' : '打卡'}
                                        </button>
                                    ` : ''}
                                    <button class="month-item-action btn-small" data-remove-habit="${h.id}">×</button>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>

            <div class="month-detail-tip">
                <span class="tip-icon">💡</span>
                <span>每月只关注 2-3 个核心目标 + 几个每日小习惯，比制定一堆很难实现的计划更有效</span>
            </div>
        `;

        modal.classList.add('active');
        modal.dataset.monthKey = monthKey;

        this.bindDetailEvents();
    },

    // 绑定详情页事件
    bindDetailEvents() {
        const monthKey = this.selectedMonthKey;

        // 添加目标
        document.getElementById('btn-add-month-goal')?.addEventListener('click', () => {
            this.openAddGoalForMonth(monthKey);
        });

        // 添加习惯
        document.getElementById('btn-add-month-habit')?.addEventListener('click', () => {
            this.openAddHabitForMonth(monthKey);
        });

        // 点击目标项 - 打开目标详情
        document.querySelectorAll('.month-detail-item[data-goal-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                const goalId = item.dataset.goalId;
                document.getElementById('month-detail-modal').classList.remove('active');
                App.navigateTo('goals');
                setTimeout(() => Goals.openGoalDetail(goalId), 100);
            });
        });

        // 移除目标关联（不删除目标）
        document.querySelectorAll('[data-remove-goal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const goalId = btn.dataset.removeGoal;
                AppData.updateGoal(goalId, { targetMonth: null });
                this.openMonthDetail(monthKey);
                this.render();
                App.showToast('已从本月移除', 'info');
            });
        });

        // 习惯打卡
        document.querySelectorAll('[data-checkin-habit]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const habitId = btn.dataset.checkinHabit;
                Checkin.doCheckin(habitId);
                setTimeout(() => this.openMonthDetail(monthKey), 200);
            });
        });

        // 移除习惯关联
        document.querySelectorAll('[data-remove-habit]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const habitId = btn.dataset.removeHabit;
                const habit = AppData.habits.find(h => h.id === habitId);
                if (habit) {
                    habit.targetMonth = null;
                    AppData.save();
                    this.openMonthDetail(monthKey);
                    this.render();
                    App.showToast('已从本月移除', 'info');
                }
            });
        });
    },

    // 为指定月份添加目标
    openAddGoalForMonth(monthKey) {
        const modal = document.getElementById('goal-modal');
        document.getElementById('modal-title').textContent = '添加月度目标';
        document.getElementById('goal-name').value = '';
        document.getElementById('goal-desc').value = '';
        document.getElementById('goal-priority').value = 'medium';
        document.getElementById('goal-duration').value = 1;
        document.getElementById('goal-progress').value = 0;
        document.getElementById('progress-value').textContent = '0%';
        document.getElementById('subtasks-list').innerHTML = '';

        modal.classList.add('active');
        modal.dataset.monthKey = monthKey;
        modal.dataset.stageId = '';
        modal.dataset.cardIndex = '-1';
        modal.dataset.cardId = '';
        modal.dataset.goalId = '';

        // 替换保存按钮逻辑
        const saveBtn = document.getElementById('btn-save-goal');
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', () => {
            const name = document.getElementById('goal-name').value.trim();
            if (!name) {
                App.showToast('请输入目标名称', 'warning');
                return;
            }

            const subtaskItems = document.querySelectorAll('#subtasks-list .subtask-item');
            const subtasks = Array.from(subtaskItems).map(item => ({
                text: item.querySelector('input[type="text"]').value,
                done: item.querySelector('input[type="checkbox"]').checked
            })).filter(t => t.text.trim());

            AppData.addGoal({
                name: name,
                desc: document.getElementById('goal-desc').value,
                priority: document.getElementById('goal-priority').value,
                duration: parseInt(document.getElementById('goal-duration').value),
                progress: parseInt(document.getElementById('goal-progress').value),
                subtasks: subtasks,
                targetMonth: monthKey,
                stage: '',
                icon: '🎯',
                category: 'life',
                cardId: ''
            });

            modal.classList.remove('active');
            this.openMonthDetail(monthKey);
            this.render();
            App.showToast('月度目标已添加！', 'success');
            App.updateStats();
            AppData.addExp(10);
            AppData.addCoins(5);
            App.updateUserInfo();
        });
    },

    // 为指定月份添加习惯
    openAddHabitForMonth(monthKey) {
        const modal = document.getElementById('habit-modal');
        document.getElementById('habit-name-input').value = '';
        document.getElementById('habit-icon-input').value = '';
        document.getElementById('habit-target-input').value = '';
        document.getElementById('habit-reminder-input').value = '';

        document.querySelectorAll('.freq-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.freq === 'daily');
        });

        Checkin.renderGoalLinkOptions();

        modal.classList.add('active');
        modal.dataset.editId = '';
        modal.dataset.monthKey = monthKey;

        // 替换保存按钮逻辑
        const saveBtn = document.getElementById('btn-save-habit');
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', () => {
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

            const habit = Checkin.addHabit({ name, icon, targetPerDay: target, frequency, reminder, linkedGoalId });
            // 关联到月份
            habit.targetMonth = monthKey;
            AppData.save();

            modal.classList.remove('active');
            this.openMonthDetail(monthKey);
            this.render();
            App.showToast(`习惯 "${name}" 已添加到 ${monthKey}！`, 'success');
            App.updateStats();
        });
    },

    bindEvents() {
        // 月份详情弹窗关闭
        document.getElementById('month-detail-close')?.addEventListener('click', () => {
            document.getElementById('month-detail-modal').classList.remove('active');
        });
    }
};
