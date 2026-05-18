// ===== 时间线模块 =====

const Timeline = {
    expandedGroups: new Set(['childhood', 'youth', 'adult', 'middle', 'elder', 'senior']),

    init() {
        this.renderStages();
        this.renderPaletteCards();
        this.bindEvents();
    },

    // 渲染时间线阶段（按组分类）
    renderStages() {
        const track = document.getElementById('timeline-track');
        track.innerHTML = '';

        AppData.stageGroups.forEach(group => {
            const groupEl = document.createElement('div');
            groupEl.className = 'timeline-group';
            
            const isExpanded = this.expandedGroups.has(group.id);
            const groupStages = AppData.stages.filter(s => s.group === group.id);
            const totalCards = groupStages.reduce((sum, s) => sum + (AppData.timelineData[s.id] || []).length, 0);

            groupEl.innerHTML = `
                <div class="group-header" data-group="${group.id}">
                    <div class="group-dot" style="background:${group.color}"></div>
                    <div class="group-info">
                        <span class="group-icon">${group.icon}</span>
                        <span class="group-name">${group.name}</span>
                        <span class="group-age">${group.ageRange}</span>
                        <span class="group-count">${totalCards} 个事件</span>
                    </div>
                    <span class="group-toggle">${isExpanded ? '▼' : '▶'}</span>
                </div>
                <div class="group-stages ${isExpanded ? '' : 'collapsed'}">
                    ${groupStages.map(stage => this.renderStage(stage)).join('')}
                </div>
            `;
            track.appendChild(groupEl);
        });

        this.setupDragDrop();
    },

    // 渲染单个阶段
    renderStage(stage) {
        const cards = AppData.timelineData[stage.id] || [];
        return `
            <div class="timeline-stage" data-stage-id="${stage.id}">
                <div class="stage-header">
                    <div class="stage-dot-small" style="background:${stage.color}"></div>
                    <span class="stage-title">${stage.name}</span>
                    <span class="stage-age">${stage.ageRange}</span>
                </div>
                <div class="stage-cards" id="stage-${stage.id}" data-stage="${stage.id}">
                    ${cards.map((card, index) => this.renderCard(card, stage.id, index)).join('')}
                    ${cards.length === 0 ? '<div class="stage-empty">拖拽卡片到这里</div>' : ''}
                </div>
            </div>
        `;
    },

    // 渲染单个卡片
    renderCard(card, stageId, index) {
        const goal = AppData.goals.find(g => g.cardId === card.id);
        const progress = goal ? goal.progress : (card.progress || 0);
        return `
            <div class="event-card" draggable="true" 
                 data-card-id="${card.id}" 
                 data-category="${card.category}"
                 data-index="${index}">
                <span class="card-icon">${card.icon}</span>
                <span class="card-text">${card.name}</span>
                <button class="card-remove" data-stage="${stageId}" data-index="${index}">×</button>
                <div class="card-progress">
                    <div class="card-progress-fill" style="width:${progress}%"></div>
                </div>
            </div>
        `;
    },

    // 渲染卡片面板
    renderPaletteCards(category = 'all') {
        const container = document.getElementById('palette-cards');
        let cards = AppData.eventCards;

        if (category !== 'all') {
            cards = cards.filter(c => c.category === category);
        }

        container.innerHTML = cards.map(card => `
            <div class="palette-card" draggable="true" 
                 data-card-id="${card.id}"
                 data-name="${card.name}"
                 data-icon="${card.icon}"
                 data-category="${card.category}">
                <span class="card-icon">${card.icon}</span>
                <span class="card-text">${card.name}</span>
            </div>
        `).join('');

        // 绑定面板卡片拖拽
        container.querySelectorAll('.palette-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    id: card.dataset.cardId,
                    name: card.dataset.name,
                    icon: card.dataset.icon,
                    category: card.dataset.category
                }));
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            // 双击添加到第一个阶段
            card.addEventListener('dblclick', () => {
                const cardData = {
                    id: card.dataset.cardId + '_' + Date.now(),
                    name: card.dataset.name,
                    icon: card.dataset.icon,
                    category: card.dataset.category,
                    progress: 0
                };
                const firstStage = AppData.stages[0].id;
                AppData.timelineData[firstStage].push(cardData);
                AppData.save();
                this.renderStages();
                App.showToast(`已添加 "${cardData.name}" 到${AppData.stages[0].name}阶段`, 'success');
                App.updateStats();
                Achievements.checkAchievements();
            });
        });
    },

    // 设置拖放
    setupDragDrop() {
        const stageContainers = document.querySelectorAll('.stage-cards');

        stageContainers.forEach(container => {
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                container.classList.add('drag-over');
            });

            container.addEventListener('dragleave', () => {
                container.classList.remove('drag-over');
            });

            container.addEventListener('drop', (e) => {
                e.preventDefault();
                container.classList.remove('drag-over');

                const stageId = container.dataset.stage;
                
                try {
                    const cardData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    
                    const newCard = {
                        id: cardData.id + '_' + Date.now(),
                        name: cardData.name,
                        icon: cardData.icon,
                        category: cardData.category,
                        progress: 0
                    };

                    AppData.timelineData[stageId].push(newCard);
                    AppData.save();
                    this.renderStages();
                    
                    const stageName = AppData.stages.find(s => s.id === stageId)?.name || stageId;
                    App.showToast(`已添加 "${newCard.name}" 到「${stageName}」`, 'success');
                    App.updateStats();
                    Achievements.checkAchievements();
                } catch (err) {
                    // ignore
                }
            });
        });

        // 阶段内卡片拖拽和点击
        document.querySelectorAll('.stage-cards .event-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    id: card.dataset.cardId,
                    name: card.querySelector('.card-text').textContent,
                    icon: card.querySelector('.card-icon').textContent,
                    category: card.dataset.category
                }));
                card.classList.add('dragging');

                const stage = card.closest('.stage-cards').dataset.stage;
                const index = parseInt(card.dataset.index);
                AppData.timelineData[stage].splice(index, 1);
                AppData.save();
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                this.renderStages();
            });

            // 点击打开目标设定
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('card-remove')) return;
                const stage = card.closest('.stage-cards').dataset.stage;
                const index = parseInt(card.dataset.index);
                this.openGoalModal(stage, index);
            });
        });

        // 删除按钮
        document.querySelectorAll('.card-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const stage = btn.dataset.stage;
                const index = parseInt(btn.dataset.index);
                const removed = AppData.timelineData[stage].splice(index, 1)[0];
                AppData.save();
                this.renderStages();
                App.showToast(`已移除 "${removed.name}"`, 'warning');
                App.updateStats();
            });
        });

        // 组折叠/展开
        document.querySelectorAll('.group-header').forEach(header => {
            header.addEventListener('click', () => {
                const groupId = header.dataset.group;
                if (this.expandedGroups.has(groupId)) {
                    this.expandedGroups.delete(groupId);
                } else {
                    this.expandedGroups.add(groupId);
                }
                this.renderStages();
            });
        });
    },

    // 打开目标设定弹窗
    openGoalModal(stageId, cardIndex) {
        const card = AppData.timelineData[stageId][cardIndex];
        if (!card) return;

        // 查找是否已有关联目标
        const existingGoal = AppData.goals.find(g => g.cardId === card.id);

        const modal = document.getElementById('goal-modal');
        document.getElementById('modal-title').textContent = `设定目标: ${card.name}`;
        document.getElementById('goal-name').value = existingGoal?.name || card.name;
        document.getElementById('goal-desc').value = existingGoal?.desc || '';
        document.getElementById('goal-priority').value = existingGoal?.priority || 'medium';
        document.getElementById('goal-duration').value = existingGoal?.duration || 6;
        document.getElementById('goal-progress').value = existingGoal?.progress || card.progress || 0;
        document.getElementById('progress-value').textContent = (existingGoal?.progress || card.progress || 0) + '%';

        this.renderSubtasks(existingGoal?.subtasks || []);

        modal.classList.add('active');
        modal.dataset.stageId = stageId;
        modal.dataset.cardIndex = cardIndex;
        modal.dataset.cardId = card.id;
        modal.dataset.goalId = existingGoal?.id || '';
    },

    // 渲染子任务
    renderSubtasks(subtasks) {
        const container = document.getElementById('subtasks-list');
        container.innerHTML = subtasks.map((task, i) => `
            <div class="subtask-item" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
                <input type="checkbox" ${task.done ? 'checked' : ''} data-subtask="${i}">
                <input type="text" value="${task.text}" data-subtask-text="${i}" 
                       style="flex:1;padding:0.4rem;background:var(--bg);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:0.85rem;">
                <button class="btn-small" onclick="Timeline.removeSubtask(${i})" style="color:var(--danger);border-color:var(--danger);">×</button>
            </div>
        `).join('');
    },

    addSubtask() {
        const container = document.getElementById('subtasks-list');
        const index = container.children.length;
        const div = document.createElement('div');
        div.className = 'subtask-item';
        div.style.cssText = 'display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;';
        div.innerHTML = `
            <input type="checkbox" data-subtask="${index}">
            <input type="text" placeholder="子任务描述..." data-subtask-text="${index}"
                   style="flex:1;padding:0.4rem;background:var(--bg);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:0.85rem;">
            <button class="btn-small" onclick="Timeline.removeSubtask(${index})" style="color:var(--danger);border-color:var(--danger);">×</button>
        `;
        container.appendChild(div);
    },

    removeSubtask(index) {
        const container = document.getElementById('subtasks-list');
        if (container.children[index]) {
            container.children[index].remove();
        }
    },

    // 保存目标
    saveGoal() {
        const modal = document.getElementById('goal-modal');
        const stageId = modal.dataset.stageId;
        const cardIndex = parseInt(modal.dataset.cardIndex);
        const cardId = modal.dataset.cardId;
        const existingGoalId = modal.dataset.goalId;
        const card = AppData.timelineData[stageId][cardIndex];

        if (!card) return;

        // 收集子任务
        const subtaskItems = document.querySelectorAll('#subtasks-list .subtask-item');
        const subtasks = Array.from(subtaskItems).map(item => ({
            text: item.querySelector('input[type="text"]').value,
            done: item.querySelector('input[type="checkbox"]').checked
        })).filter(t => t.text.trim());

        const progress = parseInt(document.getElementById('goal-progress').value);
        const goalData = {
            cardId: cardId,
            name: document.getElementById('goal-name').value,
            desc: document.getElementById('goal-desc').value,
            priority: document.getElementById('goal-priority').value,
            duration: parseInt(document.getElementById('goal-duration').value),
            progress: progress,
            subtasks: subtasks,
            stage: stageId,
            icon: card.icon,
            category: card.category,
            status: progress >= 100 ? 'completed' : 'active'
        };

        // 更新卡片进度
        card.progress = progress;

        if (existingGoalId) {
            AppData.updateGoal(existingGoalId, goalData);
        } else {
            AppData.addGoal(goalData);
        }

        AppData.save();
        modal.classList.remove('active');
        this.renderStages();
        App.showToast('目标已保存！', 'success');
        App.updateStats();
        Achievements.checkAchievements();

        const leveledUp = AppData.addExp(10);
        AppData.addCoins(5);
        if (leveledUp) {
            App.showToast(`🎉 升级了！当前等级: Lv.${AppData.user.level}`, 'success');
        }
        App.updateUserInfo();
    },

    // 绑定事件
    bindEvents() {
        // 分类筛选
        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderPaletteCards(btn.dataset.category);
            });
        });

        // 进度条实时更新
        document.getElementById('goal-progress').addEventListener('input', (e) => {
            document.getElementById('progress-value').textContent = e.target.value + '%';
        });

        // 添加子任务按钮
        document.getElementById('btn-add-subtask').addEventListener('click', () => {
            this.addSubtask();
        });

        // 保存目标
        document.getElementById('btn-save-goal').addEventListener('click', () => {
            this.saveGoal();
        });

        // 取消/关闭弹窗
        document.getElementById('btn-cancel-goal').addEventListener('click', () => {
            document.getElementById('goal-modal').classList.remove('active');
        });
        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('goal-modal').classList.remove('active');
        });

        // 自定义卡片
        document.getElementById('btn-add-card').addEventListener('click', () => {
            document.getElementById('custom-card-modal').classList.add('active');
        });
        document.getElementById('btn-cancel-custom').addEventListener('click', () => {
            document.getElementById('custom-card-modal').classList.remove('active');
        });
        document.getElementById('custom-card-close').addEventListener('click', () => {
            document.getElementById('custom-card-modal').classList.remove('active');
        });
        document.getElementById('btn-save-custom').addEventListener('click', () => {
            const name = document.getElementById('custom-card-name').value.trim();
            const category = document.getElementById('custom-card-category').value;
            const icon = document.getElementById('custom-card-icon').value || '📌';

            if (!name) {
                App.showToast('请输入卡片名称', 'warning');
                return;
            }

            AppData.eventCards.push({
                id: 'custom-' + Date.now(),
                name,
                icon,
                category
            });

            document.getElementById('custom-card-modal').classList.remove('active');
            this.renderPaletteCards(document.querySelector('.cat-btn.active').dataset.category);
            App.showToast(`自定义卡片 "${name}" 已添加！`, 'success');

            document.getElementById('custom-card-name').value = '';
            document.getElementById('custom-card-icon').value = '';
        });
    }
};
