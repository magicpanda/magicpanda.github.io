// ===== Firebase 云端同步模块 =====

const Cloud = {
    enabled: false,
    // 内置 Firebase 配置（apiKey 暴露在前端是 Firebase 设计允许的，安全由 DB 规则保证）
    config: {
        apiKey: "AIzaSyAQppNc-MwBdmq_ZfnZVZ-Zl70ZCV8UUUk",
        authDomain: "bitslife-fc04b.firebaseapp.com",
        databaseURL: "https://bitslife-fc04b-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "bitslife-fc04b",
        storageBucket: "bitslife-fc04b.firebasestorage.app",
        messagingSenderId: "68183208251",
        appId: "1:68183208251:web:2fcf929c009349e2ed071e",
        measurementId: "G-X3TPQNLNJ0"
    },
    familyCode: null,
    db: null,
    syncTimeout: null,
    lastSyncTime: null,
    suppressSync: false,
    listenerRef: null,

    // 初始化 - 从 localStorage 加载配置
    init() {
        const saved = localStorage.getItem('8bitslife_cloud_config');
        if (saved) {
            try {
                const { familyCode, enabled } = JSON.parse(saved);
                this.familyCode = familyCode;

                if (enabled && familyCode && typeof firebase !== 'undefined') {
                    this.enable(true).catch(err => console.error(err));
                }
            } catch (e) {
                console.error('Cloud config parse error', e);
            }
        }
    },

    saveConfig() {
        localStorage.setItem('8bitslife_cloud_config', JSON.stringify({
            familyCode: this.familyCode,
            enabled: this.enabled
        }));
    },

    // 验证 Firebase 配置
    validateConfig(config) {
        return config && config.apiKey && config.databaseURL && config.projectId;
    },

    // 启用云同步
    async enable(silent = false) {
        if (!this.validateConfig(this.config)) {
            if (!silent) App.showToast('Firebase 配置不完整', 'error');
            return false;
        }
        if (!this.familyCode) {
            if (!silent) App.showToast('请输入家庭码', 'error');
            return false;
        }

        try {
            // 初始化 Firebase（避免重复初始化）
            if (!firebase.apps.length) {
                firebase.initializeApp(this.config);
            }

            // 尝试匿名登录（用于满足 Firebase 安全规则）
            // 如果未启用匿名认证，会失败但不影响数据库读写（取决于规则）
            try {
                await firebase.auth().signInAnonymously();
            } catch (authErr) {
                console.warn('Anonymous auth not available:', authErr.code);
                // 如果是 CONFIGURATION_NOT_FOUND，提示用户但继续尝试
                if (authErr.code === 'auth/configuration-not-found' || authErr.code === 'auth/admin-restricted-operation') {
                    if (!silent) {
                        App.showToast('⚠️ 匿名登录未启用，将以公开模式连接', 'warning');
                    }
                }
            }

            this.db = firebase.database();

            // 测试数据库连接
            try {
                await this.db.ref('.info/connected').once('value');
            } catch (dbErr) {
                throw new Error('数据库连接失败：' + (dbErr.message || dbErr));
            }

            this.enabled = true;
            this.saveConfig();
            this.updateStatusUI();

            // 启用时检查云端是否有数据
            const snapshot = await this.db.ref(`families/${this.familyCode}`).once('value');
            const remote = snapshot.val();

            if (!silent) {
                if (remote && remote.members && remote.members.length > 0) {
                    const useCloud = confirm(
                        '☁️ 云端发现已有数据。\n\n' +
                        '点击「确定」：使用云端数据（覆盖本地）\n' +
                        '点击「取消」：使用本地数据（覆盖云端）'
                    );
                    if (useCloud) {
                        await this.syncDown();
                        App.showToast('☁️ 云端数据已下载', 'success');
                    } else {
                        await this.syncUp(true);
                        App.showToast('☁️ 本地数据已上传', 'success');
                    }
                } else {
                    await this.syncUp(true);
                    App.showToast('☁️ 已上传本地数据到云端', 'success');
                }
            }

            // 启动监听
            this.listenForChanges();
            return true;
        } catch (err) {
            console.error('Firebase enable error', err);
            const errMsg = this.formatError(err);
            if (!silent) {
                App.showToast('云同步启用失败: ' + errMsg, 'error');
            }
            this.enabled = false;
            return false;
        }
    },

    // 格式化错误信息为用户友好的提示
    formatError(err) {
        const msg = (err && err.message) || String(err);
        const code = (err && err.code) || '';

        if (code === 'auth/configuration-not-found' || msg.includes('CONFIGURATION_NOT_FOUND')) {
            return '请在 Firebase Console 启用「匿名登录」（Authentication → Sign-in method → Anonymous）';
        }
        if (msg.includes('PERMISSION_DENIED') || code === 'PERMISSION_DENIED') {
            return '权限被拒绝，请检查数据库规则（Realtime Database → 规则）';
        }
        if (msg.includes('Network') || code === 'auth/network-request-failed') {
            return '网络错误，请检查网络连接';
        }
        return msg.length > 100 ? msg.substring(0, 100) + '...' : msg;
    },

    // 关闭云同步
    disable() {
        if (this.listenerRef) {
            this.listenerRef.off();
            this.listenerRef = null;
        }
        this.enabled = false;
        this.db = null;
        this.saveConfig();
        this.updateStatusUI();
    },

    // 收集所有本地数据
    collectLocalData() {
        const members = Family.getMembers();
        const data = {};
        members.forEach(m => {
            const key = Family.getMemberDataKey(m.id);
            const saved = localStorage.getItem(key);
            if (saved) {
                try {
                    data[m.id] = JSON.parse(saved);
                } catch (e) {}
            }
        });
        return { members, data };
    },

    // 推送数据到云端（带防抖）
    syncUp(immediate = false) {
        if (!this.enabled || !this.db || this.suppressSync) return Promise.resolve();

        clearTimeout(this.syncTimeout);

        const doSync = async () => {
            try {
                const { members, data } = this.collectLocalData();
                await this.db.ref(`families/${this.familyCode}`).set({
                    members,
                    data,
                    lastUpdate: Date.now()
                });
                this.lastSyncTime = Date.now();
                this.updateStatusUI();
            } catch (err) {
                console.error('Sync up error', err);
            }
        };

        if (immediate) {
            return doSync();
        }
        return new Promise(resolve => {
            this.syncTimeout = setTimeout(() => {
                doSync().then(resolve);
            }, 1500);
        });
    },

    // 从云端拉取数据
    async syncDown() {
        if (!this.enabled || !this.db) return false;

        try {
            const snapshot = await this.db.ref(`families/${this.familyCode}`).once('value');
            const remote = snapshot.val();

            if (!remote || !remote.members) return false;

            this.suppressSync = true;

            // 保存成员列表
            Family.saveMembers(remote.members);

            // 保存每个成员的数据
            if (remote.data) {
                Object.entries(remote.data).forEach(([memberId, data]) => {
                    localStorage.setItem(Family.getMemberDataKey(memberId), JSON.stringify(data));
                });
            }

            // 确保活跃成员仍然存在
            const activeId = Family.getActiveMemberId();
            const stillExists = remote.members.some(m => m.id === activeId);
            if (!stillExists && remote.members.length > 0) {
                Family.setActiveMember(remote.members[0].id);
            }

            // 重新加载当前成员的数据
            Family.loadActiveMemberData();
            Family.renderMemberSwitcher();

            this.lastSyncTime = remote.lastUpdate || Date.now();
            this.updateStatusUI();

            this.suppressSync = false;
            return true;
        } catch (err) {
            this.suppressSync = false;
            console.error('Sync down error', err);
            return false;
        }
    },

    // 监听云端变化
    listenForChanges() {
        if (!this.enabled || !this.db || !this.familyCode) return;

        if (this.listenerRef) {
            this.listenerRef.off();
        }

        this.listenerRef = this.db.ref(`families/${this.familyCode}/lastUpdate`);

        let initialLoad = true;
        this.listenerRef.on('value', (snapshot) => {
            if (initialLoad) {
                initialLoad = false;
                return;
            }

            const remoteTime = snapshot.val();
            // 远端时间比本地新（误差超过2秒）才同步，避免回环
            if (remoteTime && remoteTime > (this.lastSyncTime || 0) + 2000) {
                this.syncDown().then((success) => {
                    if (success) {
                        App.showToast('☁️ 检测到其他设备的更新，已同步', 'info');
                        // 刷新当前视图
                        if (App.currentSection) {
                            App.navigateTo(App.currentSection);
                        }
                        App.updateUserInfo();
                        App.updateStats();
                    }
                });
            }
        });
    },

    // 手动触发同步
    async manualSync() {
        if (!this.enabled) {
            App.showToast('请先启用云同步', 'warning');
            return;
        }
        App.showToast('正在同步...', 'info');
        try {
            await this.syncUp(true);
            await this.syncDown();
            App.showToast('☁️ 同步完成', 'success');
        } catch (err) {
            App.showToast('同步失败: ' + err.message, 'error');
        }
    },

    // 生成随机家庭码
    generateFamilyCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    },

    // 更新设置页面的状态显示
    updateStatusUI() {
        const statusEl = document.getElementById('cloud-sync-status');
        if (!statusEl) return;

        if (this.enabled) {
            const time = this.lastSyncTime
                ? new Date(this.lastSyncTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                : '尚未';
            statusEl.innerHTML = `<span style="color:var(--success);">● 已连接</span> · 上次同步: ${time}`;
        } else {
            statusEl.innerHTML = `<span style="color:var(--text-muted);">○ 未启用</span>`;
        }

        const toggleBtn = document.getElementById('cloud-toggle-btn');
        if (toggleBtn) {
            toggleBtn.textContent = this.enabled ? '关闭云同步' : '启用云同步';
            toggleBtn.classList.toggle('btn-primary', !this.enabled);
            toggleBtn.classList.toggle('btn-secondary', this.enabled);
        }

        // 显示家庭码
        const codeDisplay = document.getElementById('family-code-display');
        if (codeDisplay && this.familyCode) {
            codeDisplay.textContent = this.familyCode;
        }
    },

    // 渲染设置页面
    renderSettingsUI() {
        const container = document.getElementById('cloud-sync-settings');
        if (!container) return;

        container.innerHTML = `
            <div class="cloud-status-row">
                <span class="cloud-status-label">同步状态</span>
                <span id="cloud-sync-status">${this.enabled ? '<span style="color:var(--success);">● 已连接</span>' : '<span style="color:var(--text-muted);">○ 未启用</span>'}</span>
            </div>

            <div class="cloud-config-section">
                <div class="form-group">
                    <label>家庭码</label>
                    <div style="display:flex;gap:0.5rem;">
                        <input type="text" id="cloud-family-code-input" value="${this.familyCode || ''}" placeholder="例如：SMITH2026" maxlength="20" style="flex:1;text-transform:uppercase;letter-spacing:1px;font-weight:600;" ${this.enabled ? 'disabled' : ''}>
                        ${!this.enabled ? '<button class="btn-secondary" id="btn-gen-family-code" style="padding:0.5rem 1rem;font-size:0.8rem;">随机</button>' : ''}
                    </div>
                    <span class="form-hint">家人在他们的设备上输入相同的家庭码即可看到家庭数据</span>
                </div>

                <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                    <button class="btn-primary" id="cloud-toggle-btn">${this.enabled ? '关闭云同步' : '启用云同步'}</button>
                    ${this.enabled ? '<button class="btn-secondary" id="cloud-manual-sync-btn">立即同步</button>' : ''}
                </div>
            </div>

            <div class="cloud-help">
                <h4>💡 这是什么？</h4>
                <p>云同步可以让你和家人在不同设备（手机、iPad、电脑）上看到同一份家庭数据。每次有人打卡、添加目标，所有人的设备都会自动更新。</p>

                <h4>🚀 如何使用？</h4>
                <ol>
                    <li>设定一个家庭码（任意字母数字组合，比如全家姓氏 + 年份）</li>
                    <li>点击"启用云同步"</li>
                    <li>家人在他们的设备上打开网站，输入同一个家庭码即可同步</li>
                </ol>

                <h4>⚙️ 部署者必读：Firebase 必须配置</h4>
                <p>如果遇到 <code>CONFIGURATION_NOT_FOUND</code> 错误，需要在 Firebase Console 完成以下设置：</p>
                <ol>
                    <li>访问 <a href="https://console.firebase.google.com/project/bitslife-fc04b/authentication/providers" target="_blank" rel="noopener">Authentication → Sign-in method</a></li>
                    <li>启用「匿名」（Anonymous）登录方式</li>
                    <li>访问 <a href="https://console.firebase.google.com/project/bitslife-fc04b/database/bitslife-fc04b-default-rtdb/rules" target="_blank" rel="noopener">Realtime Database → 规则</a></li>
                    <li>设置规则为下方推荐配置并发布</li>
                </ol>

                <h4>🔒 推荐数据库规则</h4>
                <pre>{
  "rules": {
    "families": {
      "$family": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}</pre>
                <p style="margin-top:0.5rem;">如果不想启用匿名登录，可临时使用 <code>".read": true, ".write": true</code>（不推荐生产环境使用）。</p>

                <h4>🛡️ 隐私说明</h4>
                <p>家庭码是数据隔离的钥匙，只有知道你家庭码的人才能看到你的数据。建议设置一个不容易被猜到的码（避免使用"123456"或常见名字）。</p>
            </div>
        `;

        this.bindSettingsEvents();
    },

    bindSettingsEvents() {
        // 随机生成家庭码
        document.getElementById('btn-gen-family-code')?.addEventListener('click', () => {
            document.getElementById('cloud-family-code-input').value = this.generateFamilyCode();
        });

        // 启用/关闭云同步
        document.getElementById('cloud-toggle-btn')?.addEventListener('click', async () => {
            if (this.enabled) {
                if (confirm('确定关闭云同步吗？本地数据不会被删除。')) {
                    this.disable();
                    App.showToast('云同步已关闭', 'info');
                    this.renderSettingsUI();
                }
                return;
            }

            const familyCode = document.getElementById('cloud-family-code-input').value.trim().toUpperCase();

            if (!familyCode) {
                App.showToast('请输入家庭码', 'warning');
                return;
            }
            if (familyCode.length < 4) {
                App.showToast('家庭码至少需要4位字符', 'warning');
                return;
            }

            this.familyCode = familyCode;

            const success = await this.enable();
            if (success) {
                this.renderSettingsUI();
            }
        });

        // 立即同步
        document.getElementById('cloud-manual-sync-btn')?.addEventListener('click', () => {
            this.manualSync();
        });
    }
};
