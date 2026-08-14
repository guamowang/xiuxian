// ========== 用户数据管理 ==========
const STORAGE_KEY = 'cultivation_users';

function loadUsers() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function defaultUserData(daoName) {
    return {
        daoName: daoName,
        age: 27,
        cultivationValue: 47,
        stageIndex: 0,
        attributes: {
            intelligence: 12,
            strength: 9,
            order: 14,
            dexterity: 11,
            luck: 8
        },
        cultivatingAttribute: null
    };
}

// ========== 全局数据 ==========
let cultivationData = null; // 当前登录用户数据

const stages = [
    { name: '练气期', threshold: 0, nextThreshold: 100 },
    { name: '筑基期', threshold: 100, nextThreshold: 300 },
    { name: '金丹期', threshold: 300, nextThreshold: 600 },
    { name: '元婴期', threshold: 600, nextThreshold: 1000 },
    { name: '化神期', threshold: 1000, nextThreshold: 2000 },
];

const attributeMap = {
    intelligence: { short: 'int', name: '智力', icon: '📖' },
    strength: { short: 'str', name: '体质', icon: '💪' },
    order: { short: 'ord', name: '秩序', icon: '📐' },
    dexterity: { short: 'dex', name: '灵巧', icon: '🍃' },
    luck: { short: 'lck', name: '幸运', icon: '🍀' }
};

// ========== 粒子背景 ==========
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
const maxParticles = 75;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.size = Math.random() * 2 + 0.4;
        this.speedY = Math.random() * 0.45 + 0.18;
        this.speedX = (Math.random() - 0.5) * 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = Math.random() < 0.5 ?
            `rgba(220,180,80,${this.opacity})` :
            `rgba(200,160,60,${this.opacity})`;
        this.twinkleSpeed = Math.random() * 0.018 + 0.005;
        this.twinklePhase = Math.random() * Math.PI * 2;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.y * 0.01 + this.twinklePhase) * 0.2;
        if (this.y > canvas.height + 10 || this.x < -10 || this.x > canvas.width + 10) {
            this.reset();
            this.y = -10;
        }
        this.twinklePhase += this.twinkleSpeed;
        this.currentOpacity = this.opacity * (0.55 + 0.45 * Math.sin(this.twinklePhase));
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace(/[\d.]+\)$/, `${this.currentOpacity})`);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace(/[\d.]+\)$/, `${this.currentOpacity * 0.2})`);
        ctx.fill();
    }
}

for (let i = 0; i < maxParticles; i++) particles.push(new Particle());

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(200,160,80,${0.06 * (1 - dist / 100)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();

// ========== UI更新 ==========
function getCurrentStage() { return stages[cultivationData.stageIndex]; }

function getNextStage() {
    if (cultivationData.stageIndex < stages.length - 1) return stages[cultivationData.stageIndex + 1];
    return null;
}

function updateUI(animateValue = false) {
    const stage = getCurrentStage();
    const nextStage = getNextStage();
    const cv = cultivationData.cultivationValue;

    document.getElementById('dao-name').textContent = cultivationData.daoName;
    document.getElementById('age-display').textContent = cultivationData.age;
    document.getElementById('stage-display').textContent = stage.name;
    document.getElementById('stage-name').textContent = stage.name;

    const cvEl = document.getElementById('cultivation-value');
    cvEl.textContent = cv;
    if (animateValue) {
        cvEl.classList.remove('pop');
        void cvEl.offsetWidth;
        cvEl.classList.add('pop');
    }

    let pp, rt;
    if (nextStage) {
        const range = nextStage.threshold - stage.threshold;
        const progress = cv - stage.threshold;
        pp = Math.min(100, Math.max(0, (progress / range) * 100));
        rt = `距突破 ${nextStage.name} 还需 ${nextStage.threshold - cv} 修为`;
    } else {
        pp = 100;
        rt = '已达当前最高境界 · 超凡入圣';
    }

    document.getElementById('progress-fill').style.width = pp + '%';
    document.getElementById('progress-text').textContent = rt;

    document.getElementById('attr-int').textContent = cultivationData.attributes.intelligence;
    document.getElementById('attr-str').textContent = cultivationData.attributes.strength;
    document.getElementById('attr-ord').textContent = cultivationData.attributes.order;
    document.getElementById('attr-dex').textContent = cultivationData.attributes.dexterity;
    document.getElementById('attr-lck').textContent = cultivationData.attributes.luck;

    updateCultivationStatus();
}

function updateCultivationStatus() {
    const allAttributes = Object.keys(attributeMap);
    allAttributes.forEach(attr => {
        const short = attributeMap[attr].short;
        const statusEl = document.getElementById(`status-${short}`);
        const cardEl = document.getElementById(`card-${short}`);
        const cancelBtn = document.getElementById(`cancel-${short}`);

        if (cultivationData.cultivatingAttribute === attr) {
            statusEl.textContent = '修炼完成';
            cardEl.classList.add('cultivating');
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
        } else {
            statusEl.textContent = '开始修炼';
            cardEl.classList.remove('cultivating');
            if (cancelBtn) cancelBtn.style.display = 'none';
        }
    });
}

function setRecentLog(text) {
    document.getElementById('recent-log').textContent = text;
}

// ========== 粒子特效 ==========
function spawnSpiritParticles(sourceElement, text, count = 8) {
    const rect = sourceElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('span');
        particle.className = 'spirit-particle';
        particle.textContent = text;
        particle.style.left = cx + (Math.random() - 0.5) * 60 + 'px';
        particle.style.top = cy + (Math.random() - 0.5) * 40 + 'px';
        particle.style.fontSize = (Math.random() * 0.5 + 0.7) + 'em';
        document.body.appendChild(particle);
        particle.addEventListener('animationend', () => particle.remove());
    }
}

// ========== 属性修炼逻辑 ==========
let pendingCompleteAttribute = null;

function handleAttributeClick(event) {
    const card = event.currentTarget;
    const attribute = card.dataset.attribute;
    const target = event.target;

    if (target.classList.contains('cancel-cultivation-btn')) {
        return;
    }

    if (target.classList.contains('attribute-status')) {
        if (cultivationData.cultivatingAttribute === attribute) {
            openCompleteModal(attribute);
        }
        else if (cultivationData.cultivatingAttribute === null) {
            startCultivation(attribute, card);
        }
        else {
            const currentAttr = cultivationData.cultivatingAttribute;
            const currentName = attributeMap[currentAttr].name;
            setRecentLog(`⚠️ 正在修炼${currentName}，请先完成当前修炼或取消`);
            const currentCard = document.getElementById(`card-${attributeMap[currentAttr].short}`);
            if (currentCard) {
                currentCard.style.animation = 'shake 0.5s ease';
                currentCard.addEventListener('animationend', () => { currentCard.style.animation = ''; }, { once: true });
            }
        }
        return;
    }

    if (cultivationData.cultivatingAttribute === null) {
        startCultivation(attribute, card);
    } else if (cultivationData.cultivatingAttribute === attribute) {
        setRecentLog(`请点击“修炼完成”按钮完成${attributeMap[attribute].name}修炼`);
    } else {
        const currentAttr = cultivationData.cultivatingAttribute;
        setRecentLog(`⚠️ 正在修炼${attributeMap[currentAttr].name}，请先完成或取消`);
    }
}

function startCultivation(attribute, card) {
    cultivationData.cultivatingAttribute = attribute;
    updateCultivationStatus();

    const attrInfo = attributeMap[attribute];
    setRecentLog(`🧘 开始修炼${attrInfo.name}... 达成1小时后点击“修炼完成”按钮`);

    spawnSpiritParticles(card, attrInfo.icon, 5);
}

function openCompleteModal(attribute) {
    pendingCompleteAttribute = attribute;
    document.getElementById('cultivation-note').value = '';
    document.getElementById('cultivation-complete-modal').style.display = 'flex';
}

function closeCompleteModal() {
    document.getElementById('cultivation-complete-modal').style.display = 'none';
    pendingCompleteAttribute = null;
}

function confirmComplete() {
    if (!pendingCompleteAttribute) return;
    const attribute = pendingCompleteAttribute;
    const note = document.getElementById('cultivation-note').value.trim();
    const card = document.getElementById(`card-${attributeMap[attribute].short}`);
    closeCompleteModal();
    completeCultivation(attribute, card, note);
}

function completeCultivation(attribute, card, note = '') {
    cultivationData.attributes[attribute] += 1;
    cultivationData.cultivationValue += 1;
    cultivationData.cultivatingAttribute = null;

    const nextStage = getNextStage();
    let brokeThrough = false;
    if (nextStage && cultivationData.cultivationValue >= nextStage.threshold) {
        cultivationData.stageIndex++;
        brokeThrough = true;
    }

    updateUI(true);

    const attrInfo = attributeMap[attribute];
    let logMsg = `✨ ${attrInfo.name}修炼完成！${attrInfo.name}+1，修为+1`;
    if (note) {
        logMsg += `，修炼痕迹：${note}`;
    }
    setRecentLog(logMsg);

    card.classList.add('completing');
    setTimeout(() => {
        card.classList.remove('completing');
    }, 600);

    spawnSpiritParticles(card, '+1', 10);

    if (brokeThrough) {
        triggerBreakthrough();
    }

    saveCurrentUser();
}

function cancelCultivation(attribute) {
    if (cultivationData.cultivatingAttribute !== attribute) return;

    cultivationData.cultivatingAttribute = null;
    updateCultivationStatus();

    const attrInfo = attributeMap[attribute];
    setRecentLog(`🚫 已取消${attrInfo.name}的修炼，无任何收益`);

    const card = document.getElementById(`card-${attributeMap[attribute].short}`);
    if (card) {
        spawnSpiritParticles(card, '取消', 3);
    }

    saveCurrentUser();
}

function triggerBreakthrough() {
    const panel = document.getElementById('main-panel');
    panel.classList.add('breakthrough-flash');
    setTimeout(() => panel.classList.remove('breakthrough-flash'), 600);
    setRecentLog(`🌟 突破！晋升 ${getCurrentStage().name}！`);
}

// ========== 用户登录/注册 ==========
function handleLogin() {
    const daoName = document.getElementById('login-dao-name').value.trim();
    const spiritMark = document.getElementById('login-spirit-mark').value.trim();
    const messageEl = document.getElementById('login-message');

    if (!daoName || !spiritMark) {
        messageEl.textContent = '道号和神纹均不能为空';
        return;
    }

    const users = loadUsers();
    if (users[daoName]) {
        // 登录
        if (users[daoName].spiritMark === spiritMark) {
            cultivationData = users[daoName].data;
            messageEl.textContent = '登录成功，欢迎回来！';
            enterMainPanel();
        } else {
            messageEl.textContent = '神纹错误，请重新输入';
        }
    } else {
        // 注册
        const newUser = {
            spiritMark: spiritMark,
            data: defaultUserData(daoName)
        };
        users[daoName] = newUser;
        saveUsers(users);
        cultivationData = newUser.data;
        messageEl.textContent = '注册成功，欢迎入卷！';
        enterMainPanel();
    }
}

function enterMainPanel() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';
    // 初始化主面板事件
    initMainPanel();
    updateUI();
    setRecentLog('点击属性卡片开始修炼，修炼达成后点击“修炼完成”按钮');
}

// ========== 主面板初始化 ==========
function initMainPanel() {
    // 绑定属性卡片点击事件
    document.querySelectorAll('.attribute-card').forEach(card => {
        card.addEventListener('click', handleAttributeClick);
    });

    // 绑定取消按钮点击事件
    document.querySelectorAll('.cancel-cultivation-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const short = this.id.replace('cancel-', '');
            const attribute = Object.keys(attributeMap).find(key => attributeMap[key].short === short);
            if (attribute) {
                cancelCultivation(attribute);
            }
        });
    });

    // 绑定状态按钮事件
    document.querySelectorAll('.attribute-status').forEach(statusBtn => {
        statusBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const card = this.closest('.attribute-card');
            if (card) {
                handleAttributeClick({ currentTarget: card, target: this });
            }
        });
    });

    // 对话框按钮事件
    document.getElementById('confirm-complete-btn').addEventListener('click', confirmComplete);
    document.getElementById('cancel-complete-btn').addEventListener('click', closeCompleteModal);
    document.getElementById('cultivation-complete-modal').addEventListener('click', function (e) {
        if (e.target === this) closeCompleteModal();
    });

    // 键盘快捷键
    document.addEventListener('keydown', handleKeydown);
}

function handleKeydown(e) {
    const keyMap = {
        'Digit1': 'intelligence',
        'Digit2': 'strength',
        'Digit3': 'order',
        'Digit4': 'dexterity',
        'Digit5': 'luck'
    };

    if (keyMap[e.code]) {
        e.preventDefault();
        const attribute = keyMap[e.code];
        const short = attributeMap[attribute].short;
        const card = document.getElementById(`card-${short}`);
        if (card) {
            handleAttributeClick({ currentTarget: card, target: card });
        }
    }

    if (e.code === 'Escape') {
        if (pendingCompleteAttribute) {
            closeCompleteModal();
        } else if (cultivationData && cultivationData.cultivatingAttribute) {
            cancelCultivation(cultivationData.cultivatingAttribute);
        }
    }
}

// ========== 保存当前用户数据 ==========
function saveCurrentUser() {
    const users = loadUsers();
    if (cultivationData) {
        const daoName = cultivationData.daoName;
        if (users[daoName]) {
            users[daoName].data = cultivationData;
            saveUsers(users);
        }
    }
}

// ========== 初始化 ==========
function init() {
    // 绑定登录按钮
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    // 按回车登录
    document.getElementById('login-spirit-mark').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleLogin();
    });

    // 检查是否有已登录用户（自动登录），简化处理，这里不实现自动登录
    // 默认显示登录界面
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('main-container').style.display = 'none';

    console.log('🌌 太虚道卷 · 登录系统已就绪');
}

// 添加 shake 动画
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-5px); }
        40% { transform: translateX(5px); }
        60% { transform: translateX(-3px); }
        80% { transform: translateX(3px); }
    }
    
    .breakthrough-flash {
        animation: flashGold 0.6s ease-out;
    }
    
    @keyframes flashGold {
        0% { box-shadow: 0 0 60px rgba(180, 140, 60, 0.25); }
        50% { box-shadow: 0 0 150px rgba(255, 215, 0, 0.8); }
        100% { box-shadow: 0 0 60px rgba(180, 140, 60, 0.25); }
    }
`;
document.head.appendChild(style);

init();