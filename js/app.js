// ===== 主应用控制器 =====

const App = {
    currentSection: 'welcome',

    init() {
        // 初始化家庭成员系统（必须在其他模块之前）
        Family.init();
        Family.patchSave();

        // 初始化云同步
        if (typeof Cloud !== 'undefined') {
            Cloud.init();
        }

        this.bindNavigation();
        this.bindMemberModals();
        this.bindMorePage();
        this.bindCloudSync();
        this.updateUserInfo();
        this.updateStats();

        // 初始化各模块
        Timeline.init();
        Goals.init();
        Checkin.init();
        MonthlyPlan.init();
        Game.init();
        Achievements.init();
        Analytics.init();

        // 开始按钮 - 直接进入月度规划
        document.getElementById('btn-start').addEventListener('click', () => {
            this.navigateTo('monthly');
        });

        // 检查成就
        Achievements.checkAchievements();
    },

    // 导航绑定
    bindNavigation() {
        // 顶部导航
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.navigateTo(section);
            });
        });

        // 底部导航
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateTo(section);
            });
        });
    },

    // 绑定成员弹窗事件
    bindMemberModals() {
        // 成员弹窗
        const memberModal = document.getElementById('member-modal');
        document.getElementById('btn-save-member')?.addEventListener('click', () => {
            Family.saveMember();
        });
        document.getElementById('btn-cancel-member')?.addEventListener('click', () => {
            memberModal.classList.remove('active');
        });
        document.getElementById('member-modal-close')?.addEventListener('click', () => {
            memberModal.classList.remove('active');
        });

        // 头像选择
        document.querySelectorAll('.member-avatar-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.member-avatar-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        // 管理弹窗
        document.getElementById('manage-modal-close')?.addEventListener('click', () => {
            document.getElementById('manage-members-modal').classList.remove('active');
        });
    },

    // 绑定云同步入口
    bindCloudSync() {
        document.getElementById('btn-settings-cloud-sync')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateTo('cloud-sync');
        });

        document.getElementById('btn-back-from-cloud')?.addEventListener('click', () => {
            this.navigateTo('settings');
        });
    },

    // 绑定"设置"页面
    bindMorePage() {
        document.querySelectorAll('.more-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateTo(section);
            });
        });

        document.getElementById('btn-settings-add-member')?.addEventListener('click', (e) => {
            e.preventDefault();
            Family.openManageModal();
        });
    },

    // 导航到指定模块
    navigateTo(section) {
        // 隐藏所有section
        document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));

        // 显示目标section
        const target = document.getElementById(section);
        if (target) {
            target.classList.remove('hidden');
        }

        // 更新顶部导航高亮
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-section="${section}"]`);
        if (activeLink) activeLink.classList.add('active');

        // 更新底部导航高亮
        document.querySelectorAll('.bottom-nav-item').forEach(l => l.classList.remove('active'));
        const activeBottom = document.querySelector(`.bottom-nav-item[data-section="${section}"]`);
        if (activeBottom) activeBottom.classList.add('active');

        this.currentSection = section;

        // 记录访问模块
        if (!AppData.visitedModules.includes(section)) {
            AppData.visitedModules.push(section);
            AppData.save();
            Achievements.checkAchievements();
        }

        // 特定模块的刷新
        if (section === 'analytics') {
            Analytics.renderGrowthChart();
            Analytics.renderHeatmap();
            Analytics.updateCompletionRing();
        }
        if (section === 'achievements') {
            Achievements.renderAchievements();
        }
        if (section === 'goals') {
            Goals.renderGoalsList();
        }
        if (section === 'timeline') {
            Timeline.renderStages();
        }
        if (section === 'checkin') {
            Checkin.renderCheckinPage();
            this.renderMotivationBanner();
            this.renderFamilyLeaderboard();
        }
        if (section === 'monthly') {
            MonthlyPlan.render();
        }
        if (section === 'cloud-sync' && typeof Cloud !== 'undefined') {
            Cloud.renderSettingsUI();
        }
        if (section === 'settings') {
            this.updateCloudSummary();
        }

        // 滚动到顶部
        window.scrollTo(0, 0);
    },

    // 渲染激励横幅
    renderMotivationBanner() {
        const container = document.getElementById('motivation-banner-container');
        if (!container) return;

        const streak = AppData.user.streakDays || 0;
        const habits = AppData.habits || [];
        const today = new Date().toISOString().split('T')[0];
        const todayChecked = habits.filter(h => {
            const history = AppData.checkinHistory[h.id] || {};
            return !!history[today];
        }).length;

        let banner = '';

        // 根据状态显示不同激励
        if (todayChecked === habits.length && habits.length > 0) {
            // 今天全部完成
            banner = `
                <div class="motivation-banner" style="border-color:rgba(0,184,148,0.4);background:linear-gradient(135deg,rgba(0,184,148,0.1),rgba(0,206,201,0.1));">
                    <span class="motivation-icon">🎉</span>
                    <div class="motivation-content">
                        <div class="motivation-title">今日全部完成！太棒了！</div>
                        <div class="motivation-text">你已经连续坚持了 ${streak} 天，继续保持这个节奏！</div>
                        <div class="motivation-reward">🪙 +${streak >= 7 ? 10 : 5} 金币已到账</div>
                    </div>
                </div>
            `;
        } else if (streak >= 7) {
            // 连续打卡超过7天
            const nextMilestone = streak < 30 ? 30 : streak < 100 ? 100 : streak < 365 ? 365 : null;
            banner = `
                <div class="motivation-banner">
                    <span class="motivation-icon">🔥</span>
                    <div class="motivation-content">
                        <div class="motivation-title">连续 ${streak} 天！势不可挡</div>
                        <div class="motivation-text">${nextMilestone ? `距离 ${nextMilestone} 天里程碑还差 ${nextMilestone - streak} 天` : '你已经是传奇了！'}</div>
                        <div class="motivation-reward">🪙 里程碑奖励 +${nextMilestone === 30 ? 50 : nextMilestone === 100 ? 200 : 500}</div>
                    </div>
                </div>
            `;
        } else if (habits.length > 0 && todayChecked === 0) {
            // 今天还没开始
            banner = `
                <div class="motivation-banner">
                    <span class="motivation-icon">💪</span>
                    <div class="motivation-content">
                        <div class="motivation-title">新的一天，新的开始</div>
                        <div class="motivation-text">今天有 ${habits.length} 个习惯等你打卡，完成即可获得奖励！</div>
                        <div class="motivation-reward">🪙 全部完成 +${habits.length * 3} 金币</div>
                    </div>
                </div>
            `;
        } else if (habits.length === 0) {
            banner = `
                <div class="motivation-banner">
                    <span class="motivation-icon">🌱</span>
                    <div class="motivation-content">
                        <div class="motivation-title">开始你的第一个小习惯</div>
                        <div class="motivation-text">不需要宏大的目标，每天5分钟就够了。千里之行，始于足下。</div>
                    </div>
                </div>
            `;
        } else {
            // 部分完成
            banner = `
                <div class="motivation-banner">
                    <span class="motivation-icon">⚡</span>
                    <div class="motivation-content">
                        <div class="motivation-title">已完成 ${todayChecked}/${habits.length}，继续加油！</div>
                        <div class="motivation-text">还差 ${habits.length - todayChecked} 个就全部完成了，你可以的！</div>
                        <div class="motivation-reward">🪙 全部完成额外 +${(habits.length - todayChecked) * 2} 金币</div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = banner;
    },

    // 渲染家庭排行榜
    renderFamilyLeaderboard() {
        const container = document.getElementById('family-leaderboard-container');
        if (!container) return;

        const members = Family.getMembers();
        // 只有多个成员时才显示排行榜
        if (members.length <= 1) {
            container.innerHTML = '';
            return;
        }

        const leaderboard = Family.getFamilyLeaderboard();
        const activeId = Family.getActiveMemberId();
        const rankIcons = ['🥇', '🥈', '🥉'];

        container.innerHTML = `
            <div class="family-leaderboard">
                <div class="leaderboard-title">👨‍👩‍👧‍👦 家庭排行榜</div>
                <div class="leaderboard-list">
                    ${leaderboard.map((m, i) => `
                        <div class="leaderboard-item ${m.id === activeId ? 'current-user' : ''}">
                            <span class="leaderboard-rank">${rankIcons[i] || (i + 1)}</span>
                            <span class="leaderboard-avatar" style="background:${m.color}">${m.avatar}</span>
                            <div class="leaderboard-info">
                                <div class="leaderboard-name">${m.name} ${m.id === activeId ? '(我)' : ''}</div>
                                <div class="leaderboard-stats">
                                    <span>Lv.${m.level}</span>
                                    <span>🪙${m.coins}</span>
                                    <span>今日${m.todayCheckins}/${m.totalHabits}</span>
                                </div>
                            </div>
                            <span class="leaderboard-streak">🔥${m.streak}天</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // 显示里程碑弹窗
    showMilestone(icon, title, desc, reward) {
        // 创建遮罩和弹窗
        const overlay = document.createElement('div');
        overlay.className = 'milestone-overlay';
        
        const popup = document.createElement('div');
        popup.className = 'milestone-popup';
        popup.innerHTML = `
            <span class="milestone-icon">${icon}</span>
            <div class="milestone-title">${title}</div>
            <div class="milestone-desc">${desc}</div>
            ${reward ? `<div class="milestone-reward">🪙 +${reward} 金币</div>` : ''}
            <button class="btn-primary" style="margin-top:0.5rem;">太棒了！</button>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        const close = () => {
            overlay.remove();
            popup.remove();
        };

        popup.querySelector('button').addEventListener('click', close);
        overlay.addEventListener('click', close);

        // 5秒后自动关闭
        setTimeout(close, 5000);
    },

    // 更新设置页面云同步摘要
    updateCloudSummary() {
        const el = document.getElementById('cloud-sync-summary');
        if (!el) return;
        if (typeof Cloud === 'undefined' || !Cloud.enabled) {
            el.textContent = '未启用 · 启用后家庭成员可跨设备同步';
        } else {
            el.textContent = `已启用 · 家庭码: ${Cloud.familyCode}`;
        }
    },

    // 更新用户信息显示
    updateUserInfo() {
        document.getElementById('coin-count').textContent = AppData.user.coins;
        document.getElementById('user-level').textContent = AppData.user.level;
    },

    // 更新统计数据
    updateStats() {
        const totalGoals = AppData.goals.length;
        const completedGoals = AppData.goals.filter(g => g.progress >= 100 || g.status === 'completed').length;
        const totalAchievements = AppData.unlockedAchievements.length;

        document.getElementById('total-goals').textContent = totalGoals;
        document.getElementById('completed-goals').textContent = completedGoals;
        document.getElementById('total-achievements').textContent = totalAchievements;
        document.getElementById('streak-days').textContent = AppData.user.streakDays;
    },

    // 显示Toast通知
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
