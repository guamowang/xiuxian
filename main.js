// ========== Supabase 初始化 ==========
const SUPABASE_URL = 'https://iejwqfiqdxhkdqjmwfki.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uQdpBniIdCdBwzoukWJNjw_vWEyC396';
const mysupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== 全局数据 ==========
let cultivationData = null;
let currentUser = null;
let rizhiLogs = [];
let xiulianRecords = [];
let youliRecords = [];
let activeTravels = { easy: null, medium: null, hard: null };
let currentFourArtType = null;
let selectedQuality = null;
let currentTravelType = null;
let isTravelProcessing = false; // 防止重复提交云游操作

// ========== 大境界定义 ==========
const bigStages = [
    { name: '炼气期', threshold: 0, nextThreshold: 1000 },
    { name: '筑基期', threshold: 1000, nextThreshold: 3000 },
    { name: '金丹期', threshold: 3000, nextThreshold: Infinity }
];

// ========== 小境界定义 ==========
const smallStages = [
    { name: '炼气期1层', min: 0, max: 9 },
    { name: '炼气期2层', min: 10, max: 19 },
    { name: '炼气期3层', min: 20, max: 29 },
    { name: '炼气期4层', min: 30, max: 99 },
    { name: '炼气期5层', min: 100, max: 199 },
    { name: '炼气期6层', min: 200, max: 299 },
    { name: '炼气期7层', min: 300, max: 499 },
    { name: '炼气期8层', min: 500, max: 699 },
    { name: '炼气期9层', min: 700, max: 899 },
    { name: '炼气期大圆满', min: 900, max: 999 },
    { name: '筑基前期', min: 1000, max: 1499 },
    { name: '筑基中期', min: 1500, max: 1999 },
    { name: '筑基后期', min: 2000, max: 2899 },
    { name: '筑基巅峰', min: 2900, max: 2999 },
    { name: '金丹期', min: 3000, max: Infinity }
];

const attributeMap = {
    intelligence: { short: 'int', name: '智力', icon: '📖', dbField: 'zhili', type: 11 },
    strength: { short: 'str', name: '体质', icon: '💪', dbField: 'tizhi', type: 12 },
    order: { short: 'ord', name: '秩序', icon: '📐', dbField: 'zhixu', type: 13 },
    dexterity: { short: 'dex', name: '灵巧', icon: '🍃', dbField: 'lingqiao', type: 14 },
    luck: { short: 'lck', name: '幸运', icon: '🍀', dbField: 'xingyun', type: 15 }
};

// ========== 四艺映射 ==========
const fourArtsMap = {
    gongfa: { name: '功法', icon: '📜', type: 21, inputLabel: '功法名称', unit: '本功法' },
    qi: { name: '炼器', icon: '⚒️', type: 22, inputLabel: '法器名称', unit: '件' },
    fu: { name: '制符', icon: '📝', type: 23, inputLabel: '灵符名称', unit: '件' },
    ti: { name: '炼体', icon: '🔥', type: 24, inputLabel: '技能名称', unit: '个技能' }
};

// ========== 云游映射 ==========
const travelMap = {
    easy: { name: '初级游历', icon: '🌿', type: 31, cost: 10, reward: 30 },
    medium: { name: '中级游历', icon: '⛰️', type: 32, cost: 10, reward: 50 },
    hard: { name: '高级游历', icon: '🌋', type: 33, cost: 10, reward: 100 }
};

// ========== 粒子背景 ==========
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
const maxParticles = 75;

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() { this.reset(); this.y = Math.random() * canvas.height; }
    reset() {
        this.x = Math.random() * canvas.width; this.y = -10;
        this.size = Math.random() * 2 + 0.4;
        this.speedY = Math.random() * 0.45 + 0.18;
        this.speedX = (Math.random() - 0.5) * 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = Math.random() < 0.5 ? `rgba(220,180,80,${this.opacity})` : `rgba(200,160,60,${this.opacity})`;
        this.twinkleSpeed = Math.random() * 0.018 + 0.005;
        this.twinklePhase = Math.random() * Math.PI * 2;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.y * 0.01 + this.twinklePhase) * 0.2;
        if (this.y > canvas.height + 10 || this.x < -10 || this.x > canvas.width + 10) { this.reset(); this.y = -10; }
        this.twinklePhase += this.twinkleSpeed;
        this.currentOpacity = this.opacity * (0.55 + 0.45 * Math.sin(this.twinklePhase));
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace(/[\d.]+\)$/, `${this.currentOpacity})`); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace(/[\d.]+\)$/, `${this.currentOpacity * 0.2})`); ctx.fill();
    }
}

for (let i = 0; i < maxParticles; i++) particles.push(new Particle());

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(200,160,80,${0.06 * (1 - dist / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();

// ========== 工具函数 ==========
function getBigStageIndex(xiuwei) {
    for (let i = bigStages.length - 1; i >= 0; i--) {
        if (xiuwei >= bigStages[i].threshold) return i;
    }
    return 0;
}

function getCurrentBigStage() { return bigStages[cultivationData.stageIndex]; }
function getNextBigStage() {
    const idx = cultivationData.stageIndex;
    return idx < bigStages.length - 1 ? bigStages[idx + 1] : null;
}

function getSmallStage(xiuwei) {
    for (const stage of smallStages) {
        if (xiuwei >= stage.min && xiuwei <= stage.max) {
            return stage;
        }
    }
    return null;
}

function getSmallStageName(xiuwei) {
    const stage = getSmallStage(xiuwei);
    return stage ? stage.name : '未知境界';
}

function getNextSmallStage(xiuwei) {
    for (let i = 0; i < smallStages.length; i++) {
        if (xiuwei >= smallStages[i].min && xiuwei <= smallStages[i].max) {
            return smallStages[i + 1] || null;
        }
    }
    return null;
}

function getDaoAge(createtime) {
    const diffMs = new Date() - new Date(createtime);
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function formatTime(timeStr) { return new Date(timeStr).toLocaleString('zh-CN', { hour12: false }); }
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========== 登录状态管理 ==========
function setLoginLoading(isLoading, message = '') {
    const daoInput = document.getElementById('login-dao-name');
    const markInput = document.getElementById('login-spirit-mark');
    const btn = document.getElementById('login-btn');
    const msgEl = document.getElementById('login-message');
    if (daoInput) daoInput.disabled = isLoading;
    if (markInput) markInput.disabled = isLoading;
    if (btn) btn.disabled = isLoading;
    if (msgEl) msgEl.textContent = message;
}

// ========== 简单提示弹窗 ==========
function showSimpleAlert(message) {
    document.getElementById('simple-alert-message').textContent = message;
    document.getElementById('simple-alert-overlay').style.display = 'flex';
}
function closeSimpleAlert() {
    document.getElementById('simple-alert-overlay').style.display = 'none';
}

// ========== 全局加载提示 ==========
function showLoadingToast(message) {
    document.getElementById('loading-toast-text').textContent = message;
    document.getElementById('loading-toast').style.display = 'block';
}
function hideLoadingToast() {
    document.getElementById('loading-toast').style.display = 'none';
}

// ========== UI 更新 ==========
function updateUI(animateValue = false) {
    const bigStage = getCurrentBigStage();
    const nextBigStage = getNextBigStage();
    const cv = cultivationData.cultivationValue;
    const smallStageName = getSmallStageName(cv);
    const currentSmall = getSmallStage(cv);
    const nextSmall = getNextSmallStage(cv);

    document.getElementById('dao-name').textContent = cultivationData.daoName;
    document.getElementById('lingshi-value').textContent = cultivationData.spiritStones;
    document.getElementById('stage-display').textContent = bigStage.name;
    document.getElementById('stage-name').textContent = smallStageName;
    document.getElementById('dao-age').textContent = currentUser && currentUser.createtime ? getDaoAge(currentUser.createtime) + '天' : '0天';

    const cvEl = document.getElementById('cultivation-value');
    cvEl.textContent = cv;
    if (animateValue) { cvEl.classList.remove('pop'); void cvEl.offsetWidth; cvEl.classList.add('pop'); }

    // 进度条逻辑（基于小境界）
    let pp = 100;
    let currentExp = 0;
    let totalExp = 0;
    let rt = '';

    if (currentSmall && nextSmall) {
        currentExp = cv - currentSmall.min;
        totalExp = nextSmall.min - currentSmall.min;
        pp = Math.min(100, Math.max(0, (currentExp / totalExp) * 100));
        rt = `距 ${nextSmall.name} 还需 ${totalExp - currentExp} 修为`;
    } else if (currentSmall && !nextSmall) {
        // 最高境界
        currentExp = cv;
        totalExp = cv;
        pp = 100;
        rt = '已达当前最高境界 · 超凡入圣';
    }

    document.getElementById('progress-fill').style.width = pp + '%';
    document.getElementById('progress-tooltip').textContent = `${currentExp}/${totalExp}`;
    document.getElementById('progress-text').textContent = rt;

    document.getElementById('attr-int').textContent = cultivationData.attributes.intelligence;
    document.getElementById('attr-str').textContent = cultivationData.attributes.strength;
    document.getElementById('attr-ord').textContent = cultivationData.attributes.order;
    document.getElementById('attr-dex').textContent = cultivationData.attributes.dexterity;
    document.getElementById('attr-lck').textContent = cultivationData.attributes.luck;

    updateCultivationStatus();
    updateFourArtsCount();
    updateTravelCards();
}

function updateCultivationStatus() {
    Object.keys(attributeMap).forEach(attr => {
        const short = attributeMap[attr].short;
        const statusEl = document.getElementById(`status-${short}`);
        const cardEl = document.getElementById(`card-${short}`);
        const cancelBtn = document.getElementById(`cancel-${short}`);
        const hintEl = cardEl ? cardEl.querySelector('.attribute-hint') : null;
        if (cultivationData.cultivatingAttribute === attr) {
            statusEl.textContent = '修炼完成';
            cardEl.classList.add('cultivating');
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
            if (hintEl) hintEl.textContent = '修炼中...';
        } else {
            statusEl.textContent = '开始修炼';
            cardEl.classList.remove('cultivating');
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (hintEl) hintEl.textContent = hintEl.dataset.original || '';
        }
    });
}

function setRecentLog(text) { document.getElementById('recent-log').textContent = text; }

// ========== 修行日志 ==========
async function fetchRizhiLogs() {
    if (!currentUser) return;
    const { data, error } = await mysupabase
        .from('rizhi').select('*').eq('number', currentUser.number).order('time', { ascending: false });
    if (error) { console.error('获取日志失败:', error); return; }
    rizhiLogs = data || [];
    renderRizhiLogs();
}

function renderRizhiLogs() {
    const container = document.getElementById('rizhi-log-list');
    if (!container) return;
    if (rizhiLogs.length === 0) {
        container.innerHTML = '<span style="color:rgba(200,160,80,0.3);">— 暂无修行记录 —</span>';
        return;
    }
    const typeIconMap = {};
    Object.values(attributeMap).forEach(attr => { typeIconMap[attr.type] = attr.icon; });
    Object.values(fourArtsMap).forEach(art => { typeIconMap[art.type] = art.icon; });
    Object.values(travelMap).forEach(travel => { typeIconMap[travel.type] = travel.icon; });

    container.innerHTML = rizhiLogs.map(log => {
        const icon = typeIconMap[log.type] || '📌';
        return `<div class="rizhi-log-item">
                    <span class="rizhi-log-time">${escapeHtml(formatTime(log.time))}</span>
                    <span class="rizhi-log-icon">${icon}</span>
                    <span class="rizhi-log-record">${escapeHtml(log.record)}</span>
                </div>`;
    }).join('');
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
        // 左右偏移适配两倍：原 60 改为 120
        particle.style.left = cx + (Math.random() - 0.5) * 120 + 'px';
        particle.style.top = cy + (Math.random() - 0.5) * 40 + 'px';
        // 字体大小增大两倍：原 (Math.random()*0.5+0.7)em，现乘以2
        particle.style.fontSize = ((Math.random() * 0.5 + 0.7) * 2) + 'em';
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
    if (target.classList.contains('cancel-cultivation-btn')) return;
    if (target.classList.contains('attribute-status')) {
        if (cultivationData.cultivatingAttribute === attribute) openCompleteModal(attribute);
        else if (cultivationData.cultivatingAttribute === null) startCultivation(attribute, card);
        else {
            const currentAttr = cultivationData.cultivatingAttribute;
            setRecentLog(`⚠️ 正在修炼${attributeMap[currentAttr].name}，请先完成当前修炼或取消`);
            const currentCard = document.getElementById(`card-${attributeMap[currentAttr].short}`);
            if (currentCard) { currentCard.style.animation = 'shake 0.5s ease'; currentCard.addEventListener('animationend', () => { currentCard.style.animation = ''; }, { once: true }); }
        }
        return;
    }
    if (cultivationData.cultivatingAttribute === null) startCultivation(attribute, card);
    else if (cultivationData.cultivatingAttribute === attribute) setRecentLog(`请点击"修炼完成"按钮完成${attributeMap[attribute].name}修炼`);
    else setRecentLog(`⚠️ 正在修炼${attributeMap[cultivationData.cultivatingAttribute]?.name}，请先完成或取消`);
}

function startCultivation(attribute, card) {
    cultivationData.cultivatingAttribute = attribute;
    updateCultivationStatus();
    const attrInfo = attributeMap[attribute];
    setRecentLog(`🧘 开始修炼${attrInfo.name}... 达成1小时后点击"修炼完成"按钮`);
    spawnSpiritParticles(card, attrInfo.icon, 5);
}

function openCompleteModal(attribute) {
    pendingCompleteAttribute = attribute;
    document.getElementById('cultivation-note').value = '';
    document.getElementById('cultivation-note-error').style.display = 'none';
    document.getElementById('cultivation-complete-modal').style.display = 'flex';
}

function closeCompleteModal() {
    document.getElementById('cultivation-complete-modal').style.display = 'none';
    pendingCompleteAttribute = null;
}

function confirmComplete() {
    if (!pendingCompleteAttribute) return;
    const note = document.getElementById('cultivation-note').value.trim();
    if (!note) {
        const errorEl = document.getElementById('cultivation-note-error');
        errorEl.style.display = 'block';
        const textarea = document.getElementById('cultivation-note');
        textarea.style.animation = 'shake 0.5s ease';
        textarea.addEventListener('animationend', () => { textarea.style.animation = ''; }, { once: true });
        return;
    }
    const attribute = pendingCompleteAttribute;
    const card = document.getElementById(`card-${attributeMap[attribute].short}`);
    closeCompleteModal();
    completeCultivation(attribute, card, note);
}

async function completeCultivation(attribute, card, note = '') {
    cultivationData.attributes[attribute] += 1;
    cultivationData.cultivationValue += 1;
    cultivationData.cultivatingAttribute = null;

    const oldStageIndex = cultivationData.stageIndex;
    const newStageIndex = getBigStageIndex(cultivationData.cultivationValue);
    let brokeThrough = false;
    if (newStageIndex !== oldStageIndex) {
        cultivationData.stageIndex = newStageIndex;
        brokeThrough = true;
    }

    updateUI(true);

    const attrInfo = attributeMap[attribute];
    let record = `完成${attrInfo.name}修炼，${attrInfo.name}+1，修为+1`;
    if (note) record += `，修炼痕迹：${note}`;
    setRecentLog('✨ ' + record);

    card.classList.add('completing');
    setTimeout(() => card.classList.remove('completing'), 600);
    spawnSpiritParticles(card, '+1', 10);

    if (brokeThrough) triggerBreakthrough();

    if (currentUser) {
        const { error: insertError } = await mysupabase
            .from('rizhi').insert([{ number: currentUser.number, time: new Date().toISOString(), type: attrInfo.type, record: record }]);
        if (insertError) console.error('插入日志失败:', insertError);
    }

    await updateUserData();
    await fetchRizhiLogs();
}

function cancelCultivation(attribute) {
    if (cultivationData.cultivatingAttribute !== attribute) return;
    cultivationData.cultivatingAttribute = null;
    updateCultivationStatus();
    const attrInfo = attributeMap[attribute];
    setRecentLog(`🚫 已取消${attrInfo.name}的修炼，无任何收益`);
    const card = document.getElementById(`card-${attributeMap[attribute].short}`);
    if (card) spawnSpiritParticles(card, '取消', 3);
}

function triggerBreakthrough() {
    const panel = document.getElementById('main-panel-view');
    panel.classList.add('breakthrough-flash');
    setTimeout(() => panel.classList.remove('breakthrough-flash'), 600);
    setRecentLog(`🌟 突破！晋升 ${getCurrentBigStage().name}！`);
}

// ========== 四艺功能 ==========
function startFourArt(type) {
    if (!fourArtsMap[type]) return;
    currentFourArtType = type;
    selectedQuality = null;
    const art = fourArtsMap[type];
    document.getElementById('quality-modal-title').textContent = `评定${art.name}品质`;
    document.getElementById('quality-modal-desc').textContent = `请输入${art.inputLabel}并选择品质`;
    document.getElementById('four-art-name-input').value = '';
    document.getElementById('quality-error').style.display = 'none';
    document.querySelectorAll('.quality-option').forEach(opt => opt.classList.remove('selected'));
    const card = document.getElementById(`four-art-${type}`);
    if (card) card.classList.add('cultivating');
    document.getElementById('quality-modal-overlay').style.display = 'flex';
}

function selectQualityOption(quality) {
    selectedQuality = quality;
    document.querySelectorAll('.quality-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.quality === quality);
    });
    document.getElementById('quality-error').style.display = 'none';
}

function closeQualityModal() {
    document.getElementById('quality-modal-overlay').style.display = 'none';
    if (currentFourArtType) {
        const card = document.getElementById(`four-art-${currentFourArtType}`);
        if (card) card.classList.remove('cultivating');
    }
    currentFourArtType = null;
    selectedQuality = null;
}

async function confirmFourArt() {
    if (!currentFourArtType) return;
    const name = document.getElementById('four-art-name-input').value.trim();
    if (!name) {
        document.getElementById('quality-error').textContent = '⚠️ 名称不能为空';
        document.getElementById('quality-error').style.display = 'block';
        document.getElementById('four-art-name-input').style.animation = 'shake 0.5s ease';
        document.getElementById('four-art-name-input').addEventListener('animationend', () => {
            document.getElementById('four-art-name-input').style.animation = '';
        }, { once: true });
        return;
    }
    if (!selectedQuality) {
        document.getElementById('quality-error').textContent = '⚠️ 请选择品质';
        document.getElementById('quality-error').style.display = 'block';
        return;
    }

    const type = currentFourArtType;
    const art = fourArtsMap[type];
    const rewardMap = { 'low': 3, 'mid': 5, 'high': 10 };
    const levelMap = { 'low': 1, 'mid': 2, 'high': 3 };
    const qualityNameMap = { 'low': '下品', 'mid': '中品', 'high': '上品' };
    const reward = rewardMap[selectedQuality];
    const level = levelMap[selectedQuality];
    const qualityName = qualityNameMap[selectedQuality];

    closeQualityModal();

    cultivationData.spiritStones += reward;
    updateUI(true);

    const record = `完成${art.name}${qualityName}《${name}》，获得 💎${reward} 灵石`;

    const card = document.getElementById(`four-art-${type}`);
    if (card) {
        card.classList.remove('cultivating');
        card.classList.add('completing');
        setTimeout(() => card.classList.remove('completing'), 600);
        spawnSpiritParticles(card, `💎+${reward}`, 8);
    }

    if (currentUser) {
        const insertData = {
            number: currentUser.number,
            type: art.type,
            level: level,
            name: name,
            time: new Date().toISOString()
        };
        const { error: insertXiuLianError } = await mysupabase
            .from('xiulian')
            .insert([insertData]);
        if (insertXiuLianError) console.error('插入修炼表失败:', insertXiuLianError);
    }

    if (currentUser) {
        const { error: insertRizhiError } = await mysupabase
            .from('rizhi')
            .insert([{ number: currentUser.number, time: new Date().toISOString(), type: art.type, record: record }]);
        if (insertRizhiError) console.error('插入日志失败:', insertRizhiError);
    }

    await updateUserData();
    await fetchRizhiLogs();
    await fetchXiulianRecords();
}

// ========== xiulian 表操作 ==========
async function fetchXiulianRecords() {
    if (!currentUser) return;
    const { data, error } = await mysupabase
        .from('xiulian')
        .select('*')
        .eq('number', currentUser.number)
        .order('time', { ascending: false });
    if (error) { console.error('获取修炼记录失败:', error); return; }
    xiulianRecords = data || [];
    updateFourArtsCount();
}

function updateFourArtsCount() {
    const typeCounts = {
        21: xiulianRecords.filter(r => r.type === 21).length,
        22: xiulianRecords.filter(r => r.type === 22).length,
        23: xiulianRecords.filter(r => r.type === 23).length,
        24: xiulianRecords.filter(r => r.type === 24).length
    };
    document.getElementById('count-gongfa').textContent = `已修炼${typeCounts[21]}本功法`;
    document.getElementById('count-qi').textContent = `已炼器${typeCounts[22]}件`;
    document.getElementById('count-fu').textContent = `已制符${typeCounts[23]}件`;
    document.getElementById('count-ti').textContent = `已修炼${typeCounts[24]}个技能`;
}

function showListModal(type) {
    const records = xiulianRecords.filter(r => r.type === type);
    const art = Object.values(fourArtsMap).find(a => a.type === type);
    document.getElementById('list-modal-title').textContent = `${art.name}列表（共${records.length}条）`;
    const content = document.getElementById('list-modal-content');
    if (records.length === 0) {
        content.innerHTML = '<div class="list-modal-item">暂无记录</div>';
    } else {
        const levelMap = { 1: '下品', 2: '中品', 3: '上品' };
        content.innerHTML = records.map(r => {
            const levelName = levelMap[r.level] || '未知';
            const timeStr = r.time ? formatTime(r.time) : '未知时间';
            return `<div class="list-modal-item">[${levelName}] ${escapeHtml(r.name)} - ${timeStr}</div>`;
        }).join('');
    }
    document.getElementById('list-modal-overlay').style.display = 'flex';
}

function closeListModal() {
    document.getElementById('list-modal-overlay').style.display = 'none';
}

// ========== 云游四海功能 ==========
function handleTravelButton(type) {
    if (isTravelProcessing) return; // 防止处理中重复点击

    if (activeTravels[type]) {
        currentTravelType = type;
        document.getElementById('travel-complete-modal-title').textContent = `完成${travelMap[type].name}`;
        document.getElementById('travel-trace-input').value = '';
        document.getElementById('travel-complete-error').style.display = 'none';
        document.getElementById('travel-complete-modal-overlay').style.display = 'flex';
    } else {
        if (cultivationData.spiritStones < 10) {
            showSimpleAlert('灵石不足10，无法开启副本！');
            return;
        }
        currentTravelType = type;
        document.getElementById('travel-open-modal-title').textContent = `开启${travelMap[type].name}`;
        document.getElementById('travel-open-modal-desc').textContent = '开启副本需消耗10灵石';
        document.getElementById('travel-name-input').value = '';
        document.getElementById('travel-detail-input').value = '';
        document.getElementById('travel-endtime-input').value = '';
        document.getElementById('travel-open-error').style.display = 'none';
        document.getElementById('travel-open-modal-overlay').style.display = 'flex';
    }
}

function closeTravelOpenModal() {
    document.getElementById('travel-open-modal-overlay').style.display = 'none';
    currentTravelType = null;
}

function closeTravelCompleteModal() {
    document.getElementById('travel-complete-modal-overlay').style.display = 'none';
    currentTravelType = null;
}

function setTravelModalLoading(modalId, isLoading) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const inputs = modal.querySelectorAll('input, textarea, button');
    inputs.forEach(el => el.disabled = isLoading);
}

async function confirmOpenTravel() {
    if (isTravelProcessing) return;
    if (!currentTravelType) return;

    const name = document.getElementById('travel-name-input').value.trim();
    const detail = document.getElementById('travel-detail-input').value.trim();
    const endtime = document.getElementById('travel-endtime-input').value;
    const errorEl = document.getElementById('travel-open-error');

    if (!name || !detail || !endtime) {
        errorEl.style.display = 'block';
        return;
    }

    const selectedTime = new Date(endtime).getTime();
    const minTime = Date.now() + 24 * 60 * 60 * 1000;
    if (selectedTime < minTime) {
        errorEl.textContent = '⚠️ 关闭时间须在当前时间一天之后';
        errorEl.style.display = 'block';
        return;
    }

    const type = currentTravelType;
    const travel = travelMap[type];

    // 立即关闭弹窗（方案要求）
    closeTravelOpenModal();

    // 显示加载提示
    isTravelProcessing = true;
    showLoadingToast('副本开启中...');

    try {
        // 更新本地数据
        cultivationData.spiritStones -= travel.cost;
        updateUI(true);

        const youliData = {
            number: currentUser.number,
            starttime: new Date().toISOString(),
            endtime: new Date(endtime).toISOString(),
            type: travel.type,
            status: 1,
            name: name,
            completetime: null,
            detail: detail
        };
        const { data: insertedYouli, error: insertYouliError } = await mysupabase
            .from('youli')
            .insert([youliData])
            .select()
            .single();
        if (insertYouliError) console.error('插入youli表失败:', insertYouliError);

        const record = `开启${travel.name}《${name}》副本，消耗10灵石`;
        const { error: insertRizhiError } = await mysupabase
            .from('rizhi')
            .insert([{ number: currentUser.number, time: new Date().toISOString(), type: travel.type, record: record }]);
        if (insertRizhiError) console.error('插入日志失败:', insertRizhiError);

        if (insertedYouli) {
            activeTravels[type] = insertedYouli;
        }

        await updateUserData();
        await fetchRizhiLogs();
        await fetchYouliRecords();
        updateTravelCards();
        setRecentLog(`✨ 已开启${travel.name}副本《${name}》`);
    } catch (err) {
        console.error('开启副本失败:', err);
        // 如果失败，尝试恢复本地数据
        await reloadUserData();
        showSimpleAlert('开启副本失败，请稍后重试');
    } finally {
        isTravelProcessing = false;
        hideLoadingToast();
    }
}

async function confirmCompleteTravel() {
    if (isTravelProcessing) return;
    if (!currentTravelType) return;

    const trace = document.getElementById('travel-trace-input').value.trim();
    if (!trace) {
        document.getElementById('travel-complete-error').style.display = 'block';
        return;
    }

    const type = currentTravelType;
    const travel = travelMap[type];
    const activeRecord = activeTravels[type];

    // 立即关闭弹窗（方案要求）
    closeTravelCompleteModal();

    // 显示加载提示
    isTravelProcessing = true;
    showLoadingToast('副本关闭中...');

    try {
        if (activeRecord) {
            const { error: updateYouliError } = await mysupabase
                .from('youli')
                .update({ status: 2, completetime: new Date().toISOString() })
                .eq('number', currentUser.number)
                .eq('type', travel.type)
                .eq('status', 1);
            if (updateYouliError) console.error('更新youli表失败:', updateYouliError);
        }

        const record = `完成${travel.name}《${activeRecord ? activeRecord.name : ''}》副本，痕迹：${trace}，修为增加${travel.reward}`;
        const { error: insertRizhiError } = await mysupabase
            .from('rizhi')
            .insert([{ number: currentUser.number, time: new Date().toISOString(), type: travel.type, record: record }]);
        if (insertRizhiError) console.error('插入日志失败:', insertRizhiError);

        cultivationData.cultivationValue += travel.reward;
        const oldStageIndex = cultivationData.stageIndex;
        cultivationData.stageIndex = getBigStageIndex(cultivationData.cultivationValue);
        if (cultivationData.stageIndex !== oldStageIndex) {
            triggerBreakthrough();
        }

        activeTravels[type] = null;
        await updateUserData();
        await reloadUserData();
        await fetchRizhiLogs();
        await fetchYouliRecords();
        updateTravelCards();
        setRecentLog(`✨ 完成${travel.name}，修为+${travel.reward}`);
        spawnSpiritParticles(document.getElementById(`travel-${type}`), `✨+${travel.reward}`, 8);
    } catch (err) {
        console.error('完成副本失败:', err);
        await reloadUserData();
        showSimpleAlert('完成副本失败，请稍后重试');
    } finally {
        isTravelProcessing = false;
        hideLoadingToast();
    }
}

async function reloadUserData() {
    if (!currentUser) return;
    const { data: user, error } = await mysupabase
        .from('users')
        .select('*')
        .eq('number', currentUser.number)
        .maybeSingle();
    if (error || !user) {
        console.error('重新加载用户数据失败:', error);
        return;
    }
    cultivationData = mapUserToCultivationData(user);
    updateUI();
}

async function fetchYouliRecords() {
    if (!currentUser) return;
    const { data, error } = await mysupabase
        .from('youli')
        .select('*')
        .eq('number', currentUser.number)
        .order('starttime', { ascending: false });
    if (error) { console.error('获取游历记录失败:', error); return; }
    youliRecords = data || [];

    const now = new Date();
    for (const record of youliRecords) {
        if (record.status === 1 && record.endtime && new Date(record.endtime) < now) {
            await mysupabase
                .from('youli')
                .update({ status: 2, completetime: new Date().toISOString() })
                .eq('number', currentUser.number)
                .eq('type', record.type)
                .eq('status', 1);
            record.status = 2;
            record.completetime = new Date().toISOString();

            // 写入到期关闭日志
            const expireLog = `副本《${record.name}》已到期关闭`;
            const { error: expireLogError } = await mysupabase
                .from('rizhi')
                .insert([{ number: currentUser.number, time: new Date().toISOString(), type: record.type, record: expireLog }]);
            if (expireLogError) console.error('插入到期日志失败:', expireLogError);
        }
    }

    // 刷新修行日志，确保到期日志显示
    await fetchRizhiLogs();

    activeTravels = { easy: null, medium: null, hard: null };
    youliRecords.forEach(r => {
        if (r.status === 1) {
            if (r.type === 31) activeTravels.easy = r;
            else if (r.type === 32) activeTravels.medium = r;
            else if (r.type === 33) activeTravels.hard = r;
        }
    });

    updateTravelCards();
}

function updateTravelCards() {
    const types = ['easy', 'medium', 'hard'];
    types.forEach(type => {
        const card = document.getElementById(`travel-${type}`);
        const btn = document.getElementById(`travel-${type}-btn`);
        const example = document.getElementById(`travel-${type}-example`);
        const progress = document.getElementById(`travel-${type}-progress`);
        const countEl = document.getElementById(`travel-${type}-count`);
        const typeNum = travelMap[type].type;
        const count = youliRecords.filter(r => r.type === typeNum).length;

        countEl.textContent = `游历${count}次`;

        if (activeTravels[type]) {
            card.classList.add('cultivating');
            btn.textContent = '完成副本';
            example.style.display = 'none';
            progress.style.display = 'block';
            progress.textContent = `副本《${activeTravels[type].name}》进行中...`;
        } else {
            card.classList.remove('cultivating');
            btn.textContent = '开启副本';
            example.style.display = 'block';
            progress.style.display = 'none';
        }
    });
}

function showYouliList(type) {
    const typeNum = travelMap[type].type;
    const records = youliRecords.filter(r => r.type === typeNum);
    const travel = travelMap[type];
    document.getElementById('list-modal-title').textContent = `${travel.name}列表（共${records.length}条）`;
    const content = document.getElementById('list-modal-content');
    if (records.length === 0) {
        content.innerHTML = '<div class="list-modal-item">暂无记录</div>';
    } else {
        const statusMap = { 1: '开启中', 2: '已完成', 3: '失败' };
        content.innerHTML = records.map(r => {
            const statusText = statusMap[r.status] || '未知';
            const startTime = r.starttime ? formatTime(r.starttime) : '未知';
            const endTime = r.endtime ? formatTime(r.endtime) : '未知';
            const completeTime = r.completetime ? formatTime(r.completetime) : '未知';
            return `<div class="list-modal-item">
                【${statusText}】${escapeHtml(r.name)}<br>
                开始：${startTime}<br>
                关闭：${endTime}<br>
                完成：${completeTime}
            </div>`;
        }).join('');
    }
    document.getElementById('list-modal-overlay').style.display = 'flex';
}

// ========== 数据库操作 ==========
async function updateUserData() {
    if (!currentUser || !cultivationData) return;
    const dbUpdates = {
        xiuwei: cultivationData.cultivationValue,
        lingshi: cultivationData.spiritStones,
        zhili: cultivationData.attributes.intelligence,
        tizhi: cultivationData.attributes.strength,
        zhixu: cultivationData.attributes.order,
        lingqiao: cultivationData.attributes.dexterity,
        xingyun: cultivationData.attributes.luck
    };
    const { error } = await mysupabase.from('users').update(dbUpdates).eq('number', currentUser.number);
    if (error) console.error('更新用户数据失败:', error);
}

// ========== 登录/注册/登出 ==========
function mapUserToCultivationData(user) {
    const stageIndex = getBigStageIndex(user.xiuwei || 0);
    return {
        daoName: user.name,
        cultivationValue: user.xiuwei || 0,
        stageIndex: stageIndex,
        spiritStones: user.lingshi || 0,
        attributes: {
            intelligence: user.zhili || 0,
            strength: user.tizhi || 0,
            order: user.zhixu || 0,
            dexterity: user.lingqiao || 0,
            luck: user.xingyun || 0
        },
        cultivatingAttribute: null
    };
}

function getCachedUser() { const c = localStorage.getItem('current_user'); return c ? JSON.parse(c) : null; }
function setCachedUser(user) { localStorage.setItem('current_user', JSON.stringify({ name: user.name, number: user.number })); }
function clearCachedUser() { localStorage.removeItem('current_user'); }

async function checkAutoLogin() {
    const cachedUser = getCachedUser();
    if (!cachedUser || !cachedUser.name) {
        showLogin();
        return;
    }
    setLoginLoading(true, '入卷检索中...');
    try {
        const { data: user, error } = await mysupabase.from('users').select('*').eq('name', cachedUser.name).maybeSingle();
        if (error || !user) {
            clearCachedUser();
            showLogin();
            return;
        }
        currentUser = user;
        cultivationData = mapUserToCultivationData(user);
        await fetchRizhiLogs();
        await fetchXiulianRecords();
        await fetchYouliRecords();
        enterMainPanel();
    } finally {
        setLoginLoading(false, '');
    }
}

function showLogin() {
    setLoginLoading(false, '');
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('login-message').textContent = '';
    document.getElementById('login-dao-name').value = '';
    document.getElementById('login-spirit-mark').value = '';
}

function enterMainPanel() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';
    if (!window._mainPanelInitialized) { initMainPanel(); window._mainPanelInitialized = true; }
    updateUI();
    setRecentLog('点击属性卡片开始修炼，修炼达成后点击"修炼完成"按钮');
}

async function handleLogin() {
    const daoName = document.getElementById('login-dao-name').value.trim();
    const password = document.getElementById('login-spirit-mark').value.trim();
    const messageEl = document.getElementById('login-message');
    const loginBtn = document.getElementById('login-btn');

    if (!daoName || !password) { messageEl.textContent = '道号和神纹均不能为空'; return; }

    setLoginLoading(true, '正在入卷...');

    try {
        const { data: user, error: queryError } = await mysupabase.from('users').select('*').eq('name', daoName).maybeSingle();
        if (queryError) throw queryError;

        if (user) {
            if (user.password !== password) {
                const spiritInput = document.getElementById('login-spirit-mark');
                spiritInput.value = '';
                messageEl.textContent = '道友神纹匹配失败';
                spawnSpiritParticles(spiritInput, '❌ 神纹错误', 10);
                spiritInput.style.animation = 'shake 0.5s ease';
                spiritInput.addEventListener('animationend', () => { spiritInput.style.animation = ''; }, { once: true });
                return;
            }
            currentUser = user;
            cultivationData = mapUserToCultivationData(user);
            setCachedUser(user);
            await fetchRizhiLogs();
            await fetchXiulianRecords();
            await fetchYouliRecords();
            messageEl.textContent = '登录成功，欢迎回来！';
            enterMainPanel();
        } else {
            const { data: maxData } = await mysupabase.from('users').select('number').order('number', { ascending: false }).limit(1);
            let newNumber = 1;
            if (maxData && maxData.length > 0) newNumber = maxData[0].number + 1;

            const newUser = {
                number: newNumber, name: daoName, password: password,
                createtime: new Date().toISOString(),
                xiuwei: 0, lingshi: 10, zhili: 0, tizhi: 0, zhixu: 0, lingqiao: 0, xingyun: 0
            };
            const { data: insertedUser, error: insertError } = await mysupabase.from('users').insert([newUser]).select().single();
            if (insertError) throw insertError;

            currentUser = insertedUser;
            cultivationData = mapUserToCultivationData(insertedUser);
            setCachedUser(insertedUser);
            await fetchRizhiLogs();
            await fetchXiulianRecords();
            await fetchYouliRecords();

            messageEl.textContent = '恭喜新道友入卷！';
            spawnSpiritParticles(document.getElementById('login-btn'), '🎉 入卷', 12);
            setTimeout(() => enterMainPanel(), 800);
        }
    } catch (err) {
        console.error('登录/注册异常:', err);
        messageEl.textContent = '网络错误，请稍后再试';
    } finally {
        setLoginLoading(false, '');
    }
}

function handleLogout() {
    clearCachedUser();
    currentUser = null;
    cultivationData = null;
    rizhiLogs = [];
    xiulianRecords = [];
    youliRecords = [];
    activeTravels = { easy: null, medium: null, hard: null };
    isTravelProcessing = false;
    hideLoadingToast();
    showLogin();
}

// ========== 主面板初始化 ==========
function initMainPanel() {
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    document.querySelectorAll('.attribute-card').forEach(card => card.addEventListener('click', handleAttributeClick));

    document.querySelectorAll('.cancel-cultivation-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const short = this.id.replace('cancel-', '');
            const attribute = Object.keys(attributeMap).find(key => attributeMap[key].short === short);
            if (attribute) cancelCultivation(attribute);
        });
    });

    document.querySelectorAll('.attribute-status').forEach(statusBtn => {
        statusBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const card = this.closest('.attribute-card');
            if (card) handleAttributeClick({ currentTarget: card, target: this });
        });
    });

    document.getElementById('confirm-complete-btn').addEventListener('click', confirmComplete);
    document.getElementById('cancel-complete-btn').addEventListener('click', closeCompleteModal);
    document.getElementById('cultivation-complete-modal').addEventListener('click', function (e) { if (e.target === this) closeCompleteModal(); });

    document.getElementById('quality-modal-overlay').addEventListener('click', function (e) {
        if (e.target === this) closeQualityModal();
    });

    document.getElementById('list-modal-overlay').addEventListener('click', function (e) {
        if (e.target === this) closeListModal();
    });

    document.getElementById('travel-open-modal-overlay').addEventListener('click', function (e) {
        if (e.target === this) closeTravelOpenModal();
    });

    document.getElementById('travel-complete-modal-overlay').addEventListener('click', function (e) {
        if (e.target === this) closeTravelCompleteModal();
    });

    document.getElementById('simple-alert-overlay').addEventListener('click', function (e) {
        if (e.target === this) closeSimpleAlert();
    });

    document.querySelectorAll('.four-art-count').forEach(el => {
        el.addEventListener('click', function (e) {
            e.stopPropagation();
            const type = parseInt(this.dataset.type);
            showListModal(type);
        });
    });

    document.querySelectorAll('.travel-count').forEach(el => {
        el.addEventListener('click', function (e) {
            e.stopPropagation();
            const typeNum = parseInt(this.dataset.type);
            const type = Object.keys(travelMap).find(key => travelMap[key].type === typeNum);
            if (type) showYouliList(type);
        });
    });
}

// ========== 初始化 ==========
function init() {
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('login-spirit-mark').addEventListener('keypress', function (e) { if (e.key === 'Enter') handleLogin(); });
    checkAutoLogin();
}

// 添加 shake 动画
const style = document.createElement('style');
style.textContent = `
    @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
    .breakthrough-flash { animation: flashGold 0.6s ease-out; }
    @keyframes flashGold { 0% { box-shadow: 0 0 60px rgba(180, 140, 60, 0.25); } 50% { box-shadow: 0 0 150px rgba(255, 215, 0, 0.8); } 100% { box-shadow: 0 0 60px rgba(180, 140, 60, 0.25); } }
`;
document.head.appendChild(style);

init();