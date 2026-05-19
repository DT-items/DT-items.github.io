// parsers.js
// Модуль для работы с данными, парсинга форматов и обработки изображений

// --- Глобальные хранилища для UGS ---
window.modUGS = {}; // { modName: ArrayBuffer }
window.modUGSOffsets = {}; // { modName: [offset1, offset2, ...] }
window.modUGSCache = {}; // { modName: { index: blobUrl } }
// НОВОЕ: Кэш сырых байтов для моментального экспорта без потери качества
window.ugsRawCache = {}; 

// --- КАРТЫ СОПОСТАВЛЕНИЙ ДЛЯ NATIVE INI ---
window.BONUS_MAP = {
    'SpearDefense': 'Длинное Оружие', 'HorseAtack': 'Быстрая Атака',
    'GodStrike': 'Гнев Господен', 'GodAnger': 'Кара Господня',
    'ArmyMedic': 'Лекарское Умение', 'Unvulnerabe': 'Неуязвимость',
    'Poison': 'Отравленное Оружие', 'DeathCurse': 'Проклятие Смерти',
    'ArmorIgnore': 'Проникающий Удар', 'OldVampirsGist': 'Тёмное Искусство',
    'Merchant': 'Торговец-Эксперт', 'Evasive': 'Увёртливость',
    'FastDead': 'Быстрый Мертвец', 'Garrison': 'Гарнизон',
    'Counterblow': 'Контрудар', 'Dead': 'Мертвец',
    'VampirsGist': 'Тёмный Дар', 'Artillery': 'Шквальная Атака',
    'Ghost': 'Яростный Дух', 'FlankStrike': 'Фланговый Удар',
    'AddPayment': 'Тыловая Служба',
    'Hunger': 'Голод', 'Berserk': 'Берсерк',
    'Exhaustion': 'Истощение', 'Drying': 'Иссушение',
    'CtrPoison': 'Ядовитый', 'Suicide': 'Смертник',
    'Caster': 'Колдовство', 'Splash': 'Размашистый удар',
    'Fortify': 'Укрепление', 'Dominate': 'Доминация',
    'Concentration': 'Концентрация', 'PoisonS': 'Сильный яд',
    'Stun': 'Ошеломляющий удар', 'Potent': 'Мощная магия',
    'FirstShot': 'Первый удар', 'Bastion': 'Бастион',
    'Flying': 'Летающий', 'Flock': 'Стая',
    'Bleed': 'Кровотечение', 'HoldLine': 'Держать строй',
    'ArmorBreaker': 'Разрушение брони', 'PoisonArmorIgnore': 'Ядовитый прокол',
    'FasterAttack': 'Молниеносная атака', 'NoHeal': 'Калечащий удар',
    'PreventiveStrike': 'Упреждающий удар',
    'Neutralize': 'Нейтрализация', 'KillingStrike': 'Добивание',
    'BloodThrist': 'Жажда крови', 'Assault': 'Штурмовик',
    'EternalGift': 'Дар вечности', 'FateGift': 'Подарок судьбы'
};

window.MAGIC_MAP = {
    'DeathMagic': 'Магия смерти', 'LifeMagic': 'Магия жизни',
    'ElementalMagic': 'Магия стихий',
};

window.NAME_MAP = {
    'Manevres': 'Количество действий', 'Hits': 'Жизнь (хиты)',
    'DefenceBlow': 'Защита рукопашная', 'AttackBlow': 'Атака рукопашная',
    'DefenceShot': 'Защита стрелковая', 'AttackShot': 'Атака стрелковая',
    'Vampirizm': 'Вампиризм', 'Regen': 'Регенерация', 'Initiative': 'Инициатива',
    'DeathMagic': 'Магия смерти', 'LifeMagic': 'Магия жизни',
    'ElementalMagic': 'Магия стихий', 'MagicPower': 'Сила магии',
    'ProtectElemental': 'Защита от магии стихий', 'ProtectDeath': 'Защита от магии смерти',
    'ProtectLife': 'Защита от магии жизни',
};

// --- 1) INI‑парсер ---
window.parseINI = function(text) {
    const lines = text.split(/\r?\n/);
    const data = {};
    let section = null, inAttrs = false;

    for (let raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        if (line.startsWith('// характеристики')) { inAttrs = true; continue; }
        if (line.startsWith('//')) continue;
        const m = line.match(/^\[(.+)\]$/);
        if (m) {
            section = m[1];
            data[section] = {};
            inAttrs = false;
            continue;
        }
        if (!section) continue;

        const firstEqIndex = line.indexOf('=');
        if (firstEqIndex === -1) continue;

        const k = line.substring(0, firstEqIndex).trim();
        let value = line.substring(firstEqIndex + 1).trim();

        if (k === 'Magic') {
            if (window.MAGIC_MAP[value]) value = window.MAGIC_MAP[value];
            data[section][k] = value;
            continue;
        }
        if (k === 'Bonus') {
            const rawBonusName = value;
            if (window.BONUS_MAP[value]) value = window.BONUS_MAP[value];
            data[section][k] = value;
            data[section]['BonusIcon'] = `bonic/${rawBonusName}.png`;
            continue;
        }
        if (k === 'Icon') {
            value = value.replace(/\.tga$/i, '.png');
            data[section][k] = value;
            continue;
        }

        if (inAttrs) {
            if (!Array.isArray(data[section]._attrs)) data[section]._attrs = [];

            const prefixMatch = k.match(/^([pdf])-(.+)$/);
            if (prefixMatch) {
                const prefix = prefixMatch[1];
                const rawKey = prefixMatch[2];
                const mappedKey = window.NAME_MAP[rawKey] || rawKey;

                let numericVal = parseFloat(value);
                let isNumber = !isNaN(numericVal);

                if (prefix === 'p') {
                    if (isNumber && numericVal > 0) value = `+${value}%`;
                    else value = `${value}%`;
                } else if (prefix === 'd') {
                    if (isNumber && numericVal > 0) value = `+${value}`;
                } else if (prefix === 'f') {
                    value = `=${value}`;
                }

                data[section]._attrs.push({ key: mappedKey, value });
            } else {
                data[section]._attrs.push({ key: k, value });
            }
        } else {
            data[section][k] = value;
        }
    }
    return data;
};


// --- UGS DECODER & HELPER ---

window.indexUGS = function(modName, buffer) {
    const offsets = [];
    const view = new DataView(buffer);
    let offset = 0;
    const len = buffer.byteLength;

    while (offset < len) {
        if (offset + 4 > len) break;
        const w = view.getUint16(offset, true);
        const h = view.getUint16(offset + 2, true);
        offsets.push(offset);
        const size = 4 + w * h * 2;
        offset += size;
    }
    window.modUGSOffsets[modName] = offsets;
};

window.getUGSIconUrl = function(modName, globalIndexStr) {
    const buffer = window.modUGS[modName];
    const offsets = window.modUGSOffsets[modName];

    if (!buffer || !offsets) return null;

    const index = parseInt(globalIndexStr);
    if (isNaN(index) || index < 1 || index > offsets.length) return null;

    const arrayIndex = index - 1;

    if (!window.modUGSCache[modName]) window.modUGSCache[modName] = {};
    if (window.modUGSCache[modName][index]) return window.modUGSCache[modName][index];

    const offset = offsets[arrayIndex];
    const view = new DataView(buffer);

    const width = view.getUint16(offset, true);
    const height = view.getUint16(offset + 2, true);
    const pixelsPerImage = width * height;

    const rgbaBuffer = new Uint8Array(pixelsPerImage * 4);
    let bytePtr = offset + 4;

    for (let i = 0; i < pixelsPerImage; i++) {
        let rawWord = view.getUint16(bytePtr, true);
        bytePtr += 2;
        const idx = i * 4;

        if (rawWord === 0xAAAA) {
            rgbaBuffer[idx] = 0; rgbaBuffer[idx + 1] = 0; rgbaBuffer[idx + 2] = 0; rgbaBuffer[idx + 3] = 0;
            continue;
        }

        let val = rawWord ^ 0xAAAA;
        const r4 = (val >> 11) & 0xF;
        const g4 = (val >> 7) & 0xF;
        const b4 = (val >> 3) & 0xF;
        const alpha_high = val & 0x7;
        const alpha_low = (val >> 15) & 0x1;
        const a4 = (alpha_high << 1) | alpha_low;

        rgbaBuffer[idx] = r4 * 17;
        rgbaBuffer[idx + 1] = g4 * 17;
        rgbaBuffer[idx + 2] = b4 * 17;
        rgbaBuffer[idx + 3] = a4 * 17;
    }

    // ИСПОЛЬЗУЕМ ВСТРОЕННЫЙ CANVAS ДЛЯ ОТОБРАЖЕНИЯ НА САЙТЕ (работает моментально)
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    imgData.data.set(rgbaBuffer);
    ctx.putImageData(imgData, 0, 0);

    const url = canvas.toDataURL('image/png');
    
    // СОХРАНЯЕМ СЫРЫЕ, НЕИСКАЖЕННЫЕ БАЙТЫ В КЭШ ДЛЯ ЭКСПОРТА (гарантирует байт-в-байт точность)
    if (!window.ugsRawCache) window.ugsRawCache = {};
    window.ugsRawCache[url] = { width, height, data: rgbaBuffer };

    window.modUGSCache[modName][index] = url;
    
    return url;
};

window.resolveIconUrl = function(mod, item) {
    if (!item) return '';

    if (item.Icon && item.Icon.startsWith('data:')) {
        return item.Icon;
    }

    const ugsUrl = window.getUGSIconUrl(mod, item.GlobalIndex);
    if (ugsUrl) return ugsUrl;

    let iconUrl = `./${mod}/` + item.Icon.replace(/\\/g, '/');

    return iconUrl;
};

window.loadUGS = function(modName) {
    if (modName === 'NewMod') {
        if (window.modUGS['NewMod'] && !window.modUGSOffsets['NewMod']) {
            window.indexUGS('NewMod', window.modUGS['NewMod']);
        }
        return Promise.resolve(window.modUGS['NewMod']);
    }

    const ugsPath = `./${modName}/Items.ugs`;
    return fetch(ugsPath)
        .then(res => {
            if (res.ok) return res.arrayBuffer();
            return null;
        })
        .then(buffer => {
            if (buffer) {
                window.modUGS[modName] = buffer;
                window.indexUGS(modName, buffer);
            } else {
                window.modUGS[modName] = null;
            }
            return buffer;
        })
        .catch(() => {
            window.modUGS[modName] = null;
        });
};
