// 等待DOM内容加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 移动端菜单切换功能
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }
    
    // 导航栏滚动效果
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // 滚动动画初始化
    const animateElements = document.querySelectorAll('.animate');
    
    // 立即检查一次元素是否在视口中
    checkIfInView();
    
    // 滚动时检查元素是否在视口中
    window.addEventListener('scroll', checkIfInView);
    
    function checkIfInView() {
        const windowHeight = window.innerHeight;
        const windowTopPosition = window.scrollY;
        const windowBottomPosition = windowTopPosition + windowHeight;
        
        animateElements.forEach(function(element) {
            const elementHeight = element.offsetHeight;
            const elementTopPosition = getOffsetTop(element);
            const elementBottomPosition = elementTopPosition + elementHeight;
            
            // 检查元素是否在视口中
            if (
                elementBottomPosition >= windowTopPosition && 
                elementTopPosition <= windowBottomPosition
            ) {
                element.classList.add('animated');
            }
        });
    }
    
    // 获取元素距离文档顶部的距离
    function getOffsetTop(element) {
        let offsetTop = 0;
        
        while(element) {
            offsetTop += element.offsetTop;
            element = element.offsetParent;
        }
        
        return offsetTop;
    }
    
    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            
            // 检查目标元素是否存在
            if (targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // 关闭移动菜单（如果打开）
                    if (nav.classList.contains('active')) {
                        nav.classList.remove('active');
                    }
                    
                    // 计算滚动目标位置（考虑固定导航栏高度）
                    const headerHeight = header.offsetHeight;
                    const targetPosition = getOffsetTop(targetElement) - headerHeight;
                    
                    // 平滑滚动
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // 如果存在轮播图，初始化轮播功能
    initTestimonialSlider();
    
    function initTestimonialSlider() {
        const testimonials = document.querySelectorAll('.testimonial');
        const navDots = document.querySelectorAll('.nav-dot');
        
        if (testimonials.length && navDots.length) {
            let currentIndex = 0;
            
            // 显示特定索引的轮播项
            function showTestimonial(index) {
                // 隐藏所有轮播项
                testimonials.forEach(item => {
                    item.classList.remove('active');
                });
                
                // 移除所有导航点的激活状态
                navDots.forEach(dot => {
                    dot.classList.remove('active');
                });
                
                // 显示当前轮播项
                testimonials[index].classList.add('active');
                navDots[index].classList.add('active');
                
                currentIndex = index;
            }
            
            // 设置导航点点击事件
            navDots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    showTestimonial(index);
                });
            });
            
            // 自动轮播
            let autoSlide = setInterval(() => {
                let nextIndex = (currentIndex + 1) % testimonials.length;
                showTestimonial(nextIndex);
            }, 5000);
            
            // 鼠标悬停时暂停自动轮播
            const testimonialContainer = document.querySelector('.testimonial-container');
            if (testimonialContainer) {
                testimonialContainer.addEventListener('mouseenter', () => {
                    clearInterval(autoSlide);
                });
                
                testimonialContainer.addEventListener('mouseleave', () => {
                    autoSlide = setInterval(() => {
                        let nextIndex = (currentIndex + 1) % testimonials.length;
                        showTestimonial(nextIndex);
                    }, 5000);
                });
            }
        }
    }
    
    // 数字增长动画
    animateNumbers();
    
    function animateNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'), 10);
            
            if (target) {
                let current = 0;
                const increment = Math.ceil(target / 100);
                
                const updateNumber = () => {
                    current += increment;
                    
                    if (current < target) {
                        stat.textContent = current;
                        setTimeout(updateNumber, 10);
                    } else {
                        stat.textContent = target;
                    }
                };
                
                const observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            updateNumber();
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.5 });
                
                observer.observe(stat);
            }
        });
    }
    
    // BMI计算器功能（如果在页面上存在）
    const bmiForm = document.getElementById('bmi-form');
    
    if (bmiForm) {
        bmiForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取身高（厘米）和体重（千克）
            const height = parseFloat(document.getElementById('height').value);
            const weight = parseFloat(document.getElementById('weight').value);
            
            if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
                alert('请输入有效的身高和体重');
                return;
            }
            
            // 计算BMI（体重(kg) / 身高(m)²）
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);
            
            // 确定BMI范围
            let category = '';
            if (bmi < 18.5) {
                category = '体重过轻';
            } else if (bmi >= 18.5 && bmi < 24) {
                category = '正常体重';
            } else if (bmi >= 24 && bmi < 28) {
                category = '超重';
            } else if (bmi >= 28) {
                category = '肥胖';
            }
            
            // 显示结果
            const resultDiv = document.getElementById('bmi-result');
            resultDiv.innerHTML = `
                <div class="result-box">
                    <h3>您的BMI指数: <span class="highlight">${bmi.toFixed(1)}</span></h3>
                    <p>BMI分类: <strong>${category}</strong></p>
                    <p class="result-desc">${getBMIDescription(category)}</p>
                </div>
            `;
            resultDiv.style.display = 'block';
        });
    }
    
    // 根据BMI分类返回描述
    function getBMIDescription(category) {
        switch (category) {
            case '体重过轻':
                return '您的体重低于健康范围。建议增加营养摄入，并咨询医生或营养师的建议。';
            case '正常体重':
                return '恭喜！您的体重在健康范围内。继续保持均衡饮食和规律运动。';
            case '超重':
                return '您的体重略高于健康范围。建议适当控制饮食并增加运动量。';
            case '肥胖':
                return '您的体重显著高于健康范围。建议咨询医生或营养师制定减重计划。';
            default:
                return '';
        }
    }
    
    // TDEE计算器功能（如果在页面上存在）
    const tdeeForm = document.getElementById('tdee-form');
    
    if (tdeeForm) {
        tdeeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取用户输入
            const age = parseInt(document.getElementById('age').value);
            const gender = document.querySelector('input[name="gender"]:checked').value;
            const height = parseFloat(document.getElementById('height-tdee').value);
            const weight = parseFloat(document.getElementById('weight-tdee').value);
            const activityLevel = parseFloat(document.getElementById('activity').value);
            
            if (isNaN(age) || isNaN(height) || isNaN(weight) || age <= 0 || height <= 0 || weight <= 0) {
                alert('请输入有效的年龄、身高和体重');
                return;
            }
            
            // 计算BMR（基础代谢率）- 使用Mifflin-St Jeor方程
            let bmr;
            if (gender === 'male') {
                bmr = 10 * weight + 6.25 * height - 5 * age + 5;
            } else {
                bmr = 10 * weight + 6.25 * height - 5 * age - 161;
            }
            
            // 计算TDEE（总能量消耗）
            const tdee = bmr * activityLevel;
            
            // 计算不同目标的卡路里需求
            const weightLoss = tdee - 500; // 减轻体重（每周减约0.5kg）
            const maintenance = tdee;      // 维持体重
            const weightGain = tdee + 500; // 增加体重（每周增约0.5kg）
            
            // 显示结果
            const resultDiv = document.getElementById('tdee-result');
            resultDiv.innerHTML = `
                <div class="result-box">
                    <h3>您的TDEE: <span class="highlight">${Math.round(tdee)}</span> 卡路里/天</h3>
                    <p>基础代谢率(BMR): ${Math.round(bmr)} 卡路里/天</p>
                    <div class="goals-section">
                        <h4>根据您的目标：</h4>
                        <ul>
                            <li><strong>减轻体重:</strong> 每天摄入约 ${Math.round(weightLoss)} 卡路里</li>
                            <li><strong>维持体重:</strong> 每天摄入约 ${Math.round(maintenance)} 卡路里</li>
                            <li><strong>增加体重:</strong> 每天摄入约 ${Math.round(weightGain)} 卡路里</li>
                        </ul>
                    </div>
                    <p class="result-note">注：这些只是估算值，实际需求可能因个体差异而异。建议咨询专业营养师获取个性化的饮食建议。</p>
                </div>
            `;
            resultDiv.style.display = 'block';
        });
    }
    
    // 一次性训练计划生成器（如果在页面上存在）
    const programForm = document.getElementById('program-form');
    
    if (programForm) {
        programForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取用户输入
            const goal = document.getElementById('goal').value;
            const experience = document.getElementById('experience').value;
            const frequency = parseInt(document.getElementById('frequency').value);
            
            // 生成训练计划
            const workoutPlan = generateWorkoutPlan(goal, experience, frequency);
            
            // 显示结果
            const resultDiv = document.getElementById('program-result');
            resultDiv.innerHTML = workoutPlan;
            resultDiv.style.display = 'block';
        });
    }
    
    // 生成训练计划
    function generateWorkoutPlan(goal, experience, frequency) {
        let plan = '<div class="result-box">';
        plan += `<h3>您的个性化训练计划</h3>`;
        plan += `<p>目标: <strong>${goalText(goal)}</strong> | 经验水平: <strong>${experienceText(experience)}</strong> | 每周训练: <strong>${frequency}天</strong></p>`;
        
        // 根据目标和经验水平生成特定的训练计划
        if (goal === "strength") {
            plan += generateStrengthPlan(experience, frequency);
        } else if (goal === "muscle") {
            plan += generateMusclePlan(experience, frequency);
        } else if (goal === "endurance") {
            plan += generateEndurancePlan(experience, frequency);
        } else if (goal === "weight-loss") {
            plan += generateWeightLossPlan(experience, frequency);
        }
        
        plan += '<p class="result-note">注：此计划仅供参考，建议根据个人情况调整，并在安全环境中进行训练。</p>';
        plan += '</div>';
        
        return plan;
    }
    
    // 目标文字转换
    function goalText(goal) {
        switch (goal) {
            case 'strength': return '增强力量';
            case 'muscle': return '增肌';
            case 'endurance': return '提高耐力';
            case 'weight-loss': return '减脂';
            default: return goal;
        }
    }
    
    // 经验水平文字转换
    function experienceText(experience) {
        switch (experience) {
            case 'beginner': return '初学者';
            case 'intermediate': return '中级';
            case 'advanced': return '高级';
            default: return experience;
        }
    }
    
    // 力量训练计划
    function generateStrengthPlan(experience, frequency) {
        let plan = '<div class="plan-section">';
        
        if (experience === 'beginner') {
            if (frequency <= 3) {
                plan += `
                    <h4>全身训练计划（每周${frequency}天）</h4>
                    <div class="workout-days">
                        ${frequency >= 1 ? generateWorkoutDay('第1天 - 全身训练', ['深蹲 3×8', '俯卧撑 3×10', '杠铃划船 3×10', '哑铃肩推 3×10', '硬拉 3×8']) : ''}
                        ${frequency >= 2 ? generateWorkoutDay('第2天 - 全身训练', ['箭步蹲 3×10/侧', '卧推 3×8', '引体向上（辅助）3×8', '侧平举 3×12', '腹部卷曲 3×15']) : ''}
                        ${frequency >= 3 ? generateWorkoutDay('第3天 - 全身训练', ['保加利亚分腿蹲 3×10/侧', '斜卧推 3×10', '坐姿划船 3×12', '颈后推举 3×10', '腹板 3组×30秒']) : ''}
                    </div>
                `;
            } else {
                plan += `
                    <h4>上下肢分化计划（每周${frequency}天）</h4>
                    <div class="workout-days">
                        <p>注：每周训练${frequency}天，按顺序循环以下训练日，每天休息1天</p>
                        ${generateWorkoutDay('上肢训练', ['俯卧撑 3×12', '哑铃划船 3×12', '哑铃肩推 3×12', '二头弯举 3×12', '三头下压 3×12'])}
                        ${generateWorkoutDay('下肢训练', ['深蹲 3×10', '硬拉 3×8', '箭步蹲 3×10/侧', '小腿提踵 3×15', '腹部卷曲 3×15'])}
                        ${generateWorkoutDay('全身训练', ['卧推 3×10', '引体向上（辅助）3×8', '肩推 3×10', '腿举 3×12', '侧平举 3×12'])}
                    </div>
                `;
            }
        } else if (experience === 'intermediate') {
            if (frequency <= 4) {
                plan += `
                    <h4>上下肢分化计划（每周${frequency}天）</h4>
                    <div class="workout-days">
                        ${frequency >= 1 ? generateWorkoutDay('第1天 - 推', ['卧推 4×6-8', '上斜卧推 3×8-10', '哑铃肩推 3×8-10', '侧平举 3×10-12', '绳索下压 3×10-12']) : ''}
                        ${frequency >= 2 ? generateWorkoutDay('第2天 - 拉', ['引体向上 4×6-8', '杠铃划船 4×8-10', '单臂哑铃划船 3×10/侧', '二头弯举 3×10-12', '绳索二头弯举 3×12']) : ''}
                        ${frequency >= 3 ? generateWorkoutDay('第3天 - 腿', ['深蹲 4×6-8', '腿举 3×10-12', '罗马尼亚硬拉 3×8-10', '腿弯举 3×10-12', '小腿提踵 4×15']) : ''}
                        ${frequency >= 4 ? generateWorkoutDay('第4天 - 核心与辅助', ['军推 4×8', '俯身侧平举 3×12', '窄距卧推 3×10', '绳索面拉 3×12', '悬垂举腿 3×12']) : ''}
                    </div>
                `;
            } else {
                plan += `
                    <h4>5×5强度训练（每周${frequency}天）</h4>
                    <div class="workout-days">
                        ${generateWorkoutDay('第1天 - 力量A', ['深蹲 5×5', '卧推 5×5', '引体向上 5×5', '面部拉伸 3×10', '腹部卷曲 3×15'])}
                        ${generateWorkoutDay('第2天 - 力量B', ['硬拉 5×5', '军推 5×5', '杠铃划船 5×5', '二头弯举 3×10', '腿弯举 3×10'])}
                        ${generateWorkoutDay('第3天 - 力量C', ['前蹲 5×5', '上斜卧推 5×5', 'T杠划船 5×5', '三头下压 3×10', '侧平举 3×12'])}
                        ${frequency >= 6 ? '重复循环上述训练日，每周安排1-2个休息日' : ''}
                    </div>
                `;
            }
        } else if (experience === 'advanced') {
            plan += `
                <h4>高级力量训练计划（每周${frequency}天）</h4>
                <p>采用波浪式周期化训练方法</p>
                <div class="workout-days">
                    ${generateWorkoutDay('第1天 - 重型深蹲', ['热身组", "工作组: 5组, 最后一组最大重量5RM', '辅助训练: 前蹲 3×8, 分腿蹲 3×10/侧, 腿弯举 3×12'])}
                    ${generateWorkoutDay('第2天 - 重型卧推', ['热身组", "工作组: 5组, 最后一组最大重量5RM', '辅助训练: 上斜卧推 3×8, 下斜卧推 3×8, 飞鸟 3×12, 三头下压 3×10'])}
                    ${generateWorkoutDay('第3天 - 重型硬拉', ['热身组", "工作组: 5组, 最后一组最大重量5RM', '辅助训练: 直腿硬拉 3×8, T杠划船 3×10, 引体向上 3组至力竭'])}
                    ${frequency >= 4 ? generateWorkoutDay('第4天 - 重型军推', ['热身组", "工作组: 5组, 最后一组最大重量5RM', '辅助训练: 后三角 3×10, 侧平举 3×12, 面拉 3×15, 二头弯举 3×10']) : ''}
                    ${frequency >= 5 ? generateWorkoutDay('第5天 - 爆发力训练', ['深蹲跳 5×5', '箱式跳 5×5', '抛实心球 5×5', '速度卧推 5×5 (60-70%1RM)', '高翻 5×5']) : ''}
                    ${frequency >= 6 ? generateWorkoutDay('第6天 - 辅助与弱点训练', ['针对个人弱点的定制训练，专注于技术和肌肉平衡']) : ''}
                </div>
            `;
        }
        
        plan += '</div>';
        return plan;
    }
    
    // 增肌训练计划
    function generateMusclePlan(experience, frequency) {
        let plan = '<div class="plan-section">';
        
        if (experience === 'beginner') {
            if (frequency <= 3) {
                plan += `
                    <h4>全身增肌训练（每周${frequency}天）</h4>
                    <div class="workout-days">
                        ${frequency >= 1 ? generateWorkoutDay('第1天 - 全身训练', ['深蹲 3×10-12', '卧推 3×10-12', '杠铃划船 3×10-12', '肩推 3×10-12', '二头弯举 3×12', '三头下压 3×12']) : ''}
                        ${frequency >= 2 ? generateWorkoutDay('第2天 - 全身训练', ['罗马尼亚硬拉 3×10', '上斜卧推 3×10-12', '引体向上（辅助）3×10', '侧平举 3×12-15', '腿弯举 3×12-15', '腹部训练 3×15']) : ''}
                        ${frequency >= 3 ? generateWorkoutDay('第3天 - 全身训练', ['腿举 3×12-15', '俯身飞鸟 3×12-15', '绳索划船 3×12-15', '肩上推举 3×10-12', '绳索二头弯举 3×12-15', '俯身臂屈伸 3×12']) : ''}
                    </div>
                `;
            } else {
                plan += `
                    <h4>上下肢分化计划（每周${frequency}天）</h4>
                    <div class="workout-days">
                        ${generateWorkoutDay('第1天 - 胸与三头', ['卧推 3×10-12', '上斜卧推 3×10-12', '飞鸟 3×12-15', '绳索下压 3×12-15', '窄距俯卧撑 3×10-12'])}
                        ${generateWorkoutDay('第2天 - 背与二头', ['杠铃划船 3×10-12', '引体向上(辅助) 3×10', '单臂哑铃划船 3×10-12/侧', '杠铃二头弯举 3×10-12', '锤式弯举 3×12'])}
                        ${generateWorkoutDay('第3天 - 腿与肩', ['深蹲 3×10-12', '腿举 3×12-15', '腿弯举 3×12-15', '肩推 3×10-12', '侧平举 3×12-15', '俯身飞鸟 3×12-15'])}
                        ${frequency >= 4 ? '重复循环上述训练日' : ''}
                    </div>
                `;
            }
        } else if (experience === 'intermediate') {
            plan += `
                <h4>中级增肌训练（每周${frequency}天）</h4>
                <div class="workout-days">
                    ${frequency >= 1 ? generateWorkoutDay('第1天 - 胸与三头', ['卧推 4×8-10', '上斜哑铃卧推 3×10', '绳索夹胸 3×12-15', '窄距卧推 3×10', '绳索下压 3×12', '颈后臂屈伸 3×12']) : ''}
                    ${frequency >= 2 ? generateWorkoutDay('第2天 - 背与二头', ['硬拉 4×8', '引体向上 4×8-10', 'T杠划船 3×10', '直臂下拉 3×12', '杠铃弯举 3×10', '交替哑铃弯举 3×12']) : ''}
                    ${frequency >= 3 ? generateWorkoutDay('第3天 - 腿部', ['深蹲 4×10', '腿举 3×12', '保加利亚分腿蹲 3×10/侧', '腿弯举 3×12', '小腿提踵 4×15', '悬垂举腿 3×15']) : ''}
                    ${frequency >= 4 ? generateWorkoutDay('第4天 - 肩与核心', ['军推 4×8-10', '侧平举 3×12', '前平举 3×12', '俯身飞鸟 3×12', '绳索面拉 3×15', '腹肌训练组合 3轮']) : ''}
                    ${frequency >= 5 ? generateWorkoutDay('第5天 - 手臂专项', ['杠铃弯举 4×10', '三头臂屈伸 4×10', '锤式弯举 3×12', '绳索下压 3×12', '反向弯举 3×15', '窄距俯卧撑 3×10']) : ''}
                    ${frequency >= 6 ? generateWorkoutDay('第6天 - 弱点训练', ['针对个人薄弱肌群的专项训练']) : ''}
                </div>
            `;
        } else if (experience === 'advanced') {
            plan += `
                <h4>高级增肌训练（每周${frequency}天）</h4>
                <p>采用高级训练技术，包括超级组、递减组和预疲劳组合</p>
                <div class="workout-days">
                    ${generateWorkoutDay('第1天 - 胸肌', ['上斜哑铃卧推 4×8-10', '平板卧推 4×10', '绳索夹胸 3×12 + 飞鸟 3×15 (超级组)', '负重俯卧撑 3组至力竭', '三头臂屈伸 3×12'])}
                    ${generateWorkoutDay('第2天 - 背部', ['硬拉 5×6-8', '引体向上 4×8-10', '坐姿划船 4×10 (宽、中、窄握各种变化)', '直臂下拉 + 反向飞鸟 3×12 (超级组)', '二头弯举 3×12'])}
                    ${generateWorkoutDay('第3天 - 腿部', ['深蹲 5×8', '腿举 4×10-12', '步行弓步 3×24步', '腿弯举 + 小腿提踵 4×12 (超级组)', '腹肌训练 3组'])}
                    ${frequency >= 4 ? generateWorkoutDay('第4天 - 肩部', ['军推 5×8-10', '阿诺德推举 4×10', '侧平举 3×12 + 前平举 3×12 (预疲劳组合)', '上斜划船 4×12', '绳索面拉 3×15']) : ''}
                    ${frequency >= 5 ? generateWorkoutDay('第5天 - 手臂', ['杠铃弯举 4×10 递减组', '颈后臂屈伸 4×10 递减组', '锤式弯举 3×12', '绳索下压 3×12', '腕部训练组合 3×15']) : ''}
                    ${frequency >= 6 ? generateWorkoutDay('第6天 - 弱点与形体', ['针对肌肉平衡和形体的专项训练']) : ''}
                </div>
            `;
        }
        
        plan += '</div>';
        return plan;
    }
    
    // 耐力训练计划
    function generateEndurancePlan(experience, frequency) {
        let plan = '<div class="plan-section">';
        
        if (experience === 'beginner') {
            plan += `
                <h4>初级耐力训练计划（每周${frequency}天）</h4>
                <div class="workout-days">
                    ${frequency >= 1 ? generateWorkoutDay('第1天 - 有氧与全身训练', ['热身: 5分钟轻快散步或慢跑', '中等强度有氧: 20分钟 (步行/慢跑交替，如2分钟慢跑，1分钟步行)', '基本力量循环: 每个动作30秒，间隔15秒', '- 深蹲', '- 俯卧撑（可修改）', '- 平板支撑', '- 弓步蹲', '- 超人式', '重复2-3轮', '放松: 5分钟拉伸']) : ''}
                    ${frequency >= 2 ? generateWorkoutDay('第2天 - 间歇有氧', ['热身: 5分钟轻快散步', '间歇训练: 30秒高强度，90秒恢复，共8-10组', '可选活动: 快走/慢跑、骑行、椭圆机等', '放松: 5分钟拉伸']) : ''}
                    ${frequency >= 3 ? generateWorkoutDay('第3天 - 全身耐力力量', ['热身: 5分钟轻快有氧', '循环训练: 每个动作40秒，休息20秒', '- 壁式深蹲', '- 跪姿俯卧撑', '- 反向划船（用毛巾或TRX）', '- 臀桥', '- 交替弓步蹲', '- 平板支撑', '重复3轮', '有氧收尾: 10分钟稳定速度有氧', '放松: 5分钟拉伸']) : ''}
                    ${frequency >= 4 ? generateWorkoutDay('第4天 - 灵活性与恢复', ['温和的有氧: 15-20分钟轻度有氧（步行、慢节奏骑行等）', '全身拉伸: 每个伸展保持30秒', '泡沫轴放松: 主要肌群每部位1-2分钟']) : ''}
                    ${frequency >= 5 ? generateWorkoutDay('第5天 - 中长距离有氧', ['热身: 5分钟逐渐提速', '稳定有氧: 30-40分钟中等强度有氧训练（可选步行/慢跑、游泳、骑行等）', '注意保持适当强度，应能维持交谈', '放松: 5分钟逐渐降速，5分钟拉伸']) : ''}
                    ${frequency >= 6 ? generateWorkoutDay('第6天 - 混合训练', ['热身: 5分钟轻度有氧', '上半身力量: 每个动作12-15次，2组', '- 壁式俯卧撑', '- 坐姿哑铃肩推（轻重量）', '- 拉力带划船', '有氧间隔: 15分钟，1分钟中等强度，1分钟低强度', '放松: 5分钟拉伸']) : ''}
                </div>
            `;
        } else if (experience === 'intermediate') {
            plan += `
                <h4>中级耐力训练计划（每周${frequency}天）</h4>
                <div class="workout-days">
                    ${frequency >= 1 ? generateWorkoutDay('第1天 - 力量耐力', ['热身: 8分钟逐渐提速有氧 + 动态拉伸', '力量耐力循环: 每个动作45秒，间隔15秒', '- 杠铃深蹲（轻重量）', '- 俯卧撑', '- 哑铃划船（单臂交替）', '- 弓步蹲（交替）', '- 俯身飞鸟', '- 平板支撑变体', '重复3-4轮', '心率恢复: 10分钟中等强度有氧', '放松: 5-8分钟拉伸']) : ''}
                    ${frequency >= 2 ? generateWorkoutDay('第2天 - 高强度间歇', ['热身: 8分钟渐进式 + 动态拉伸', 'Tabata间歇: 20秒全力，10秒休息，共8组（4分钟）', '- 可选：山坡冲刺、自行车冲刺、划船机等', '恢复2分钟，重复2-3轮（不同动作）', '有氧收尾: 10分钟稳定速度', '放松: 全身拉伸']) : ''}
                    ${frequency >= 3 ? generateWorkoutDay('第3天 - 长距离有氧', ['热身: 10分钟渐进式', '长距离有氧: 40-60分钟中等强度稳定性有氧', '（心率保持在最大心率的65-75%）', '可选择跑步、游泳、骑行等', '放松: 5-10分钟拉伸']) : ''}
                    ${frequency >= 4 ? generateWorkoutDay('第4天 - 力量与核心', ['热身: 8分钟有氧 + 动态拉伸', '力量训练: 每个动作12次，3组', '- 杠铃硬拉（中等重量）', '- 卧推（中等重量）', '- 引体向上（辅助如需要）', '- 负重弓步蹲', '核心循环: 各30-45秒，最小休息', '- 平板支撑', '- 侧平板支撑（两侧）', '- 登山者', '- 仰卧单车', '重复2-3轮', '放松: 5-8分钟拉伸']) : ''}
                    ${frequency >= 5 ? generateWorkoutDay('第5天 - 节奏间歇', ['热身: 10分钟渐进式', '节奏间歇: 5分钟中等强度，1分钟高强度，重复5-6次', '（选择跑步、骑行、椭圆机等）', '放松: 8-10分钟拉伸和泡沫轴放松']) : ''}
                    ${frequency >= 6 ? generateWorkoutDay('第6天 - 活动性恢复', ['低强度有氧: 30-40分钟（快走、轻度骑行、游泳等）', '维持心率在最大心率的50-60%', '全身拉伸: 重点关注紧绷区域，每个伸展40-60秒', '泡沫轴放松: 主要肌群每部位2分钟']) : ''}
                </div>
            `;
        } else if (experience === 'advanced') {
            plan += `
                <h4>高级耐力训练计划（每周${frequency}天）</h4>
                <p>适合准备长距离耐力赛事或追求高水平耐力素质的训练者</p>
                <div class="workout-days">
                    ${generateWorkoutDay('第1天 - 高强度间歇', ['热身: 10分钟渐进式 + 动态拉伸', '主要间歇: 4×4分钟（85-90%最大心率），间隔3分钟恢复', '技术专项: 20分钟专项技术练习（如跑步姿势、骑行效率等）', '放松: 10分钟低强度 + 全身拉伸'])}
                    ${generateWorkoutDay('第2天 - 力量耐力', ['热身: 10分钟有氧 + 动态拉伸', '力量训练（中等重量，专注耐力）:', '- 深蹲 4×15', '- 硬拉 4×12', '- 卧推或俯卧撑 4×15', '- 划船运动 4×15', 'Finisher: 3轮EMOM（每分钟开始）', '- 爆发式深蹲跳 10次', '- 划船机/跑步冲刺 30秒', '放松: 全身拉伸及泡沫轴放松'])}
                    ${generateWorkoutDay('第3天 - 长距离/配速训练', ['热身: 10-15分钟渐进式', '主要训练: 60-90分钟耐力训练，包括:', '- 20分钟中等强度', '- 3×10分钟比赛配速段，间隔5分钟恢复', '- 15分钟稳定收尾', '技术练习: 10分钟专注于技术细节', '放松: 拉伸和放松技术'])}
                    ${frequency >= 4 ? generateWorkoutDay('第4天 - 活动性恢复', ['低强度有氧: 40-50分钟（心率保持在低于65%最大心率）', '流动性训练: 15分钟瑜伽或动态流动性练习', '放松技术: 20分钟全面的泡沫轴和压力点释放']) : ''}
                    ${frequency >= 5 ? generateWorkoutDay('第5天 - 阈值训练', ['热身: 15分钟渐进式 + 准备性练习', '主要训练: 3×15分钟乳酸阈值训练（80-85%最大心率），间隔5分钟恢复', '核心及平衡: 15分钟综合核心训练（包括不稳定面上的训练）', '放松: 10分钟低强度 + 拉伸']) : ''}
                    ${frequency >= 6 ? generateWorkoutDay('第6天 - 力量与爆发力', ['热身: 10分钟多样化 + 动态拉伸', '力量训练: 专注于单侧和功能性动作', '- 单腿深蹲 4×10/侧', '- 单臂推举 4×10/侧', '- 负重卧姿臀桥 4×12', '- 功能性核心运动 4×45秒', '爆发力练习: 4组，每组:', '- 箱式跳 8次', '- 爆发式俯卧撑 8次', '- 实心球投掷 8次', '放松: 10-15分钟全面放松策略']) : ''}
                    ${frequency >= 7 ? generateWorkoutDay('第7天 - 砖式训练（多项运动）', ['适合三项或多项运动训练者的连续训练:', '- 游泳: 30分钟包括技术和间歇', '- 骑车: 60分钟包括爬坡和节奏变化', '- 跑步: 20分钟逐渐提速', '注: 可根据专项需求调整各部分时长和强度']) : ''}
                </div>
            `;
        }
        
        plan += '</div>';
        return plan;
    }
    
    // 减脂训练计划
    function generateWeightLossPlan(experience, frequency) {
        let plan = '<div class="plan-section">';
        
        if (experience === 'beginner') {
            plan += `
                <h4>初级减脂训练计划（每周${frequency}天）</h4>
                <p>结合低强度有氧和基础力量训练，安全有效地燃烧脂肪</p>
                <div class="workout-days">
                    ${frequency >= 1 ? generateWorkoutDay('第1天 - 全身循环训练', ['热身: 5分钟轻度有氧', '循环训练: 30秒运动，30秒休息', '- 原地高抬腿', '- 修改版俯卧撑（可使用跪姿或墙壁）', '- 深蹲', '- 登山者（慢速）', '- 俯卧交替抬臂抬腿', '重复3轮', '有氧: 15-20分钟中低强度有氧', '放松: 5分钟拉伸']) : ''}
                    ${frequency >= 2 ? generateWorkoutDay('第2天 - 低强度有氧', ['热身: 5分钟逐渐提速', '主要训练: 30分钟稳定低中强度有氧', '(如步行、轻快骑行或椭圆机)', '保持心率在最大心率的60-70%', '放松: 5分钟拉伸']) : ''}
                    ${frequency >= 3 ? generateWorkoutDay('第3天 - 上半身与核心', ['热身: 5分钟轻度有氧 + 肩部活动', '上半身训练: 每个动作12-15次，2-3组', '- 墙壁俯卧撑或膝盖俯卧撑', '- 拉力带划船或哑铃单臂划船（轻重量）', '- 拉力带肩上推或轻重量哑铃肩推', '- 坐姿二头弯举（轻重量）', '核心训练: 各30秒，2轮', '- 平板支撑', '- 仰卧两头起', '- 侧平板支撑（每侧）', '有氧燃脂: 15分钟低强度有氧', '放松: 5分钟拉伸']) : ''}
                    ${frequency >= 4 ? generateWorkoutDay('第4天 - 间歇有氧', ['热身: 8分钟渐进式', '间歇训练: 30秒中高强度，90秒低强度恢复', '重复8-10次', '选择低冲击活动（如快走/慢跑交替、椭圆机等）', '放松: 5分钟拉伸']) : ''}
                    ${frequency >= 5 ? generateWorkoutDay('第5天 - 下半身与核心', ['热身: 8分钟有氧 + 下半身动态拉伸', '下半身训练: 每个动作12-15次，2-3组', '- 深蹲（体重或轻量）', '- 弓步蹲（体重或轻量）', '- 臀桥', '- 小腿提踵', '核心训练: 各30秒，2轮', '- 仰卧单车', '- 平板支撑抬腿', '- 触地卷腹', '有氧: 15分钟中强度稳定有氧', '放松: 5-8分钟拉伸']) : ''}
                    ${frequency >= 6 ? generateWorkoutDay('第6天 - 灵活性与恢复', ['全身拉伸: 主要肌群每个伸展保持30-45秒', '轻度有氧: 20分钟低强度（心率<60%最大心率）', '泡沫轴放松: 主要肌群每部位1-2分钟']) : ''}
                </div>
                <p class="plan-note">饮食建议: 保持适度热量赤字（约300-500卡/天），增加蛋白质摄入，保持充分水分，限制加工食品和糖的摄入。</p>
            `;
        } else if (experience === 'intermediate') {
            plan += `
                <h4>中级减脂训练计划（每周${frequency}天）</h4>
                <p>结合高效HIIT、复合力量训练和策略性有氧，最大化脂肪燃烧</p>
                <div class="workout-days">
                    ${frequency >= 1 ? generateWorkoutDay('第1天 - 全身HIIT与力量', ['热身: 8分钟动态热身', '力量训练: 每个动作12次，3组，中等重量', '- 杠铃深蹲或哑铃深蹲', '- 俯卧撑或哑铃卧推', '- 硬拉（传统或罗马尼亚）', '- 哑铃划船或拉力带划船', 'HIIT燃脂: 30秒高强度，30秒休息', '- 跳跃深蹲', '- 俄罗斯转体', '- 登山者（快速）', '- 波比', '重复3-4轮', '放松: 5-8分钟拉伸']) : ''}
                    ${frequency >= 2 ? generateWorkoutDay('第2天 - 有氧间歇', ['热身: 8分钟渐进式有氧', '主要训练: 30-35分钟间歇训练', '- 4分钟中等强度（70-75%最大心率）', '- 1分钟高强度（85-90%最大心率）', '重复6-7次', '放松: 5分钟缓和 + 拉伸']) : ''}
                    ${frequency >= 3 ? generateWorkoutDay('第3天 - 上肢与核心重点', ['热身: 8分钟有氧 + 动态拉伸', '上肢超级组: 每组10-12次，3-4轮', '- A1: 卧推或俯卧撑', '- A2: 划船或引体向上变式', '- 休息45-60秒', '- B1: 肩推或阿诺德推举', '- B2: 颈后臂屈伸', '- 休息45-60秒', '- C1: 二头弯举', '- C2: 绳索下压', '- 休息45-60秒', '核心训练: 45秒运动，15秒休息，3轮', '- 平板支撑变式', '- 俄罗斯转体', '- 侧平板支撑（两侧）', '- 腹部卷曲', '有氧燃脂: 15分钟稳态有氧', '放松: 5-8分钟拉伸']) : ''}
                    ${frequency >= 4 ? generateWorkoutDay('第4天 - Tabata与复合训练', ['热身: 8分钟动态热身', 'Tabata训练: 20秒全力，10秒休息，4分钟一轮', '第1轮: 高抬腿跑', '第2轮: 波比', '第3轮: 跳跃深蹲', '第4轮: 俯卧撑到跳跃', '每轮间休息60秒', '复合动作: 10-12次，3组', '- 深蹲到推举', '- 弓步蹲到二头弯举', '- 硬拉到划船', '放松: 拉伸与呼吸练习']) : ''}
                    ${frequency >= 5 ? generateWorkoutDay('第5天 - 下肢与HIIT', ['热身: 8分钟动态热身', '下肢训练: 每组12次，3-4组', '- 保加利亚分腿蹲（每侧）', '- 腿弯举或箭步蹲', '- 臀推或臀桥', '- 小腿训练', '代谢增强器: 30秒工作，15秒休息，3轮', '- 快速高抬腿', '- 侧向滑步', '- 箱式跳或深蹲跳', '- 快速爬山者', '有氧: 20分钟脂肪燃烧区间训练', '放松: 全面拉伸']) : ''}
                    ${frequency >= 6 ? generateWorkoutDay('第6天 - 活动恢复与轻度锻炼', ['有氧: 30-40分钟中低强度稳定性有氧', '活动恢复: 15-20分钟', '- 泡沫轴放松', '- 动态拉伸', '- 瑜伽流程或类似活动', '核心稳定: 10分钟专注核心训练']) : ''}
                </div>
                <p class="plan-note">饮食建议: 计算并跟踪每日热量摄入，确保适度热量赤字（约500卡/天），增加蛋白质（体重每公斤1.6-2.2克），优化训练前后营养，保持充分水分。</p>
            `;
        } else if (experience === 'advanced') {
            plan += `
                <h4>高级减脂训练计划（每周${frequency}天）</h4>
                <p>结合高级训练技术、周期化编排和策略性营养方法，实现最佳身体成分改变</p>
                <div class="workout-days">
                    ${generateWorkoutDay('第1天 - 高强度力量与HIIT', ['热身: 10分钟全面动态热身', '力量训练: 复合动作，金字塔组', '- 杠铃深蹲: 15/12/10/8/15 (增重后减重)', '- 加重引体向上: 同上组织', '- 杠铃卧推: 同上组织', '- 硬拉: 10/8/6/12 (增重后减重)', 'HIIT燃脂终结者: 30秒全力/15秒休息', '- 战绳挥动', '- 壶铃摆动', '- 箱式跳', '- 俯卧撑到跳跃', '- 快速深蹲', '重复3轮', '放松: 8-10分钟拉伸与肌肉放松'])}
                    ${generateWorkoutDay('第2天 - 循环训练与代谢调节', ['热身: 10分钟有氧热身与动态准备', '全身循环: 40秒工作/20秒转换，极少休息', '第一轮 - 推:', '- 哑铃卧推', '- 肩推', '- 窄距俯卧撑', '- 三角肌前平举', '- 颈后臂屈伸', '第二轮 - 拉:', '- 引体向上或高位下拉', '- 哑铃划船', '- 反向飞鸟', '- 二头弯举', '- 腹部训练', '第三轮 - 腿:', '- 哑铃深蹲', '- 保加利亚分腿蹲', '- 负重箭步蹲', '- 箱式跳', '- 小腿训练', '重复2-3次', '代谢增强: 15分钟心率波动训练', '放松: 拉伸与泡沫轴放松'])}
                    ${generateWorkoutDay('第3天 - 强度区间有氧', ['热身: 10分钟渐进式热身', '主训练: 45分钟强度区间训练:', '- 8分钟第2区(RPE 3-4/10)', '- 6分钟第3区(RPE 5-6/10)', '- 4分钟第4区(RPE 7-8/10)', '- 2分钟第5区(RPE 9/10)', '重复2轮', '选择: 跑步、骑车、划船等', '核心稳定: 10分钟全面核心训练', '放松: 拉伸与呼吸练习'])}
                    ${frequency >= 4 ? generateWorkoutDay('第4天 - 上肢与HIIT', ['热身: 10分钟全面准备', '上肢强度训练:', '- 上推与下压超级组: 4组×8-10次，极少休息', '- 水平推拉超级组: 4组×10-12次，极少休息', '- 二头肌/三头肌超级组: 3组×12-15次，极少休息', '肩部特训: 巨量组，减重方式', '- 侧平举组合: 3组×下降重量，不完全休息', '上肢Tabata: 4分钟，20/10秒', '- 俯卧撑变式', '放松: 上肢与躯干拉伸']) : ''}
                    ${frequency >= 5 ? generateWorkoutDay('第5天 - 下肢强化与有氧', ['热身: 10分钟动态热身', '下肢训练:', '- 腿部组合训练: 4组', '  * 深蹲 8次', '  * 箭步蹲 8次/侧', '  * 跳跃深蹲 15次', '  * 最小休息', '- 后链超级组: 3组', '  * 硬拉 8-10次', '  * 腿弯举 12次', '  * 臀桥 15次', '- 小腿三角: 3组', '  * 站姿提踵 15次', '  * 坐姿提踵 15次', '  * 单腿提踵 12次/侧', '代谢有氧: 30/30间歇，共20分钟', '放松: 深度拉伸']) : ''}
                    ${frequency >= 6 ? generateWorkoutDay('第6天 - 全身综合与冲刺', ['热身: 10分钟动态热身', '全身控制复合动作: 每个动作30秒，15秒休息', '- 深蹲跳上箱', '- 双杠臂屈伸', '- 壶铃高翻', '- 杠铃高拉', '- 战绳交替挥动', '- 俯身飞鸟（轻重量高次数）', '- TRX划船', '- 球体旋转抛', '重复3-4轮', '冲刺训练: 6-8次30秒全力冲刺，间隔90秒完全恢复', '（跑步、骑车、划船机等）', '放松: 15分钟全身放松策略']) : ''}
                    ${frequency >= 7 ? generateWorkoutDay('第7天 - 积极恢复与评估', ['体成分评估与测量（每2-3周一次）', '低强度活动: 30-45分钟（步行、轻度骑行、游泳等）', '流动性训练: 20-30分钟瑜伽或类似活动', '放松技术: 全身肌筋膜放松和压力点技术', '计划调整: 回顾上周训练，根据结果调整下周计划']) : ''}
                </div>
                <p class="plan-note">营养策略: 考虑热量循环（在训练日增加碳水摄入，非训练日减少），合理的进餐时间安排，高质量蛋白质分布，策略性使用防止代谢适应的重填充日。</p>
            `;
        }
        
        plan += '</div>';
        return plan;
    }
    
    // 生成具体训练日内容
    function generateWorkoutDay(title, exercises) {
        let day = `<div class="workout-day">`;
        day += `<h5>${title}</h5>`;
        day += `<ul>`;
        
        exercises.forEach(exercise => {
            day += `<li>${exercise}</li>`;
        });
        
        day += `</ul>`;
        day += `</div>`;
        
        return day;
    }
});
