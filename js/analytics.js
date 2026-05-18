// ===== 数据分析模块 =====

const Analytics = {
    init() {
        this.renderHeatmap();
        this.renderGrowthChart();
        this.updateCompletionRing();
        this.bindEvents();
    },

    // 渲染热力图
    renderHeatmap() {
        const container = document.getElementById('heatmap');
        container.innerHTML = '';

        // 月份标签
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        const categories = ['学习', '工作', '生活', '娱乐', '健康'];
        const catKeys = ['study', 'work', 'life', 'entertainment', 'health'];

        // 创建标签行
        const labelsDiv = document.createElement('div');
        labelsDiv.className = 'heatmap-labels';
        months.forEach(m => {
            const label = document.createElement('span');
            label.className = 'heatmap-label';
            label.textContent = m;
            labelsDiv.appendChild(label);
        });
        container.appendChild(labelsDiv);

        // 为每个分类创建一行
        catKeys.forEach((catKey, catIndex) => {
            const rowWrapper = document.createElement('div');
            rowWrapper.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;';
            
            const rowLabel = document.createElement('span');
            rowLabel.style.cssText = 'font-size:0.7rem;color:var(--text-muted);min-width:35px;text-align:right;';
            rowLabel.textContent = categories[catIndex];
            rowWrapper.appendChild(rowLabel);

            const rowCells = document.createElement('div');
            rowCells.style.cssText = 'display:grid;grid-template-columns:repeat(12,1fr);gap:4px;flex:1;';

            for (let month = 0; month < 12; month++) {
                const cell = document.createElement('div');
                cell.className = 'heatmap-cell';
                
                // 根据时间线数据计算热度
                const level = this.calculateHeatLevel(catKey, month);
                cell.setAttribute('data-level', level);
                cell.title = `${categories[catIndex]} - ${months[month]}: 活跃度 ${level}/5`;
                
                rowCells.appendChild(cell);
            }

            rowWrapper.appendChild(rowCells);
            container.appendChild(rowWrapper);
        });

        // 图例
        const legend = document.createElement('div');
        legend.className = 'heatmap-legend';
        legend.innerHTML = `
            <span>少</span>
            <div class="heatmap-legend-cell" style="background:var(--bg);border:1px solid var(--border);"></div>
            <div class="heatmap-legend-cell" style="background:rgba(108,92,231,0.2);"></div>
            <div class="heatmap-legend-cell" style="background:rgba(108,92,231,0.4);"></div>
            <div class="heatmap-legend-cell" style="background:rgba(108,92,231,0.6);"></div>
            <div class="heatmap-legend-cell" style="background:rgba(108,92,231,0.8);"></div>
            <div class="heatmap-legend-cell" style="background:var(--primary);"></div>
            <span>多</span>
        `;
        container.appendChild(legend);
    },

    // 计算热度等级
    calculateHeatLevel(category, month) {
        // 基于时间线数据和目标进度计算
        const allCards = Object.values(AppData.timelineData).flat();
        const categoryCards = allCards.filter(c => c.category === category);
        const goals = AppData.goals.filter(g => {
            const card = allCards.find(c => c.id === g.cardId);
            return card && card.category === category;
        });

        // 基础热度来自卡片数量
        let baseLevel = Math.min(3, categoryCards.length);
        
        // 目标进度增加热度
        const avgProgress = goals.length > 0 
            ? goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length 
            : 0;
        
        if (avgProgress > 50) baseLevel = Math.min(5, baseLevel + 1);
        if (avgProgress > 80) baseLevel = Math.min(5, baseLevel + 1);

        // 添加一些随机性使热力图更有趣
        const randomOffset = Math.random() < 0.3 ? 1 : 0;
        return Math.min(5, Math.max(0, baseLevel + randomOffset - (Math.random() < 0.2 ? 1 : 0)));
    },

    // 渲染成长曲线
    renderGrowthChart() {
        const canvas = document.getElementById('growth-chart');
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width - 48 || 600;
        canvas.height = 280;

        const width = canvas.width;
        const height = canvas.height;
        const padding = { top: 30, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // 清空
        ctx.clearRect(0, 0, width, height);

        // 生成数据点（基于角色属性历史模拟）
        const attributes = [
            { name: '健康', color: '#ff7675', value: AppData.character.health },
            { name: '财富', color: '#fdcb6e', value: AppData.character.wealth },
            { name: '幸福', color: '#fd79a8', value: AppData.character.happiness },
            { name: '智慧', color: '#a29bfe', value: AppData.character.wisdom },
            { name: '社交', color: '#81ecec', value: AppData.character.social }
        ];

        // 绘制网格
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            // Y轴标签
            ctx.fillStyle = '#a0a0b0';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(100 - i * 20, padding.left - 10, y + 4);
        }

        // X轴标签（年龄阶段）
        const stages = AppData.stageGroups.map(g => g.name);
        stages.forEach((stage, i) => {
            const x = padding.left + (chartWidth / (stages.length - 1)) * i;
            ctx.fillStyle = '#a0a0b0';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(stage, x, height - 10);
        });

        // 绘制每条属性曲线
        attributes.forEach(attr => {
            const points = this.generateGrowthPoints(attr.value, 5);
            
            ctx.beginPath();
            ctx.strokeStyle = attr.color;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';

            points.forEach((point, i) => {
                const x = padding.left + (chartWidth / (points.length - 1)) * i;
                const y = padding.top + chartHeight - (point / 100) * chartHeight;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // 绘制数据点
            points.forEach((point, i) => {
                const x = padding.left + (chartWidth / (points.length - 1)) * i;
                const y = padding.top + chartHeight - (point / 100) * chartHeight;
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = attr.color;
                ctx.fill();
            });
        });

        // 图例
        const legendY = padding.top - 15;
        let legendX = padding.left;
        attributes.forEach(attr => {
            ctx.fillStyle = attr.color;
            ctx.fillRect(legendX, legendY - 8, 12, 12);
            ctx.fillStyle = '#f0f0f0';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(attr.name, legendX + 16, legendY + 2);
            legendX += 70;
        });
    },

    // 生成成长数据点
    generateGrowthPoints(currentValue, count) {
        const points = [];
        let value = Math.max(10, currentValue - 30 - Math.random() * 20);
        
        for (let i = 0; i < count; i++) {
            points.push(Math.round(value));
            const growth = (currentValue - value) / (count - i) + (Math.random() - 0.3) * 10;
            value = Math.max(5, Math.min(100, value + growth));
        }
        
        // 确保最后一个点接近当前值
        points[count - 1] = currentValue;
        return points;
    },

    // 更新完成率环形图
    updateCompletionRing() {
        const totalGoals = AppData.goals.length;
        const completedGoals = AppData.goals.filter(g => g.progress >= 100).length;
        const percentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

        const ringFill = document.getElementById('ring-fill');
        const ringText = document.getElementById('ring-text');

        if (ringFill && ringText) {
            // 圆周长 = 2 * π * r = 2 * 3.14159 * 80 ≈ 502.65
            const circumference = 502.65;
            const offset = circumference - (percentage / 100) * circumference;
            
            ringFill.style.strokeDasharray = circumference;
            ringFill.style.strokeDashoffset = offset;
            ringFill.style.stroke = percentage > 60 ? '#00b894' : percentage > 30 ? '#fdcb6e' : '#6c5ce7';
            ringText.textContent = percentage + '%';
        }
    },

    // 生成AI建议
    generateSuggestions() {
        const suggestions = [];
        const char = AppData.character;
        const goals = AppData.goals;
        const timelineCards = Object.values(AppData.timelineData).flat();

        // 基于属性分析
        if (char.health < 40) {
            suggestions.push({
                type: '健康建议',
                text: '你的健康属性偏低，建议增加运动相关的目标，如每周锻炼3次或学习瑜伽。'
            });
        }

        if (char.wealth < 30) {
            suggestions.push({
                type: '财务建议',
                text: '财富积累需要规划。建议设定理财学习目标，或考虑发展副业增加收入来源。'
            });
        }

        if (char.social < 35) {
            suggestions.push({
                type: '社交建议',
                text: '社交属性较低，可以尝试加入兴趣社群、参加志愿活动来扩展人脉。'
            });
        }

        if (char.wisdom < 40) {
            suggestions.push({
                type: '学习建议',
                text: '智慧的提升需要持续学习。建议每月阅读2本书，或报名在线课程。'
            });
        }

        // 基于目标分析
        const highPriorityGoals = goals.filter(g => g.priority === 'high' && g.progress < 50);
        if (highPriorityGoals.length > 0) {
            suggestions.push({
                type: '优先级提醒',
                text: `你有 ${highPriorityGoals.length} 个高优先级目标进度不足50%，建议集中精力推进。`
            });
        }

        const longDurationGoals = goals.filter(g => g.duration > 24 && g.progress < 30);
        if (longDurationGoals.length > 0) {
            suggestions.push({
                type: '长期规划',
                text: '部分长期目标进展缓慢，建议拆分为更小的里程碑，每月检查进度。'
            });
        }

        // 基于时间线分析
        const emptyGroups = AppData.stageGroups.filter(group => {
            const groupStages = AppData.stages.filter(s => s.group === group.id);
            return groupStages.every(s => (AppData.timelineData[s.id] || []).length === 0);
        });
        if (emptyGroups.length > 0) {
            suggestions.push({
                type: '规划建议',
                text: `"${emptyGroups.map(g => g.name).join('、')}" 阶段还没有规划，建议为每个人生阶段都设定目标。`
            });
        }

        // 通用建议
        if (suggestions.length === 0) {
            suggestions.push({
                type: '综合评价',
                text: '你的人生规划看起来很均衡！继续保持，定期回顾和调整目标。'
            });
            suggestions.push({
                type: '进阶建议',
                text: '尝试为每个目标设定具体的子任务和时间节点，这样更容易追踪进度。'
            });
        }

        return suggestions;
    },

    // 显示AI建议
    showSuggestions() {
        const container = document.getElementById('ai-suggestions');
        const suggestions = this.generateSuggestions();

        container.innerHTML = suggestions.map(s => `
            <div class="ai-suggestion-item">
                <div class="suggestion-type">${s.type}</div>
                <div>${s.text}</div>
            </div>
        `).join('');

        App.showToast('AI建议已更新', 'info');
    },

    // 绑定事件
    bindEvents() {
        document.getElementById('btn-get-suggestions').addEventListener('click', () => {
            this.showSuggestions();
        });

        // 窗口大小变化时重绘图表
        window.addEventListener('resize', () => {
            if (!document.getElementById('analytics').classList.contains('hidden')) {
                this.renderGrowthChart();
            }
        });
    }
};
