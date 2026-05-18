// ===== 家庭成员管理模块 =====

const Family = {
    // 获取所有成员
    getMembers() {
        const raw = localStorage.getItem('8bitslife_family');
        return raw ? JSON.parse(raw) : [];
    },

    // 保存成员列表
    saveMembers(members) {
        localStorage.setItem('8bitslife_family', JSON.stringify(members));
        // 触发云同步
        if (typeof Cloud !== 'undefined' && Cloud.enabled) {
            Cloud.syncUp();
        }
    },

    // 获取当前活跃成员ID
    getActiveMemberId() {
        return localStorage.getItem('8bitslife_active_member') || null;
    },

    // 设置活跃成员
    setActiveMember(memberId) {
        localStorage.setItem('8bitslife_active_member', memberId);
    },

    // 获取成员数据的存储key
    getMemberDataKey(memberId) {
        return `8bitslife_data_${memberId}`;
    },

    // 初始化 - 如果没有成员，将当前数据迁移为第一个成员
    init() {
        const members = this.getMembers();
        if (members.length === 0) {
            // 首次使用或从旧版本迁移
            const defaultMember = {
                id: 'member_' + Date.now(),
                name: '我',
                avatar: '😊',
                color: '#6c5ce7',
                createdAt: new Date().toISOString()
            };
            this.saveMembers([defaultMember]);
            this.setActiveMember(defaultMember.id);

            // 迁移已有数据
            const existingData = localStorage.getItem('8bitslife_data');
            if (existingData) {
                localStorage.setItem(this.getMemberDataKey(defaultMember.id), existingData);
            }
        }

        // 确保有活跃成员
        if (!this.getActiveMemberId()) {
            this.setActiveMember(members[0]?.id || this.getMembers()[0]?.id);
        }

        this.loadActiveMemberData();
        this.renderMemberSwitcher();
    },

    // 加载活跃成员的数据到AppData
    loadActiveMemberData() {
        const memberId = this.getActiveMemberId();
        if (!memberId) return;

        const key = this.getMemberDataKey(memberId);
        const saved = localStorage.getItem(key);

        // 重置AppData到默认值
        AppData.user = { coins: 0, level: 1, exp: 0, streakDays: 0, lastVisit: null };
        AppData.timelineData = {};
        AppData.goals = [];
        AppData.character = { name: '', avatar: '👤', age: 0, health: 50, wealth: 30, happiness: 60, wisdom: 40, social: 45 };
        AppData.unlockedAchievements = [];
        AppData.visitedModules = [];
        AppData.habits = [];
        AppData.checkinHistory = {};

        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(AppData.user, data.user || {});
            if (data.timelineData) Object.assign(AppData.timelineData, data.timelineData);
            AppData.goals = data.goals || [];
            Object.assign(AppData.character, data.character || {});
            AppData.unlockedAchievements = data.unlockedAchievements || [];
            AppData.visitedModules = data.visitedModules || [];
            AppData.habits = data.habits || [];
            AppData.checkinHistory = data.checkinHistory || {};
        }

        AppData.initTimelineData();
        AppData.checkStreak();
    },

    // 覆盖AppData.save，保存到当前成员的key
    patchSave() {
        const originalSave = AppData.save.bind(AppData);
        AppData.save = () => {
            const memberId = Family.getActiveMemberId();
            if (!memberId) return;

            const data = {
                user: AppData.user,
                timelineData: AppData.timelineData,
                goals: AppData.goals,
                character: AppData.character,
                unlockedAchievements: AppData.unlockedAchievements,
                visitedModules: AppData.visitedModules,
                habits: AppData.habits,
                checkinHistory: AppData.checkinHistory
            };
            localStorage.setItem(Family.getMemberDataKey(memberId), JSON.stringify(data));
            // 也保存到默认key以兼容
            localStorage.setItem('8bitslife_data', JSON.stringify(data));

            // 触发云同步（防抖）
            if (typeof Cloud !== 'undefined' && Cloud.enabled) {
                Cloud.syncUp();
            }
        };
    },

    // 切换成员
    switchMember(memberId) {
        // 先保存当前数据
        AppData.save();

        // 切换
        this.setActiveMember(memberId);
        this.loadActiveMemberData();

        // 刷新UI
        this.renderMemberSwitcher();
        App.updateUserInfo();
        App.updateStats();

        // 刷新当前页面
        const section = App.currentSection;
        if (section === 'checkin') Checkin.renderCheckinPage();
        if (section === 'goals') Goals.renderGoalsList();
        if (section === 'achievements') Achievements.renderAchievements();
        if (section === 'timeline') Timeline.renderStages();
        if (section === 'game') Game.updateDisplay();
        if (section === 'monthly' && typeof MonthlyPlan !== 'undefined') MonthlyPlan.render();

        const member = this.getMembers().find(m => m.id === memberId);
        App.showToast(`已切换到 ${member?.avatar || ''} ${member?.name || ''}`, 'info');
    },

    // 添加成员
    addMember(name, avatar, color, birthDate) {
        const members = this.getMembers();
        const newMember = {
            id: 'member_' + Date.now(),
            name,
            avatar: avatar || '😊',
            color: color || '#6c5ce7',
            birthDate: birthDate || null,
            createdAt: new Date().toISOString()
        };
        members.push(newMember);
        this.saveMembers(members);
        this.renderMemberSwitcher();
        return newMember;
    },

    // 删除成员
    deleteMember(memberId) {
        let members = this.getMembers();
        if (members.length <= 1) {
            App.showToast('至少保留一个成员', 'warning');
            return false;
        }

        members = members.filter(m => m.id !== memberId);
        this.saveMembers(members);
        localStorage.removeItem(this.getMemberDataKey(memberId));

        // 如果删除的是当前成员，切换到第一个
        if (this.getActiveMemberId() === memberId) {
            this.switchMember(members[0].id);
        }

        this.renderMemberSwitcher();
        return true;
    },

    // 编辑成员
    editMember(memberId, updates) {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === memberId);
        if (index >= 0) {
            Object.assign(members[index], updates);
            this.saveMembers(members);
            this.renderMemberSwitcher();
        }
    },

    // 渲染成员切换器（顶部导航中）
    renderMemberSwitcher() {
        const container = document.getElementById('member-switcher');
        if (!container) return;

        const members = this.getMembers();
        const activeId = this.getActiveMemberId();
        const activeMember = members.find(m => m.id === activeId);

        container.innerHTML = `
            <div class="member-current" id="member-current-btn">
                <span class="member-avatar-small">${activeMember?.avatar || '😊'}</span>
                <span class="member-name-small">${activeMember?.name || '我'}</span>
                <span class="member-dropdown-arrow">▾</span>
            </div>
            <div class="member-dropdown" id="member-dropdown">
                <div class="member-dropdown-header">
                    <span>👨‍👩‍👧‍👦 家庭成员</span>
                </div>
                <div class="member-list">
                    ${members.map(m => `
                        <div class="member-item ${m.id === activeId ? 'active' : ''}" data-member-id="${m.id}">
                            <span class="member-item-avatar" style="background:${m.color}">${m.avatar}</span>
                            <span class="member-item-name">${m.name}</span>
                            ${m.id === activeId ? '<span class="member-item-check">✓</span>' : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="member-dropdown-footer">
                    <button class="btn-small member-add-btn" id="btn-add-member">+ 添加成员</button>
                    <button class="btn-small member-manage-btn" id="btn-manage-members">管理</button>
                </div>
            </div>
        `;

        this.bindSwitcherEvents();
    },

    // 绑定切换器事件
    bindSwitcherEvents() {
        const btn = document.getElementById('member-current-btn');
        const dropdown = document.getElementById('member-dropdown');

        if (btn && dropdown) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });

            // 点击外部关闭
            document.addEventListener('click', () => {
                dropdown.classList.remove('show');
            });

            dropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // 成员项点击
        document.querySelectorAll('.member-item').forEach(item => {
            item.addEventListener('click', () => {
                const memberId = item.dataset.memberId;
                if (memberId !== this.getActiveMemberId()) {
                    this.switchMember(memberId);
                }
                dropdown.classList.remove('show');
            });
        });

        // 添加成员
        const addBtn = document.getElementById('btn-add-member');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                dropdown.classList.remove('show');
                this.openAddMemberModal();
            });
        }

        // 管理成员
        const manageBtn = document.getElementById('btn-manage-members');
        if (manageBtn) {
            manageBtn.addEventListener('click', () => {
                dropdown.classList.remove('show');
                this.openManageModal();
            });
        }
    },

    // 打开添加成员弹窗
    openAddMemberModal() {
        const modal = document.getElementById('member-modal');
        if (!modal) return;

        document.getElementById('member-name-input').value = '';
        document.getElementById('member-birth-input').value = '';
        document.getElementById('member-modal-title').textContent = '添加家庭成员';
        modal.dataset.editId = '';

        // 重置头像选择
        document.querySelectorAll('.member-avatar-option').forEach((opt, i) => {
            opt.classList.toggle('selected', i === 0);
        });

        modal.classList.add('active');
    },

    // 打开管理弹窗
    openManageModal() {
        const modal = document.getElementById('manage-members-modal');
        if (!modal) return;

        const members = this.getMembers();
        const activeId = this.getActiveMemberId();
        const content = document.getElementById('manage-members-content');

        content.innerHTML = members.map(m => `
            <div class="manage-member-item">
                <span class="member-item-avatar" style="background:${m.color}">${m.avatar}</span>
                <span class="manage-member-name">${m.name}</span>
                ${m.id === activeId ? '<span style="font-size:0.7rem;color:var(--success);">当前</span>' : ''}
                <div class="manage-member-actions">
                    <button class="btn-small" data-edit-id="${m.id}">✏️</button>
                    ${members.length > 1 ? `<button class="btn-small" data-delete-id="${m.id}" style="color:var(--danger);border-color:var(--danger);">🗑️</button>` : ''}
                </div>
            </div>
        `).join('');

        // 绑定编辑/删除
        content.querySelectorAll('[data-edit-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.remove('active');
                const member = members.find(m => m.id === btn.dataset.editId);
                if (member) this.openEditMemberModal(member);
            });
        });

        content.querySelectorAll('[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const member = members.find(m => m.id === btn.dataset.deleteId);
                if (member && confirm(`确定删除成员 "${member.name}" 吗？所有数据将被清除。`)) {
                    this.deleteMember(btn.dataset.deleteId);
                    modal.classList.remove('active');
                    App.showToast('成员已删除', 'warning');
                }
            });
        });

        modal.classList.add('active');
    },

    // 打开编辑成员弹窗
    openEditMemberModal(member) {
        const modal = document.getElementById('member-modal');
        if (!modal) return;

        document.getElementById('member-name-input').value = member.name;
        document.getElementById('member-birth-input').value = member.birthDate || '';
        document.getElementById('member-modal-title').textContent = '编辑成员';
        modal.dataset.editId = member.id;

        // 选中对应头像
        document.querySelectorAll('.member-avatar-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.avatar === member.avatar);
        });

        modal.classList.add('active');
    },

    // 保存成员（新增或编辑）
    saveMember() {
        const modal = document.getElementById('member-modal');
        const name = document.getElementById('member-name-input').value.trim();
        const birthDate = document.getElementById('member-birth-input').value;
        const avatar = document.querySelector('.member-avatar-option.selected')?.dataset.avatar || '😊';
        const colors = ['#6c5ce7', '#00cec9', '#fd79a8', '#fdcb6e', '#00b894', '#e17055', '#0984e3', '#e84393'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        if (!name) {
            App.showToast('请输入成员名称', 'warning');
            return;
        }

        const editId = modal.dataset.editId;
        if (editId) {
            this.editMember(editId, { name, avatar, birthDate });
            App.showToast('成员信息已更新', 'success');
        } else {
            const newMember = this.addMember(name, avatar, color, birthDate);
            App.showToast(`${avatar} ${name} 已加入家庭！`, 'success');
        }

        modal.classList.remove('active');

        // 如果新增的是当前的第一个成员或刚添加的成员，刷新月度计划
        if (typeof MonthlyPlan !== 'undefined') {
            MonthlyPlan.render();
        }
    },

    // 获取家庭排行榜数据
    getFamilyLeaderboard() {
        const members = this.getMembers();
        const leaderboard = members.map(m => {
            const key = this.getMemberDataKey(m.id);
            const saved = localStorage.getItem(key);
            const data = saved ? JSON.parse(saved) : {};
            
            const habits = data.habits || [];
            const checkinHistory = data.checkinHistory || {};
            const today = new Date().toISOString().split('T')[0];
            
            // 今日打卡数
            let todayCheckins = 0;
            habits.forEach(h => {
                if (checkinHistory[h.id] && checkinHistory[h.id][today]) {
                    todayCheckins++;
                }
            });

            // 总打卡天数
            let totalCheckins = 0;
            Object.values(checkinHistory).forEach(history => {
                totalCheckins += Object.keys(history).filter(k => history[k]).length;
            });

            return {
                ...m,
                level: data.user?.level || 1,
                coins: data.user?.coins || 0,
                streak: data.user?.streakDays || 0,
                todayCheckins,
                totalHabits: habits.length,
                totalCheckins,
                goalsCompleted: (data.goals || []).filter(g => g.status === 'completed' || g.progress >= 100).length
            };
        });

        return leaderboard.sort((a, b) => b.streak - a.streak);
    }
};
