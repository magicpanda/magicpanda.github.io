// ===== 目标管理模块 =====

const Goals = {
    currentFilter: 'all',
    currentSort: 'newest',
    selectedGoalId: null,

    init() {
        this.renderGoalsList();
        this.bindEvents();
    },

    // 渲染目标列表
    renderGoalsList() {
        const container = document.getElementById('goals-list');
        if (!container) return;

        let goals = [...AppData.goals];

        // 筛选
        if (this.currentFilter !== 'all') {
            if (this.currentFilter === 'active') goals = goals.filter(g => g.status === 'active');
            else if (this.currentFilter === 'completed') goals = goals.filter(g => g.status === 'completed');
            else if (this.currentFilter === 'paused') goals = goals.filter(g => g.status === 'paused');
            else goals = goals.filter(g => g.category === this.currentFilter);
        }

        // 排序
        if (this.currentSort === 'newest') {
            goals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (this.currentSort === 'oldest') {
            goals.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (this.currentSort === 'progress') {
            goals.sort((a, b) => b.progress - a.progress);
        } else if (this.currentSort === 'priority') {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            goals.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        }

        if (goals.length === 0) {
            container.innerHTML = `
                <div class="goals-empty">
                    <span class="empty-icon">🎯</span>
                    <p>还没有目标</p>
                    <p class="empty-hint">在时间线中添加事件卡片并设定目标，或点击下方按钮快速创建</p>
                    <button class="btn-primary" id="btn-quick-add-goal">+ 快速创建目标</button>
                </div>
            `;
            const quickBtn = document.getElementById('btn-quick-add-goal');
            if (quickBtn) {
                quickBtn.addEventListener('click', () => this.openQuickAddModal());
            }
            return;
        }

        container.innerHTML = goals.map(goal => this.renderGoalCard(goal)).join('');

        // 绑定卡片点击
        container.querySelectorAll('.goal-card').forEach(card => {
            card.addEventListener('click', () => {
                this.openGoalDetail(card.dataset.goalId);
            });
        });
    },

    // 渲染单个目标卡片
    renderGoalCard(goal) {
        const priorityColors = { high: '#e17055', medium: '#fdcb6e', low: '#00b894' };
        const priorityLabels = { high: '高', medium: '中', low: '低' };
        const statusLabels = { active: '进行中', completed: '已完成', paused: '已暂停', abandoned: '已放弃' };
        const statusIcons = { active: '🔵', completed: '✅', paused: '⏸️', abandoned: '❌' };

        const stageName = AppData.stages.find(s => s.id === goal.stage)?.name || '';
        const completedSubtasks = (goal.subtasks || []).filter(t => t.done).length;
        const totalSubtasks = (goal.subtasks || []).length;

        return `
            <div class="goal-card ${goal.status}" data-goal-id="${goal.id}">
                <div class="goal-card-header">
                    <span class="goal-card-icon">${goal.icon || '🎯'}</span>
                    <div class="goal-card-info">
                        <h4 class="goal-card-name">${goal.name}</h4>
                        <div class="goal-card-meta">
                            <span class="goal-priority-badge" style="background:${priorityColors[goal.priority]}">${priorityLabels[goal.priority]}</span>
                            <span class="goal-stage-badge">${stageName}</span>
                            <span class="goal-status-badge">${statusIcons[goal.status]} ${statusLabels[goal.status]}</span>
                        </div>
                    </div>
                    <span class="goal-card-progress-num">${goal.progress}%</span>
                </div>
                <div class="goal-card-progress-bar">
                    <div class="goal-card-progress-fill" style="width:${goal.progress}%;background:${goal.progress >= 100 ? '#00b894' : goal.progress > 50 ? '#fdcb6e' : '#6c5ce7'}"></div>
                </div>
                ${totalSubtasks > 0 ? `
                    <div class="goal-card-subtasks">
                        <span>📋 子任务: ${completedSubtasks}/${totalSubtasks}</span>
                    </div>
                ` : ''}
                ${goal.duration ? `<div class="goal-card-duration">⏱️ 预计 ${goal.duration} 个月</div>` : ''}
            </div>
        `;
    },

    // 打开目标详情页
    openGoalDetail(goalId) {
        const goal = AppData.getGoalById(goalId);
        if (!goal) return;

        this.selectedGoalId = goalId;
        const detail = document.getElementById('goal-detail-panel');
        const list = document.getElementById('goals-list-panel');

        list.classList.add('hidden');
        detail.classList.remove('hidden');

        this.renderGoalDetail(goal);
    },

    // 渲染目标详情
    renderGoalDetail(goal) {
        const container = document.getElementById('goal-detail-content');
        const priorityLabels = { high: '🔴 高优先级', medium: '🟡 中优先级', low: '🟢 低优先级' };
        const statusLabels = { active: '进行中', completed: '已完成', paused: '已暂停', abandoned: '已放弃' };
        const stageName = AppData.stages.find(s => s.id === goal.stage)?.name || '未分配';

        container.innerHTML = `
            <div class="detail-header">
                <div class="detail-title-row">
                    <span class="detail-icon">${goal.icon || '🎯'}</span>
                    <h2 class="detail-title">${goal.name}</h2>
                </div>
                <div class="detail-actions">
                    <button class="btn-small btn-edit-goal" data-goal-id="${goal.id}">✏️ 编辑</button>
                    <button class="btn-small btn-delete-goal" data-goal-id="${goal.id}" style="color:var(--danger);border-color:var(--danger);">🗑️ 删除</button>
                </div>
            </div>

            <div class="detail-meta-grid">
                <div class="detail-meta-item">
                    <span class="meta-label">状态</span>
                    <select class="detail-status-select" id="detail-status-select">
                        <option value="active" ${goal.status === 'active' ? 'selected' : ''}>🔵 进行中</option>
                        <option value="paused" ${goal.status === 'paused' ? 'selected' : ''}>⏸️ 已暂停</option>
                        <option value="completed" ${goal.status === 'completed' ? 'selected' : ''}>✅ 已完成</option>
                        <option value="abandoned" ${goal.status === 'abandoned' ? 'selected' : ''}>❌ 已放弃</option>
                    </select>
                </div>
                <div class="detail-meta-item">
                    <span class="meta-label">优先级</span>
                    <span class="meta-value">${priorityLabels[goal.priority]}</span>
                </div>
                <div class="detail-meta-item">
                    <span class="meta-label">所属阶段</span>
                    <span class="meta-value">${stageName}</span>
                </div>
                <div class="detail-meta-item">
                    <span class="meta-label">预计时长</span>
                    <span class="meta-value">${goal.duration || 0} 个月</span>
                </div>
                <div class="detail-meta-item">
                    <span class="meta-label">创建时间</span>
                    <span class="meta-value">${new Date(goal.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
                <div class="detail-meta-item">
                    <span class="meta-label">最后更新</span>
                    <span class="meta-value">${new Date(goal.updatedAt).toLocaleDateString('zh-CN')}</span>
                </div>
            </div>

            ${goal.desc ? `
                <div class="detail-section">
                    <h3>📝 描述</h3>
                    <p class="detail-desc">${goal.desc}</p>
                </div>
            ` : ''}

            <div class="detail-section">
                <h3>📊 进度</h3>
                <div class="detail-progress-container">
                    <div class="detail-progress-bar">
                        <div class="detail-progress-fill" style="width:${goal.progress}%"></div>
                    </div>
                    <div class="detail-progress-controls">
                        <input type="range" id="detail-progress-range" min="0" max="100" value="${goal.progress}">
                        <span class="detail-progress-value" id="detail-progress-value">${goal.progress}%</span>
                        <button class="btn-small" id="btn-update-progress">更新进度</button>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>📋 子任务 (${(goal.subtasks || []).filter(t => t.done).length}/${(goal.subtasks || []).length})</h3>
                <div class="detail-subtasks" id="detail-subtasks">
                    ${(goal.subtasks || []).map((task, i) => `
                        <div class="detail-subtask-item ${task.done ? 'done' : ''}">
                            <input type="checkbox" ${task.done ? 'checked' : ''} data-subtask-index="${i}" class="detail-subtask-check">
                            <span class="subtask-text">${task.text}</span>
                        </div>
                    `).join('')}
                    ${(goal.subtasks || []).length === 0 ? '<p class="empty-hint">暂无子任务</p>' : ''}
                </div>
                <div class="detail-add-subtask">
                    <input type="text" id="new-subtask-input" placeholder="添加新子任务...">
                    <button class="btn-small" id="btn-add-detail-subtask">+</button>
                </div>
            </div>

            <div class="detail-section">
                <h3>📅 进展日志</h3>
                <div class="detail-logs" id="detail-logs">
                    ${(goal.logs || []).length === 0 ? '<p class="empty-hint">暂无日志记录</p>' : ''}
                    ${(goal.logs || []).slice().reverse().map(log => `
                        <div class="log-item">
                            <span class="log-date">${new Date(log.date).toLocaleString('zh-CN')}</span>
                            <span class="log-progress">进度: ${log.progress}%</span>
                            <p class="log-text">${log.text}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="detail-add-log">
                    <textarea id="new-log-input" placeholder="记录今天的进展..."></textarea>
                    <button class="btn-primary" id="btn-add-log">📝 添加日志</button>
                </div>
            </div>
        `;

        this.bindDetailEvents(goal);
    },

    // 绑定详情页事件
    bindDetailEvents(goal) {
        // 进度滑块
        const progressRange = document.getElementById('detail-progress-range');
        const progressValue = document.getElementById('detail-progress-value');
        if (progressRange) {
            progressRange.addEventListener('input', () => {
                progressValue.textContent = progressRange.value + '%';
            });
        }

        // 更新进度按钮
        const btnUpdateProgress = document.getElementById('btn-update-progress');
        if (btnUpdateProgress) {
            btnUpdateProgress.addEventListener('click', () => {
                const newProgress = parseInt(progressRange.value);
                const status = newProgress >= 100 ? 'completed' : goal.status;
                AppData.updateGoal(goal.id, { progress: newProgress, status });
                AppData.addGoalLog(goal.id, `进度更新为 ${newProgress}%`);
                
                // 同步更新时间线卡片
                this.syncCardProgress(goal.cardId, newProgress);
                
                App.showToast('进度已更新', 'success');
                this.openGoalDetail(goal.id);
                App.updateStats();
                Achievements.checkAchievements();

                if (newProgress >= 100) {
                    App.showToast('🎉 恭喜完成目标！', 'success');
                    AppData.addCoins(20);
                    AppData.addExp(50);
                    App.updateUserInfo();
                }
            });
        }

        // 状态切换
        const statusSelect = document.getElementById('detail-status-select');
        if (statusSelect) {
            statusSelect.addEventListener('change', () => {
                const newStatus = statusSelect.value;
                AppData.updateGoal(goal.id, { status: newStatus });
                AppData.addGoalLog(goal.id, `状态变更为: ${newStatus}`);
                App.showToast('状态已更新', 'info');
                this.renderGoalsList();
            });
        }

        // 子任务勾选
        document.querySelectorAll('.detail-subtask-check').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const index = parseInt(checkbox.dataset.subtaskIndex);
                const updatedGoal = AppData.getGoalById(goal.id);
                if (updatedGoal && updatedGoal.subtasks[index]) {
                    updatedGoal.subtasks[index].done = checkbox.checked;
                    
                    // 自动计算进度
                    const total = updatedGoal.subtasks.length;
                    const done = updatedGoal.subtasks.filter(t => t.done).length;
                    const autoProgress = Math.round((done / total) * 100);
                    updatedGoal.progress = autoProgress;
                    updatedGoal.status = autoProgress >= 100 ? 'completed' : 'active';
                    
                    AppData.save();
                    this.syncCardProgress(goal.cardId, autoProgress);
                    this.openGoalDetail(goal.id);
                    this.renderGoalsList();
                    App.updateStats();

                    if (autoProgress >= 100) {
                        App.showToast('🎉 所有子任务完成！目标达成！', 'success');
                        AppData.addCoins(20);
                        AppData.addExp(50);
                        App.updateUserInfo();
                        Achievements.checkAchievements();
                    }
                }
            });
        });

        // 添加子任务
        const btnAddSubtask = document.getElementById('btn-add-detail-subtask');
        const subtaskInput = document.getElementById('new-subtask-input');
        if (btnAddSubtask && subtaskInput) {
            const addSubtask = () => {
                const text = subtaskInput.value.trim();
                if (!text) return;
                
                const updatedGoal = AppData.getGoalById(goal.id);
                if (updatedGoal) {
                    updatedGoal.subtasks = updatedGoal.subtasks || [];
                    updatedGoal.subtasks.push({ text, done: false });
                    AppData.save();
                    subtaskInput.value = '';
                    this.openGoalDetail(goal.id);
                }
            };
            btnAddSubtask.addEventListener('click', addSubtask);
            subtaskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addSubtask();
            });
        }

        // 添加日志
        const btnAddLog = document.getElementById('btn-add-log');
        const logInput = document.getElementById('new-log-input');
        if (btnAddLog && logInput) {
            btnAddLog.addEventListener('click', () => {
                const text = logInput.value.trim();
                if (!text) {
                    App.showToast('请输入日志内容', 'warning');
                    return;
                }
                AppData.addGoalLog(goal.id, text);
                AppData.addExp(5);
                AppData.addCoins(2);
                App.updateUserInfo();
                logInput.value = '';
                this.openGoalDetail(goal.id);
                App.showToast('日志已添加', 'success');
            });
        }

        // 编辑按钮
        const btnEdit = document.querySelector('.btn-edit-goal');
        if (btnEdit) {
            btnEdit.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditModal(goal);
            });
        }

        // 删除按钮
        const btnDelete = document.querySelector('.btn-delete-goal');
        if (btnDelete) {
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`确定要删除目标 "${goal.name}" 吗？`)) {
                    AppData.deleteGoal(goal.id);
                    this.backToList();
                    App.showToast('目标已删除', 'warning');
                    App.updateStats();
                }
            });
        }
    },

    // 同步卡片进度到时间线
    syncCardProgress(cardId, progress) {
        if (!cardId) return;
        for (const stageId of Object.keys(AppData.timelineData)) {
            const cards = AppData.timelineData[stageId];
            const card = cards.find(c => c.id === cardId);
            if (card) {
                card.progress = progress;
                AppData.save();
                break;
            }
        }
    },

    // 返回列表
    backToList() {
        this.selectedGoalId = null;
        const detail = document.getElementById('goal-detail-panel');
        const list = document.getElementById('goals-list-panel');
        detail.classList.add('hidden');
        list.classList.remove('hidden');
        this.renderGoalsList();
    },

    // 打开编辑弹窗
    openEditModal(goal) {
        const modal = document.getElementById('goal-modal');
        document.getElementById('modal-title').textContent = `编辑目标: ${goal.name}`;
        document.getElementById('goal-name').value = goal.name || '';
        document.getElementById('goal-desc').value = goal.desc || '';
        document.getElementById('goal-priority').value = goal.priority || 'medium';
        document.getElementById('goal-duration').value = goal.duration || 6;
        document.getElementById('goal-progress').value = goal.progress || 0;
        document.getElementById('progress-value').textContent = (goal.progress || 0) + '%';

        Timeline.renderSubtasks(goal.subtasks || []);

        modal.classList.add('active');
        modal.dataset.stageId = goal.stage || '';
        modal.dataset.cardIndex = '-1';
        modal.dataset.cardId = goal.cardId || '';
        modal.dataset.goalId = goal.id;

        // 覆盖保存逻辑
        const saveBtn = document.getElementById('btn-save-goal');
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', () => {
            const subtaskItems = document.querySelectorAll('#subtasks-list .subtask-item');
            const subtasks = Array.from(subtaskItems).map(item => ({
                text: item.querySelector('input[type="text"]').value,
                done: item.querySelector('input[type="checkbox"]').checked
            })).filter(t => t.text.trim());

            const progress = parseInt(document.getElementById('goal-progress').value);
            AppData.updateGoal(goal.id, {
                name: document.getElementById('goal-name').value,
                desc: document.getElementById('goal-desc').value,
                priority: document.getElementById('goal-priority').value,
                duration: parseInt(document.getElementById('goal-duration').value),
                progress: progress,
                subtasks: subtasks,
                status: progress >= 100 ? 'completed' : goal.status
            });

            this.syncCardProgress(goal.cardId, progress);
            modal.classList.remove('active');
            this.openGoalDetail(goal.id);
            this.renderGoalsList();
            App.showToast('目标已更新', 'success');
            App.updateStats();
        });
    },

    // 快速添加目标弹窗
    openQuickAddModal() {
        const modal = document.getElementById('goal-modal');
        document.getElementById('modal-title').textContent = '快速创建目标';
        document.getElementById('goal-name').value = '';
        document.getElementById('goal-desc').value = '';
        document.getElementById('goal-priority').value = 'medium';
        document.getElementById('goal-duration').value = 6;
        document.getElementById('goal-progress').value = 0;
        document.getElementById('progress-value').textContent = '0%';
        document.getElementById('subtasks-list').innerHTML = '';

        modal.classList.add('active');
        modal.dataset.stageId = '';
        modal.dataset.cardIndex = '-1';
        modal.dataset.cardId = '';
        modal.dataset.goalId = '';

        // 覆盖保存逻辑
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
                stage: '',
                icon: '🎯',
                category: 'life',
                cardId: ''
            });

            modal.classList.remove('active');
            this.renderGoalsList();
            App.showToast('目标已创建！', 'success');
            App.updateStats();
            Achievements.checkAchievements();
            AppData.addExp(10);
            AppData.addCoins(5);
            App.updateUserInfo();
        });
    },

    // 绑定事件
    bindEvents() {
        // 返回按钮
        const btnBack = document.getElementById('btn-back-to-goals');
        if (btnBack) {
            btnBack.addEventListener('click', () => this.backToList());
        }

        // 筛选按钮
        document.querySelectorAll('.goals-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.goals-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderGoalsList();
            });
        });

        // 排序
        const sortSelect = document.getElementById('goals-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.currentSort = sortSelect.value;
                this.renderGoalsList();
            });
        }

        // 快速添加按钮
        const btnAdd = document.getElementById('btn-add-goal-page');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => this.openQuickAddModal());
        }
    }
};
