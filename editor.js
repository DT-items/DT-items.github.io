// editor.js

// --- Элементы DOM ---
const btnEditor     = document.getElementById('btn-editor');
const editorOverlay = document.getElementById('editor-overlay');
const cancelBtn     = document.getElementById('ed-cancel-btn');
const saveBtn       = document.getElementById('ed-save-btn'); 
const createBtn     = document.getElementById('ed-create-btn'); // Кнопка Создать
const exportAllBtn  = document.getElementById('ed-export-all-btn'); // Новая общая кнопка экспорта
const edDynamicBtn  = document.getElementById('ed-dynamic-btn'); // Новая кнопка
const iconExportBtn = document.getElementById('ed-icon-export-btn'); // Кнопка экспорта иконок
const edCopyBtn     = document.getElementById('ed-copy-btn');   // Кнопка копирования
const edPasteBtn    = document.getElementById('ed-paste-btn');  // Кнопка вставки
const edZoomBtn     = document.getElementById('ed-zoom-btn');   // Новая кнопка Zoom

const contextMenu   = document.getElementById('custom-context-menu');
const ctxOpenEditor = document.getElementById('ctx-open-editor');

// Элементы внутри редактора
const edIconWrapper = document.getElementById('ed-icon-wrapper');
const edIcon      = document.getElementById('ed-icon');
const edId        = document.getElementById('ed-id');
const edName      = document.getElementById('ed-name');
const edDesc      = document.getElementById('ed-desc');
const edCost      = document.getElementById('ed-cost');

// --- Элементы селектора иконок ---
const iconSelectorOverlay = document.getElementById('icon-selector-overlay');
const iconGridStandard    = document.getElementById('icon-grid-standard');
const iconGridCustom      = document.getElementById('icon-grid-custom');
const iconSearchStandard  = document.getElementById('icon-search-standard');
const iconClearStandard   = document.getElementById('icon-clear-standard');
const iconSearchCustom    = document.getElementById('icon-search-custom');
const iconClearCustom     = document.getElementById('icon-clear-custom');
const iconUploadTrigger   = document.getElementById('icon-upload-trigger');
const iconFileInput       = document.getElementById('icon-file-input');

// --- Элементы окна "Несохраненные изменения" ---
const unsavedOverlay = document.getElementById('unsaved-changes-overlay');
const ucCancelBtn    = document.getElementById('uc-cancel');
const ucDiscardBtn   = document.getElementById('uc-discard');
const ucSaveBtn      = document.getElementById('uc-save');

// --- Элементы окна "Удаление" ---
const deleteOverlay  = document.getElementById('delete-confirm-overlay');
const delCancelBtn   = document.getElementById('del-cancel');
const delConfirmBtn  = document.getElementById('del-confirm');

// --- Элементы окна "Некорректный размер" ---
const sizeWarningOverlay = document.getElementById('size-warning-overlay');
const swCancelBtn        = document.getElementById('sw-cancel');
const swResizeBtn        = document.getElementById('sw-resize');

// --- Элементы окна Zoom (Сравнение UGS) ---
const zoomOverlay    = document.getElementById('zoom-overlay');
const zoomCanvas     = document.getElementById('zoom-canvas');
const zoomTitle      = document.getElementById('zoom-title');
const zoomCompareBtn = document.getElementById('zoom-compare-btn');
const zoomCloseBtn   = document.getElementById('zoom-close-btn');

// Контейнеры для колонок статов
let edStatsCols = { col1: null, col2: null };

const edList      = document.getElementById('ed-item-list');
const edSelectionCursor = document.getElementById('ed-selection-cursor');

// Элементы списка
const edSearchInput = document.getElementById('ed-search-input');
const edSearchClear = document.getElementById('ed-search-clear');
const edSortBtn     = document.getElementById('ed-sort-btn');

// Контейнеры для кастомных селектов
const edTypeContainer  = document.getElementById('ed-type-container');
const edMagicContainer = document.getElementById('ed-magic-container');
const edBonusContainer = document.getElementById('ed-bonus-container');

// Слайдер
let sliderPopup = null;
let sliderInput = null;
let activePercentInput = null;

// Превью
let previewContainer = null;

// Переменные состояния
let contextTargetItem = null;
let currentSortMode = 0; // 0: Type, 1: ID, 2: Name
const SORT_MODES = ['Type', 'ID', 'Name']; 

// Состояние иконки
let currentIconPath = ''; // Путь или DataURL текущей выбранной иконки
let customIcons = []; // Массив { name, url } для пользовательских картинок
window.originalCustomIcons = {}; // Связь { СжатыйDataUrl: ОригинальныйDataUrl } для Zoom окна
let isCurrentIconCustom = false; // Флаг для Zoom модального окна

// Состояние несохраненных изменений
let initialFormState = '';
let pendingAction = null; // Функция, которую нужно выполнить после подтверждения

// --- PHYSICS LIST VARS ---
const ITEM_HEIGHT = 52;
const GAP = 4;
const FULL_ITEM_HEIGHT = ITEM_HEIGHT + GAP;
const TOP_SPACER = 10;

let targetScrollTop = 0;
let currentScrollTop = 0;
let visualIndex = 0;
let animationFrameId = 0;
let isInternalNavigation = false;
let scrollStopTimeout = null;

// --- КОНФИГУРАЦИЯ СТАТОВ (ИСТОЧНИК ИСТИНЫ) ---
// Индекс в этом массиве теперь является УНИКАЛЬНЫМ ИДЕНТИФИКАТОРОМ поля.
const STAT_CONFIG = [
    // --- COL 1: Боевые (0-6) ---
    { key: 'Атака рукопашная', col: 1, cssClass: 'stat-attack', modes: ['plus', 'eq', 'percent'] },
    { key: 'Атака стрелковая', col: 1, cssClass: 'stat-attack', modes: ['plus', 'eq', 'percent'] },
    { key: 'Защита рукопашная', col: 1, cssClass: 'stat-defense', modes: ['plus', 'eq', 'percent'] },
    { key: 'Защита стрелковая', col: 1, cssClass: 'stat-defense', modes: ['plus', 'eq', 'percent'] },
    { key: 'Сила магии', col: 1, cssClass: 'stat-magic', modes: ['plus', 'eq', 'percent'] },
    { key: 'Инициатива', col: 1, cssClass: 'stat-init', modes: ['plus', 'eq', 'percent'] },
    { key: 'Количество действий', col: 1, cssClass: 'stat-moves', modes: ['plus', 'eq', 'percent'] },

    // --- COL 2: Защитные (7-12) ---
    { key: 'Жизнь (хиты)', col: 2, cssClass: 'stat-life', modes: ['eq', 'percent', 'plus'] },
    { key: 'Защита от магии жизни', label: 'Защ. от магии жизни', col: 2, cssClass: 'stat-res-life', modes: ['eq', 'percent'] },
    { key: 'Защита от магии смерти', label: 'Защ. от магии смерти', col: 2, cssClass: 'stat-res-death', modes: ['eq', 'percent'] },
    { key: 'Защита от магии стихий', label: 'Защ. от магии стихий', col: 2, cssClass: 'stat-res-elem', modes: ['eq', 'percent'] },
    { key: 'Вампиризм', col: 2, cssClass: 'stat-vamp', modes: ['eq', 'percent'] },
    { key: 'Регенерация', col: 2, cssClass: 'stat-regen', modes: ['eq', 'percent'] }
];

// Карта быстрого доступа: 'Название стата' -> Индекс в массиве
const STAT_KEY_TO_INDEX = {};
STAT_CONFIG.forEach((stat, index) => {
    STAT_KEY_TO_INDEX[stat.key] = index;
});

// ГЕНЕРАТОР ЖЕЛЕЗОБЕТОННЫХ ID
// index: номер в массиве STAT_CONFIG
// mode: 'eq', 'plus', 'percent'
function getStatInputId(index, mode) {
    return `ed_st_${index}_${mode}`;
}

const EDITOR_GROUPS = [
    { id: 'BlowWeapon', name: 'Оружие ближнего боя' },
    { id: 'ShotWeapon', name: 'Оружие дальнего боя' },
    { id: 'Armor',      name: 'Броня' },
    { id: 'Helm',       name: 'Шлемы' },
    { id: 'Shield',     name: 'Щиты' },
    { id: 'Staff',      name: 'Посохи' },
    { id: 'Amulet',     name: 'Амулеты' },
    { id: 'Ring',       name: 'Кольца' },
    { id: 'Potion',     name: 'Зелья' },
    { id: 'Item',       name: 'Предметы' }
];

const TYPE_ICONS_MAP = {
  'BlowWeapon': './Vanilla/Items/1.png',
  'ShotWeapon': './Vanilla/Items/33.png',
  'Armor':      './Vanilla/Items/35.png',
  'Helm':       './Vanilla/Items/44.png',
  'Shield':     './Vanilla/Items/53.png',
  'Staff':      './Vanilla/Items/68.png',
  'Amulet':     './Vanilla/Items/86.png',
  'Ring':       './Vanilla/Items/61.png',
  'Potion':     './Vanilla/Items/99.png',
  'Item':       './Vanilla/Items/101.png'
};

const MAGIC_OPTIONS = [
    { value: 'Нет', text: 'Нет', color: '#888' },
    { value: 'Магия Жизни', text: 'Магия Жизни', color: '#62B3F7' },
    { value: 'Магия Смерти', text: 'Магия Смерти', color: '#ccc' }, 
    { value: 'Магия Стихий', text: 'Магия Стихий', color: '#22B14C' }
];

// Текущие значения формы
let currentType = EDITOR_GROUPS[0].id;
let currentMagic = 'Нет';
let currentBonus = '';
let currentItemsList = []; 
let selectedListItemIndex = -1;

// Утилита для обновления счетчика символов
function updateCharCounter() {
    const counter = document.getElementById('ed-desc-count');
    if (counter && edDesc) {
        counter.textContent = (edDesc.value || '').length;
    }
}

// --- Helper: Получение текущего состояния формы (для сравнения) ---
function getFormState() {
    const state = {
        name: edName.value,
        desc: edDesc.value,
        id: edId.value,
        cost: edCost.value,
        icon: currentIconPath,
        type: currentType,
        magic: currentMagic,
        bonus: currentBonus,
        stats: {}
    };
    
    STAT_CONFIG.forEach((stat, index) => {
        const getVal = (mode) => {
            const el = document.getElementById(getStatInputId(index, mode));
            return el ? el.value : '';
        };
        state.stats[index] = {
            plus: getVal('plus'),
            eq: getVal('eq'),
            percent: getVal('percent')
        };
    });
    
    return state;
}

function hasUnsavedChanges() {
    if (!initialFormState) return false;
    const currentState = JSON.stringify(getFormState());
    return currentState !== initialFormState;
}

// --- Logic for Unsaved Changes Modal ---

function showUnsavedModal() {
    unsavedOverlay.classList.add('visible');
}

function hideUnsavedModal() {
    unsavedOverlay.classList.remove('visible');
    pendingAction = null;
}

// Клик вне окна (по фону) = Отмена
unsavedOverlay.addEventListener('click', (e) => {
    if (e.target === unsavedOverlay) {
        hideUnsavedModal();
    }
});

// Кнопка "Отмена" - остаемся в редакторе
ucCancelBtn.addEventListener('click', () => {
    hideUnsavedModal();
    // Возвращаем фокус на редактор
});

// Кнопка "Не сохранять" - выполняем действие без сохранения
ucDiscardBtn.addEventListener('click', () => {
    // Временно отключаем проверку, чтобы разрешить действие
    const tempAction = pendingAction;
    hideUnsavedModal();
    if (tempAction) {
        // Обновляем "начальное состояние" текущим (грязным), чтобы проверка не сработала снова внутри действия
        // Или просто выполняем действие, которое перезапишет форму
        initialFormState = ''; // Сброс флага
        tempAction(); 
    }
});

// Кнопка "Сохранить и продолжить"
ucSaveBtn.addEventListener('click', () => {
    // 1. Сохраняем данные в память
    updateCurrentItemData();
    // 2. ОБЯЗАТЕЛЬНО: Обновляем основной интерфейс приложения
    if (window.refreshApp) window.refreshApp();
    
    // 3. Выполняем отложенное действие (закрытие/переход)
    const tempAction = pendingAction;
    hideUnsavedModal();
    if (tempAction) tempAction();
});

// Wrapper для действий, требующих проверки
function attemptAction(action) {
    // ЖЕЛЕЗОБЕТОННО: Проверяем только наличие изменений формы. 
    // Индекс списка игнорируем, так как при поиске он сбрасывается в -1.
    if (hasUnsavedChanges()) {
        pendingAction = action;
        showUnsavedModal();
    } else {
        action();
    }
}

// --- Logic for DELETE Item Modal ---

// Открыть модальное окно удаления
function showDeleteModal() {
    deleteOverlay.classList.add('visible');
}

// Закрыть модальное окно удаления
function hideDeleteModal() {
    deleteOverlay.classList.remove('visible');
}

// Клик вне окна (по фону) = Отмена
deleteOverlay.addEventListener('click', (e) => {
    if (e.target === deleteOverlay) {
        hideDeleteModal();
    }
});

// Кнопки удаления
delCancelBtn.addEventListener('click', hideDeleteModal);

delConfirmBtn.addEventListener('click', () => {
    hideDeleteModal();
    performDelete();
});

function performDelete() {
    if (!savedData1 || selectedListItemIndex === -1) return;
    
    // Получаем текущий ID предмета
    const gid = edId.value;
    
    // Находим ключ в savedData1 (он может отличаться от индекса в массиве)
    let keyToDelete = null;
    for (const [key, item] of Object.entries(savedData1)) {
        if (item.GlobalIndex === gid) {
            keyToDelete = key;
            break;
        }
    }
    
    if (keyToDelete) {
        // 1. Удаляем из данных
        delete savedData1[keyToDelete];
        
        // 2. Сбрасываем флаг изменений, так как мы только что "сохранили" удаление
        initialFormState = ''; 
        
        // 3. Обновляем список в редакторе
        populateItemList();
        
        // 4. Обновляем главное приложение
        if (window.refreshApp) window.refreshApp();
        
        // 5. Переключаемся на новый последний элемент (он стал последним после удаления)
        // Ищем новый максимум
        if (currentItemsList.length > 0) {
            // Поскольку список может быть отсортирован, ищем именно последний по ID
            const newMaxItem = currentItemsList.reduce((prev, current) => 
                (parseInt(prev.GlobalIndex) > parseInt(current.GlobalIndex)) ? prev : current
            );
            
            // Находим его индекс в текущем списке
            const newIndex = currentItemsList.findIndex(x => x.GlobalIndex === newMaxItem.GlobalIndex);
            
            // Переключаемся
            if (newIndex !== -1) {
                selectItemByIndex(newIndex);
                centerOnSelectedItem();
            }
        } else {
            // Если список пуст
            clearEditorForm();
        }
    }
}

// --- ZOOM MODAL LOGIC (Сравнение сжатия UGS) ---
let currentZoomOriginalImg = null;

function renderZoomCanvas(showOriginal) {
    if (!currentZoomOriginalImg) return;

    // 1. Отрисовываем исходник в 53x53
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 53;
    tempCanvas.height = 53;
    const tCtx = tempCanvas.getContext('2d');

    const img = currentZoomOriginalImg;
    const w = img.width > 53 ? 53 : img.width;
    const h = img.height > 53 ? 53 : img.height;

    // Центрируем
    const dx = (53 - w) / 2;
    const dy = (53 - h) / 2;

    tCtx.drawImage(img, 0, 0, img.width, img.height, dx, dy, w, h);

    // 2. Получаем пиксели
    const imgData = tCtx.getImageData(0, 0, 53, 53);
    const data = imgData.data;

    if (!showOriginal) {
        // Применяем математику UGS сжатия (256 -> 17 цветов на канал)
        for (let i = 0; i < data.length; i += 4) {
            const a = Math.round(data[i+3] / 17);
            if (a === 0) {
                // Если полностью прозрачный, обнуляем цвета
                data[i] = data[i+1] = data[i+2] = data[i+3] = 0;
            } else {
                data[i] = Math.round(data[i] / 17) * 17;
                data[i+1] = Math.round(data[i+1] / 17) * 17;
                data[i+2] = Math.round(data[i+2] / 17) * 17;
                data[i+3] = a * 17;
            }
        }
        tCtx.putImageData(imgData, 0, 0);
        zoomTitle.textContent = "Сжатая для игры версия (17 цветов)";
        zoomTitle.style.color = "#ff6b6b"; // Красный
    } else {
        zoomTitle.textContent = "Оригинальная картинка";
        zoomTitle.style.color = "#69f0ae"; // Зеленый
    }

    // 3. Рисуем на финальный увеличенный канвас (212x212)
    const ctx = zoomCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false; // Отключаем сглаживание для пиксельности
    ctx.clearRect(0, 0, 212, 212);
    ctx.drawImage(tempCanvas, 0, 0, 53, 53, 0, 0, 212, 212);
}

edZoomBtn.addEventListener('click', () => {
    // Загружаем картинку напрямую из src элемента
    if (!edIcon.src) return;
    
    let targetSrc = edIcon.src;
    // Если это наша кастомная иконка, пытаемся достать несжатый оригинал
    if (isCurrentIconCustom && window.originalCustomIcons && window.originalCustomIcons[targetSrc]) {
        targetSrc = window.originalCustomIcons[targetSrc];
    }
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        currentZoomOriginalImg = img;
        
        if (isCurrentIconCustom) {
            zoomCompareBtn.disabled = false;
            zoomCompareBtn.classList.add('btn-purple');
            zoomCompareBtn.classList.remove('btn-grey');
            zoomCompareBtn.textContent = 'Удерживайте для сравнения с оригиналом';
            zoomCompareBtn.title = "Нажмите и удерживайте, чтобы увидеть оригинал";
        } else {
            zoomCompareBtn.disabled = true;
            zoomCompareBtn.classList.add('btn-grey');
            zoomCompareBtn.classList.remove('btn-purple');
            zoomCompareBtn.textContent = 'Оригинал (недоступно для стандартных)';
            zoomCompareBtn.title = "Доступно только для своих (кастомных) картинок";
        }
        
        renderZoomCanvas(false);
        zoomOverlay.classList.add('visible');
    };
    img.src = targetSrc;
});

const closeZoomModal = () => {
    zoomOverlay.classList.remove('visible');
    currentZoomOriginalImg = null;
};
zoomCloseBtn.addEventListener('click', closeZoomModal);
zoomOverlay.addEventListener('click', (e) => {
    if (e.target === zoomOverlay) closeZoomModal();
});

// Обработка удержания кнопки сравнения
const startZoomCompare = () => {
    if (!zoomCompareBtn.disabled) renderZoomCanvas(true);
};
const endZoomCompare = () => {
    if (!zoomCompareBtn.disabled) renderZoomCanvas(false);
};

zoomCompareBtn.addEventListener('mousedown', startZoomCompare);
zoomCompareBtn.addEventListener('mouseup', endZoomCompare);
zoomCompareBtn.addEventListener('mouseleave', endZoomCompare);
zoomCompareBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Предотвращаем срабатывание мыши на телефонах
    startZoomCompare();
});
zoomCompareBtn.addEventListener('touchend', endZoomCompare);
zoomCompareBtn.addEventListener('touchcancel', endZoomCompare);


// --- Инициализация редактора ---

function initEditorUI() {
    const wrapper = document.querySelector('.editor-stats-wrapper');
    wrapper.innerHTML = ''; 
    
    // --- 1. Контейнер колонок ---
    const columnsWrapper = document.createElement('div');
    columnsWrapper.className = 'stats-columns-wrapper';
    wrapper.appendChild(columnsWrapper);

    const createColumn = () => { 
        const col = document.createElement('div');
        col.className = 'stats-column';
        
        const grid = document.createElement('div');
        grid.className = 'stats-grid-compact';
        
        grid.innerHTML = `
            <div class="sh-label">Параметр</div>
            <div class="sh-val">=</div>
            <div class="sh-val">+/-</div>
            <div class="sh-val">%</div>
        `;
        col.appendChild(grid);
        return { col, grid };
    };

    const col1Obj = createColumn();
    const col2Obj = createColumn();
    
    columnsWrapper.appendChild(col1Obj.col);
    columnsWrapper.appendChild(col2Obj.col);

    edStatsCols.col1 = col1Obj.grid;
    edStatsCols.col2 = col2Obj.grid;
    
    // --- 2. Генерация строк характеристик ---
    STAT_CONFIG.forEach((stat, index) => {
        const targetGrid = stat.col === 1 ? edStatsCols.col1 : edStatsCols.col2;

        // Label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'stat-label-cell';
        if (stat.cssClass) labelDiv.classList.add(stat.cssClass);
        labelDiv.textContent = stat.label || stat.key;
        labelDiv.title = stat.key;
        targetGrid.appendChild(labelDiv);

        // = Input
        const eqContainer = document.createElement('div');
        if (stat.modes.includes('eq')) {
            const id = getStatInputId(index, 'eq');
            // Создаем инпут с ЖЕСТКИМ ID
            const inp = createNumberInput(`stat-input val-eq ${stat.cssClass}`, id);
            inp.placeholder = "-";
            
            // --- ЛОГИКА ОГРАНИЧЕНИЙ ДЛЯ ПОЛЯ "=" ---
            inp.addEventListener('input', () => {
                if (inp.value === '') {
                    // Если пользователь стер значение, обновляем превью
                    updateItemPreview();
                    return;
                }
                let val = parseInt(inp.value);
                if (isNaN(val)) return;

                const isVampRegen = stat.key === 'Вампиризм' || stat.key === 'Регенерация';
                const isMagicProt = stat.key === 'Защита от магии жизни' || stat.key === 'Защита от магии смерти' || stat.key === 'Защита от магии стихий';

                if (isVampRegen) {
                    // Для Вампиризма и Регенерации: от -99 до 99
                    if (val < -99) { inp.value = -99; val = -99; }
                    if (val > 99) { inp.value = 99; val = 99; }
                } else {
                    // Для остальных: меньше 0 -> очистить
                    if (val < 0) {
                        inp.value = '';
                        // ВАЖНО: Принудительно вызываем обновление превью, 
                        // иначе там может остаться старое значение (например, -1)
                        updateItemPreview();
                        return; // Стоп, поле очищено
                    }
                    // Для защит от магии: максимум 99
                    if (isMagicProt && val > 99) {
                        inp.value = 99;
                        val = 99;
                    }
                }
                // Обычное обновление при валидном вводе
                updateItemPreview();
            });
            // ----------------------------------------
            
            eqContainer.appendChild(inp);
        }
        targetGrid.appendChild(eqContainer);

        // +/- Input
        const plusContainer = document.createElement('div');
        if (stat.modes.includes('plus')) {
            const id = getStatInputId(index, 'plus');
            const inp = createNumberInput(`stat-input val-plus ${stat.cssClass}`, id);
            inp.placeholder = "-"; 
            plusContainer.appendChild(inp);
        }
        targetGrid.appendChild(plusContainer);

        // % Input
        const pctContainer = document.createElement('div');
        if (stat.modes.includes('percent')) {
            const id = getStatInputId(index, 'percent');
            const inp = createNumberInput(`stat-input val-percent ${stat.cssClass}`, id);
            inp.placeholder = "-";
            inp.min = -99;
            inp.max = 99;
            
            // Логика лимита значений
            inp.addEventListener('input', () => {
                if (inp.value === '') {
                    updateSliderValue(0); 
                    return;
                }
                let val = parseInt(inp.value);
                if (isNaN(val)) val = 0;
                if (val > 99) { val = 99; inp.value = 99; }
                if (val < -99) { val = -99; inp.value = -99; }
                updateSliderValue(val);
            });

            inp.addEventListener('click', (e) => showSlider(e, inp));
            inp.addEventListener('focus', (e) => showSlider(e, inp));

            pctContainer.appendChild(inp);
        }
        targetGrid.appendChild(pctContainer);
    });

    // --- 3. Preview Area ---
    const previewArea = document.createElement('div');
    previewArea.className = 'item-preview-area-bottom'; 
    previewArea.innerHTML = `
        <div id="ed-preview-tooltip" class="static-tooltip-preview"></div>
    `;
    wrapper.appendChild(previewArea);
    previewContainer = previewArea.querySelector('#ed-preview-tooltip');

    // 4. Инициализация компонентов
    createSliderPopup();
    
    // Листенеры
    edName.addEventListener('input', updateItemPreview);
    edDesc.addEventListener('input', () => {
        updateItemPreview();
        updateCharCounter();
    });
    edId.addEventListener('input', updateItemPreview);

    setupNumberInput(edCost);
    edCost.addEventListener('input', updateItemPreview); 

    const typeOptions = EDITOR_GROUPS.map(g => ({
        value: g.id,
        text: g.name,
        icon: TYPE_ICONS_MAP[g.id]
    }));
    setupCustomSelect(edTypeContainer, typeOptions, (val) => {
        currentType = val;
        updateItemPreview(); 
    }, currentType);

    setupCustomSelect(edMagicContainer, MAGIC_OPTIONS, (val) => {
        currentMagic = val;
        updateItemPreview(); 
    }, currentMagic, true);

    edSortBtn.textContent = SORT_MODES[currentSortMode];
    edSortBtn.addEventListener('click', toggleSortMode);
    
    edSearchInput.addEventListener('input', () => {
        selectedListItemIndex = -1;
        updateSearchClearBtn();
        populateItemList();
    });
    
    edSearchClear.addEventListener('click', () => {
        edSearchInput.value = '';
        selectedListItemIndex = -1;
        updateSearchClearBtn();
        populateItemList();
        edSearchInput.focus();
    });
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "attributes" && mutation.attributeName === "src") {
                updateItemPreview();
            }
        });
    });
    observer.observe(edIcon, { attributes: true });

    document.addEventListener('keydown', handlePhysicsListKeyNav);
    startScrollLoop();
    edList.addEventListener('scroll', handleManualScroll);
    
    // --- ICON SELECTOR INIT ---
    edIconWrapper.addEventListener('click', openIconSelector);
    
    // Закрытие при клике вне модального окна (на оверлей)
    iconSelectorOverlay.addEventListener('click', (e) => {
        if (e.target === iconSelectorOverlay) closeIconSelector();
    });
    
    // Поиск
    const setupIconSearch = (input, clearBtn, renderFn) => {
        input.addEventListener('input', () => {
            clearBtn.style.display = input.value ? 'flex' : 'none';
            renderFn();
        });
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            renderFn();
        });
    };
    setupIconSearch(iconSearchStandard, iconClearStandard, renderStandardIcons);
    setupIconSearch(iconSearchCustom, iconClearCustom, renderCustomIcons);
    
    // Загрузка
    iconUploadTrigger.addEventListener('click', () => {
        iconFileInput.click();
    });
    iconFileInput.addEventListener('change', handleIconUpload);
}

// --- Helper: Convert Image URL to Data URL ---
function imageUrlToDataUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
    });
}

// --- Helper: Apply UGS Compression to Image (17 colors per channel) ---
// ВАЖНО: Модифицированная функция сжатия, которая ТЕПЕРЬ сохраняет ИДЕАЛЬНЫЕ БАЙТЫ в кэш!
function applyUGSCompression(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    // Disable smoothing to preserve exact colors
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0);
    
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    // Создаем независимый массив для сырых, точных байтов (без искажений Canvas toDataURL)
    const exactBytes = new Uint8Array(data.length);
    
    for (let i = 0; i < data.length; i += 4) {
        const a = Math.round(data[i+3] / 17);
        if (a === 0) {
            // Полная прозрачность
            data[i] = data[i+1] = data[i+2] = data[i+3] = 0;
        } else {
            data[i] = Math.round(data[i] / 17) * 17;
            data[i+1] = Math.round(data[i+1] / 17) * 17;
            data[i+2] = Math.round(data[i+2] / 17) * 17;
            data[i+3] = a * 17;
        }
        // Записываем идеальные математические значения в наш кэш-буфер
        exactBytes[i] = data[i];
        exactBytes[i+1] = data[i+1];
        exactBytes[i+2] = data[i+2];
        exactBytes[i+3] = data[i+3];
    }
    
    // Для DOM создаем URL из Canvas
    ctx.putImageData(imgData, 0, 0);
    const url = canvas.toDataURL('image/png');
    
    // САМОЕ ГЛАВНОЕ: Регистрируем URL в кэше сырых байтов для экспорта UGS!
    if (!window.ugsRawCache) window.ugsRawCache = {};
    window.ugsRawCache[url] = { width: canvas.width, height: canvas.height, data: exactBytes };
    
    return url;
}

// --- ICON SELECTOR LOGIC ---

function openIconSelector() {
    iconSelectorOverlay.classList.add('visible'); // Используем CSS для показа (flex)
    renderStandardIcons();
    renderCustomIcons();
}

function closeIconSelector() {
    iconSelectorOverlay.classList.remove('visible');
    // Сброс поиска при закрытии
    iconSearchStandard.value = '';
    iconClearStandard.style.display = 'none';
    iconSearchCustom.value = '';
    iconClearCustom.style.display = 'none';
}

async function selectIcon(path, isCustom = false, resolvedUrl = null) {
    isCurrentIconCustom = isCustom; // Обновляем глобальный флаг для Zoom

    // 1. If explicitly custom (already Data URL from file input), use it.
    if (isCustom) {
        currentIconPath = path;
        edIcon.src = path;
        closeIconSelector();
        updateItemPreview();
        return;
    }

    // 2. If we have a resolved URL (standard icon clicked), ALWAYS try convert to Data URL.
    // This ensures it overrides any UGS lookup logic in the main app, 
    // fixing the issue where saving reverts the icon to the UGS original.
    if (resolvedUrl) {
        try {
            const dataUrl = await imageUrlToDataUrl(resolvedUrl);
            currentIconPath = dataUrl;
            edIcon.src = dataUrl;
        } catch (e) {
            console.error("Failed to convert to Data URL, falling back to path", e);
            // Only fallback to path if data conversion fails
            currentIconPath = path; 
            edIcon.src = resolvedUrl;
        }
    } else {
        // Fallback calculation if no resolvedUrl provided
        currentIconPath = path;
        let fullUrl = '';
         if (path.indexOf('/') === -1) {
             fullUrl = `./${currentMode}/${path}`;
             if (!fullUrl.endsWith('.png')) fullUrl += '.png';
         } else {
             fullUrl = path;
         }
         edIcon.src = fullUrl;
    }
    
    closeIconSelector();
    updateItemPreview();
}

function renderStandardIcons() {
    // ВАЖНО: Используем window.originalData1 для стабильного списка, чтобы изменения в редакторе не "съедали" иконки из списка
    // Если originalData1 нет (первый запуск/ошибка), фоллбек на savedData1
    const sourceData = window.originalData1 || savedData1;
    if (!sourceData) return;
    
    const query = iconSearchStandard.value.toLowerCase();
    iconGridStandard.innerHTML = '';
    
    // Собираем мапу: ИмяФайла -> { representativeID, representativeName, filename }
    // representativeID — минимальный GlobalIndex среди предметов с этой иконкой (для сортировки)
    const iconMetaMap = {};

    Object.values(sourceData).forEach(item => {
        if (!item.Icon || item.Icon === 'empty') return;
        
        const fname = item.Icon;
        const gid = parseInt(item.GlobalIndex);
        const validGid = isNaN(gid) ? 999999 : gid; // Если ID нет, кидаем в конец
        
        if (!iconMetaMap[fname]) {
            iconMetaMap[fname] = {
                filename: fname,
                minId: validGid,
                name: item.Name // Имя предмета для поиска
            };
        } else {
            // Если нашли предмет с меньшим ID для этой иконки — обновляем представителя
            if (validGid < iconMetaMap[fname].minId) {
                iconMetaMap[fname].minId = validGid;
                iconMetaMap[fname].name = item.Name;
            }
        }
    });
    
    // Превращаем в массив и сортируем по minId (GlobalIndex)
    const sortedIcons = Object.values(iconMetaMap).sort((a, b) => a.minId - b.minId);
    
    sortedIcons.forEach(meta => {
        // Фильтрация: По имени файла OR По ID предмета OR По Имени предмета
        if (query) {
            const matchFile = meta.filename.toLowerCase().includes(query);
            const matchId   = String(meta.minId).includes(query);
            const matchName = meta.name.toLowerCase().includes(query);
            
            if (!matchFile && !matchId && !matchName) return;
        }
        
        // Формируем URL для отображения (используя существующий резолвер)
        // Создаем фейковый item для resolveIconUrl
        // ИСПРАВЛЕНИЕ: Передаем реальный ID (meta.minId), чтобы UGS мог найти картинку
        const tempItem = { Icon: meta.filename, GlobalIndex: String(meta.minId) }; 
        const src = window.resolveIconUrl(currentMode, tempItem);
        
        const div = document.createElement('div');
        div.className = `icon-option ${currentIconPath === meta.filename ? 'selected' : ''}`;
        // В тайтле показываем полезную инфу
        div.title = `${meta.filename}\nПредмет: ${meta.name} (ID: ${meta.minId})`;
        
        // ВАЖНО: Передаем src (разрешенный URL) в selectIcon
        div.onclick = () => selectIcon(meta.filename, false, src);
        
        const img = document.createElement('img');
        img.src = src;
        img.loading = 'lazy';
        
        div.appendChild(img);
        iconGridStandard.appendChild(div);
    });
}

function renderCustomIcons() {
    const query = iconSearchCustom.value.toLowerCase();
    iconGridCustom.innerHTML = '';
    
    if (customIcons.length === 0) {
        iconGridCustom.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Нет загруженных картинок.</div>';
        return;
    }
    
    customIcons.forEach((iconObj, index) => {
        if (query && !iconObj.name.toLowerCase().includes(query)) return;
        
        const div = document.createElement('div');
        div.className = `icon-option ${currentIconPath === iconObj.url ? 'selected' : ''}`;
        div.title = iconObj.name;
        div.onclick = () => selectIcon(iconObj.url, true);
        
        const img = document.createElement('img');
        img.src = iconObj.url;
        img.loading = 'lazy';
        
        div.appendChild(img);
        iconGridCustom.appendChild(div);
    });
}

// --- Image Resize Helper ---
function resizeImageTo53(img) {
    const canvas = document.createElement('canvas');
    canvas.width = 53;
    canvas.height = 53;
    const ctx = canvas.getContext('2d');
    
    // Включаем качественное сглаживание
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(img, 0, 0, 53, 53);
    return canvas.toDataURL('image/png');
}

// --- Size Warning Modal Helper ---
function showSizeWarning() {
    return new Promise((resolve) => {
        sizeWarningOverlay.classList.add('visible');
        
        // One-time listeners to avoid stacking
        const onCancel = () => {
            sizeWarningOverlay.classList.remove('visible');
            resolve('cancel');
            cleanup();
        };
        
        const onResize = () => {
            sizeWarningOverlay.classList.remove('visible');
            resolve('resize');
            cleanup();
        };
        
        const cleanup = () => {
            swCancelBtn.removeEventListener('click', onCancel);
            swResizeBtn.removeEventListener('click', onResize);
        };
        
        swCancelBtn.addEventListener('click', onCancel);
        swResizeBtn.addEventListener('click', onResize);
    });
}

async function handleIconUpload(e) {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    let hasChanges = false;
    
    if (!window.originalCustomIcons) window.originalCustomIcons = {};
    
    // Обрабатываем файлы последовательно
    for (const file of files) {
        try {
            // 1. Читаем файл
            let dataUrl;
            const ext = file.name.split('.').pop().toLowerCase();

            if (ext === 'tga') {
                // Используем TGA парсер (TGA-JS)
                dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            const tga = new TgaLoader();
                            tga.load(new Uint8Array(ev.target.result));
                            resolve(tga.getDataURL('image/png')); // Переводим TGA в PNG DataURL
                        } catch (err) {
                            reject(new Error('Не удалось прочитать TGA файл: ' + err.message));
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(file);
                });
            } else {
                // Стандартные браузерные форматы (PNG, JPG, GIF, BMP)
                dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            // 2. Создаем Image для проверки размеров
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = dataUrl;
            });

            // 3. Проверка размеров
            let finalUrl = dataUrl;
            if (img.width > 53 || img.height > 53) {
                // Показываем предупреждение
                const decision = await showSizeWarning();
                if (decision === 'cancel') {
                    continue; 
                } else if (decision === 'resize') {
                    finalUrl = resizeImageTo53(img);
                }
            }

            // 4. НОВОЕ: Применяем игровое сжатие (17 цветов) к итоговой картинке
            const compImg = new Image();
            await new Promise((resolve, reject) => {
                compImg.onload = resolve;
                compImg.onerror = reject;
                compImg.src = finalUrl;
            });
            // applyUGSCompression теперь возвращает URL и одновременно сохраняет сырые байты в кэш!
            const compressedUrl = applyUGSCompression(compImg);
            
            // Сохраняем связь: Сжатая -> Оригинал (для модального окна Zoom)
            window.originalCustomIcons[compressedUrl] = finalUrl;

            // 5. Добавляем в список сжатую версию, чтобы она использовалась везде в UI
            customIcons.unshift({
                name: file.name,
                url: compressedUrl
            });
            hasChanges = true;

        } catch (err) {
            console.error("Ошибка при обработке файла:", file.name, err);
        }
    }

    if (hasChanges) {
        renderCustomIcons();
        if (files.length === 1 && customIcons.length > 0 && customIcons[0].name === files[0].name) {
            selectIcon(customIcons[0].url, true);
        }
    }
    
    e.target.value = '';
}


// --- Number Input Logic ---

// NEW: Accepts ID
function createNumberInput(className, id) {
    const inp = document.createElement('input');
    inp.type = 'number';
    inp.className = className;
    if (id) inp.id = id; // ЖЕСТКИЙ ID
    
    setupNumberInput(inp);
    return inp;
}

function setupNumberInput(inp) {
    inp.addEventListener('keydown', (e) => {
        if (e.key === '-' || e.key === 'Subtract') {
            e.preventDefault();
            toggleSign(inp);
            triggerInputEvent(inp);
            return;
        }
        if (e.key === '+' || e.key === 'Add') {
            e.preventDefault();
            makePositive(inp);
            triggerInputEvent(inp);
            return;
        }
    });
    
    inp.addEventListener('input', () => {
        if (inp.classList.contains('stat-input') && !inp.id.includes('_eq') && inp.value === '0') {
             inp.value = '';
        }
        updateItemPreview(); // ВОЗВРАЩЕНО: обновляем превью при любом вводе (для полей +/- и %)
    });
}

function toggleSign(inp) {
    let val = parseFloat(inp.value);
    if (isNaN(val)) return;
    inp.value = val * -1;
}

function makePositive(inp) {
    let val = parseFloat(inp.value);
    if (isNaN(val)) return;
    if (val < 0) inp.value = Math.abs(val);
}

function triggerInputEvent(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
}

// --- Slider Logic ---
function createSliderPopup() {
    sliderPopup = document.createElement('div');
    sliderPopup.className = 'ed-slider-popup';
    
    const vTrack = document.createElement('div');
    vTrack.className = 'slider-track-visual';
    sliderPopup.appendChild(vTrack);
    
    const ruler = document.createElement('div');
    ruler.className = 'slider-ruler';
    ruler.innerHTML = `
        <div class="slider-tick" data-val="99"></div>
        <div class="slider-tick" data-val="50"></div>
        <div class="slider-tick zero" data-val="0"></div>
        <div class="slider-tick" data-val="-50"></div>
        <div class="slider-tick" data-val="-99"></div>
    `;
    sliderPopup.appendChild(ruler);
    
    sliderInput = document.createElement('input');
    sliderInput.type = 'range';
    sliderInput.className = 'vertical-slider';
    sliderInput.min = -99;
    sliderInput.max = 99;
    
    sliderPopup.appendChild(sliderInput);
    document.body.appendChild(sliderPopup);
    
    sliderInput.addEventListener('input', () => {
        if (activePercentInput) {
            const val = sliderInput.value;
            if (val === '0') {
                activePercentInput.value = '';
            } else {
                activePercentInput.value = val;
            }
            triggerInputEvent(activePercentInput);
        }
    });

    window.addEventListener('mousedown', (e) => {
        if (sliderPopup.classList.contains('visible')) {
            if (!sliderPopup.contains(e.target) && e.target !== activePercentInput) {
                hideSlider();
            }
        }
    });
    
    window.addEventListener('scroll', () => {
         if (sliderPopup.classList.contains('visible')) hideSlider();
    }, true);
}

function showSlider(e, inp) {
    if (activePercentInput === inp && sliderPopup.classList.contains('visible')) return;
    
    activePercentInput = inp;
    let val = parseInt(inp.value);
    if (isNaN(val)) val = 0;
    sliderInput.value = val;
    
    const rect = inp.getBoundingClientRect();
    const left = rect.left - 50; 
    const top = rect.top + (rect.height / 2) - (420 / 2); 
    
    sliderPopup.style.left = `${left}px`;
    sliderPopup.style.top = `${top}px`;
    sliderPopup.classList.add('visible');
}

function hideSlider() {
    sliderPopup.classList.remove('visible');
    activePercentInput = null;
}

function updateSliderValue(val) {
    if (sliderInput && sliderPopup.classList.contains('visible')) {
        sliderInput.value = val;
    }
}

// --- Preview Logic ---

function colorizePreviewSigns(text) {
    if (!text) return '';
    return text.replace(/([+\-])/g, (match) => 
        match === '+' ? '<span class="sign-plus" style="color:#88ff88;">+</span>' : '<span class="sign-minus" style="color:#d00; font-weight:bold;">-</span>'
    );
}

function updateItemPreview() {
    if (!previewContainer) return;
    
    const name = edName.value || 'Название';
    const desc = edDesc.value || 'Описание';
    const id = edId.value || '???';
    const cost = edCost.value || '0';
    const magic = currentMagic !== 'Нет' ? currentMagic : null;
    const bonus = currentBonus || null;
    
    // ЭТАЛОННЫЙ ПОРЯДОК СОРТИРОВКИ (как в script.js)
    const ATTR_ORDER = [
      'Жизнь (хиты)',
      'Физическая атака',
      'Атака рукопашная',
      'Атака стрелковая',
      'Физическая защита',
      'Защита рукопашная',
      'Защита стрелковая',
      'Сила магии',
      'Иммунитет к магии',
      'Защита от магии смерти',
      'Защита от магии жизни',
      'Защита от магии стихий',
      'Вампиризм',
      'Регенерация',
      'Инициатива',
      'Количество действий'
    ];
    
    // 1. Сбор всех значений из инпутов
    const getValParts = (index) => {
        const parts = [];

        // Eq
        const eqId = getStatInputId(index, 'eq');
        const eqEl = document.getElementById(eqId);
        if (eqEl && eqEl.value !== '') {
            parts.push('=' + eqEl.value);
        }
        
        // Plus
        const plusId = getStatInputId(index, 'plus');
        const plusEl = document.getElementById(plusId);
        if (plusEl && plusEl.value !== '') {
            let v = plusEl.value;
            if (!v.startsWith('-') && !v.startsWith('+')) v = '+' + v;
            parts.push(v);
        }
        
        // Percent
        const pctId = getStatInputId(index, 'percent');
        const pctEl = document.getElementById(pctId);
        if (pctEl && pctEl.value !== '') {
            let v = pctEl.value;
            if (!v.startsWith('-') && !v.startsWith('+')) v = '+' + v;
            parts.push(v + '%');
        }
        return parts;
    };

    const statValuesMap = {};
    STAT_CONFIG.forEach((stat, index) => {
        statValuesMap[stat.key] = getValParts(index);
    });

    // 2. Группировка (Grouping Logic)
    const displayStats = {};

    // Хелпер сравнения массивов (строк)
    const isArrEqual = (arr1, arr2) => {
        if (!arr1 || !arr2) return false;
        return arr1.join(' ') === arr2.join(' ');
    };

    // --- Группировка Физической Атаки ---
    const attBlow = statValuesMap['Атака рукопашная'];
    const attShot = statValuesMap['Атака стрелковая'];
    if (attBlow && attShot && attBlow.length > 0 && isArrEqual(attBlow, attShot)) {
        displayStats['Физическая атака'] = attBlow;
        delete statValuesMap['Атака рукопашная'];
        delete statValuesMap['Атака стрелковая'];
    }

    // --- Группировка Физической Защиты ---
    const defBlow = statValuesMap['Защита рукопашная'];
    const defShot = statValuesMap['Защита стрелковая'];
    if (defBlow && defShot && defBlow.length > 0 && isArrEqual(defBlow, defShot)) {
        displayStats['Физическая защита'] = defBlow;
        delete statValuesMap['Защита рукопашная'];
        delete statValuesMap['Защита стрелковая'];
    }

    // --- Группировка Иммунитета к магии ---
    const resLife = statValuesMap['Защита от магии жизни'];
    const resDeath = statValuesMap['Защита от магии смерти'];
    const resElem = statValuesMap['Защита от магии стихий'];
    
    if (resLife && resDeath && resElem && resLife.length > 0 && 
        isArrEqual(resLife, resDeath) && isArrEqual(resLife, resElem)) {
        displayStats['Иммунитет к магии'] = resLife;
        delete statValuesMap['Защита от магии жизни'];
        delete statValuesMap['Защита от магии смерти'];
        delete statValuesMap['Защита от магии стихий'];
    }

    // Добавляем оставшиеся не сгруппированные, но заполненные статы
    Object.keys(statValuesMap).forEach(k => {
        if (statValuesMap[k] && statValuesMap[k].length > 0) {
            displayStats[k] = statValuesMap[k];
        }
    });

    // 3. Сортировка по ATTR_ORDER
    const sortedKeys = Object.keys(displayStats).sort((a, b) => {
        const ia = ATTR_ORDER.indexOf(a);
        const ib = ATTR_ORDER.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
    });

    // 4. Генерация HTML
    let attrsHtml = '';
    sortedKeys.forEach(key => {
        const valStr = displayStats[key].join(' ');
        attrsHtml += `<li>${key}: ${colorizePreviewSigns(valStr)}</li>`;
    });

    // Добавляем Бонус и Магию
    let extraHtml = '';
    if (bonus) {
        let bonusIconStyle = '';
        if (window.getAllBonuses) {
            const allBonuses = window.getAllBonuses();
            const foundBonus = allBonuses.find(b => b.value === bonus);
            if (foundBonus && foundBonus.icon) {
                bonusIconStyle = `style="--bonus-icon:url('${foundBonus.icon}')"`;
            }
        }
        
        if (bonusIconStyle) {
             extraHtml += `<li class="bonus-line"><span class="bonus-text has-icon" ${bonusIconStyle}>${bonus}</span></li>`;
        } else {
             extraHtml += `<li class="bonus-line"><span class="bonus-text">${bonus}</span></li>`;
        }
    }
    
    if (magic) {
        let mClass = '';
        // Приводим к нижнему регистру для надежной проверки
        const mLower = magic.toLowerCase();
        
        if (mLower.includes('смерти')) mClass = 'magic-death';
        else if (mLower.includes('жизни')) mClass = 'magic-life';
        else if (mLower.includes('стихий')) mClass = 'magic-elemental';
        
        extraHtml += `<li class="magic-line ${mClass}"><span class="bonus-text">${magic}</span></li>`;
    }

    let bgImage = 'tooltip-bg.png';
    if (typeof currentMode !== 'undefined' && currentMode === 'Ragnar' && typeof syncBg !== 'undefined' && !syncBg) {
        bgImage = 'tooltip-ragn.png';
    }
    previewContainer.style.backgroundImage = `url('${bgImage}')`;

    previewContainer.innerHTML = `
        <h3>${name}</h3>
        <p>${desc}</p>
        <ul class="attrs">
            ${attrsHtml}
            ${extraHtml}
            <li class="spacer" style="height:1em;"></li>
        </ul>
        <div class="tooltip-id">ID: ${id}</div>
        <div class="tooltip-price">
            ${cost}<img src="gold.png" class="gold-icon" alt="Gold">
        </div>
    `;
}

function updateSearchClearBtn() {
    edSearchClear.classList.toggle('visible', edSearchInput.value.length > 0);
}

// --- Custom Select Logic ---
function setupCustomSelect(container, options, onSelect, initialValue, isMagic = false, useGridLayout = false) {
    container.innerHTML = '';
    
    const head = document.createElement('div');
    head.className = 'ed-custom-select-head';
    
    const selectedContent = document.createElement('div');
    selectedContent.className = 'selected-content';
    head.appendChild(selectedContent);
    
    const arrow = document.createElement('div');
    arrow.className = 'ed-custom-select-arrow';
    head.appendChild(arrow);
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'ed-custom-select-options';
    if (useGridLayout) optionsContainer.classList.add('grid-layout');
    
    let currentVal = initialValue;

    function renderHead() {
        selectedContent.innerHTML = '';
        const opt = options.find(o => o.value === currentVal) || options[0];
        if (!opt) return;

        if (opt.icon) {
            const img = document.createElement('img');
            img.src = opt.icon;
            selectedContent.appendChild(img);
        }
        const span = document.createElement('span');
        span.textContent = opt.text;
        if (isMagic && opt.color) {
            span.style.color = opt.color;
            if (opt.value.includes('Смерти')) span.style.textShadow = '0 0 2px #fff';
        }
        selectedContent.appendChild(span);
    }

    options.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'ed-custom-option';
        if (opt.value === currentVal) div.classList.add('selected');
        
        if (opt.icon) {
            const img = document.createElement('img');
            img.src = opt.icon;
            div.appendChild(img);
        }
        const span = document.createElement('span');
        span.textContent = opt.text;
        if (isMagic && opt.color) {
            span.style.color = opt.color;
        }
        div.appendChild(span);

        div.addEventListener('click', (e) => {
            e.stopPropagation();
            currentVal = opt.value;
            optionsContainer.querySelectorAll('.ed-custom-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            renderHead();
            optionsContainer.classList.remove('open');
            if (onSelect) onSelect(currentVal);
        });

        optionsContainer.appendChild(div);
    });

    head.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.ed-custom-select-options.open').forEach(el => {
            if (el !== optionsContainer) el.classList.remove('open');
        });

        if (!optionsContainer.classList.contains('open')) {
            optionsContainer.classList.add('open');
            const rect = head.getBoundingClientRect();
            optionsContainer.style.top = '';
            optionsContainer.style.left = '';
            optionsContainer.style.right = '';
            optionsContainer.style.width = '';
            optionsContainer.style.maxHeight = '';
            
            optionsContainer.style.top = `${rect.bottom}px`;
            
            if (useGridLayout) {
                optionsContainer.style.left = 'auto';
                optionsContainer.style.right = `${window.innerWidth - rect.right}px`;
            } else {
                optionsContainer.style.left = `${rect.left}px`;
                optionsContainer.style.width = `${rect.width}px`;
            }
            const bottomSpace = window.innerHeight - rect.bottom - 10;
            optionsContainer.style.maxHeight = `${bottomSpace}px`;
        } else {
            optionsContainer.classList.remove('open');
        }
    });

    container.appendChild(head);
    container.appendChild(optionsContainer); 
    renderHead();
    
    container._updateOptions = (newOptions, newVal, newOnSelect) => {
        setupCustomSelect(container, newOptions, newOnSelect || onSelect, newVal, isMagic, useGridLayout);
    };
    container._setValue = (val) => {
        currentVal = val;
        optionsContainer.querySelectorAll('.ed-custom-option').forEach(el => {
           const matches = (el.textContent === val) || 
                           (options.find(o=>o.value===val) && el.textContent.includes(options.find(o=>o.value===val).text));
           el.classList.toggle('selected', matches);
        });
        renderHead();
    };
}

window.addEventListener('click', (e) => {
    if (!e.target.closest('.ed-custom-select-container')) {
        document.querySelectorAll('.ed-custom-select-options.open').forEach(el => el.classList.remove('open'));
    }
});

// --- Bonus List Update ---
function populateBonusList() {
    const bonusOptions = window.getAllBonuses ? window.getAllBonuses() : [];
    if (bonusOptions.length === 0) {
        bonusOptions.push({ value: '', text: 'Отсутствует', icon: null });
        if (typeof bonusMap !== 'undefined') {
            Object.keys(bonusMap).forEach(bonusKey => {
                if (bonusKey === 'all') return;
                bonusOptions.push({
                    value: bonusKey,
                    text: bonusKey,
                    icon: bonusMap[bonusKey] 
                });
            });
        }
    }
    // Используем сетку для бонусов, если их много
    const useGrid = true; 
    if (edBonusContainer._updateOptions) {
        edBonusContainer._updateOptions(bonusOptions, currentBonus, (val) => {
            currentBonus = val;
            updateItemPreview();
        });
    } else {
        setupCustomSelect(edBonusContainer, bonusOptions, (val) => {
            currentBonus = val;
            updateItemPreview();
        }, currentBonus, false, useGrid);
    }
}

// --- Item List Logic ---
function toggleSortMode() {
    let selectedItem = null;
    if (selectedListItemIndex !== -1 && currentItemsList[selectedListItemIndex]) {
        selectedItem = currentItemsList[selectedListItemIndex];
    }

    currentSortMode = (currentSortMode + 1) % 3;
    edSortBtn.textContent = SORT_MODES[currentSortMode];
    
    populateItemList();
    
    if (selectedItem) {
        const newIndex = currentItemsList.findIndex(x => x.GlobalIndex === selectedItem.GlobalIndex);
        if (newIndex !== -1) {
            selectedListItemIndex = newIndex;
            const domItems = edList.querySelectorAll('.ed-list-item');
            domItems.forEach((el, idx) => {
                el.classList.toggle('selected', idx === newIndex);
            });
            centerOnSelectedItem();
        } else {
            selectedListItemIndex = -1;
        }
    } else {
        selectedListItemIndex = -1;
    }
}

function getItemY(index) {
    return TOP_SPACER + (index * FULL_ITEM_HEIGHT);
}

function startScrollLoop() {
    cancelAnimationFrame(animationFrameId);
    function animate() {
        const targetIndex = selectedListItemIndex === -1 ? 0 : selectedListItemIndex;
        const diffIndex = targetIndex - visualIndex;
        visualIndex += diffIndex * 0.2;
        if (Math.abs(diffIndex) < 0.001) visualIndex = targetIndex;

        const diffScroll = targetScrollTop - currentScrollTop;
        currentScrollTop += diffScroll * 0.2;
        if (Math.abs(diffScroll) < 0.5) currentScrollTop = targetScrollTop;

        if (edList) {
            if (Math.abs(diffScroll) >= 0.5) {
                edList.scrollTop = currentScrollTop;
            }
            if (edSelectionCursor) {
                const itemY = getItemY(visualIndex);
                const cursorY = itemY - currentScrollTop;
                edSelectionCursor.style.transform = `translateY(${cursorY}px)`;
            }
        }
        if (visualIndex !== targetIndex || Math.abs(diffScroll) >= 0.5) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
             animationFrameId = requestAnimationFrame(animate);
        }
    }
    animate();
}

function handlePhysicsListKeyNav(e) {
    if (!editorOverlay.classList.contains('visible')) return;
    const act = document.activeElement;
    if (act && (act.tagName === 'INPUT' || act.tagName === 'TEXTAREA')) {
        if (act !== edSearchInput && act !== iconSearchStandard && act !== iconSearchCustom) return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const direction = e.key === 'ArrowUp' ? 'up' : 'down';
        navigatePhysicsList(direction);
    }
}

function navigatePhysicsList(direction) {
    if (currentItemsList.length === 0) return;
    const prevIndex = selectedListItemIndex === -1 ? 0 : selectedListItemIndex;
    const nextIndex = direction === 'up' 
        ? Math.max(0, prevIndex - 1) 
        : Math.min(currentItemsList.length - 1, prevIndex + 1);

    if (prevIndex === nextIndex) return;
    
    // Вместо прямого вызова selectItemByIndex, проверяем изменения
    attemptAction(() => {
        selectItemByIndex(nextIndex);
        
        const viewportH = edList.clientHeight;
        const centerZoneY = (viewportH / 2) - (ITEM_HEIGHT / 2);
        const prevItemY = getItemY(prevIndex);
        const nextItemY = getItemY(nextIndex);
        const nextItemBottom = nextItemY + ITEM_HEIGHT;
        const viewportBottom = targetScrollTop + viewportH;
        const SAFETY_MARGIN = 160;

        const isWayAbove = nextItemY < (targetScrollTop - SAFETY_MARGIN);
        const isWayBelow = nextItemY > (viewportBottom + SAFETY_MARGIN);
        const isSlightlyAbove = nextItemY < targetScrollTop;
        const isSlightlyBelow = nextItemBottom > viewportBottom;

        let newTargetScrollTop = targetScrollTop;

        if (isWayAbove || isWayBelow) {
            newTargetScrollTop = nextItemY - (viewportH / 2) + (ITEM_HEIGHT / 2);
        } else if (isSlightlyAbove) {
            newTargetScrollTop = nextItemY;
        } else if (isSlightlyBelow) {
            newTargetScrollTop = nextItemBottom - viewportH;
        } else {
            const prevVisualY = prevItemY - targetScrollTop;
            const centerTolerance = 2;
            const isBelowCenter = prevVisualY > (centerZoneY + centerTolerance);
            const isAboveCenter = prevVisualY < (centerZoneY - centerTolerance);
            const isAtCenter = !isBelowCenter && !isAboveCenter;

            if (direction === 'down') {
                if (isBelowCenter || isAtCenter) {
                    newTargetScrollTop = nextItemY - prevVisualY;
                } else {
                    const nextVisualY = nextItemY - targetScrollTop;
                    if (nextVisualY > centerZoneY) {
                        newTargetScrollTop = nextItemY - centerZoneY;
                    }
                }
            } else {
                if (isAboveCenter || isAtCenter) {
                    newTargetScrollTop = nextItemY - prevVisualY;
                } else {
                     const nextVisualY = nextItemY - targetScrollTop;
                     if (nextVisualY < centerZoneY) {
                         newTargetScrollTop = nextItemY - centerZoneY;
                     }
                }
            }
        }

        const maxScroll = edList.scrollHeight - viewportH;
        const safeMaxScroll = Math.max(0, maxScroll);
        newTargetScrollTop = Math.max(0, Math.min(newTargetScrollTop, safeMaxScroll));

        targetScrollTop = newTargetScrollTop;
        isInternalNavigation = true;
        startScrollLoop();
    });
}

function handleManualScroll(e) {
    const actualScroll = e.currentTarget.scrollTop;
    if (Math.abs(actualScroll - currentScrollTop) >= 1.5) {
        currentScrollTop = actualScroll;
        targetScrollTop = actualScroll;
        if (edSelectionCursor) {
            const itemY = getItemY(visualIndex);
            const cursorY = itemY - actualScroll;
            edSelectionCursor.style.transform = `translateY(${cursorY}px)`;
        }
    }
    if (scrollStopTimeout) clearTimeout(scrollStopTimeout);
    scrollStopTimeout = setTimeout(() => {
        const savedScroll = actualScroll;
        populateItemList();
        edList.scrollTop = savedScroll;
        currentScrollTop = savedScroll;
        targetScrollTop = savedScroll;
        if (edSelectionCursor) {
            const itemY = getItemY(visualIndex);
            const cursorY = itemY - savedScroll;
            edSelectionCursor.style.transform = `translateY(${cursorY}px)`;
        }
        startScrollLoop();
    }, 100);
}

function selectItemByIndex(index) {
    if (index < 0 || index >= currentItemsList.length) return;
    selectedListItemIndex = index;
    const item = currentItemsList[index];
    const domItems = edList.querySelectorAll('.ed-list-item');
    domItems.forEach((el, idx) => {
        if (idx === index) el.classList.add('selected');
        else el.classList.remove('selected');
    });
    fillEditorForm(item);
}

function populateItemList() {
    if (typeof savedData1 === 'undefined') return;
    let items = Object.values(savedData1);
    const query = edSearchInput.value.toLowerCase();
    if (query) {
        items = items.filter(it => 
            it.Name.toLowerCase().includes(query) || 
            it.GlobalIndex.toLowerCase().includes(query)
        );
    }
    items.sort((a, b) => {
        if (currentSortMode === 0) { 
            const grpA = EDITOR_GROUPS.findIndex(g => g.id === a.Type);
            const grpB = EDITOR_GROUPS.findIndex(g => g.id === b.Type);
            if (grpA !== grpB) return grpA - grpB;
            const costA = Number(a.Cost) || 0;
            const costB = Number(b.Cost) || 0;
            if (costA !== costB) return costB - costA;
            return a.Name.localeCompare(b.Name);
        } else if (currentSortMode === 1) { 
             return Number(a.GlobalIndex) - Number(b.GlobalIndex);
        } else { 
            return a.Name.localeCompare(b.Name);
        }
    });
    currentItemsList = items;
    let listHTML = '<div class="list-spacer"></div>';
    items.forEach((item, index) => {
        const iconSrc = window.resolveIconUrl(currentMode, item);
        const isSelected = index === selectedListItemIndex ? 'selected' : '';
        listHTML += `
            <div class="ed-list-item ${isSelected}" data-index="${index}">
                <img class="ed-list-icon" src="${iconSrc}">
                <div style="display:flex; flex-direction:column; overflow:hidden;">
                    <span class="ed-list-name">${item.Name}</span>
                    <span style="font-size:11px; color:#666;">
                        ID: ${item.GlobalIndex}
                        <span class="ed-list-cost">${item.Cost}</span>
                    </span>
                </div>
            </div>
        `;
    });
    listHTML += '<div class="list-spacer"></div>';
    edList.innerHTML = listHTML;
    const domItems = edList.querySelectorAll('.ed-list-item');
    domItems.forEach(div => {
        div.addEventListener('click', () => {
            const idx = parseInt(div.dataset.index);
            handlePhysicsItemClick(idx);
        });
    });
}

function handlePhysicsItemClick(index) {
    if (index === selectedListItemIndex) return;
    
    // Вместо прямого переключения, используем обертку с проверкой
    attemptAction(() => {
        selectItemByIndex(index);
        visualIndex = index;
        targetScrollTop = edList.scrollTop;
        currentScrollTop = edList.scrollTop;
        isInternalNavigation = true;
        startScrollLoop();
    });
}

function centerOnSelectedItem() {
    if (selectedListItemIndex === -1) return;
    const viewportH = edList.clientHeight;
    const itemY = getItemY(selectedListItemIndex);
    let target = itemY - (viewportH / 2) + (ITEM_HEIGHT / 2);
    target = Math.max(0, Math.min(target, edList.scrollHeight - viewportH));
    targetScrollTop = target;
    currentScrollTop = target;
    edList.scrollTop = target;
    visualIndex = selectedListItemIndex;
    if (edSelectionCursor) {
        const cursorY = itemY - target;
        edSelectionCursor.style.transform = `translateY(${cursorY}px)`;
    }
}

// --- DYNAMIC BUTTON LOGIC ---

function updateDynamicButtonState() {
    if (!savedData1 || selectedListItemIndex === -1) {
        edDynamicBtn.style.display = 'none';
        return;
    }
    
    edDynamicBtn.style.display = 'inline-block';
    const currentGid = parseInt(edId.value);
    
    // Находим максимальный GlobalIndex во всем наборе данных
    let maxGid = -1;
    Object.values(savedData1).forEach(item => {
        const gid = parseInt(item.GlobalIndex);
        if (!isNaN(gid) && gid > maxGid) {
            maxGid = gid;
        }
    });
    
    // Если текущий элемент имеет максимальный ID -> Режим удаления
    if (currentGid === maxGid) {
        edDynamicBtn.textContent = 'Удалить';
        edDynamicBtn.classList.remove('btn-neutral');
        edDynamicBtn.classList.add('btn-danger');
        edDynamicBtn.dataset.action = 'delete';
    } else {
        // Иначе -> Режим перехода к последнему
        edDynamicBtn.textContent = 'К последнему ID';
        edDynamicBtn.classList.remove('btn-danger');
        edDynamicBtn.classList.add('btn-neutral');
        edDynamicBtn.dataset.action = 'last';
    }
}

edDynamicBtn.addEventListener('click', () => {
    const action = edDynamicBtn.dataset.action;
    
    if (action === 'delete') {
        showDeleteModal();
    } else {
        // Переход к последнему элементу
        // Используем attemptAction для проверки несохраненных изменений перед переходом
        attemptAction(() => {
            // Находим элемент с макс ID
            let maxItem = null;
            let maxGid = -1;
            
            // Ищем в currentItemsList (отфильтрованном) или во всем savedData1?
            // Логичнее искать во всем savedData1, так как кнопка глобальная
            // Но переключиться мы можем только если он есть в списке.
            // Поэтому ищем в savedData1, а потом проверяем наличие в currentItemsList
            // Если в списке нет (фильтр), сбрасываем фильтр? Нет, просто ищем в текущем списке.
            
            // Вариант: ищем в ТЕКУЩЕМ ОТОБРАЖАЕМОМ СПИСКЕ
            currentItemsList.forEach(item => {
                const gid = parseInt(item.GlobalIndex);
                if (!isNaN(gid) && gid > maxGid) {
                    maxGid = gid;
                    maxItem = item;
                }
            });
            
            if (maxItem) {
                const index = currentItemsList.findIndex(x => x.GlobalIndex === maxItem.GlobalIndex);
                if (index !== -1) {
                    selectItemByIndex(index);
                    centerOnSelectedItem();
                }
            }
        });
    }
});

// --- ICONS EXPORT LOGIC ---

iconExportBtn.addEventListener('click', async () => {
    if (!savedData1) return;
    
    // Проверка на наличие библиотеки
    if (typeof JSZip === 'undefined') {
        alert('Ошибка: Библиотека JSZip не загружена. Проверьте подключение к интернету.');
        return;
    }

    // Показываем индикацию загрузки на кнопке
    const originalText = iconExportBtn.innerHTML;
    iconExportBtn.textContent = '...';
    iconExportBtn.disabled = true;

    // Показываем модальное окно с загрузкой
    const loader = document.getElementById('loading-overlay');
    const loaderText = document.querySelector('.loading-text');
    let originalLoaderText = 'Обработка данных...';
    if (loader) {
        if (loaderText) {
            originalLoaderText = loaderText.textContent;
            loaderText.textContent = 'Сбор архива с иконками...';
        }
        loader.classList.add('visible');
    }

    try {
        // Даем браузеру время отрисовать лоадер
        await new Promise(r => setTimeout(r, 50));

        const zip = new JSZip();
        const items = Object.values(savedData1);
        
        // Хелпер для добавления ведущих нулей (ID 6 -> 006)
        const padId = (id) => String(id).padStart(3, '0');
        
        // Массив промисов для параллельной загрузки
        const promises = items.map(async (item) => {
            const gid = parseInt(item.GlobalIndex);
            if (isNaN(gid)) return;
            
            const filename = padId(gid) + '.png';
            const iconUrl = window.resolveIconUrl(currentMode, item);
            
            if (!iconUrl) return;

            try {
                let finalBlob;
                // ИСПОЛЬЗУЕМ СЫРЫЕ БАЙТЫ ДЛЯ 100% ТОЧНОСТИ ZIP ЭКСПОРТА (ВМЕСТО ИСКАЖЕННОГО CANVAS)
                if (window.ugsRawCache && window.ugsRawCache[iconUrl]) {
                    const raw = window.ugsRawCache[iconUrl];
                    const pngBuf = UPNG.encode([raw.data.buffer], raw.width, raw.height, 0);
                    finalBlob = new Blob([pngBuf], { type: 'image/png' });
                } else {
                    const response = await fetch(iconUrl);
                    if (!response.ok) throw new Error(`Status ${response.status}`);
                    finalBlob = await response.blob();
                }
                zip.file(filename, finalBlob);
            } catch (err) {
                console.warn(`Не удалось загрузить иконку для ID ${gid}:`, err);
            }
        });

        await Promise.all(promises);
        
        // Генерируем архив
        const content = await zip.generateAsync({type: "blob"});
        
        // Скачиваем
        downloadBlob(content, 'icons.zip', 'application/zip');
        
    } catch (e) {
        console.error("Ошибка экспорта иконок:", e);
        alert("Произошла ошибка при экспорте иконок.");
    } finally {
        // Возвращаем кнопку в исходное состояние
        iconExportBtn.innerHTML = originalText;
        iconExportBtn.disabled = false;

        // Скрываем лоадер
        if (loader) {
            loader.classList.remove('visible');
            if (loaderText) loaderText.textContent = originalLoaderText;
        }
    }
});

// --- COPY / PASTE FUNCTIONALITY ---

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure it's not visible but part of DOM
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            if (typeof showNotification === 'function') {
                showNotification('Предмет скопирован в буфер!', 'success');
            } else {
                alert('Предмет скопирован!');
            }
        } else {
            throw new Error('Fallback copy failed');
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        if (typeof showNotification === 'function') {
            showNotification('Ошибка копирования!', 'error');
        }
    }

    document.body.removeChild(textArea);
}

// ВАЖНО: Копирование предмета теперь избегает Canvas, чтобы сохранить точность байт-в-байт
edCopyBtn.addEventListener('click', async () => {
    // 1. Получаем текущие данные из формы (чтобы скопировать именно то, что на экране)
    const formData = getFormState();
    
    // 2. Получаем картинку в Base64
    let iconBase64 = '';
    const url = edIcon.src;

    try {
        // Создаем Canvas и рисуем на нем текущую картинку
        
        // Проверка на пустое изображение
        if (window.ugsRawCache && window.ugsRawCache[url]) {
            // Если картинка из UGS (сохранена в кэше), кодируем её сырые байты в Base64 без искажений Canvas
            const raw = window.ugsRawCache[url];
            const pngBuf = UPNG.encode([raw.data.buffer], raw.width, raw.height, 0);
            const bytes = new Uint8Array(pngBuf);
            let binary = '';
            // Избегаем ошибки "Maximum call stack size exceeded"
            const chunkSize = 8192;
            for (let i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
            }
            iconBase64 = 'data:image/png;base64,' + window.btoa(binary);
        } else if (url && url !== window.location.href) {
            // Если это обычный PNG файл, просто скачиваем его без потерь (никакого Canvas)
            const resp = await fetch(url);
            const blob = await resp.blob();
            iconBase64 = await new Promise(r => {
                const reader = new FileReader();
                reader.onload = () => r(reader.result);
                reader.readAsDataURL(blob);
            });
        }
    } catch (err) {
        console.error('Ошибка конвертации изображения в Base64', err);
        // Не блокируем копирование данных, если картинка не удалась (например, CORS)
    }

    // 3. Формируем объект для буфера обмена
    const clipboardObj = {
        type: 'DT_ITEM_CLIPBOARD', // Сигнатура
        itemData: formData,
        iconDataUrl: iconBase64
    };

    const textData = JSON.stringify(clipboardObj);

    // 4. Записываем в буфер
    // Проверка поддержки Clipboard API и безопасного контекста
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
        fallbackCopyTextToClipboard(textData);
        return;
    }

    try {
        await navigator.clipboard.writeText(textData);
        if (typeof showNotification === 'function') {
            showNotification('Предмет скопирован в буфер!', 'success');
        } else {
            alert('Предмет скопирован!');
        }
    } catch (err) {
        console.error('Не удалось записать в буфер обмена через API, пробую fallback', err);
        fallbackCopyTextToClipboard(textData);
    }
});

edPasteBtn.addEventListener('click', async () => {
    let text = '';
    
    // 1. Пытаемся прочитать из буфера обмена
    try {
        if (navigator.clipboard && navigator.clipboard.readText) {
            text = await navigator.clipboard.readText();
        }
    } catch (err) {
        console.warn('Ошибка чтения буфера обмена, пробую запасной вариант:', err);
    }

    text = text.trim();

    // 2. Запасной вариант: если буфер недоступен или пуст, берем из поля поиска
    if (!text && edSearchInput) {
        text = edSearchInput.value.trim();
    }

    // 3. Если ничего не нашли
    if (!text) {
        if (typeof showNotification === 'function') {
            showNotification('Дайте разрешение на чтение буфера или вставьте данные предмета в поле поиска.', 'error');
        } else {
            alert('Дайте разрешение на чтение буфера или вставьте данные предмета в поле поиска.');
        }
        return;
    }

    attemptAction(() => {
        try {
            let clipboardObj;
            try {
                clipboardObj = JSON.parse(text);
            } catch (e) {
                if (typeof showNotification === 'function') {
                    showNotification('Невалидный JSON в буфере обмена или поле поиска.', 'error');
                }
                return;
            }

            // Проверка сигнатуры
            if (!clipboardObj || clipboardObj.type !== 'DT_ITEM_CLIPBOARD') {
                if (typeof showNotification === 'function') {
                    showNotification('Неверный формат данных (нет сигнатуры DT_ITEM_CLIPBOARD).', 'error');
                }
                return;
            }

            const sourceData = clipboardObj.itemData;
        
        // 1. Вычисляем новый свободный ID
        let maxId = 0;
        if (savedData1) {
            Object.values(savedData1).forEach(item => {
                const gid = parseInt(item.GlobalIndex);
                if (!isNaN(gid) && gid > maxId) maxId = gid;
            });
        }
        const newId = maxId + 1;

        // 2. Обработка иконки
        let newIconPath = 'empty';
        if (clipboardObj.iconDataUrl) {
            newIconPath = clipboardObj.iconDataUrl;
            // Добавляем в customIcons, чтобы селектор знал о ней
            const pseudoName = `Copied_Item_${newId}.png`;
            customIcons.unshift({
                name: pseudoName,
                url: newIconPath
            });
            // Сохраняем в реестре оригиналов для Zoom
            window.originalCustomIcons[newIconPath] = newIconPath;
        }

        // 3. Создадим новый объект item
        const newItem = {
            GlobalIndex: String(newId),
            Name: sourceData.name || 'Новый предмет',
            Descript: sourceData.desc || '',
            Cost: sourceData.cost || '0',
            Type: sourceData.type || EDITOR_GROUPS[0].id,
            Icon: newIconPath,
            _attrs: []
        };

        if (sourceData.magic && sourceData.magic !== 'Нет') newItem.Magic = sourceData.magic;
        if (sourceData.bonus) {
            newItem.Bonus = sourceData.bonus;
            // Попытка восстановить BonusIcon
            if (window.getAllBonuses) {
                 const allBonuses = window.getAllBonuses();
                 const found = allBonuses.find(b => b.value === sourceData.bonus);
                 if (found && found.icon) {
                     if (found.icon.startsWith('bonic/')) newItem.BonusIcon = found.icon;
                 }
            }
        }

        // Восстанавливаем атрибуты из sourceData.stats
        if (sourceData.stats) {
            Object.entries(sourceData.stats).forEach(([idxStr, vals]) => {
                const index = parseInt(idxStr);
                const statConf = STAT_CONFIG[index];
                if (!statConf) return;

                if (vals.eq) newItem._attrs.push({ key: statConf.key, value: `=${vals.eq}` });
                if (vals.plus) {
                    const v = vals.plus.startsWith('-') ? vals.plus : `+${vals.plus}`;
                    newItem._attrs.push({ key: statConf.key, value: v });
                }
                if (vals.percent) {
                    const v = vals.percent.startsWith('-') ? vals.percent : `+${vals.percent}`;
                    newItem._attrs.push({ key: statConf.key, value: `${v}%` });
                }
            });
        }

        // 4. Добавляем в savedData1
        const objectKey = `NewItem_${newId}_${Date.now()}`;
        if (!savedData1) savedData1 = {};
        savedData1[objectKey] = newItem;

        // 5. Очищаем поле поиска, чтобы увидеть список
        edSearchInput.value = '';
        updateSearchClearBtn();
        
        // 6. Обновляем UI
        populateItemList();
        
        // Находим индекс нового предмета в списке
        const newIndex = currentItemsList.findIndex(x => x.GlobalIndex === String(newId));
        if (newIndex !== -1) {
            // Выбираем его
            selectItemByIndex(newIndex);
            centerOnSelectedItem();
        }

        if (typeof showNotification === 'function') {
            showNotification(`Предмет вставлен c ID ${newId}`, 'success');
        }
        
        // Обновляем основное приложение
        if (window.refreshApp) window.refreshApp();

    } catch (err) {
        console.error('Ошибка вставки', err);
        if (typeof showNotification === 'function') {
            showNotification('Ошибка обработки данных!', 'error');
        }
    }
    }); // <- Закрывающая скобка attemptAction
});

// --- NEW CREATE BUTTON LOGIC ---
createBtn.addEventListener('click', () => {
    // Оборачиваем в attemptAction, чтобы проверить несохраненные изменения перед созданием
    attemptAction(() => {
        // 1. Находим максимальный ID
        let maxId = 0;
        if (savedData1) {
            Object.values(savedData1).forEach(item => {
                const gid = parseInt(item.GlobalIndex);
                if (!isNaN(gid) && gid > maxId) maxId = gid;
            });
        }
        const newId = maxId + 1;

        // 2. Создаем пустой шаблон предмета
        const newItem = {
            GlobalIndex: String(newId),
            Name: 'Новый предмет',
            Descript: '',
            Cost: '0',
            Type: EDITOR_GROUPS[0].id, // Default type (BlowWeapon)
            Icon: '../NewmodIcon.png', // Default icon from root
            _attrs: [] // Empty stats
        };

        // 3. Добавляем в структуру данных
        const objectKey = `NewItem_${newId}_${Date.now()}`;
        if (!savedData1) savedData1 = {};
        savedData1[objectKey] = newItem;

        // 4. Очищаем поиск, чтобы увидеть новый предмет
        edSearchInput.value = '';
        updateSearchClearBtn();

        // 5. Обновляем список
        populateItemList();

        // 6. Выбираем новый предмет
        const newIndex = currentItemsList.findIndex(x => x.GlobalIndex === String(newId));
        if (newIndex !== -1) {
            selectItemByIndex(newIndex);
            centerOnSelectedItem();
        }

        // 7. Уведомление
        if (typeof showNotification === 'function') {
            showNotification(`Создан новый предмет (ID: ${newId})`, 'success');
        }

        // 8. Обновляем приложение
        if (window.refreshApp) window.refreshApp();
    });
});


// --- FORM FILLING (HARDENED) ---

function fillEditorForm(item) {
    // 1. Очищаем все инпуты ПЕРЕД заполнением
    STAT_CONFIG.forEach((stat, index) => {
        const setVal = (mode) => {
            const el = document.getElementById(getStatInputId(index, mode));
            if(el) el.value = '';
        };
        setVal('plus'); setVal('eq'); setVal('percent');
    });

    edId.value = item.GlobalIndex;
    edName.value = item.Name;
    edDesc.value = item.Descript || '';
    edCost.value = item.Cost;
    updateCharCounter();
    const counterEl = document.getElementById('ed-desc-count');
    if (counterEl) counterEl.textContent = edDesc.value.length;
    edIcon.src = window.resolveIconUrl(currentMode, item);
    // Сохраняем текущую иконку для редактора
    currentIconPath = item.Icon; 
    isCurrentIconCustom = currentIconPath && currentIconPath.startsWith('data:'); // Обновляем флаг
    
    if (item.Type && edTypeContainer._setValue) {
        edTypeContainer._setValue(item.Type);
        currentType = item.Type;
    }
    
    const magicRaw = item.Magic || 'Нет';
    const magicLower = magicRaw.toLowerCase();
    let targetMagic = 'Нет';
    if (magicLower.includes('жизни')) targetMagic = 'Магия Жизни';
    else if (magicLower.includes('смерти')) targetMagic = 'Магия Смерти';
    else if (magicLower.includes('стихий')) targetMagic = 'Магия Стихий';
    
    if (edMagicContainer._setValue) edMagicContainer._setValue(targetMagic);
    currentMagic = targetMagic;

    const bonus = item.Bonus || '';
    if (edBonusContainer._setValue) edBonusContainer._setValue(bonus);
    currentBonus = bonus;
    
    // Хелпер для установки значения по индексу в массиве STAT_CONFIG
    const fillStatByIndex = (index, valStr) => {
        if (index === undefined || index === -1) return;
        
        valStr = valStr.trim();
        let targetId = null;
        let cleanVal = null;

        if (valStr.endsWith('%')) {
            targetId = getStatInputId(index, 'percent');
            cleanVal = parseFloat(valStr);
        } else if (valStr.startsWith('=')) {
            targetId = getStatInputId(index, 'eq');
            cleanVal = parseFloat(valStr.substring(1));
        } else {
            targetId = getStatInputId(index, 'plus');
            cleanVal = parseFloat(valStr);
        }

        if (targetId) {
            const el = document.getElementById(targetId);
            if (el) el.value = cleanVal;
        }
    };

    // Заполнение статов
    if (item._attrs) {
       item._attrs.forEach(attr => {
           let key = attr.key.replace(/-/g, ' ');
           
           // Разворачиваем составные статы в конкретные индексы
           if (key === 'Иммунитет к магии') {
                fillStatByIndex(STAT_KEY_TO_INDEX['Защита от магии смерти'], attr.value);
                fillStatByIndex(STAT_KEY_TO_INDEX['Защита от магии жизни'], attr.value);
                fillStatByIndex(STAT_KEY_TO_INDEX['Защита от магии стихий'], attr.value);
                return; 
           }
           if (key === 'Физическая атака') {
               fillStatByIndex(STAT_KEY_TO_INDEX['Атака рукопашная'], attr.value);
               fillStatByIndex(STAT_KEY_TO_INDEX['Атака стрелковая'], attr.value);
               return;
           }
           if (key === 'Физическая защита') {
               fillStatByIndex(STAT_KEY_TO_INDEX['Защита рукопашная'], attr.value);
               fillStatByIndex(STAT_KEY_TO_INDEX['Защита стрелковая'], attr.value);
               return;
           }

           // Обычное заполнение
           const idx = STAT_KEY_TO_INDEX[key];
           fillStatByIndex(idx, attr.value);
       });
    }
    updateItemPreview();
    updateDynamicButtonState(); // Обновляем состояние кнопки
    
    // Сохраняем состояние для отслеживания изменений
    initialFormState = JSON.stringify(getFormState());
}

// --- Open/Close Logic ---

function clearEditorForm() {
    edId.value = '';
    edName.value = '';
    edDesc.value = '';
    edCost.value = '';
    updateCharCounter();
    
    if (edTypeContainer._setValue) {
         edTypeContainer._setValue(EDITOR_GROUPS[0].id);
         currentType = EDITOR_GROUPS[0].id;
    }
    if (edMagicContainer._setValue) {
         edMagicContainer._setValue('Нет');
         currentMagic = 'Нет';
    }
    if (edBonusContainer._setValue) {
         edBonusContainer._setValue('');
         currentBonus = '';
    }
    
    // Clear Stats via ID loop
    STAT_CONFIG.forEach((stat, index) => {
        const setVal = (mode) => {
            const el = document.getElementById(getStatInputId(index, mode));
            if(el) el.value = '';
        };
        setVal('plus'); setVal('eq'); setVal('percent');
    });
    
    edIcon.src = '';
    edIcon.removeAttribute('src'); 
    currentIconPath = ''; // Reset icon state
    isCurrentIconCustom = false;
    updateItemPreview();
    updateDynamicButtonState();
    
    // ВАЖНО: Фиксируем "пустое" состояние, чтобы любые новые буквы считались изменением
    initialFormState = JSON.stringify(getFormState());
}

function openEditor(item) {
  clearEditorForm();
  populateBonusList(); 
  selectedListItemIndex = -1;
  visualIndex = 0; 
  
  if (!item) {
     // Очищаем поиск при открытии по кнопке
     if (edSearchInput) edSearchInput.value = '';
     if (typeof updateSearchClearBtn === 'function') updateSearchClearBtn();
     populateItemList();
     
     if (currentItemsList && currentItemsList.length > 0) {
         let minId = Infinity;
         let minItemIndex = -1;
         
         currentItemsList.forEach((it, idx) => {
             let gid = parseInt(it.GlobalIndex);
             if (!isNaN(gid) && gid < minId) {
                 minId = gid;
                 minItemIndex = idx;
             }
         });
         
         if (minItemIndex !== -1) {
             setTimeout(() => {
                 selectItemByIndex(minItemIndex);
                 centerOnSelectedItem();
             }, 50);
         } else {
             setTimeout(() => {
                edList.scrollTop = 0;
                currentScrollTop = 0;
                targetScrollTop = 0;
                if(edSelectionCursor) edSelectionCursor.style.transform = `translateY(${TOP_SPACER}px)`;
             }, 0);
         }
     } else {
         setTimeout(() => {
            edList.scrollTop = 0;
            currentScrollTop = 0;
            targetScrollTop = 0;
            if(edSelectionCursor) edSelectionCursor.style.transform = `translateY(${TOP_SPACER}px)`;
         }, 0);
     }
  }

  if (item) {
     const idElem = item.querySelector('.tooltip-id');
     if (idElem) {
         const txt = idElem.textContent;
         const gid = txt.replace('ID: ', '').trim();
         
         if (typeof savedData1 !== 'undefined') {
             const dataItem = Object.values(savedData1).find(x => x.GlobalIndex === gid);
             if (dataItem) {
                 fillEditorForm(dataItem);
                 populateItemList(); 
                 const itemIndex = currentItemsList.findIndex(x => x.GlobalIndex === gid);
                 
                 if (itemIndex !== -1) {
                     setTimeout(() => {
                         selectItemByIndex(itemIndex); 
                         centerOnSelectedItem();
                     }, 50);
                 }
             }
         }
     }
  }

  editorOverlay.classList.add('visible');
  startScrollLoop(); 
}

function closeEditor(force = false) {
  const action = () => {
      editorOverlay.classList.remove('visible');
      contextTargetItem = null;
      document.querySelectorAll('.ed-custom-select-options.open').forEach(el => el.classList.remove('open'));
      hideSlider();
      cancelAnimationFrame(animationFrameId); 
  };
  
  // Если force === true (клик по кнопке "Отмена"), закрываем без предупреждения
  if (force === true) {
      action();
  } else {
      attemptAction(action);
  }
}

initEditorUI();

btnEditor.addEventListener('click', (e) => {
  e.stopPropagation();
  openEditor(null);
});

// Передаем true, чтобы кнопка "Отмена" игнорировала несохраненные изменения
cancelBtn.addEventListener('click', () => closeEditor(true));

let overlayMouseDownStarted = false;
editorOverlay.addEventListener('mousedown', (e) => {
  if (e.target === editorOverlay) {
    overlayMouseDownStarted = true;
  } else {
    overlayMouseDownStarted = false;
  }
});

editorOverlay.addEventListener('click', (e) => {
  if (e.target === editorOverlay && overlayMouseDownStarted) {
    closeEditor();
  }
  overlayMouseDownStarted = false; 
});

document.addEventListener('contextmenu', (e) => {
  if ((e.target.tagName === 'INPUT' && e.target.type === 'text') || e.target.tagName === 'TEXTAREA') {
    return;
  }
  e.preventDefault(); 
  const itemCard = e.target.closest('.item');
  if (itemCard) {
    contextTargetItem = itemCard;
    showContextMenu(e.pageX, e.pageY);
  } else {
    hideContextMenu();
  }
});

function showContextMenu(x, y) {
  const menuWidth = 160;
  if (x + menuWidth > window.innerWidth) x -= menuWidth;
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.add('visible');
}

function hideContextMenu() {
  contextMenu.classList.remove('visible');
}

document.addEventListener('click', (e) => {
  if (!contextMenu.contains(e.target)) {
    hideContextMenu();
  }
});

ctxOpenEditor.addEventListener('click', (e) => {
  e.stopPropagation();
  hideContextMenu();
  if (contextTargetItem) {
    openEditor(contextTargetItem);
  }
});

// --- SAVE LOGIC (HARDENED) ---

function updateCurrentItemData() {
    if (!savedData1) return;
    
    const gid = edId.value;
    if (!gid) return; // Защита от пустой формы
    
    const item = Object.values(savedData1).find(x => x.GlobalIndex === gid);
    
    if (!item) return;
    
    item.Name = edName.value;
    item.Descript = edDesc.value;
    item.Cost = edCost.value;
    item.Type = currentType;
    // Сохраняем новую иконку
    if (currentIconPath) {
        item.Icon = currentIconPath;
    }
    
    if (currentMagic && currentMagic !== 'Нет') {
        item.Magic = currentMagic;
    } else {
        delete item.Magic;
    }
    
    if (currentBonus && currentBonus !== '' && currentBonus !== 'Отсутствует') {
        item.Bonus = currentBonus;
        
        // --- ОБНОВЛЕНИЕ ИКОНКИ БОНУСА (NEW FIX) ---
        let newIcon = null;
        if (window.getAllBonuses) {
             const allBonuses = window.getAllBonuses();
             // 1. Ищем бонус в списке всех доступных
             const found = allBonuses.find(b => b.value === currentBonus);
             
             if (found && found.icon) {
                 if (found.icon.startsWith('bonic/')) {
                     // Это стандартный бонус, используем путь как есть
                     newIcon = found.icon;
                 } else {
                     // Это кастомный бонус из INI. found.icon - полный путь (./Mod/Icon.png).
                     // Нам нужен "сырой" путь для item.BonusIcon.
                     // Пытаемся найти другой предмет с таким же бонусом и скопировать его BonusIcon.
                     const prototype = Object.values(savedData1).find(i => i.Bonus === currentBonus && i.BonusIcon);
                     if (prototype) {
                         newIcon = prototype.BonusIcon;
                     }
                 }
             }
        }
        
        if (newIcon) {
            item.BonusIcon = newIcon;
        } else {
            // Если иконка не найдена, удаляем свойство, чтобы не отображалась старая
            delete item.BonusIcon;
        }
        // ------------------------------------------

    } else {
        delete item.Bonus;
        delete item.BonusIcon;
    }
    
    // СБОР АТРИБУТОВ: ЖЕЛЕЗОБЕТОННЫЙ ЦИКЛ ПО ID
    const newAttrs = [];
    
    STAT_CONFIG.forEach((stat, index) => {
        // Читаем напрямую из DOM по ID, который гарантированно существует и уникален
        const getVal = (mode) => {
            const el = document.getElementById(getStatInputId(index, mode));
            return el ? el.value : '';
        };

        const plus = getVal('plus');
        const eq   = getVal('eq');
        const pct  = getVal('percent');
        
        // --- ПОРЯДОК: Eq (=), Plus (+/-), Percent (%) ---

        // 1. Eq
        if (eq !== '') newAttrs.push({ key: stat.key, value: `=${eq}` });
        
        // 2. Plus
        // FIX: Проверка на знак перед сохранением
        // Если число отрицательное, сохраняем как есть (-5).
        // Если положительное, добавляем плюс (+5), чтобы сохранить формат игры.
        if (plus !== '') {
             const val = plus.startsWith('-') ? plus : `+${plus}`;
             newAttrs.push({ key: stat.key, value: val }); 
        }
        
        // 3. Percent
        // FIX: Аналогичная логика для процентов для красоты (+5% / -5%)
        if (pct !== '') {
             const val = pct.startsWith('-') ? pct : `+${pct}`;
             newAttrs.push({ key: stat.key, value: `${val}%` }); 
        }
    });
    
    item._attrs = newAttrs;
    
    // Обновляем "начальное состояние" после сохранения, чтобы модалка не вылезала
    initialFormState = JSON.stringify(getFormState());
    
    const currentId = item.GlobalIndex;
    populateItemList();
    const newIndex = currentItemsList.findIndex(x => x.GlobalIndex === currentId);
    if (newIndex !== -1) {
        selectItemByIndex(newIndex);
        const itemTop = getItemY(newIndex);
        const itemBottom = itemTop + ITEM_HEIGHT;
        const scrollTop = edList.scrollTop;
        const scrollBottom = scrollTop + edList.clientHeight;

        if (itemTop >= scrollTop && itemBottom <= scrollBottom) {
            targetScrollTop = scrollTop;
            currentScrollTop = scrollTop;
            startScrollLoop();
        } else {
            centerOnSelectedItem();
        }
    }
}

saveBtn.addEventListener('click', () => {
   updateCurrentItemData();
   saveBtn.textContent = 'Сохранено!';
   setTimeout(() => saveBtn.textContent = 'Сохранить', 1000);
   if (window.refreshApp) window.refreshApp();
});

// --- INI EXPORT ---
const REVERSE_NAME_MAP = {
    'Количество действий': 'Manevres',
    'Жизнь (хиты)': 'Hits',
    'Защита рукопашная': 'DefenceBlow',
    'Атака рукопашная': 'AttackBlow',
    'Защита стрелковая': 'DefenceShot',
    'Атака стрелковая': 'AttackShot',
    'Вампиризм': 'Vampirizm',
    'Регенерация': 'Regen',
    'Инициатива': 'Initiative',
    'Магия смерти': 'DeathMagic',
    'Магия жизни': 'LifeMagic',
    'Магия стихий': 'ElementalMagic',
    'Сила магии': 'MagicPower',
    'Защита от магии стихий': 'ProtectElemental',
    'Защита от магии смерти': 'ProtectDeath',
    'Защита от магии жизни': 'ProtectLife'
};

const COMPOUND_MAP = {
    'Физическая защита': ['DefenceBlow', 'DefenceShot'],
    'Физическая атака': ['AttackBlow', 'AttackShot'],
    'Иммунитет к магии': ['ProtectDeath', 'ProtectLife', 'ProtectElemental']
};

const REVERSE_MAGIC_MAP = {
    'Магия смерти': 'DeathMagic',
    'Магия жизни': 'LifeMagic',
    'Магия стихий': 'ElementalMagic'
};

let REVERSE_BONUS_MAP = {};
if (typeof BONUS_MAP !== 'undefined') {
    for (const [eng, rus] of Object.entries(BONUS_MAP)) {
        REVERSE_BONUS_MAP[rus] = eng;
    }
}

function parseValueForIni(rawVal) {
    let prefix = 'd-';
    let cleanVal = rawVal;
    
    if (rawVal.endsWith('%')) {
        prefix = 'p-';
        cleanVal = rawVal.replace('%', '').replace('+', ''); 
    } else if (rawVal.startsWith('=')) {
        prefix = 'f-';
        cleanVal = rawVal.replace('=', '');
    } else {
        prefix = 'd-';
        cleanVal = rawVal.replace('+', ''); 
    }
    return { prefix, cleanVal };
}

function makeIniText(dataObj) {
    let output = '';
    
    for (const [key, item] of Object.entries(dataObj)) {
        let header = key;
        if (item.GlobalIndex && item.Name) {
            header = `${item.GlobalIndex} ${item.Name}`;
        }
        output += `[${header}]\r\n`;
        
        if (item.GlobalIndex) output += `GlobalIndex=${item.GlobalIndex}\r\n`;
        if (item.Name) output += `Name=${item.Name}\r\n`;
        if (item.Descript) output += `Descript=${item.Descript}\r\n`;
        
        if (item.GlobalIndex) {
            if (item.Icon && !item.Icon.startsWith('data:')) {
                 const iconVal = item.Icon.replace('.png', '').replace('.tga', '');
                 output += `Icon=${iconVal}\r\n`;
            } else {
                 const paddedId = String(item.GlobalIndex).padStart(3, '0');
                 output += `Icon=A${paddedId}\r\n`;
            }
        } else {
            output += `Icon=empty\r\n`;
        }
        
        if (item.Cost) output += `Cost=${item.Cost}\r\n`;
        if (item.Type) output += `Type=${item.Type}\r\n`;
        
        if (item.Magic) {
            const mKey = REVERSE_MAGIC_MAP[item.Magic] || item.Magic;
            output += `Magic=${mKey}\r\n`;
        }
        
        if (item.Bonus) {
            const bKey = REVERSE_BONUS_MAP[item.Bonus] || item.Bonus;
            output += `Bonus=${bKey}\r\n`;
        }
        
        if (item._attrs) {
            output += `// характеристики\r\n`;
            item._attrs.forEach(attr => {
                const rusKey = attr.key;
                if (COMPOUND_MAP[rusKey]) {
                    const engKeys = COMPOUND_MAP[rusKey];
                    let { prefix, cleanVal } = parseValueForIni(attr.value);
                    engKeys.forEach(ek => {
                        output += `${prefix}${ek}=${cleanVal}\r\n`;
                    });
                    return; 
                }
                const engKey = REVERSE_NAME_MAP[rusKey] || rusKey;
                let { prefix, cleanVal } = parseValueForIni(attr.value);
                output += `${prefix}${engKey}=${cleanVal}\r\n`;
            });
        }
        output += `\r\n`;
    }
    return output;
}

function encodeWin1251(str) {
    const buf = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (charCode < 128) {
            buf[i] = charCode;
        } else {
            const map = {
                1025: 168, 1105: 184, 
                1028: 170, 1108: 186, 
                1031: 175, 1111: 191, 
                1030: 178, 1110: 179, 
            };
            if (map[charCode]) {
                buf[i] = map[charCode];
            } else if (charCode >= 1040 && charCode <= 1103) {
                buf[i] = charCode - 1040 + 192;
            } else {
                buf[i] = 63;
            }
        }
    }
    return buf;
}

function downloadBlob(data, fileName, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}

// --- UGS EXPORT LOGIC ---

function encodeUGSPixel(r, g, b, a) {
    const to4Bit = (val) => Math.round(val / 17);
    const r4 = to4Bit(r);
    const g4 = to4Bit(g);
    const b4 = to4Bit(b);
    const a4 = to4Bit(a);

    if (a4 === 0) return 0xAAAA;

    const alpha_lsb = a4 & 1;
    const alpha_msbs = (a4 >> 1) & 7;

    let val = 0;
    val |= (alpha_lsb << 15);   
    val |= (r4 << 11);          
    val |= (g4 << 7);           
    val |= (b4 << 3);           
    val |= alpha_msbs;          

    return val ^ 0xAAAA;
}

// ВАЖНО: Модифицированная функция получения пикселей
// Она ИДЕАЛЬНО восстанавливает байты из нашего кэша, гарантируя 100% точность
async function getRawPixelData(url) {
    if (!url || url === 'empty') return null;
    
    // НОВОЕ: Если картинка была сгенерирована из UGS, берем сырые байты прямо из кэша!
    // Это делает экспорт моментальным и гарантирует 100% точность (без искажений Canvas).
    // САМОЕ ГЛАВНОЕ: берем сохраненные байты из кэша (избегая искажений Canvas)
    if (window.ugsRawCache && window.ugsRawCache[url]) {
        return window.ugsRawCache[url];
    }

    // Если в кэше нет (например, обычная PNG-картинка) - декодируем без Canvas!
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
}

// Выносим генерацию UGS в отдельную функцию, чтобы получить буфер
async function generateUGSBuffer() {
    let maxId = 0;
    const itemsMap = {}; 
    
    Object.values(savedData1).forEach(item => {
        const gid = parseInt(item.GlobalIndex);
        if (!isNaN(gid)) {
            if (gid > maxId) maxId = gid;
            itemsMap[gid] = item;
        }
    });

    if (maxId === 0) throw new Error("Нет предметов с валидным ID");

    const framePromises = [];

    for (let i = 1; i <= maxId; i++) {
        const item = itemsMap[i];
        
        const p = (async () => {
            let width = 1;
            let height = 1;
            let pixelData = null; 

            if (item) {
                const iconUrl = window.resolveIconUrl(currentMode, item);
                const imgData = await getRawPixelData(iconUrl);
                
                if (imgData) {
                    width = imgData.width;
                    height = imgData.height;
                    const totalPixels = width * height;
                    pixelData = new Uint16Array(totalPixels);
                    const rgba = imgData.data;
                    
                    for (let k = 0; k < totalPixels; k++) {
                        const r = rgba[k * 4];
                        const g = rgba[k * 4 + 1];
                        const b = rgba[k * 4 + 2];
                        const a = rgba[k * 4 + 3];
                        pixelData[k] = encodeUGSPixel(r, g, b, a);
                    }
                }
            }

            if (!pixelData) {
                width = 1;
                height = 1;
                pixelData = new Uint16Array([0xAAAA]);
            }

            const headerSize = 4;
            const dataSize = pixelData.length * 2;
            const frameBuffer = new ArrayBuffer(headerSize + dataSize);
            const view = new DataView(frameBuffer);

            view.setUint16(0, width, true);
            view.setUint16(2, height, true);
            
            const frameWords = new Uint16Array(frameBuffer, 4, pixelData.length);
            frameWords.set(pixelData);

            return frameBuffer;
        })();

        framePromises.push(p);
    }

    const frames = await Promise.all(framePromises);

    const totalSize = frames.reduce((acc, buf) => acc + buf.byteLength, 0);
    const finalBuffer = new Uint8Array(totalSize);
    
    let offset = 0;
    frames.forEach(buf => {
        finalBuffer.set(new Uint8Array(buf), offset);
        offset += buf.byteLength;
    });

    return finalBuffer;
}

// Новый единый обработчик экспорта (ZIP)
exportAllBtn.addEventListener('click', async () => {
    updateCurrentItemData();
    if (!savedData1) return;
    
    if (typeof JSZip === 'undefined') {
        alert('Ошибка: Библиотека JSZip не загружена. Проверьте подключение к интернету.');
        return;
    }

    const originalText = exportAllBtn.textContent;
    exportAllBtn.textContent = 'Генерация...';
    exportAllBtn.disabled = true;

    // Показываем лоадер
    const loader = document.getElementById('loading-overlay');
    const loaderText = document.querySelector('.loading-text');
    let originalLoaderText = 'Обработка данных...';
    if (loader) {
        if (loaderText) {
            originalLoaderText = loaderText.textContent;
            loaderText.textContent = 'Генерация файлов мода...';
        }
        loader.classList.add('visible');
    }

    try {
        // Даем браузеру время отрисовать лоадер
        await new Promise(r => setTimeout(r, 50));

        const zip = new JSZip();
        
        // 1. Генерируем INI
        const iniText = makeIniText(savedData1);
        const iniBuffer = encodeWin1251(iniText);
        zip.file("Rus_Artefacts.ini", iniBuffer);
        
        // 2. Генерируем UGS
        const ugsBuffer = await generateUGSBuffer();
        zip.file("Items.ugs", ugsBuffer);
        
        // 3. Формируем архив
        const content = await zip.generateAsync({type: "blob"});
        
        // 4. Формируем имя файла с датой и временем
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const fileName = `items (${dateStr}).zip`;
        
        // 5. Скачиваем
        downloadBlob(content, fileName, 'application/zip');
        
        // 6. Сбрасываем флаг несохраненных изменений (так как данные только что были скачаны)
        if (typeof savedData1 !== 'undefined') {
            window.originalData1 = JSON.parse(JSON.stringify(savedData1));
        }
        
    } catch (e) {
        console.error("Ошибка экспорта:", e);
        alert("Произошла ошибка при генерации файлов экспорта.");
    } finally {
        exportAllBtn.textContent = originalText;
        exportAllBtn.disabled = false;
        
        // Скрываем лоадер
        if (loader) {
            loader.classList.remove('visible');
            if (loaderText) loaderText.textContent = originalLoaderText;
        }
    }
});

// --- ПРЕДУПРЕЖДЕНИЕ ПРИ ЗАКРЫТИИ/ОБНОВЛЕНИИ ВКЛАДКИ ---
window.addEventListener('beforeunload', function (e) {
    // Проверяем: есть ли несохраненные изменения в открытой форме редактора 
    // ИЛИ есть ли глобальные изменения в памяти (модифицирован весь набор данных)
    const isEditorDirty = typeof hasUnsavedChanges === 'function' ? hasUnsavedChanges() : false;
    const isDataDirty = typeof isGlobalDirty === 'function' ? isGlobalDirty() : false;

    if (isEditorDirty || isDataDirty) {
        // Стандартный способ вызова встроенного браузерного окна подтверждения
        e.preventDefault();
        e.returnValue = ''; // Требуется для Chrome и современных браузеров
        return ''; // Требуется для старых браузеров
    }
});

