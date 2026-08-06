// parsers.js
// Модуль для работы с данными, парсинга форматов и обработки изображений

window.globalGameRenderActive = false;
window.preloadedBgs = {};
const bgList = [
    'background.png', '2background.png', '3background.png',
    '4background.png', '5background.png', '6background.png',
    '7background.png', 'RagnPhone.png'
];
bgList.forEach(bg => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        window.preloadedBgs[bg] = img;
    };
    img.src = bg;
});
const preloadBgGlobal = new Image();
preloadBgGlobal.onload = () => {
    window._cachedTrueInventoryBgImage = preloadBgGlobal;
    window._cachedTrueInventoryBgDimensions = { w: preloadBgGlobal.naturalWidth, h: preloadBgGlobal.naturalHeight };
};
preloadBgGlobal.src = 'trueinventorybackground.png';

window.getRawPixelData = async function(url) {
    if (!url || url === 'empty') return null;
    if (window.ugsRawCache && window.ugsRawCache[url]) {
        return window.ugsRawCache[url];
    }
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const img = UPNG.decode(buffer);
        const rgbaBuffer = UPNG.toRGBA8(img)[0];
        return {
            width: img.width,
            height: img.height,
            data: new Uint8Array(rgbaBuffer) 
        };
        } catch (e) {
            console.warn("UPNG decode failed, fallback or invalid format:", url, e);
            return null;
        }
    };

    window.applyGameRenderToImage = async function(img) {
        if (!img || !img.src) return;

        // Сохраняем исходный чистый путь к картинке
        if (!img.dataset.originalSrc) {
            if (img.src.startsWith('data:') || img.src.startsWith('blob:')) {
                if (!img.dataset.originalSrc) {
                    img.dataset.originalSrc = img.src;
                }
            } else {
                img.dataset.originalSrc = img.src;
            }
        }

        // Если глобальный игровой рендер выключен, бесшовно возвращаем оригинал на место
        if (!window.globalGameRenderActive) {
            if (img.dataset.gameRendered === 'true' || img.src !== img.dataset.originalSrc) {
                img.src = img.dataset.originalSrc;
                img.removeAttribute('data-game-rendered');
            }
            return;
        }

        if (img.dataset.gameRendered === 'true') return;

        const originalSrc = img.dataset.originalSrc;
        if (!originalSrc || originalSrc === 'empty') return;

        // Вычисляем ключ кэша на основе пути картинки и текущего фона
        const bgStyle = getComputedStyle(document.documentElement).getPropertyValue('--background-tile');
        const match = bgStyle ? bgStyle.match(/url\(['"]?(.*?)['"]?\)/) : null;
        const currentBgName = match ? match[1].split('/').pop() : '2background.png';
        const cacheKey = originalSrc + "::" + currentBgName;

        // Если картинка с таким фоном уже есть в кэше, применяем её мгновенно без Canvas-операций
        if (window.blendedImageCache && window.blendedImageCache[cacheKey]) {
            img.src = window.blendedImageCache[cacheKey];
            img.dataset.gameRendered = 'true';
            return;
        }

        img.dataset.gameRendered = 'true';

        try {
            const imgData = await window.getRawPixelData(originalSrc);
            if (!imgData) return;

            const width = imgData.width;
            const height = imgData.height;
            const srcData = imgData.data;

            let hasAlpha = false;
            for (let i = 3; i < srcData.length; i += 4) {
                if (srcData[i] < 255) {
                    hasAlpha = true;
                    break;
                }
            }
            // Если прозрачности нет, то и смешивать нечего. Кэшируем оригинал.
            if (!hasAlpha) {
                if (img.src !== originalSrc) {
                    img.src = originalSrc;
                }
                window.blendedImageCache[cacheKey] = originalSrc;
                return;
            }

            const bgCanvas = document.createElement('canvas');
            bgCanvas.width = width;
            bgCanvas.height = height;
            const bgCtx = bgCanvas.getContext('2d');

            const activeBgImg = window.preloadedBgs[currentBgName] || window._cachedTrueInventoryBgImage;

            if (activeBgImg && activeBgImg.complete) {
                const pattern = bgCtx.createPattern(activeBgImg, 'repeat');
                bgCtx.fillStyle = pattern;
                bgCtx.fillRect(0, 0, width, height);
            } else {
                bgCtx.fillStyle = '#1a1a1a';
                bgCtx.fillRect(0, 0, width, height);
            }

            const bgData = bgCtx.getImageData(0, 0, width, height).data;
            const dest = new Uint8ClampedArray(srcData.length);

            for (let i = 0; i < srcData.length; i += 4) {
                const a_src = srcData[i+3] / 255.0;
                const invA = 1.0 - a_src;
                dest[i]   = Math.min(255, Math.max(0, Math.round(srcData[i]   + bgData[i]   * invA)));
                dest[i+1] = Math.min(255, Math.max(0, Math.round(srcData[i+1] + bgData[i+1] * invA)));
                dest[i+2] = Math.min(255, Math.max(0, Math.round(srcData[i+2] + bgData[i+2] * invA)));
                dest[i+3] = 255;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            const outImgData = ctx.createImageData(width, height);
            outImgData.data.set(dest);
            ctx.putImageData(outImgData, 0, 0);

            const blendedUrl = canvas.toDataURL('image/png');

            // Сохраняем в кэш полученную DataURL
            window.blendedImageCache[cacheKey] = blendedUrl;

            // Подменяем src только если состояние рендера за время генерации не поменялось
            if (window.globalGameRenderActive && img.dataset.originalSrc === originalSrc) {
                img.src = blendedUrl;
            }
        } catch (e) {
            console.warn("CORS or Canvas error during dynamic game render blending:", e);
            if (img.src !== img.dataset.originalSrc) {
                img.src = img.dataset.originalSrc;
            }
        }
    };

    // Функция бесшовного обновления иконок прямо в DOM без пересоздания структуры
    window.updateAllBoardImagesInPlace = function() {
        const itemImages = document.querySelectorAll(
            '.item > img, ' +
            '.pinned-icon-container img, ' +
            '.ct-item-icon, ' +
            '.ed-list-icon, ' +
            '#ed-icon'
        );

        itemImages.forEach(img => {
            if (img.classList.contains('gold-icon') || img.classList.contains('type-icon') || img.classList.contains('mod-icon') || img.classList.contains('ct-bonus-icon')) {
                return;
            }

            const container = img.closest('.item') || img.closest('.pinned-item') || img.closest('.ct-item-header-inner') || img.closest('.ed-list-item');
            let uid = null;

            if (container) {
                uid = container.dataset.uid || (container.querySelector('[data-uid]') ? container.querySelector('[data-uid]').dataset.uid : null);
            }

            if (img.id === 'ed-icon') {
                const edId = document.getElementById('ed-id');
                if (edId && edId.value) {
                    uid = currentMode + '_' + edId.value;
                }
            }

            if (uid) {
                const [mod, globalId] = uid.split('_');
                let itemData = null;
                const sourceData = (mod === mod1) ? savedData1 : savedData2;
                if (sourceData) {
                    itemData = Object.values(sourceData).find(x => x.GlobalIndex === globalId);
                }

                if (itemData) {
                    const isSecondIcon = img.parentElement.classList.contains('pinned-icon-container') && img.previousElementSibling;
                    let freshUrl = '';
                    if (isSecondIcon && itemData.Icon2) {
                        freshUrl = window.resolveIconUrl(mod, { ...itemData, Icon: itemData.Icon2 });
                    } else if (isSecondIcon && container.dataset.icon2) {
                        freshUrl = container.dataset.icon2;
                    } else {
                        freshUrl = window.resolveIconUrl(mod, itemData);
                    }

                    if (freshUrl) {
                        img.dataset.originalSrc = freshUrl;
                        img.removeAttribute('data-game-rendered');
                        window.applyGameRenderToImage(img);
                    }
                }
            } else if (img.dataset.originalSrc) {
                img.removeAttribute('data-game-rendered');
                window.applyGameRenderToImage(img);
            }
        });
    };

    // --- Глобальные хранилища для UGS ---
    window.modUGS = {}; // { modName: ArrayBuffer }
    window.modUGSOffsets = {}; // { modName: [offset1, offset2, ...] }
    window.modUGSCache = {}; // { modName: { index: blobUrl } }
    window.blendedImageCache = {}; // Кэш обработанных картинок игрового рендера
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

    if (item.Icon && (item.Icon.startsWith('data:') || item.Icon.startsWith('blob:'))) {
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
