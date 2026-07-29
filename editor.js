// editor.js

// --- Элементы DOM ---
const btnEditor     = document.getElementById('btn-editor');
const editorOverlay = document.getElementById('editor-overlay');
const cancelBtn     = document.getElementById('ed-cancel-btn');
const saveBtn       = document.getElementById('ed-save-btn'); 
const createBtn     = document.getElementById('ed-create-btn'); // Кнопка Создать
const exportAllBtn  = document.getElementById('ed-export-all-btn'); // Новая общая кнопка экспорта
const edDynamicBtn  = document.getElementById('ed-dynamic-btn'); // Новая кнопка
const edDeleteShiftBtn = document.getElementById('ed-delete-shift-btn'); // Новая кнопка удаления со смещением
const iconExportBtn = document.getElementById('ed-icon-export-btn'); // Кнопка экспорта иконок
const edCopyBtn     = document.getElementById('ed-copy-btn');   // Кнопка копирования
const edPasteBtn    = document.getElementById('ed-paste-btn');  // Кнопка вставки
const edZoomBtn     = document.getElementById('ed-zoom-btn');   // Новая кнопка Zoom

const sharpnessBackBtn = document.getElementById('sharpness-back-btn');
const shadowBackBtn = document.getElementById('shadow-back-btn');
const premultBackBtn = document.getElementById('premult-back-btn');
const premultSkipBtn = document.getElementById('premult-skip-btn');
const premultApplyBtn = document.getElementById('premult-apply-btn');

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

// --- Элементы окна "Удаление со смещением" ---
const deleteShiftOverlay = document.getElementById('delete-shift-confirm-overlay');
const delShiftCancelBtn  = document.getElementById('del-shift-cancel');
const delShiftConfirmBtn = document.getElementById('del-shift-confirm');

// --- Элементы окна "Некорректный размер" ---
const sizeWarningOverlay = document.getElementById('size-warning-overlay');
const swCancelBtn        = document.getElementById('sw-cancel');
const swResizeBtn        = document.getElementById('sw-resize');

// --- Элементы окна "Ручная вставка" (мобильный) ---
const manualPasteOverlay = document.getElementById('manual-paste-overlay');
const manualPasteInput   = document.getElementById('manual-paste-input');
const mpCancelBtn        = document.getElementById('mp-cancel');
const mpConfirmBtn       = document.getElementById('mp-confirm');

// --- Элементы авто-обработки загрузки и удаления фона (RMBG-2.0) ---
let globalIsAutoProcessEnabled = true;
let pendingUploadQueue = [];
let currentQueueIndex = 0;
let processedBlob = null;
let pipelineStepBlobs = { rmbgInput: null, cropInput: null, sharpnessInput: null, shadowInput: null, premultiplyInput: null };
let currentSessionCropState = null; // Сохраняем состояние кропа в рамках текущей сессии обработки картинки
let globalScale1to1 = false; // Глобальное состояние масштаба 1к1 для всего пайплайна
let rmbgElapsedInterval = null;
let rmbgWiggleInterval = null;
let rmbgAutoPlay = true;
let rmbgLastMouseX = null;
let rmbgLastMouseY = null;

// --- Элементы автоматической и интерактивной обрезки (Crop) ---
let cropImageFile = null;
let cropImageBlob = null;
let cropImageObj = null;
let cropCoords = { x: 0, y: 0, w: 0, h: 0 };
let cropDisplayScale = 1;
let cropIsDragging = false;
let cropDragStart = { x: 0, y: 0 };
let cropStartCoords = { x: 0, y: 0, w: 0, h: 0 };
let cropActiveHandle = null;
let cropZoom = 1.0;
let cropBaseWidth = 0;
let cropBaseHeight = 0;

// --- Элементы контурной резкости (Sharpness) ---
const sharpnessOverlay = document.getElementById('sharpness-overlay');
const sharpnessCanvas = document.getElementById('sharpness-canvas');
const sharpnessOrigCanvas = document.getElementById('sharpness-orig-canvas');
const sharpnessCancelBtn = document.getElementById('sharpness-cancel-btn');
const sharpnessSkipBtn = document.getElementById('sharpness-skip-btn');
const sharpnessApplyBtn = document.getElementById('sharpness-apply-btn');
const sharpnessCompareBtn = document.getElementById('sharpness-compare-btn');
const paramSharpAmount = document.getElementById('param-sharp-amount');
const paramSharpRadius = document.getElementById('param-sharp-radius');
const paramSharpThreshold = document.getElementById('param-sharp-threshold');
const valSharpAmount = document.getElementById('val-sharp-amount');
const valSharpRadius = document.getElementById('val-sharp-radius');
const valSharpThreshold = document.getElementById('val-sharp-threshold');

let sharpnessImageObj = null;
let sharpnessFileObj = null;
let sharpnessBaseBlob = null;
let sharpnessOriginalPixels = null;
let sharpnessIsProcessing = false;
let sharpnessTimeout = null;

// --- Элементы падающей тени (Shadow) ---
const shadowOverlay = document.getElementById('shadow-overlay');
const shadowCanvas = document.getElementById('shadow-canvas');
const shadowOrigCanvas = document.getElementById('shadow-orig-canvas');
const shadowCancelBtn = document.getElementById('shadow-cancel-btn');
const shadowSkipBtn = document.getElementById('shadow-skip-btn');
const shadowApplyBtn = document.getElementById('shadow-apply-btn');
const shadowCompareBtn = document.getElementById('shadow-compare-btn');

// --- Элементы совместимости краев (Импорт) ---
const premultiplyOverlay = document.getElementById('premultiply-overlay');
const premultCanvasA = document.getElementById('premult-canvas-a');
const premultCanvasB = document.getElementById('premult-canvas-b');
const premultCancelBtn = document.getElementById('premult-cancel-btn');
const premultSelectABtn = document.getElementById('premult-select-a-btn');
const premultSelectBBtn = document.getElementById('premult-select-b-btn');
const premultCompareABtn = document.getElementById('premult-compare-a-btn');
const premultCompareBBtn = document.getElementById('premult-compare-b-btn');

let premultImageObj = null;
let premultFileObj = null;
let premultBaseBlob = null;
let premultRawPixels = null; 
let premultProcessedPixels = null;

const paramShadowRadius = document.getElementById('param-shadow-radius');
const numShadowRadius = document.getElementById('num-shadow-radius');
const paramShadowDist = document.getElementById('param-shadow-dist');
const numShadowDist = document.getElementById('num-shadow-dist');
const paramShadowOpacity = document.getElementById('param-shadow-opacity');
const numShadowOpacity = document.getElementById('num-shadow-opacity');
const shadowAngleDial = document.getElementById('shadow-angle-dial');
const shadowAngleLine = document.getElementById('shadow-angle-line');
const numShadowAngle = document.getElementById('num-shadow-angle');
const shadowColorPreview = document.getElementById('shadow-color-preview');
const shadowColorPicker = document.getElementById('shadow-color-picker');
const shadowRgbR = document.getElementById('shadow-rgb-r');
const shadowRgbG = document.getElementById('shadow-rgb-g');
const shadowRgbB = document.getElementById('shadow-rgb-b');
const paramShadowOnly = document.getElementById('param-shadow-only');
const paramShadow1to1 = document.getElementById('param-shadow-1to1');
const paramShadowShowBorder = document.getElementById('param-shadow-show-border');
const paramSharp1to1 = document.getElementById('param-sharp-1to1');
const paramPremult1to1 = document.getElementById('param-premult-1to1');

let shadowImageObj = null;
        let shadowFileObj = null;
        let shadowBaseBlob = null;
let shadowIsProcessing = false;
let shadowTimeout = null;

let shadowState = {
    radius: 5.0,
    distance: 5.0,
    angle: -45,
    opacity: 0.70,   
    r: 0,
    g: 0,
    b: 0,
    shadowOnly: false
};

let sharpnessState = {
    amount: 60,
    radius: 0.9,
    threshold: 0
};

const confirmOverlay = document.getElementById('confirm-processing-overlay');
const confirmSkipBtn = document.getElementById('te-confirm-skip');
const confirmApplyBtn = document.getElementById('te-confirm-apply');
const askEverytimeToggle = document.getElementById('te-ask-everytime-toggle');
const autoProcessImagesToggle = document.getElementById('auto-process-images-toggle');

const pipelineCancelOverlay = document.getElementById('pipeline-cancel-confirm-overlay');
const pcCancelBtn = document.getElementById('pc-cancel');
const pcConfirmBtn = document.getElementById('pc-confirm');
let onPipelineCancelConfirmed = null;

function requestPipelineCancel(onConfirm) {
    onPipelineCancelConfirmed = onConfirm;
    if (pipelineCancelOverlay) {
        pipelineCancelOverlay.classList.add('visible');
    }
}

// Настройка слушателей для предупреждения об отмене пайплайна
if (pcCancelBtn) {
    pcCancelBtn.addEventListener('click', () => {
        if (pipelineCancelOverlay) {
            pipelineCancelOverlay.classList.remove('visible');
        }
        onPipelineCancelConfirmed = null;
    });
}

if (pcConfirmBtn) {
    pcConfirmBtn.addEventListener('click', () => {
        if (pipelineCancelOverlay) {
            pipelineCancelOverlay.classList.remove('visible');
        }
        if (onPipelineCancelConfirmed) {
            onPipelineCancelConfirmed();
        }
        onPipelineCancelConfirmed = null;
    });
}

if (pipelineCancelOverlay) {
    pipelineCancelOverlay.addEventListener('click', (e) => {
        if (e.target === pipelineCancelOverlay) {
            pipelineCancelOverlay.classList.remove('visible');
            onPipelineCancelConfirmed = null;
        }
    });
}

const rmbgOverlay = document.getElementById('rmbg-overlay');
const rmbgLoadingView = document.getElementById('rmbg-loading-view');
const rmbgSliderView = document.getElementById('rmbg-slider-view');
const rmbgErrorView = document.getElementById('rmbg-error-view');
const rmbgLoadingStage = document.getElementById('rmbg-loading-stage');
const rmbgStatElapsed = document.getElementById('rmbg-stat-elapsed');
const rmbgStatEta = document.getElementById('rmbg-stat-eta');
const rmbgProgressFill = document.getElementById('rmbg-progress-fill');
const rmbgServerLog = document.getElementById('rmbg-server-log');
const rmbgImgAfter = document.getElementById('rmbg-img-after');
const rmbgImgBefore = document.getElementById('rmbg-img-before');
const rmbgSliderLine = document.getElementById('rmbg-slider-line');
const rmbgRangeInput = document.getElementById('rmbg-range-input');
const rmbgErrorText = document.getElementById('rmbg-error-text');

const rmbgCancelBtn = document.getElementById('rmbg-cancel-btn');
const rmbgDownloadBtn = document.getElementById('rmbg-download-btn');
const rmbgSkipBtn = document.getElementById('rmbg-skip-btn');
const rmbgContinueBtn = document.getElementById('rmbg-continue-btn');

// --- Элементы окна Zoom (Сравнение UGS) ---
const zoomOverlay    = document.getElementById('zoom-overlay');
const zoomCanvas     = document.getElementById('zoom-canvas');
const zoomTitle      = document.getElementById('zoom-title');
const zoomCompareBtn = document.getElementById('zoom-compare-btn');
const zoomCloseBtn   = document.getElementById('zoom-close-btn');
const zoomBlendToggle = document.getElementById('zoom-blend-toggle');

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
window.EDITOR_GROUPS = EDITOR_GROUPS;

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

// --- Обработчики для окна ручной вставки ---
if (mpCancelBtn) {
    mpCancelBtn.addEventListener('click', () => {
        manualPasteOverlay.classList.remove('visible');
    });
}
if (manualPasteOverlay) {
    manualPasteOverlay.addEventListener('click', (e) => {
        if (e.target === manualPasteOverlay) manualPasteOverlay.classList.remove('visible');
    });
}
if (mpConfirmBtn) {
    mpConfirmBtn.addEventListener('click', () => {
        const text = manualPasteInput.value.trim();
        if (text) {
            manualPasteOverlay.classList.remove('visible');
            processPasteData(text);
        }
    });
}

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

// --- Logic for DELETE with Shift Modal ---
function performDeleteWithShift() {
    if (!savedData1 || selectedListItemIndex === -1) return;
    
    const gidToDelete = parseInt(edId.value);
    if (isNaN(gidToDelete)) return;
    
    let keyToDelete = null;
    for (const [key, item] of Object.entries(savedData1)) {
        if (parseInt(item.GlobalIndex) === gidToDelete) {
            keyToDelete = key;
            break;
        }
    }
    
    if (keyToDelete) {
        // 1. Удаляем предмет
        delete savedData1[keyToDelete];
        
        // 2. Смещаем все последующие ID (GlobalIndex) на -1
        for (const [key, item] of Object.entries(savedData1)) {
            const currentGid = parseInt(item.GlobalIndex);
            if (!isNaN(currentGid) && currentGid > gidToDelete) {
                item.GlobalIndex = String(currentGid - 1);
            }
        }
        
        // 3. Сбрасываем флаг изменений
        initialFormState = ''; 
        
        // 4. Обновляем список в редакторе
        populateItemList();
        
        // 5. Обновляем главное приложение
        if (window.refreshApp) window.refreshApp();
        
        // 6. Выбираем следующий логический элемент, который сместился на освободившееся ID место
        let newIndex = currentItemsList.findIndex(x => parseInt(x.GlobalIndex) === gidToDelete);
        
        // Если такого нет (удалили последний элемент), выбираем предыдущий по порядку
        if (newIndex === -1 && gidToDelete > 1) {
            newIndex = currentItemsList.findIndex(x => parseInt(x.GlobalIndex) === (gidToDelete - 1));
        }
        
        if (newIndex !== -1) {
            selectItemByIndex(newIndex);
            centerOnSelectedItem();
        } else if (currentItemsList.length > 0) {
            selectItemByIndex(0);
            centerOnSelectedItem();
        } else {
            clearEditorForm();
        }

        if (typeof showNotification === 'function') {
            showNotification('Предмет удален, ID последующих предметов смещены!', 'success');
        }
    }
}

// --- ZOOM MODAL LOGIC (Сравнение сжатия UGS) ---
let currentZoomOriginalImg = null;
let loadedZoomBgImg = null;

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

        const zoomBlendToggle = document.getElementById('zoom-blend-toggle');
        const useCustomBlend = zoomBlendToggle ? zoomBlendToggle.checked : false;

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
            zoomTitle.textContent = useCustomBlend 
                ? "Сжатая для игры версия (17 цветов) — фактическое отображение в игре" 
                : "Сжатая для игры версия (17 цветов)";
            zoomTitle.style.color = "#ff6b6b"; // Красный
        } else {
            zoomTitle.textContent = useCustomBlend 
                ? "Оригинальная картинка — фактическое отображение в игре" 
                : "Оригинальная картинка";
            zoomTitle.style.color = "#69f0ae"; // Зеленый
        }

        // 3. Рисуем на финальный увеличенный канвас (212x212)
        const ctx = zoomCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false; // Отключаем сглаживание для пиксельности
        ctx.clearRect(0, 0, 212, 212);
        if (useCustomBlend && loadedZoomBgImg) {
        // 1) Масштабируем 53x53 (tempCanvas) до 212x212 без сглаживания
        const scaledIconCanvas = document.createElement('canvas');
        scaledIconCanvas.width = 212;
        scaledIconCanvas.height = 212;
        const sCtx = scaledIconCanvas.getContext('2d');
        sCtx.imageSmoothingEnabled = false;
        sCtx.drawImage(tempCanvas, 0, 0, 53, 53, 0, 0, 212, 212);
        const iconDataObj = sCtx.getImageData(0, 0, 212, 212);
        const iconData = iconDataObj.data;

        // 2) Замостим фон размером 212x212 со стандартным (100%) масштабом узора
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = 212;
        bgCanvas.height = 212;
        const bgCtx = bgCanvas.getContext('2d');
        const pattern = bgCtx.createPattern(loadedZoomBgImg, 'repeat');
        bgCtx.fillStyle = pattern;
        bgCtx.fillRect(0, 0, 212, 212);
        const bgData = bgCtx.getImageData(0, 0, 212, 212).data;

        // 3) Попиксельно смешиваем по твоей формуле на полном разрешении (212x212)
        for (let i = 0; i < iconData.length; i += 4) {
            const a_src = iconData[i+3] / 255;
            const oneMinusAlpha = 1 - a_src;

            // Формула: Result = PixelColor + (BackgroundColor * (1 - Alpha))
            const r = iconData[i]   + bgData[i]   * oneMinusAlpha;
            const g = iconData[i+1] + bgData[i+1] * oneMinusAlpha;
            const b = iconData[i+2] + bgData[i+2] * oneMinusAlpha;

            iconData[i]   = Math.min(255, Math.max(0, Math.round(r)));
            iconData[i+1] = Math.min(255, Math.max(0, Math.round(g)));
            iconData[i+2] = Math.min(255, Math.max(0, Math.round(b)));
            iconData[i+3] = 255; // Запечатываем непрозрачностью
        }

        sCtx.putImageData(iconDataObj, 0, 0);
        ctx.drawImage(scaledIconCanvas, 0, 0);
    } else {
        // Стандартный рендер (прозрачный спрайт, фон подгружается из CSS)
        ctx.drawImage(tempCanvas, 0, 0, 53, 53, 0, 0, 212, 212);
    }
}

edZoomBtn.addEventListener('click', () => {
    // Загружаем картинку напрямую из src элемента
    if (!edIcon.src) return;
    
    let targetSrc = edIcon.src;
    // Если это наша кастомная иконка, пытаемся достать несжатый оригинал
    if (isCurrentIconCustom && window.originalCustomIcons && window.originalCustomIcons[targetSrc]) {
        targetSrc = window.originalCustomIcons[targetSrc];
    }
    
    // Динамически получаем текущий фоновый рисунок из стилей обертки
    const wrapper = document.querySelector('.zoom-image-wrapper');
    const bgStyle = window.getComputedStyle(wrapper).backgroundImage;
    const match = bgStyle.match(/url\(['"]?(.*?)['"]?\)/);
    const bgUrl = match ? match[1] : '2background.png';

    const img = new Image();
    const bgImg = new Image();
    img.crossOrigin = 'Anonymous';
    bgImg.crossOrigin = 'Anonymous';

    let loadedCount = 0;
    const checkLoaded = () => {
        loadedCount++;
        if (loadedCount === 2) {
            currentZoomOriginalImg = img;
            loadedZoomBgImg = bgImg;
            
            if (isCurrentIconCustom) {
                zoomCompareBtn.disabled = false;
                zoomCompareBtn.classList.add('btn-purple');
                zoomCompareBtn.classList.remove('btn-grey');
                zoomCompareBtn.textContent = 'Удерживайте для сравнения с оригинал';
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
        }
    };

    img.onload = checkLoaded;
    img.onerror = () => console.error("Failed to load icon");
    bgImg.onload = checkLoaded;
    bgImg.onerror = checkLoaded; // В случае ошибки загрузки фона продолжаем работу

    img.src = targetSrc;
    bgImg.src = bgUrl;
});

const closeZoomModal = () => {
    zoomOverlay.classList.remove('visible');
    currentZoomOriginalImg = null;
};
zoomCloseBtn.addEventListener('click', closeZoomModal);
zoomOverlay.addEventListener('click', (e) => {
    if (e.target === zoomOverlay) closeZoomModal();
});

if (document.getElementById('zoom-blend-toggle')) {
    document.getElementById('zoom-blend-toggle').addEventListener('change', () => {
        renderZoomCanvas(zoomCompareBtn.matches(':active'));
    });
}

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
async function handleIconUpload(e) {
    if (!e.target.files || e.target.files.length === 0) return;
    pendingUploadQueue = Array.from(e.target.files);
    currentQueueIndex = 0;
    e.target.value = '';
    
    if (!window.originalCustomIcons) window.originalCustomIcons = {};
    
    processNextInQueue();
}

async function ensurePngFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const pngName = baseName + ".png";

    if (ext === 'tga') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const tga = new TgaLoader();
                    tga.load(new Uint8Array(ev.target.result));
                    const dataUrl = tga.getDataURL('image/png');
                    
                    fetch(dataUrl)
                        .then(res => res.blob())
                        .then(blob => {
                            const pngFile = new File([blob], pngName, { type: 'image/png' });
                            resolve(pngFile);
                        })
                        .catch(reject);
                } catch (err) {
                    reject(new Error('Не удалось прочитать TGA файл: ' + err.message));
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    } else if (['bmp', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const pngFile = new File([blob], pngName, { type: 'image/png' });
                            resolve(pngFile);
                        } else {
                            reject(new Error('Ошибка конвертации изображения в PNG'));
                        }
                    }, 'image/png');
                };
                img.onerror = reject;
                img.src = ev.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    } else {
        return file;
    }
}

async function processFileWithDirectPremultiply(file) {
    try {
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsDataURL(file);
        });

        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.src = dataUrl;
        });

        let finalUrl = dataUrl;
        if (img.width > 53 || img.height > 53) {
            const decision = await showSizeWarning();
            if (decision === 'cancel') {
                return false;
            } else if (decision === 'resize') {
                finalUrl = resizeImageTo53(img);
            }
        } else if (img.width < 53 || img.height < 53) {
            finalUrl = padImageTo53(img);
        }

        const res = await fetch(finalUrl);
        const blob = await res.blob();

        openPremultiplyModal(file, blob, null);
        return true;
    } catch (err) {
        console.error("Ошибка при обработке файла без автообработки:", file.name, err);
        return false;
    }
}

async function processNextInQueue() {
    if (currentQueueIndex >= pendingUploadQueue.length) {
        renderCustomIcons();
        if (pendingUploadQueue.length === 1 && customIcons.length > 0) {
            selectIcon(customIcons[0].url, true);
        }
        pendingUploadQueue = [];
        currentQueueIndex = 0;
        return;
    }
    
    processedBlob = null;
    pipelineStepBlobs = { rmbgInput: null, cropInput: null, sharpnessInput: null, shadowInput: null, premultiplyInput: null };
    currentSessionCropState = null; // Сбрасываем кроп для новой сессии картинки
    
    let file = pendingUploadQueue[currentQueueIndex];
    try {
        file = await ensurePngFile(file);
        pendingUploadQueue[currentQueueIndex] = file;
    } catch (err) {
        console.error("Ошибка предварительной конвертации файла в PNG:", err);
        if (typeof showNotification === 'function') {
            showNotification(`Ошибка конвертации ${file.name} в PNG`, 'error');
        }
        currentQueueIndex++;
        processNextInQueue();
        return;
    }

    if (globalIsAutoProcessEnabled) {
        showConfirmProcessingModal(file);
    } else {
        const success = await processFileWithDirectPremultiply(file);
        if (!success) {
            currentQueueIndex++;
            processNextInQueue();
        }
    }
}

function showConfirmProcessingModal(file) {
    if (confirmOverlay) {
        confirmOverlay.classList.add('visible');
    }
}

function startRMBGProcessing(file) {
    if (!rmbgOverlay) return;
    rmbgOverlay.classList.add('visible');
    
    pipelineStepBlobs.rmbgInput = file; // Сохраняем оригинал для истории возвратов
    
    const rmbgStartView = document.getElementById('rmbg-start-view');
    const rmbgStartImg = document.getElementById('rmbg-start-preview-img');
    
    if (processedBlob) {
        if (rmbgStartView) rmbgStartView.style.display = 'none';
        rmbgLoadingView.style.display = 'none';
        rmbgSliderView.style.display = 'flex';
        if (rmbgDownloadBtn) rmbgDownloadBtn.style.display = 'inline-block';
        rmbgContinueBtn.disabled = false;
        rmbgContinueBtn.style.display = 'inline-block';
        updateSliderPosition(Number(rmbgRangeInput.value || 50));
        return;
    }
    
    if (rmbgStartView) rmbgStartView.style.display = 'flex';
    rmbgLoadingView.style.display = 'none';
    rmbgSliderView.style.display = 'none';
    rmbgErrorView.style.display = 'none';
    if (rmbgDownloadBtn) rmbgDownloadBtn.style.display = 'none';

    rmbgContinueBtn.disabled = true;
    rmbgContinueBtn.style.display = 'none';

    const objectUrl = URL.createObjectURL(file);
    if (rmbgStartImg) {
        rmbgStartImg.src = objectUrl;
        rmbgStartImg.onload = () => {
            const contentArea = document.querySelector('.rmbg-content-area');
            const wrapper = document.querySelector('.rmbg-start-image-wrapper');
            if (contentArea && wrapper) {
                const areaRect = contentArea.getBoundingClientRect();
                const maxWidth = areaRect.width - 40;
                const maxHeight = areaRect.height - 40;
                const ratio = rmbgStartImg.naturalWidth / rmbgStartImg.naturalHeight;
                
                let targetWidth = maxWidth;
                let targetHeight = maxWidth / ratio;
                if (targetHeight > maxHeight) {
                    targetHeight = maxHeight;
                    targetWidth = maxHeight * ratio;
                }
                
                wrapper.style.width = `${targetWidth}px`;
                wrapper.style.height = `${targetHeight}px`;
            }
        };
    }

    const runBtn = document.getElementById('rmbg-run-btn');
    if (runBtn) {
        runBtn.onclick = () => {
            runRMBGProcessing(file);
        };
    }
}

async function runRMBGProcessing(file) {
    const rmbgStartView = document.getElementById('rmbg-start-view');
    if (rmbgStartView) rmbgStartView.style.display = 'none';
    
    rmbgLoadingView.style.display = 'flex';
    rmbgSliderView.style.display = 'none';
    rmbgErrorView.style.display = 'none';
    if (rmbgDownloadBtn) rmbgDownloadBtn.style.display = 'none';

    rmbgContinueBtn.disabled = true;
    rmbgContinueBtn.style.display = 'none';

    let elapsed = 0;
    let serverEta = 0;
    let progress = 0;
    let serverStage = 'uploading';
    const startTime = Date.now();
    
    rmbgLoadingStage.textContent = "Ожидайте...";
    rmbgStatElapsed.textContent = "⏱ Прошло: 0.0s";
    rmbgStatEta.textContent = "⏳ Среднее время ожидания 60 сек";
    rmbgProgressFill.style.width = "0%";
    rmbgServerLog.textContent = "Обработка...";
    
    if (rmbgElapsedInterval) clearInterval(rmbgElapsedInterval);
    rmbgElapsedInterval = setInterval(() => {
        elapsed = (Date.now() - startTime) / 1000;
        rmbgStatElapsed.textContent = `⏱ Прошло: ${elapsed.toFixed(1)}s`;
        
        if (serverEta > 0) {
            const estimatedTotal = elapsed + serverEta;
            progress = Math.min((elapsed / estimatedTotal) * 100, 98);
            rmbgProgressFill.style.width = `${progress}%`;
        } else if (serverStage === 'generating') {
            progress = Math.min(progress + 0.3, 95);
            rmbgProgressFill.style.width = `${progress}%`;
        }
    }, 100);

    try {
        const { Client } = await import("https://cdn.jsdelivr.net/npm/@gradio/client/dist/index.min.js");
        const app = await Client.connect("LiXiang12/RMBG2.0-gradio");
        const job = app.submit("/predict", [file, ""]);

        for await (const msg of job) {
            if (msg.type === "status") {
                serverStage = msg.stage;
                let queueText = "";
                if (msg.position !== undefined) {
                    queueText = ` (Очередь: ${msg.position})`;
                }
                rmbgLoadingStage.textContent = serverStage === 'generating' ? '✨ Удаление фона...' : '⏳ Подготовка...';
                
                if (msg.eta !== undefined) {
                    serverEta = msg.eta;
                    rmbgStatEta.textContent = `⏳ Осталось: ~${serverEta.toFixed(1)}s${queueText}`;
                } else {
                    rmbgStatEta.textContent = `⏳ Статус: ${serverStage}${queueText}`;
                }
                
                rmbgServerLog.textContent = `Стадия: ${msg.stage}${queueText}`;
            } 
            else if (msg.type === "data") {
                const outputUrl = msg.data?.[1]?.url || msg.data?.[0]?.url || msg.data?.[1] || msg.data?.[0];
                if (!outputUrl) throw new Error("Неверный формат ответа от нейросети.");

                const res = await fetch(outputUrl);
                processedBlob = await res.blob();
                
                const processedUrl = URL.createObjectURL(processedBlob);
                const originalUrl = URL.createObjectURL(file);
                
                rmbgImgBefore.onload = () => {
                    const contentArea = document.querySelector('.rmbg-content-area');
                    const wrapper = document.querySelector('.rmbg-image-wrapper');
                    if (contentArea && wrapper) {
                        const areaRect = contentArea.getBoundingClientRect();
                        const maxWidth = areaRect.width - 40;
                        const maxHeight = areaRect.height - 40;
                        const ratio = rmbgImgBefore.naturalWidth / rmbgImgBefore.naturalHeight;
                        
                        let targetWidth = maxWidth;
                        let targetHeight = maxWidth / ratio;
                        if (targetHeight > maxHeight) {
                            targetHeight = maxHeight;
                            targetWidth = maxHeight * ratio;
                        }
                        
                        wrapper.style.width = `${targetWidth}px`;
                        wrapper.style.height = `${targetHeight}px`;
                    }
                };
                
                rmbgImgAfter.src = processedUrl;
                rmbgImgBefore.src = originalUrl;
                
                rmbgLoadingView.style.display = 'none';
                rmbgSliderView.style.display = 'flex';
                if (rmbgDownloadBtn) rmbgDownloadBtn.style.display = 'inline-block';

                rmbgContinueBtn.disabled = false;
                rmbgContinueBtn.style.display = 'inline-block';
                clearInterval(rmbgElapsedInterval);
                
                startSliderWiggle();
            }
        }
    } catch (err) {
        console.error("RMBG Error:", err);
        clearInterval(rmbgElapsedInterval);
        rmbgLoadingView.style.display = 'none';
        rmbgErrorView.style.display = 'flex';
        rmbgErrorText.textContent = err.message || "Неизвестная ошибка связи с сервером";
    }
}

function startSliderWiggle() {
    rmbgAutoPlay = true;
    let direction = 1;
    let pos = 50;
    rmbgRangeInput.value = 50;
    updateSliderPosition(50);
    rmbgLastMouseX = null;
    rmbgLastMouseY = null;
    
    if (rmbgWiggleInterval) clearInterval(rmbgWiggleInterval);
    rmbgWiggleInterval = setInterval(() => {
        if (!rmbgAutoPlay) {
            clearInterval(rmbgWiggleInterval);
            return;
        }
        pos += direction * 0.5;
        if (pos >= 90) direction = -1;
        if (pos <= 10) direction = 1;
        rmbgRangeInput.value = pos;
        updateSliderPosition(pos);
    }, 16);
}

function updateSliderPosition(pos) {
    rmbgSliderLine.style.left = `${pos}%`;
    
    const layerBefore = document.getElementById('rmbg-layer-before');
    if (layerBefore) {
        layerBefore.style.clipPath = `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)`;
    }
    
    const layerAfter = document.getElementById('rmbg-layer-after');
    if (layerAfter) {
        layerAfter.style.clipPath = `polygon(${pos}% 0, 100% 0, 100% 100%, ${pos}% 100%)`;
    }
}

function closeRMBGModal() {
    if (rmbgOverlay) rmbgOverlay.classList.remove('visible');
    if (rmbgElapsedInterval) clearInterval(rmbgElapsedInterval);
    if (rmbgWiggleInterval) clearInterval(rmbgWiggleInterval);
    if (rmbgDownloadBtn) rmbgDownloadBtn.style.display = 'none';
    processedBlob = null;
}

async function processFileAndAddToLibrary(file, customBlob = null) {
    try {
        let dataUrl;
        let finalName = file.name;
        if (customBlob) {
            dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target.result);
                reader.readAsDataURL(customBlob);
            });
            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            finalName = "rmbg_" + baseName + ".png";
        } else {
            const ext = file.name.split('.').pop().toLowerCase();
            if (ext === 'tga') {
                dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            const tga = new TgaLoader();
                            tga.load(new Uint8Array(ev.target.result));
                            resolve(tga.getDataURL('image/png'));
                        } catch (err) {
                            reject(new Error('Не удалось прочитать TGA файл: ' + err.message));
                        }
                    };
                    reader.readAsArrayBuffer(file);
                });
            } else {
                dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.readAsDataURL(file);
                });
            }
        }

        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.src = dataUrl;
        });

        let finalUrl = dataUrl;
        if (img.width > 53 || img.height > 53) {
            const decision = await showSizeWarning();
            if (decision === 'cancel') {
                return false;
            } else if (decision === 'resize') {
                finalUrl = resizeImageTo53(img);
            }
        } else if (img.width < 53 || img.height < 53) {
            finalUrl = padImageTo53(img);
        }

        const compImg = new Image();
        await new Promise((resolve) => {
            compImg.onload = resolve;
            compImg.src = finalUrl;
        });
        const compressedUrl = applyUGSCompression(compImg);
        
        window.originalCustomIcons[compressedUrl] = finalUrl;

        customIcons.unshift({
            name: finalName,
            url: compressedUrl
        });
        return compressedUrl;
    } catch (err) {
        console.error("Ошибка при обработке файла:", file.name, err);
        return false;
    }
}

function initEditorUI() {
    // Упреждающий предзагрузчик фона инвентаря для пиксель-пёрфект превью
    const preloadBg = new Image();
    preloadBg.onload = () => {
        window._cachedTrueInventoryBgImage = preloadBg;
        window._cachedTrueInventoryBgDimensions = { w: preloadBg.naturalWidth, h: preloadBg.naturalHeight };
    };
    preloadBg.src = 'trueinventorybackground.png';

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
                    // Разрешаем отрицательные значения для Жизни у зелий
                    const isPotionHits = (currentType === 'Potion' && stat.key === 'Жизнь (хиты)');

                    // Для остальных: меньше 0 -> очистить
                    if (val < 0 && !isPotionHits) {
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
    initCropDragResize();
    initCropButtons();
    initSharpnessButtons();
    initShadowButtons();
    initPremultiplyButtons();
    
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
        updateSearchClearBtn();
        populateItemList();
    });
    
edSearchClear.addEventListener('click', () => {
    edSearchInput.value = '';
    updateSearchClearBtn();
    populateItemList();
    edSearchInput.focus();
});

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "src") {
            updateItemPreview();
            if (window.globalGameRenderActive) {
                edIcon.removeAttribute('data-game-rendered');
                window.applyGameRenderToImage(edIcon);
            }
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
    
    // Синхронизация переключателей авто-обработки
    if (autoProcessImagesToggle) {
        autoProcessImagesToggle.checked = globalIsAutoProcessEnabled;
        autoProcessImagesToggle.addEventListener('change', (e) => {
            globalIsAutoProcessEnabled = e.target.checked;
            if (askEverytimeToggle) askEverytimeToggle.checked = globalIsAutoProcessEnabled;
        });
    }
    if (askEverytimeToggle) {
        askEverytimeToggle.checked = globalIsAutoProcessEnabled;
        askEverytimeToggle.addEventListener('change', (e) => {
            globalIsAutoProcessEnabled = e.target.checked;
            if (autoProcessImagesToggle) autoProcessImagesToggle.checked = globalIsAutoProcessEnabled;
        });
    }

    if (confirmSkipBtn) {
        confirmSkipBtn.addEventListener('click', async () => {
            if (confirmOverlay) confirmOverlay.classList.remove('visible');
            const file = pendingUploadQueue[currentQueueIndex];
            
            const success = await processFileWithDirectPremultiply(file);
            if (!success) {
                currentQueueIndex++;
                processNextInQueue();
            }
        });
    }

    if (confirmApplyBtn) {
        confirmApplyBtn.addEventListener('click', () => {
            if (confirmOverlay) confirmOverlay.classList.remove('visible');
            const file = pendingUploadQueue[currentQueueIndex];
            startRMBGProcessing(file);
        });
    }

    if (confirmOverlay) {
        confirmOverlay.addEventListener('click', (e) => {
            if (e.target === confirmOverlay) {
                requestPipelineCancel(() => {
                    confirmOverlay.classList.remove('visible');
                    pendingUploadQueue = [];
                    currentQueueIndex = 0;
                });
            }
        });
    }

    let confirmMouseDownStarted = false;
    if (confirmOverlay) {
        confirmOverlay.addEventListener('mousedown', (e) => {
            confirmMouseDownStarted = (e.target === confirmOverlay);
        });
        confirmOverlay.addEventListener('click', (e) => {
            if (e.target === confirmOverlay && confirmMouseDownStarted) {
                requestPipelineCancel(() => {
                    confirmOverlay.classList.remove('visible');
                    pendingUploadQueue = [];
                    currentQueueIndex = 0;
                });
            }
            confirmMouseDownStarted = false;
        });
    }

    let rmbgMouseDownStarted = false;
    if (rmbgOverlay) {
        rmbgOverlay.addEventListener('mousedown', (e) => {
            rmbgMouseDownStarted = (e.target === rmbgOverlay);
        });
        rmbgOverlay.addEventListener('click', (e) => {
            if (e.target === rmbgOverlay && rmbgMouseDownStarted) {
                requestPipelineCancel(() => {
                    closeRMBGModal();
                    pendingUploadQueue = [];
                    currentQueueIndex = 0;
                });
            }
            rmbgMouseDownStarted = false;
        });
    }

    if (rmbgCancelBtn) {
        rmbgCancelBtn.addEventListener('click', () => {
            closeRMBGModal();
            pendingUploadQueue = [];
            currentQueueIndex = 0;
        });
    }

    if (rmbgSkipBtn) {
        rmbgSkipBtn.addEventListener('click', async () => {
            closeRMBGModal();
            const file = pendingUploadQueue[currentQueueIndex];
            openCropModal(file);
        });
    }

    if (rmbgContinueBtn) {
        rmbgContinueBtn.addEventListener('click', async () => {
            const blobToProcess = processedBlob;
            closeRMBGModal();
            const file = pendingUploadQueue[currentQueueIndex];
            openCropModal(file, blobToProcess);
        });
    }

        if (rmbgRangeInput) {
            rmbgRangeInput.addEventListener('input', (e) => {
                rmbgAutoPlay = false;
                if (rmbgWiggleInterval) clearInterval(rmbgWiggleInterval);
                updateSliderPosition(Number(e.target.value));
            });
            rmbgRangeInput.addEventListener('mousemove', (e) => {
                if (rmbgLastMouseX === null && rmbgLastMouseY === null) {
                    rmbgLastMouseX = e.clientX;
                    rmbgLastMouseY = e.clientY;
                    return;
                }
                if (rmbgLastMouseX !== e.clientX || rmbgLastMouseY !== e.clientY) {
                    rmbgAutoPlay = false;
                    if (rmbgWiggleInterval) clearInterval(rmbgWiggleInterval);
                }
            });
            rmbgRangeInput.addEventListener('mousedown', () => {
                rmbgAutoPlay = false;
                if (rmbgWiggleInterval) clearInterval(rmbgWiggleInterval);
            });
        }

function closeRMBGModal() {
    if (rmbgOverlay) rmbgOverlay.classList.remove('visible');
    if (rmbgElapsedInterval) clearInterval(rmbgElapsedInterval);
    if (rmbgWiggleInterval) clearInterval(rmbgWiggleInterval);
    if (rmbgDownloadBtn) rmbgDownloadBtn.style.display = 'none';
    const rmbgStartView = document.getElementById('rmbg-start-view');
    if (rmbgStartView) rmbgStartView.style.display = 'none';
    processedBlob = null;
}

        const reencodeBlobToStandardPng = (blob) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const url = URL.createObjectURL(blob);
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((newBlob) => {
                        URL.revokeObjectURL(url);
                        if (newBlob) resolve(newBlob);
                        else reject(new Error("Canvas toBlob failed"));
                    }, 'image/png');
                };
                img.onerror = (err) => {
                    URL.revokeObjectURL(url);
                    reject(err);
                };
                img.src = url;
            });
        };

        if (rmbgDownloadBtn) {
            rmbgDownloadBtn.addEventListener('click', async () => {
                if (processedBlob) {
                    try {
                        const standardBlob = await reencodeBlobToStandardPng(processedBlob);
                        const url = URL.createObjectURL(standardBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        const file = pendingUploadQueue[currentQueueIndex];
                        const originalName = file ? file.name.split('.').slice(0, -1).join('.') : 'no-bg';
                        a.download = `${originalName}_nobg.png`;
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                        if (typeof showNotification === 'function') {
                            showNotification('Изображение без фона скачано!', 'success');
                        }
                    } catch (err) {
                        console.error("Failed to re-encode PNG:", err);
                        const url = URL.createObjectURL(processedBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        const file = pendingUploadQueue[currentQueueIndex];
                        const originalName = file ? file.name.split('.').slice(0, -1).join('.') : 'no-bg';
                        a.download = `${originalName}_nobg.png`;
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                    }
                }
            });
        }
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
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    const ratio = img.width / img.height;
    let drawWidth, drawHeight;
    
    if (img.width > img.height) {
        drawWidth = 53;
        drawHeight = 53 / ratio;
    } else {
        drawHeight = 53;
        drawWidth = 53 * ratio;
    }
    
    const dx = (53 - drawWidth) / 2;
    const dy = (53 - drawHeight) / 2;
    
    ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
    return canvas.toDataURL('image/png');
}

function padImageTo53(img) {
    const canvas = document.createElement('canvas');
    canvas.width = 53;
    canvas.height = 53;
    const ctx = canvas.getContext('2d');
    
    // Центрируем изображение на прозрачном холсте 53x53
    const dx = Math.floor((53 - img.width) / 2);
    const dy = Math.floor((53 - img.height) / 2);
    
    ctx.drawImage(img, dx, dy);
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
    inp._prevValue = inp.value || '';

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
        const isSpecialStepInput = (inp.id === 'ed_st_11_eq' || inp.id === 'ed_st_12_eq');
        if (isSpecialStepInput) {
            const prev = inp._prevValue;
            const curr = inp.value;

            if (prev === '-1' && curr === '0') {
                inp.value = '';
            } else if (prev === '0' && curr === '-1') {
                inp.value = '';
            } else if (prev === '') {
                if (curr !== '') {
                    const parsed = parseInt(curr);
                    if (!isNaN(parsed)) {
                        if (parsed >= 0) {
                            inp.value = '0';
                        } else {
                            inp.value = '-1';
                        }
                    }
                }
            }
        }
        inp._prevValue = inp.value;

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
        const isPotionHits = (currentType === 'Potion' && STAT_CONFIG[index].key === 'Жизнь (хиты)');

        // Eq
        const eqId = getStatInputId(index, 'eq');
        const eqEl = document.getElementById(eqId);
        if (eqEl && eqEl.value !== '') {
            if (isPotionHits) {
                let v = eqEl.value;
                if (!v.startsWith('-') && !v.startsWith('+')) v = '+' + v;
                parts.push(`текущее ${v}`);
            } else {
                parts.push('=' + eqEl.value);
            }
        }
        
        // Plus
        const plusId = getStatInputId(index, 'plus');
        const plusEl = document.getElementById(plusId);
        if (plusEl && plusEl.value !== '') {
            let v = plusEl.value;
            if (!v.startsWith('-') && !v.startsWith('+')) v = '+' + v;
            if (isPotionHits) {
                parts.push(`макс ${v}`);
            } else {
                parts.push(v);
            }
        }
        
        // Percent
        const pctId = getStatInputId(index, 'percent');
        const pctEl = document.getElementById(pctId);
        if (pctEl && pctEl.value !== '') {
            let v = pctEl.value;
            if (!v.startsWith('-') && !v.startsWith('+')) v = '+' + v;
            if (isPotionHits) {
                parts.push(`макс ${v}%`);
            } else {
                parts.push(v + '%');
            }
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
        const isPotionHits = (currentType === 'Potion' && key === 'Жизнь (хиты)');
        const valStr = isPotionHits ? displayStats[key].join(', ') : displayStats[key].join(' ');
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

        let hoverTimeout = null;
        let dimTimeout = null;

        div.addEventListener('mouseenter', () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            if (dimTimeout) clearTimeout(dimTimeout);
            
            const normName = opt.value ? opt.value.trim().toLowerCase().replace(/ё/g, 'е') : '';
            const desc = (window.bonusDescriptions || bonusDescriptions)[normName];
            
            if (desc) {
                // Таймер для запуска затухания цвета через 1 секунду
                dimTimeout = setTimeout(() => {
                    div.style.transition = 'background-color 1s ease';
                    div.style.backgroundColor = 'rgba(103, 77, 242, 0.35)';
                }, 1000);

                // Таймер для появления подсказки через 2 секунды
                hoverTimeout = setTimeout(() => {
                    // Возвращаем цвет обратно к исходному яркому
                    div.style.transition = 'background-color 0.15s ease';
                    div.style.backgroundColor = '';

                    const bonusDescTooltip = document.getElementById('bonus-desc-tooltip');
                    if (bonusDescTooltip) {
                        bonusDescTooltip.innerHTML = `<span class="bd-name">${opt.value}</span>${desc}`;
                        bonusDescTooltip.classList.add('visible');
                        
                        const rect = div.getBoundingClientRect();
                        let tooltipX = rect.right + 10;
                        let tooltipY = rect.top;
                        const tooltipWidth = 280;
                        
                        if (tooltipX + tooltipWidth > window.innerWidth) {
                            tooltipX = rect.left - tooltipWidth - 10;
                        }
                        
                        const viewportHeight = window.innerHeight;
                        const tempHeight = 120;
                        if (tooltipY + tempHeight > viewportHeight) {
                            tooltipY = Math.max(10, viewportHeight - tempHeight - 10);
                        }
                        if (tooltipY < 10) tooltipY = 10;
                        
                        bonusDescTooltip.style.left = `${tooltipX}px`;
                        bonusDescTooltip.style.top = `${tooltipY}px`;
                    }
                }, 2000);
            }
        });

        const resetStylesAndTimers = () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            if (dimTimeout) clearTimeout(dimTimeout);
            div.style.transition = '';
            div.style.backgroundColor = '';
            const bonusDescTooltip = document.getElementById('bonus-desc-tooltip');
            if (bonusDescTooltip) {
                bonusDescTooltip.classList.remove('visible');
            }
        };

        div.addEventListener('mouseleave', resetStylesAndTimers);

        div.addEventListener('click', (e) => {
            resetStylesAndTimers();
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
    if (edSelectionCursor) edSelectionCursor.style.display = 'block';
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
    const rawQuery = edSearchInput.value.trim();
    
    let isJsonQuery = false;
    if (rawQuery.startsWith('{') && rawQuery.endsWith('}')) {
        try {
            JSON.parse(rawQuery);
            isJsonQuery = true;
        } catch (e) {}
    }

    if (isJsonQuery) {
        currentItemsList = [];
        selectedListItemIndex = -1;
        if (edSelectionCursor) edSelectionCursor.style.display = 'none';
        edList.innerHTML = `
            <div class="list-spacer"></div>
            <div class="ed-paste-placeholder-btn" id="ed-paste-placeholder-btn">
                Нажмите сюда, чтобы вставить предмет
            </div>
            <div class="list-spacer"></div>
        `;
        const pBtn = document.getElementById('ed-paste-placeholder-btn');
            if (pBtn) {
                pBtn.addEventListener('click', () => {
                    processPasteData(rawQuery);
                });
            }
            return;
        }

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

        const currentGid = edId.value;
        selectedListItemIndex = currentGid ? items.findIndex(it => it.GlobalIndex === currentGid) : -1;

        if (edSelectionCursor) {
            edSelectionCursor.style.display = selectedListItemIndex === -1 ? 'none' : 'block';
        }

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

edList.querySelectorAll('.ed-list-icon').forEach(img => {
    window.applyGameRenderToImage(img);
});

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
        if (edDeleteShiftBtn) edDeleteShiftBtn.style.display = 'none';
        return;
    }
    
    edDynamicBtn.style.display = 'inline-block';
    if (edDeleteShiftBtn) edDeleteShiftBtn.style.display = 'inline-block';
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
            if (edDeleteShiftBtn) edDeleteShiftBtn.style.display = 'none'; // Скрываем т.к. это последний предмет
        } else {
            // Иначе -> Режим перехода к последнему
            edDynamicBtn.textContent = 'К последнему ID';
            edDynamicBtn.classList.remove('btn-danger');
            edDynamicBtn.classList.add('btn-neutral');
            edDynamicBtn.dataset.action = 'last';
            if (edDeleteShiftBtn) edDeleteShiftBtn.style.display = 'inline-block'; // Показываем для остальных
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
            
            // Ищем в ТЕКУЩЕМ ОТОБРАЖАЕМОМ СПИСКЕ
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

// Кнопки удаления со смещением
if (edDeleteShiftBtn) {
    edDeleteShiftBtn.addEventListener('click', () => {
        if (deleteShiftOverlay) deleteShiftOverlay.classList.add('visible');
    });
}

if (delShiftCancelBtn) {
    delShiftCancelBtn.addEventListener('click', () => {
        if (deleteShiftOverlay) deleteShiftOverlay.classList.remove('visible');
    });
}

if (deleteShiftOverlay) {
    deleteShiftOverlay.addEventListener('click', (e) => {
        if (e.target === deleteShiftOverlay) {
            deleteShiftOverlay.classList.remove('visible');
        }
    });
}

if (delShiftConfirmBtn) {
    delShiftConfirmBtn.addEventListener('click', () => {
        if (deleteShiftOverlay) deleteShiftOverlay.classList.remove('visible');
        performDeleteWithShift();
    });
}

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

function processPasteData(text) {
    attemptAction(() => {
        try {
            let clipboardObj;
            try {
                clipboardObj = JSON.parse(text);
            } catch (e) {
                if (typeof showNotification === 'function') {
                    showNotification('Невалидный JSON в буфере обмена или текстовом поле.', 'error');
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
        if (edSearchInput) {
            edSearchInput.value = '';
            updateSearchClearBtn();
        }
        
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
}

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

    text = (text || '').trim();

    // 2. Запасной вариант: если буфер недоступен или пуст, берем из поля поиска
    if (!text && edSearchInput) {
        text = edSearchInput.value.trim();
    }

    // 3. Если ничего не нашли
    if (!text) {
        // Открываем модалку для ручной вставки ИСКЛЮЧИТЕЛЬНО на мобильных (ширина <= 800px)
        if (window.innerWidth <= 800) {
            if (manualPasteOverlay) {
                manualPasteInput.value = '';
                manualPasteOverlay.classList.add('visible');
            }
            return;
        }

        if (typeof showNotification === 'function') {
            showNotification('Дайте разрешение сайту на чтение буфера обмена либо вставьте данные предмета в поле поиска.', 'error');
        } else {
            alert('Дайте разрешение сайту на чтение буфера обмена либо вставьте данные предмета в поле поиска.');
        }
        return;
    }

    processPasteData(text);
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
    
    // Синхронизируем предыдущие значения для плавных переходов через прочерк
    document.querySelectorAll('.stat-input').forEach(inp => {
        inp._prevValue = inp.value;
    });

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
    
    // Синхронизируем предыдущие значения для плавных переходов через прочерк
    document.querySelectorAll('.stat-input').forEach(inp => {
        inp._prevValue = '';
    });

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
                 selectedListItemIndex = minItemIndex;
                 fillEditorForm(currentItemsList[minItemIndex]);
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
                     // Сначала очищаем поиск и синхронизируем список под текущий мод
                     if (edSearchInput) edSearchInput.value = '';
                     if (typeof updateSearchClearBtn === 'function') updateSearchClearBtn();
                     populateItemList();

                     const itemIndex = currentItemsList.findIndex(x => x.GlobalIndex === gid);
                     if (itemIndex !== -1) {
                         selectedListItemIndex = itemIndex;
                     }
                     fillEditorForm(dataItem);
                     
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

// --- Логика автоматической и интерактивной обрезки (Crop) ---

function applyZoom() {
    const cropImage = document.getElementById('crop-image');
    if (!cropImage || !cropBaseWidth) return;
    
    const w = cropBaseWidth * cropZoom;
    const h = cropBaseHeight * cropZoom;
    
    cropImage.style.width = `${w}px`;
    cropImage.style.height = `${h}px`;
    cropImage.style.maxWidth = 'none';
    cropImage.style.maxHeight = 'none';
    
    const zoomLabel = document.getElementById('crop-zoom-level');
    if (zoomLabel) {
        zoomLabel.textContent = `${Math.round(cropZoom * 100)}%`;
    }
    
    if (currentSessionCropState) {
        currentSessionCropState.zoom = cropZoom;
    }
    
    updateCropUI();
}

function openCropModal(file, blob = null, onReady = null) {
    cropImageFile = file;
    cropImageBlob = blob || file;
    
    pipelineStepBlobs.cropInput = cropImageBlob; // Сохраняем входные данные для истории
    
    const cropOverlay = document.getElementById('crop-overlay');
    const cropImage = document.getElementById('crop-image');
    
    const objectUrl = URL.createObjectURL(cropImageBlob);
    cropImage.src = objectUrl;
    
    cropOverlay.classList.add('visible');
    if (onReady) onReady();
    
    const img = new Image();
    img.onload = () => {
        cropImageObj = img;
        
        const contentArea = document.querySelector('#crop-overlay .rmbg-content-area');
        const maxWidth = contentArea.clientWidth - 40;
        const maxHeight = contentArea.clientHeight - 40;
        const ratio = img.naturalWidth / img.naturalHeight;
        
        // Автоприближение: всегда масштабируем картинку до краев области просмотра
        if (maxWidth / ratio <= maxHeight) {
            cropBaseWidth = maxWidth;
            cropBaseHeight = maxWidth / ratio;
        } else {
            cropBaseHeight = maxHeight;
            cropBaseWidth = maxHeight * ratio;
        }
        
        // Проверяем, есть ли уже сохраненное состояние обрезки для этой картинки
        if (currentSessionCropState) {
            cropCoords = { ...currentSessionCropState.coords };
            cropZoom = currentSessionCropState.zoom;
            applyZoom();
        } else {
            cropZoom = 1.0;
            applyZoom();
            
            // Автоопределение границ видимой области спрайта
            autoCropTransparency(img, (autoCoords) => {
                cropCoords = autoCoords;
                currentSessionCropState = {
                    coords: { ...cropCoords },
                    zoom: cropZoom
                };
                updateCropUI();
            });
        }
    };
    img.src = objectUrl;
}

function autoCropTransparency(img, callback) {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        
        let minX = width, minY = height, maxX = 0, maxY = 0;
        let hasVisible = false;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const alpha = data[(y * width + x) * 4 + 3];
                if (alpha > 5) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    hasVisible = true;
                }
            }
        }
        
        if (hasVisible) {
            const padding = 10;
            minX = Math.max(0, minX - padding);
            minY = Math.max(0, minY - padding);
            maxX = Math.min(width, maxX + padding);
            maxY = Math.min(height, maxY + padding);
            callback({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
        } else {
            callback({ x: 0, y: 0, w: width, h: height });
        }
    } catch (e) {
        callback({ x: 0, y: 0, w: width, h: height });
    }
}

function updateCropUI() {
    if (!cropImageObj) return;
    
    const cropImage = document.getElementById('crop-image');
    const rect = cropImage.getBoundingClientRect();
    
    const scale = rect.width / cropImageObj.naturalWidth;
    cropDisplayScale = scale;
    
    const cropBox = document.getElementById('crop-box');
    const maskTop = document.getElementById('crop-mask-top');
    const maskBottom = document.getElementById('crop-mask-bottom');
    const maskLeft = document.getElementById('crop-mask-left');
    const maskRight = document.getElementById('crop-mask-right');
    
    const boxX = cropCoords.x * scale;
    const boxY = cropCoords.y * scale;
    const boxW = cropCoords.w * scale;
    const boxH = cropCoords.h * scale;
    
    const imgW = rect.width;
    const imgH = rect.height;
    
    cropBox.style.left = `${boxX}px`;
    cropBox.style.top = `${boxY}px`;
    cropBox.style.width = `${boxW}px`;
    cropBox.style.height = `${boxH}px`;
    
    // Top mask
    maskTop.style.top = '0';
    maskTop.style.left = '0';
    maskTop.style.width = '100%';
    maskTop.style.height = `${boxY}px`;
    
    // Bottom mask
    maskBottom.style.top = `${boxY + boxH}px`;
    maskBottom.style.left = '0';
    maskBottom.style.width = '100%';
    maskBottom.style.height = `${imgH - (boxY + boxH)}px`;
    
    // Left mask
    maskLeft.style.top = `${boxY}px`;
    maskLeft.style.left = '0';
    maskLeft.style.width = `${boxX}px`;
    maskLeft.style.height = `${boxH}px`;
    
    // Right mask
    maskRight.style.top = `${boxY}px`;
    maskRight.style.left = `${boxX + boxW}px`;
    maskRight.style.width = `${imgW - (boxX + boxW)}px`;
    maskRight.style.height = `${boxH}px`;
}

function initCropDragResize() {
    const cropBox = document.getElementById('crop-box');
    
    const handlePointerDown = (e, handle) => {
        if (e.pointerType !== 'touch' && e.button !== 0) return; // Only LKM or Touch!
        e.preventDefault();
        e.stopPropagation();
        
        cropIsDragging = true;
        cropActiveHandle = handle;
        cropDragStart = { x: e.clientX, y: e.clientY };
        cropStartCoords = { ...cropCoords };
        
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };
    
    document.querySelectorAll('.crop-handle').forEach(el => {
        const handleType = el.getAttribute('data-handle');
        el.addEventListener('pointerdown', (e) => handlePointerDown(e, handleType));
    });
    
    cropBox.addEventListener('pointerdown', (e) => {
        if (e.target === cropBox) {
            handlePointerDown(e, 'drag');
        }
    });
}

function handlePointerMove(e) {
    if (!cropIsDragging || !cropImageObj) return;
    
    const dx = (e.clientX - cropDragStart.x) / cropDisplayScale;
    const dy = (e.clientY - cropDragStart.y) / cropDisplayScale;
    
    const maxW = cropImageObj.naturalWidth;
    const maxH = cropImageObj.naturalHeight;
    const minSize = 20;
    
    let { x, y, w, h } = cropStartCoords;
    
    if (cropActiveHandle === 'drag') {
        x = Math.max(0, Math.min(maxW - w, x + dx));
        y = Math.max(0, Math.min(maxH - h, y + dy));
    } else {
        if (cropActiveHandle.includes('e')) {
            w = Math.min(maxW - x, Math.max(minSize, w + dx));
        }
        if (cropActiveHandle.includes('w')) {
            const xNew = Math.max(0, Math.min(x + w - minSize, x + dx));
            w = w + (x - xNew);
            x = xNew;
        }
        if (cropActiveHandle.includes('s')) {
            h = Math.min(maxH - y, Math.max(minSize, h + dy));
        }
        if (cropActiveHandle.includes('n')) {
            const yNew = Math.max(0, Math.min(y + h - minSize, y + dy));
            h = h + (y - yNew);
            y = yNew;
        }
    }
    
    cropCoords = { x, y, w, h };
    if (currentSessionCropState) {
        currentSessionCropState.coords = { ...cropCoords };
    }
    updateCropUI();
}

function handlePointerUp() {
    cropIsDragging = false;
    cropActiveHandle = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
}

function initCropButtons() {
    const cropCancelBtn = document.getElementById('crop-cancel-btn');
    const cropApplyBtn = document.getElementById('crop-apply-btn');
    const cropOverlay = document.getElementById('crop-overlay');
    
    cropCancelBtn.addEventListener('click', () => {
        closeCropModal();
        pendingUploadQueue = [];
        currentQueueIndex = 0;
    });
    
    cropApplyBtn.addEventListener('click', () => {
        applyCropAndContinue();
    });
    
    let cropMouseDownStarted = false;
    cropOverlay.addEventListener('mousedown', (e) => {
        cropMouseDownStarted = (e.target === cropOverlay);
    });
    cropOverlay.addEventListener('click', (e) => {
        if (e.target === cropOverlay && cropMouseDownStarted) {
            requestPipelineCancel(() => {
                closeCropModal();
                pendingUploadQueue = [];
                currentQueueIndex = 0;
            });
        }
        cropMouseDownStarted = false;
    });

    // Блокируем контекстное меню для возможности перетаскивания камеры на ПКМ
    cropOverlay.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Zoom buttons
    const btnIn = document.getElementById('crop-zoom-in');
    const btnOut = document.getElementById('crop-zoom-out');
    const btnReset = document.getElementById('crop-zoom-reset');
    
    if (btnIn) {
        btnIn.addEventListener('click', (e) => {
            e.stopPropagation();
            cropZoom = Math.min(4.0, cropZoom + 0.25);
            applyZoom();
        });
    }
    if (btnOut) {
        btnOut.addEventListener('click', (e) => {
            e.stopPropagation();
            cropZoom = Math.max(0.5, cropZoom - 0.25);
            applyZoom();
        });
    }
    if (btnReset) {
        btnReset.addEventListener('click', (e) => {
            e.stopPropagation();
            cropZoom = 1.0;
            applyZoom();
        });
    }

    // Mouse wheel zoom
    const contentArea = document.querySelector('#crop-overlay .rmbg-content-area');
    if (contentArea) {
        contentArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                cropZoom = Math.min(4.0, cropZoom + 0.1);
            } else {
                cropZoom = Math.max(0.5, cropZoom - 0.1);
            }
            applyZoom();
        }, { passive: false });
    }

    // PKM panning (Right Mouse Button Drag)
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let panScrollStart = { left: 0, top: 0 };

    contentArea.addEventListener('mousedown', (e) => {
        if (e.button === 2) { // ПКМ
            e.preventDefault();
            e.stopPropagation();
            isPanning = true;
            panStart = { x: e.clientX, y: e.clientY };
            panScrollStart = { left: contentArea.scrollLeft, top: contentArea.scrollTop };
            contentArea.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isPanning) {
            e.preventDefault();
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            contentArea.scrollLeft = panScrollStart.left - dx;
            contentArea.scrollTop = panScrollStart.top - dy;
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 2 && isPanning) {
            isPanning = false;
            contentArea.style.cursor = '';
        }
    });
}

// --- Gaussian Blur and Sharpness Helpers ---

function createGaussianKernel(sigma) {
    const radius = Math.ceil(sigma * 3);
    const size = 2 * radius + 1;
    const kernel = new Float32Array(size);
    let sum = 0;
    for (let i = 0; i < size; i++) {
        const x = i - radius;
        kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
        sum += kernel[i];
    }
    for (let i = 0; i < size; i++) {
        kernel[i] /= sum;
    }
    return { kernel, radius };
}

function straightGaussianBlur(srcData, width, height, sigma) {
    const { kernel, radius } = createGaussianKernel(sigma);
    const length = srcData.length;
    const tempData = new Float32Array(length);
    const outData = new Float32Array(length);

    // Horizontal pass
    for (let y = 0; y < height; y++) {
        const yOffset = y * width * 4;
        for (let x = 0; x < width; x++) {
            let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
            for (let k = -radius; k <= radius; k++) {
                const nx = Math.min(width - 1, Math.max(0, x + k));
                const nIdx = yOffset + nx * 4;
                const w = kernel[k + radius];

                rSum += srcData[nIdx] * w;
                gSum += srcData[nIdx + 1] * w;
                bSum += srcData[nIdx + 2] * w;
                aSum += srcData[nIdx + 3] * w;
            }
            const destIdx = yOffset + x * 4;
            tempData[destIdx] = rSum;
            tempData[destIdx + 1] = gSum;
            tempData[destIdx + 2] = bSum;
            tempData[destIdx + 3] = aSum;
        }
    }

    // Vertical pass
    for (let y = 0; y < height; y++) {
        const yOffset = y * width * 4;
        for (let x = 0; x < width; x++) {
            let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
            for (let k = -radius; k <= radius; k++) {
                const ny = Math.min(height - 1, Math.max(0, y + k));
                const nIdx = (ny * width + x) * 4;
                const w = kernel[k + radius];

                rSum += tempData[nIdx] * w;
                gSum += tempData[nIdx + 1] * w;
                bSum += tempData[nIdx + 2] * w;
                aSum += tempData[nIdx + 3] * w;
            }
                const destIdx = yOffset + x * 4;
                outData[destIdx] = rSum;
                outData[destIdx + 1] = gSum;
                outData[destIdx + 2] = bSum;
                outData[destIdx + 3] = aSum;
            }
        }

        return outData;
    }

    function updateSharpnessPreviewScale() {
        const wrapper = document.getElementById('sharpness-preview-wrapper');
        if (!wrapper || !sharpnessImageObj) return;

        const is1to1 = paramSharp1to1 && paramSharp1to1.checked;
        const canvases = wrapper.querySelectorAll('canvas');

        const applyStyles = () => {
            if (is1to1) {
                const bgW = window._cachedTrueInventoryBgDimensions ? window._cachedTrueInventoryBgDimensions.w : 375;
                const bgH = window._cachedTrueInventoryBgDimensions ? window._cachedTrueInventoryBgDimensions.h : 375;
                
                const cellW = bgW / 5;
                const cellH = bgH / 5;
                const sizeW = cellW * 3;
                const sizeH = cellH * 3;

                wrapper.style.width = `${sizeW}px`;
                wrapper.style.height = `${sizeH}px`;
                wrapper.style.minWidth = `${sizeW}px`;
                wrapper.style.minHeight = `${sizeH}px`;
                
                wrapper.style.backgroundPosition = `-${cellW}px -${cellH}px`;
                wrapper.style.backgroundSize = `${bgW}px ${bgH}px`;
                wrapper.style.backgroundRepeat = 'no-repeat';

                canvases.forEach(canvas => {
                    canvas.style.width = `${sharpnessImageObj.naturalWidth}px`;
                    canvas.style.height = `${sharpnessImageObj.naturalHeight}px`;
                });
            } else {
                wrapper.style.width = '';
                wrapper.style.height = '';
                wrapper.style.minWidth = '';
                wrapper.style.minHeight = '';
                wrapper.style.backgroundPosition = 'center';
                wrapper.style.backgroundRepeat = '';
                
                canvases.forEach(canvas => {
                    canvas.style.width = '70%';
                    canvas.style.height = '70%';
                });
                
                const rect = sharpnessCanvas.getBoundingClientRect();
                const scale = rect.width / sharpnessImageObj.naturalWidth;
                
                const bgW = window._cachedTrueInventoryBgDimensions ? window._cachedTrueInventoryBgDimensions.w : 375;
                const bgH = window._cachedTrueInventoryBgDimensions ? window._cachedTrueInventoryBgDimensions.h : 375;
                wrapper.style.backgroundSize = `${bgW * scale}px ${bgH * scale}px`;
            }
        };

    if (!window._cachedTrueInventoryBgDimensions) {
        const tempBg = new Image();
        tempBg.onload = () => {
            window._cachedTrueInventoryBgImage = tempBg;
            window._cachedTrueInventoryBgDimensions = { w: tempBg.naturalWidth, h: tempBg.naturalHeight };
            applyStyles();
        };
        tempBg.src = 'trueinventorybackground.png';
    } else {
        applyStyles();
    }
}

function openSharpnessModal(file, blob, onReady) {
    sharpnessFileObj = file;
    sharpnessBaseBlob = blob;
    
    pipelineStepBlobs.sharpnessInput = blob; // Сохраняем входные данные для истории
    
    if (sharpnessBackBtn) {
        sharpnessBackBtn.style.display = pipelineStepBlobs.cropInput ? 'inline-block' : 'none';
    }
    
    // Используем глобальные сохраненные настройки резкости
    paramSharpAmount.value = sharpnessState.amount;
    paramSharpRadius.value = sharpnessState.radius;
    paramSharpThreshold.value = sharpnessState.threshold;
    if (paramSharp1to1) paramSharp1to1.checked = globalScale1to1;
    
    updateSharpnessUIValues();
    
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
        sharpnessImageObj = img;
        
        sharpnessCanvas.width = img.naturalWidth;
        sharpnessCanvas.height = img.naturalHeight;
        sharpnessOrigCanvas.width = img.naturalWidth;
        sharpnessOrigCanvas.height = img.naturalHeight;
        
        const origCtx = sharpnessOrigCanvas.getContext('2d');
        origCtx.drawImage(img, 0, 0);
        sharpnessOriginalPixels = origCtx.getImageData(0, 0, img.width, img.height).data;
        
        applySharpnessFilter();
        sharpnessOverlay.classList.add('visible');

        if (onReady) onReady();

        requestAnimationFrame(() => {
            updateSharpnessPreviewScale();
        });
    };
    img.src = url;
}

function closeSharpnessModal() {
    sharpnessOverlay.classList.remove('visible');
    sharpnessImageObj = null;
    sharpnessFileObj = null;
    sharpnessBaseBlob = null;
    sharpnessOriginalPixels = null;
}

function updateSharpnessUIValues() {
    valSharpAmount.textContent = paramSharpAmount.value + '%';
    valSharpRadius.textContent = parseFloat(paramSharpRadius.value).toFixed(1) + ' px';
    valSharpThreshold.textContent = paramSharpThreshold.value;
}

function applySharpnessFilter() {
    if (!sharpnessOriginalPixels || sharpnessIsProcessing) return;
    sharpnessIsProcessing = true;
    
    const width = sharpnessCanvas.width;
    const height = sharpnessCanvas.height;
    
    const amount = parseFloat(paramSharpAmount.value) / 100;
    const radius = parseFloat(paramSharpRadius.value);
    const threshold = parseInt(paramSharpThreshold.value, 10);
    
    const length = sharpnessOriginalPixels.length;
    
    const preparedPixels = new Uint8ClampedArray(length);
    for (let i = 0; i < length; i += 4) {
        const a = sharpnessOriginalPixels[i + 3];
        if (a === 0) {
            preparedPixels[i] = 255;
            preparedPixels[i + 1] = 255;
            preparedPixels[i + 2] = 255;
            preparedPixels[i + 3] = 0;
        } else {
            preparedPixels[i] = sharpnessOriginalPixels[i];
            preparedPixels[i + 1] = sharpnessOriginalPixels[i + 1];
            preparedPixels[i + 2] = sharpnessOriginalPixels[i + 2];
            preparedPixels[i + 3] = a;
        }
    }
    
    const dB = straightGaussianBlur(preparedPixels, width, height, radius);
    
    const resCtx = sharpnessCanvas.getContext('2d');
    const resData = resCtx.createImageData(width, height);
    const resultPixels = resData.data;
    
    for (let i = 0; i < length; i += 4) {
        for (let c = 0; c < 3; c++) { 
            const idx = i + c;
            const origVal = preparedPixels[idx];
            const blurVal = dB[idx];
            const diff = origVal - blurVal;
            const absDiff = Math.abs(diff);
            
            if (threshold === 0) {
                let val = origVal + diff * amount;
                resultPixels[idx] = val < 0 ? 0 : (val > 255 ? 255 : val);
            } else {
                if (absDiff <= threshold) {
                    resultPixels[idx] = origVal;
                } else {
                    const softWeight = Math.min(1, (absDiff - threshold) / Math.max(1, threshold * 0.5));
                    let val = origVal + diff * amount * softWeight;
                    resultPixels[idx] = val < 0 ? 0 : (val > 255 ? 255 : val);
                }
            }
        }
        resultPixels[i + 3] = sharpnessOriginalPixels[i + 3];
    }
    
    resCtx.putImageData(resData, 0, 0);
    sharpnessIsProcessing = false;
}

function initSharpnessButtons() {
    [paramSharpAmount, paramSharpRadius, paramSharpThreshold].forEach(input => {
        input.addEventListener('input', () => {
            sharpnessState.amount = parseInt(paramSharpAmount.value, 10) || 60;
            sharpnessState.radius = parseFloat(paramSharpRadius.value) || 0.9;
            sharpnessState.threshold = parseInt(paramSharpThreshold.value, 10) || 0;
            
            updateSharpnessUIValues();
            clearTimeout(sharpnessTimeout);
            sharpnessTimeout = setTimeout(applySharpnessFilter, 50);
        });
    });

    const sharpnessResetBtn = document.getElementById('sharpness-reset-btn');
    if (sharpnessResetBtn) {
        sharpnessResetBtn.addEventListener('click', () => {
            sharpnessState.amount = 60;
            sharpnessState.radius = 0.9;
            sharpnessState.threshold = 0;
            
            paramSharpAmount.value = sharpnessState.amount;
            paramSharpRadius.value = sharpnessState.radius;
            paramSharpThreshold.value = sharpnessState.threshold;
            
            updateSharpnessUIValues();
            applySharpnessFilter();
        });
    }

    if (paramSharp1to1) {
        paramSharp1to1.addEventListener('change', (e) => {
            globalScale1to1 = e.target.checked;
            updateSharpnessPreviewScale();
        });
    }

    let sharpnessMouseDownStarted = false;
    sharpnessOverlay.addEventListener('mousedown', (e) => {
        sharpnessMouseDownStarted = (e.target === sharpnessOverlay);
    });
    sharpnessOverlay.addEventListener('click', (e) => {
        if (e.target === sharpnessOverlay && sharpnessMouseDownStarted) {
            requestPipelineCancel(() => {
                closeSharpnessModal();
                pendingUploadQueue = [];
                currentQueueIndex = 0;
            });
        }
        sharpnessMouseDownStarted = false;
    });

    sharpnessCancelBtn.addEventListener('click', () => {
                closeSharpnessModal();
                pendingUploadQueue = [];
                currentQueueIndex = 0;
            });

            if (sharpnessBackBtn) {
                sharpnessBackBtn.addEventListener('click', () => {
                    const file = sharpnessFileObj;
                    if (pipelineStepBlobs.cropInput) {
                        openCropModal(file, pipelineStepBlobs.cropInput, () => {
                            closeSharpnessModal();
                        });
                    }
                });
            }

            sharpnessSkipBtn.addEventListener('click', async () => {
        if (!sharpnessFileObj || !sharpnessBaseBlob) return;
        
        const fileToProcess = sharpnessFileObj;
        const blobToProcess = sharpnessBaseBlob;
        
        openShadowModal(fileToProcess, blobToProcess, () => {
            closeSharpnessModal();
        });
    });

    sharpnessApplyBtn.addEventListener('click', () => {
        if (!sharpnessCanvas || !sharpnessFileObj) return;
        
        const fileToProcess = sharpnessFileObj;
        sharpnessCanvas.toBlob(async (blob) => {
            if (blob) {
                openShadowModal(fileToProcess, blob, () => {
                    closeSharpnessModal();
                });
            }
        }, 'image/png');
    });

    sharpnessCompareBtn.addEventListener('mousedown', () => {
        sharpnessOrigCanvas.style.opacity = '1';
    });
    sharpnessCompareBtn.addEventListener('mouseup', () => {
        sharpnessOrigCanvas.style.opacity = '0';
    });
    sharpnessCompareBtn.addEventListener('mouseleave', () => {
        sharpnessOrigCanvas.style.opacity = '0';
    });
    sharpnessCompareBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        sharpnessOrigCanvas.style.opacity = '1';
    });
    sharpnessCompareBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        sharpnessOrigCanvas.style.opacity = '0';
    });
}

function closeCropModal() {
    const cropOverlay = document.getElementById('crop-overlay');
    if (cropOverlay) {
        cropOverlay.classList.remove('visible');
    }
    cropImageFile = null;
    cropImageBlob = null;
    cropImageObj = null;
    cropZoom = 1.0;
    cropBaseWidth = 0;
    cropBaseHeight = 0;
}

async function applyCropAndContinue() {
    if (!cropImageObj) return;
    
    const targetSize = 53;
    const croppedWidth = Math.round(cropCoords.w);
    const croppedHeight = Math.round(cropCoords.h);
    const ratio = croppedWidth / croppedHeight;

    let drawWidth, drawHeight;
    if (croppedWidth > croppedHeight) {
        drawWidth = targetSize;
        drawHeight = targetSize / ratio;
    } else {
        drawHeight = targetSize;
        drawWidth = targetSize * ratio;
    }

    const dx = (targetSize - drawWidth) / 2;
    const dy = (targetSize - drawHeight) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(
        cropImageObj,
        Math.round(cropCoords.x), Math.round(cropCoords.y), Math.round(cropCoords.w), Math.round(cropCoords.h),
        dx, dy, drawWidth, drawHeight
    );
    
    const fileToProcess = cropImageFile;
    
    canvas.toBlob(async (blob) => {
        if (blob) {
            openSharpnessModal(fileToProcess, blob, () => {
                closeCropModal();
            });
        }
    }, 'image/png');
}

window.addEventListener('resize', () => {
    const cropOverlay = document.getElementById('crop-overlay');
    if (cropOverlay && cropOverlay.classList.contains('visible')) {
        updateCropUI();
    }
    const shadowOverlay = document.getElementById('shadow-overlay');
    if (shadowOverlay && shadowOverlay.classList.contains('visible')) {
        updateShadowPreviewScale();
    }
    const sharpnessOverlay = document.getElementById('sharpness-overlay');
    if (sharpnessOverlay && sharpnessOverlay.classList.contains('visible')) {
        updateSharpnessPreviewScale();
    }
});



// --- Shadow Logic ---

function getShadowGaussianKernel(sigma) {
    const radius = Math.ceil(sigma * 3);
    const size = 2 * radius + 1;
    const kernel = new Float32Array(size);
    let sum = 0;
    for (let i = 0; i < size; i++) {
        const x = i - radius;
        kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
        sum += kernel[i];
    }
    for (let i = 0; i < size; i++) {
        kernel[i] /= sum;
    }
    return { kernel, radius };
}

function openShadowModal(file, blob, onReady) {
    shadowFileObj = file;
    shadowBaseBlob = blob;
    
    pipelineStepBlobs.shadowInput = blob; // Сохраняем входные данные для истории
    
    if (shadowBackBtn) {
        shadowBackBtn.style.display = pipelineStepBlobs.sharpnessInput ? 'inline-block' : 'none';
    }
    
    paramShadowRadius.value = shadowState.radius;
    numShadowRadius.value = shadowState.radius.toFixed(1);
    paramShadowDist.value = shadowState.distance;
    numShadowDist.value = shadowState.distance.toFixed(1);
    paramShadowOpacity.value = shadowState.opacity;
    numShadowOpacity.value = shadowState.opacity.toFixed(2);
    numShadowAngle.value = shadowState.angle;
    paramShadowOnly.checked = shadowState.shadowOnly;
    if (paramShadow1to1) paramShadow1to1.checked = globalScale1to1;
    if (paramShadowShowBorder) paramShadowShowBorder.checked = false;
    updateShadowCanvasBorder();

    // Явно синхронизируем текстовые метки (<span>) в панели управления при открытии
    document.getElementById('val-shadow-radius').textContent = shadowState.radius.toFixed(1);
    document.getElementById('val-shadow-dist').textContent = shadowState.distance.toFixed(1);
    document.getElementById('val-shadow-opacity').textContent = shadowState.opacity.toFixed(2);
    
    shadowRgbR.value = 0;
    shadowRgbG.value = 0;
    shadowRgbB.value = 0;
    updateShadowColorPreview();
    updateShadowAngleDial();

    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
        shadowImageObj = img;
        shadowCanvas.width = img.naturalWidth;
        shadowCanvas.height = img.naturalHeight;
        shadowOrigCanvas.width = img.naturalWidth;
        shadowOrigCanvas.height = img.naturalHeight;

        // Рисуем исходник на невидимый по умолчанию верхний слой для мгновенного сравнения
        const origCtx = shadowOrigCanvas.getContext('2d');
        origCtx.drawImage(img, 0, 0);

        applyShadowFilter();
        shadowOverlay.classList.add('visible');

        if (onReady) onReady();

        requestAnimationFrame(() => {
            updateShadowPreviewScale();
        });
    };
    img.src = url;
}

function updateShadowPreviewScale() {
            const wrapper = document.getElementById('shadow-preview-wrapper');
            if (!wrapper || !shadowImageObj) return;

            const is1to1 = paramShadow1to1 && paramShadow1to1.checked;
            const canvases = wrapper.querySelectorAll('canvas');

            const applyStyles = () => {
                if (is1to1) {
                    // Вычисляем размеры на основе 5x5 сетки trueinventorybackground.png (оригинал 375x375)
                    const bgW = window._cachedTrueInventoryBgDimensions ? window._cachedTrueInventoryBgDimensions.w : 375;
                    const bgH = window._cachedTrueInventoryBgDimensions ? window._cachedTrueInventoryBgDimensions.h : 375;
                    
                    const cellW = bgW / 5;
                    const cellH = bgH / 5;
                    const sizeW = cellW * 3;
                    const sizeH = cellH * 3;

                    // Задаем оригинальный размер контейнера для сетки 3x3
                    wrapper.style.width = `${sizeW}px`;
                    wrapper.style.height = `${sizeH}px`;
                    wrapper.style.minWidth = `${sizeW}px`;
                    wrapper.style.minHeight = `${sizeH}px`;
                    
                    // Сдвигаем на 1 ячейку влево и вверх, фиксируем оригинальный размер фона
                    wrapper.style.backgroundPosition = `-${cellW}px -${cellH}px`;
                    wrapper.style.backgroundSize = `${bgW}px ${bgH}px`;
                    wrapper.style.backgroundRepeat = 'no-repeat';

                    // Принудительно задаем холстам их настоящий размер 1к1 (обычно 53x53)
                    canvases.forEach(canvas => {
                        canvas.style.width = `${shadowImageObj.naturalWidth}px`;
                        canvas.style.height = `${shadowImageObj.naturalHeight}px`;
                    });
                } else {
                    // Сбрасываем жесткие инлайн стили размеров, центрируем фон
                    wrapper.style.width = '';
                    wrapper.style.height = '';
                    wrapper.style.minWidth = '';
                    wrapper.style.minHeight = '';
                    wrapper.style.backgroundPosition = 'center';
                    wrapper.style.backgroundRepeat = '';
                    
                    // Задаем холстам уменьшенный размер (70%), чтобы приоткрыть границы соседних ячеек
                    canvases.forEach(canvas => {
                        canvas.style.width = '70%';
                        canvas.style.height = '70%';
                    });
                    
                    const rect = shadowCanvas.getBoundingClientRect();
                    const scale = rect.width / shadowImageObj.naturalWidth;
                    
                    const bgW = window._cachedTrueInventoryBgDimensions ? window._cachedTrueInventoryBgDimensions.w : 375;
                    const bgH = window._cachedTrueInventoryBgDimensions ? window._cachedTrueInventoryBgDimensions.h : 375;
                    wrapper.style.backgroundSize = `${bgW * scale}px ${bgH * scale}px`;
                }
            };

            // Гарантируем, что перед расчетом размеров картинка trueinventorybackground.png загружена и её габариты известны
            if (!window._cachedTrueInventoryBgDimensions) {
                const tempBg = new Image();
                tempBg.onload = () => {
                    window._cachedTrueInventoryBgImage = tempBg;
                    window._cachedTrueInventoryBgDimensions = { w: tempBg.naturalWidth, h: tempBg.naturalHeight };
                    applyStyles();
                };
                tempBg.src = 'trueinventorybackground.png';
            } else {
                applyStyles();
            }
        }

        function updateShadowCanvasBorder() {
            const canvases = document.querySelectorAll('#shadow-preview-wrapper canvas');
            const showBorder = paramShadowShowBorder && paramShadowShowBorder.checked;
            canvases.forEach(canvas => {
                if (showBorder) {
                    canvas.style.boxShadow = '';
                    canvas.style.border = '';
                } else {
                    canvas.style.boxShadow = 'none';
                    canvas.style.border = 'none';
                }
            });
        }

        function closeShadowModal() {
            shadowOverlay.classList.remove('visible');
            shadowImageObj = null;
            shadowFileObj = null;
            shadowBaseBlob = null;
}

function updateShadowColorPreview() {
    const hex = "#" + ((1 << 24) + (shadowState.r << 16) + (shadowState.g << 8) + shadowState.b).toString(16).slice(1);
    shadowColorPreview.style.backgroundColor = hex;
    shadowColorPicker.value = hex;
}

function updateShadowAngleDial() {
    shadowAngleLine.style.transform = `rotate(${-shadowState.angle}deg)`;
}

function handleShadowAngleDial(e) {
    const rect = shadowAngleDial.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    let angle = Math.round(Math.atan2(-dy, dx) * (180 / Math.PI));
    shadowState.angle = angle;
    numShadowAngle.value = angle;
    updateShadowAngleDial();
    
    clearTimeout(shadowTimeout);
    shadowTimeout = setTimeout(applyShadowFilter, 20);
}

function applyShadowFilter() {
    if (!shadowImageObj || shadowIsProcessing) return;
    shadowIsProcessing = true;

    const radius = Math.max(0, shadowState.radius);
    const distance = shadowState.distance;
    const angleRad = (shadowState.angle * Math.PI) / 180;

    const dx = distance * Math.cos(angleRad);
    const dy = -distance * Math.sin(angleRad);

    const origW = shadowImageObj.width;
    const origH = shadowImageObj.height;

    shadowCanvas.width = origW;
    shadowCanvas.height = origH;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = origW;
    tempCanvas.height = origH;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(shadowImageObj, 0, 0);
    const origImageData = tempCtx.getImageData(0, 0, origW, origH);

    const pad = Math.ceil(radius * 3);
    const padW = origW + pad * 2;
    const padH = origH + pad * 2;

    const alphaIn = new Uint8Array(padW * padH);
    for (let y = 0; y < origH; y++) {
        for (let x = 0; x < origW; x++) {
            const origIndex = (y * origW + x) * 4 + 3;
            const targetIndex = (y + pad) * padW + (x + pad);
            alphaIn[targetIndex] = origImageData.data[origIndex];
        }
    }

    let alphaBlurred = new Uint8Array(padW * padH);
    if (radius > 0) {
        const sigma = radius * 0.5;
        const { kernel, radius: kRad } = getShadowGaussianKernel(sigma);

        const tempAlpha = new Uint8Array(padW * padH);
        for (let y = 0; y < padH; y++) {
            for (let x = 0; x < padW; x++) {
                let sum = 0;
                for (let k = -kRad; k <= kRad; k++) {
                    const px = Math.min(Math.max(x + k, 0), padW - 1);
                    sum += alphaIn[y * padW + px] * kernel[k + kRad];
                }
                tempAlpha[y * padW + x] = sum;
            }
        }

        for (let x = 0; x < padW; x++) {
            for (let y = 0; y < padH; y++) {
                let sum = 0;
                for (let k = -kRad; k <= kRad; k++) {
                    const py = Math.min(Math.max(y + k, 0), padH - 1);
                    sum += tempAlpha[py * padW + x] * kernel[k + kRad];
                }
                alphaBlurred[y * padW + x] = sum;
            }
        }
    } else {
        alphaBlurred.set(alphaIn);
    }

    const ctx = shadowCanvas.getContext('2d');
    const finalImageData = ctx.createImageData(origW, origH);
    const dest = finalImageData.data;

    const shadowR = shadowState.r;
    const shadowG = shadowState.g;
    const shadowB = shadowState.b;
    const shadowOpacity = shadowState.opacity;

    const getVal = (px, py) => {
        if (px >= 0 && px < padW && py >= 0 && py < padH) {
            return alphaBlurred[py * padW + px];
        }
        return 0;
    };

    for (let y = 0; y < origH; y++) {
        for (let x = 0; x < origW; x++) {
            const idx = (y * origW + x) * 4;

            const sx = x - dx + pad;
            const sy = y - dy + pad;
            let sAlphaNorm = 0;

            const x0 = Math.floor(sx);
            const x1 = x0 + 1;
            const y0 = Math.floor(sy);
            const y1 = y0 + 1;

            const tx = sx - x0;
            const ty = sy - y0;

            const v00 = getVal(x0, y0);
            const v10 = getVal(x1, y0);
            const v01 = getVal(x0, y1);
            const v11 = getVal(x1, y1);

            const interpVal = (1 - ty) * ((1 - tx) * v00 + tx * v10) + ty * ((1 - tx) * v01 + tx * v11);
            sAlphaNorm = (interpVal / 255.0) * shadowOpacity;

            const fgR = origImageData.data[idx];
            const fgG = origImageData.data[idx + 1];
            const fgB = origImageData.data[idx + 2];
            const fgA = origImageData.data[idx + 3] / 255.0;

            if (shadowState.shadowOnly) {
                dest[idx] = shadowR;
                dest[idx + 1] = shadowG;
                dest[idx + 2] = shadowB;
                dest[idx + 3] = Math.round(sAlphaNorm * 255);
            } else {
                const outAlpha = fgA + sAlphaNorm * (1.0 - fgA);
                if (outAlpha > 0) {
                    dest[idx] = Math.round((fgR * fgA + shadowR * sAlphaNorm * (1.0 - fgA)) / outAlpha);
                    dest[idx + 1] = Math.round((fgG * fgA + shadowG * sAlphaNorm * (1.0 - fgA)) / outAlpha);
                    dest[idx + 2] = Math.round((fgB * fgA + shadowB * sAlphaNorm * (1.0 - fgA)) / outAlpha);
                    dest[idx + 3] = Math.round(outAlpha * 255);
                } else {
                    dest[idx] = dest[idx + 1] = dest[idx + 2] = dest[idx + 3] = 0;
                }
            }
        }
    }

    ctx.putImageData(finalImageData, 0, 0);
    shadowIsProcessing = false;
}

function initShadowButtons() {
    function bindSliderAndNum(slider, num, stateKey, isFloat = true) {
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            num.value = val.toFixed(stateKey === 'opacity' ? 2 : 1);
            shadowState[stateKey] = val;
            document.getElementById('val-shadow-' + (stateKey==='distance'?'dist':stateKey)).textContent = num.value;
            clearTimeout(shadowTimeout);
            shadowTimeout = setTimeout(applyShadowFilter, 20);
        });
        num.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value) || 0;
            val = Math.max(slider.min, Math.min(slider.max, val));
            slider.value = val;
            shadowState[stateKey] = val;
            document.getElementById('val-shadow-' + (stateKey==='distance'?'dist':stateKey)).textContent = num.value;
            clearTimeout(shadowTimeout);
            shadowTimeout = setTimeout(applyShadowFilter, 20);
        });
    }

    bindSliderAndNum(paramShadowRadius, numShadowRadius, 'radius');
    bindSliderAndNum(paramShadowDist, numShadowDist, 'distance');
    bindSliderAndNum(paramShadowOpacity, numShadowOpacity, 'opacity');

    numShadowAngle.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value) || 0;
        if (val > 180) val = 180;
        if (val < -180) val = -180;
        shadowState.angle = val;
        updateShadowAngleDial();
        clearTimeout(shadowTimeout);
        shadowTimeout = setTimeout(applyShadowFilter, 20);
    });

    shadowAngleDial.addEventListener('mousedown', handleShadowAngleDial);
    shadowAngleDial.addEventListener('mousemove', (e) => {
        if (e.buttons === 1) handleShadowAngleDial(e);
    });

    shadowColorPicker.addEventListener('input', (e) => {
        const hex = e.target.value;
        shadowState.r = parseInt(hex.slice(1, 3), 16);
        shadowState.g = parseInt(hex.slice(3, 5), 16);
        shadowState.b = parseInt(hex.slice(5, 7), 16);
        shadowRgbR.value = shadowState.r;
        shadowRgbG.value = shadowState.g;
        shadowRgbB.value = shadowState.b;
        updateShadowColorPreview();
        clearTimeout(shadowTimeout);
        shadowTimeout = setTimeout(applyShadowFilter, 20);
    });

    paramShadowOnly.addEventListener('change', (e) => {
        shadowState.shadowOnly = e.target.checked;
        applyShadowFilter();
    });

    if (paramShadow1to1) {
        paramShadow1to1.addEventListener('change', (e) => {
            globalScale1to1 = e.target.checked;
            updateShadowPreviewScale();
        });
    }

            if (paramShadowShowBorder) {
                paramShadowShowBorder.addEventListener('change', () => {
                    updateShadowCanvasBorder();
                });
            }

            let isDialDragging = false;

            shadowAngleDial.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return; // Только ЛКМ
                isDialDragging = true;
                handleShadowAngleDial(e);
                window.addEventListener('mousemove', handleGlobalDialMove);
                window.addEventListener('mouseup', handleGlobalDialUp);
            });

            function handleGlobalDialMove(e) {
                if (isDialDragging) {
                    handleShadowAngleDial(e);
                }
            }

            function handleGlobalDialUp(e) {
                isDialDragging = false;
                window.removeEventListener('mousemove', handleGlobalDialMove);
                window.removeEventListener('mouseup', handleGlobalDialUp);
            }

            // Обработка кнопки сравнения (ДО / ПОСЛЕ)
            shadowCompareBtn.addEventListener('mousedown', () => {
                shadowOrigCanvas.style.opacity = '1';
                shadowCanvas.style.opacity = '0';
            });
    shadowCompareBtn.addEventListener('mouseup', () => {
        shadowOrigCanvas.style.opacity = '0';
        shadowCanvas.style.opacity = '1';
    });
    shadowCompareBtn.addEventListener('mouseleave', () => {
        shadowOrigCanvas.style.opacity = '0';
        shadowCanvas.style.opacity = '1';
    });
    shadowCompareBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        shadowOrigCanvas.style.opacity = '1';
        shadowCanvas.style.opacity = '0';
    });
    shadowCompareBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        shadowOrigCanvas.style.opacity = '0';
        shadowCanvas.style.opacity = '1';
    });

    let shadowMouseDownStarted = false;
    shadowOverlay.addEventListener('mousedown', (e) => {
        shadowMouseDownStarted = (e.target === shadowOverlay);
    });
    shadowOverlay.addEventListener('click', (e) => {
        if (e.target === shadowOverlay && shadowMouseDownStarted) {
            requestPipelineCancel(() => {
                closeShadowModal();
                pendingUploadQueue = [];
                currentQueueIndex = 0;
            });
        }
        shadowMouseDownStarted = false;
    });

    const shadowResetBtn = document.getElementById('shadow-reset-btn');
    if (shadowResetBtn) {
        shadowResetBtn.addEventListener('click', () => {
            shadowState.radius = 5.0;
            shadowState.distance = 5.0;
            shadowState.angle = -45;
            shadowState.opacity = 0.70;
            shadowState.r = 0;
            shadowState.g = 0;
            shadowState.b = 0;
            shadowState.shadowOnly = false;
            
            paramShadowRadius.value = shadowState.radius;
            numShadowRadius.value = shadowState.radius.toFixed(1);
            paramShadowDist.value = shadowState.distance;
            numShadowDist.value = shadowState.distance.toFixed(1);
            paramShadowOpacity.value = shadowState.opacity;
            numShadowOpacity.value = shadowState.opacity.toFixed(2);
            numShadowAngle.value = shadowState.angle;
            paramShadowOnly.checked = shadowState.shadowOnly;
            
            shadowRgbR.value = shadowState.r;
            shadowRgbG.value = shadowState.g;
            shadowRgbB.value = shadowState.b;
            
            document.getElementById('val-shadow-radius').textContent = shadowState.radius.toFixed(1);
            document.getElementById('val-shadow-dist').textContent = shadowState.distance.toFixed(1);
            document.getElementById('val-shadow-opacity').textContent = shadowState.opacity.toFixed(2);
            
            updateShadowColorPreview();
            updateShadowAngleDial();
            applyShadowFilter();
        });
    }

    shadowCancelBtn.addEventListener('click', () => {
                closeShadowModal();
                pendingUploadQueue = [];
                currentQueueIndex = 0;
            });

            if (shadowBackBtn) {
                shadowBackBtn.addEventListener('click', () => {
                    const file = shadowFileObj;
                    if (pipelineStepBlobs.sharpnessInput) {
                        openSharpnessModal(file, pipelineStepBlobs.sharpnessInput, () => {
                            closeShadowModal();
                        });
                    }
                });
            }

            shadowSkipBtn.addEventListener('click', async () => {
        if (!shadowFileObj || !shadowBaseBlob) return;
        
        const fileToProcess = shadowFileObj;
        const blobToProcess = shadowBaseBlob;
        
        openPremultiplyModal(fileToProcess, blobToProcess, () => {
            closeShadowModal();
        });
    });

    shadowApplyBtn.addEventListener('click', () => {
        if (!shadowCanvas || !shadowFileObj) return;
        
        const fileToProcess = shadowFileObj;
        const w = shadowCanvas.width;
        const h = shadowCanvas.height;
        const imgData = shadowCanvas.getContext('2d').getImageData(0, 0, w, h);
        
        // Pixel-perfect сохранение с помощью UPNG
        const pngBuffer = UPNG.encode([imgData.data.buffer], w, h, 0);
        const blob = new Blob([pngBuffer], { type: "image/png" });
        
        openPremultiplyModal(fileToProcess, blob, () => {
            closeShadowModal();
        });
    });
}

// --- Premultiply Alpha Logic ---

function updatePremultiplyPreviewScale() {
    const wrapper = document.getElementById('premult-preview-wrapper');
    if (!wrapper || !premultImageObj) return;

    const is1to1 = paramPremult1to1 && paramPremult1to1.checked;
    const canvases = wrapper.querySelectorAll('canvas');

    const applyStyles = () => {
        if (is1to1) {
            const bgW = window._cachedTrueInventoryBgDimensions ? window._cachedTrueInventoryBgDimensions.w : 375;
            const bgH = window._cachedTrueInventoryBgDimensions ? window._cachedTrueInventoryBgDimensions.h : 375;
            
            const cellW = bgW / 5;
            const cellH = bgH / 5;
            const sizeW = cellW * 3;
            const sizeH = cellH * 3;

            wrapper.style.width = `${sizeW}px`;
            wrapper.style.height = `${sizeH}px`;
            wrapper.style.minWidth = `${sizeW}px`;
            wrapper.style.minHeight = `${sizeH}px`;
            
            wrapper.style.backgroundPosition = `-${cellW}px -${cellH}px`;
            wrapper.style.backgroundSize = `${bgW}px ${bgH}px`;
            wrapper.style.backgroundRepeat = 'no-repeat';

            canvases.forEach(canvas => {
                canvas.style.width = `${premultImageObj.naturalWidth}px`;
                canvas.style.height = `${premultImageObj.naturalHeight}px`;
            });
        } else {
            wrapper.style.width = '';
            wrapper.style.height = '';
            wrapper.style.minWidth = '';
            wrapper.style.minHeight = '';
            wrapper.style.backgroundPosition = 'center';
            wrapper.style.backgroundRepeat = '';
            
            canvases.forEach(canvas => {
                canvas.style.width = '70%';
                canvas.style.height = '70%';
            });
            
            const rect = premultCanvas.getBoundingClientRect();
            const scale = rect.width / premultImageObj.naturalWidth;
            
            const bgW = window._cachedTrueInventoryBgDimensions ? window._cachedTrueInventoryBgDimensions.w : 375;
            const bgH = window._cachedTrueInventoryBgDimensions ? window._cachedTrueInventoryBgDimensions.h : 375;
            wrapper.style.backgroundSize = `${bgW * scale}px ${bgH * scale}px`;
        }
    };

    if (!window._cachedTrueInventoryBgDimensions) {
        const tempBg = new Image();
        tempBg.onload = () => {
            window._cachedTrueInventoryBgImage = tempBg;
            window._cachedTrueInventoryBgDimensions = { w: tempBg.naturalWidth, h: tempBg.naturalHeight };
            applyStyles();
        };
        tempBg.src = 'trueinventorybackground.png';
    } else {
        applyStyles();
    }
}

function openPremultiplyModal(file, blob, onReady) {
    premultFileObj = file;
    premultBaseBlob = blob;
    
    pipelineStepBlobs.premultiplyInput = blob; // Сохраняем входные данные для истории
    
    if (premultBackBtn) {
        premultBackBtn.style.display = pipelineStepBlobs.shadowInput ? 'inline-block' : 'none';
    }
    
    paramPremultGameRender.checked = true;
    if (paramPremult1to1) paramPremult1to1.checked = globalScale1to1;

    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
        premultImageObj = img;
        premultCanvas.width = img.naturalWidth;
        premultCanvas.height = img.naturalHeight;
        premultOrigCanvas.width = img.naturalWidth;
        premultOrigCanvas.height = img.naturalHeight;

        // Отрисовываем исходник для получения сырых пикселей
        const origCtx = premultOrigCanvas.getContext('2d');
        origCtx.imageSmoothingEnabled = false;
        origCtx.clearRect(0, 0, img.naturalWidth, img.naturalHeight);
        origCtx.drawImage(img, 0, 0);

        // Извлекаем точные пиксели для математики (оригинал)
        premultRawPixels = origCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;

        applyPremultiplyFilter();
        premultiplyOverlay.classList.add('visible');
        
        // Закрываем предыдущее окно без мерцания интерфейса
        if (onReady) onReady();

        requestAnimationFrame(() => {
            updatePremultiplyPreviewScale();
        });
    };
    img.src = url;
}

function closePremultiplyModal() {
    premultiplyOverlay.classList.remove('visible');
    premultImageObj = null;
    premultFileObj = null;
    premultBaseBlob = null;
    premultRawPixels = null;
    premultProcessedPixels = null;
}

function openPremultiplyModal(file, blob, onReady) {
    premultFileObj = file;
    premultBaseBlob = blob;
    
    pipelineStepBlobs.premultiplyInput = blob; // Сохраняем входные данные для истории
    
    if (premultBackBtn) {
        premultBackBtn.style.display = pipelineStepBlobs.shadowInput ? 'inline-block' : 'none';
    }

    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
        premultImageObj = img;
        premultCanvasA.width = img.naturalWidth;
        premultCanvasA.height = img.naturalHeight;
        premultCanvasB.width = img.naturalWidth;
        premultCanvasB.height = img.naturalHeight;

        // Создаем вспомогательный холст для извлечения пикселей исходного формата
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.naturalWidth;
        tempCanvas.height = img.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);
        premultRawPixels = tempCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;

        // Математическое преумножение RGB-каналов на Alpha
        const length = premultRawPixels.length;
        premultProcessedPixels = new Uint8ClampedArray(length);
        for (let i = 0; i < length; i += 4) {
            const r = premultRawPixels[i];
            const g = premultRawPixels[i + 1];
            const b = premultRawPixels[i + 2];
            const a = premultRawPixels[i + 3];

            const coef = a / 255.0;
            premultProcessedPixels[i] = Math.round(r * coef);
            premultProcessedPixels[i + 1] = Math.round(g * coef);
            premultProcessedPixels[i + 2] = Math.round(b * coef);
            premultProcessedPixels[i + 3] = a;
        }

        // Рисуем дефолтные превью для обеих колонок
        drawPremultPreview(premultCanvasA, premultRawPixels);       // Вариант А: Исходный, с ободками
        drawPremultPreview(premultCanvasB, premultProcessedPixels); // Вариант Б: Оптимизированный, чистый

        premultiplyOverlay.classList.add('visible');
        
        if (onReady) onReady();
    };
    img.src = url;
}

function drawPremultPreview(canvas, pixels) {
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');
    
    // Отрисовываем фоновую плитку инвентаря
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = w;
    bgCanvas.height = h;
    const bgCtx = bgCanvas.getContext('2d');
    
    if (window._cachedTrueInventoryBgDimensions && window._cachedTrueInventoryBgImage) {
        const pattern = bgCtx.createPattern(window._cachedTrueInventoryBgImage, 'repeat');
        const matrix = new DOMMatrix();
        const patW = window._cachedTrueInventoryBgDimensions.w;
        const patH = window._cachedTrueInventoryBgDimensions.h;
        const dx = (w / 2) - (patW / 2);
        const dy = (h / 2) - (patH / 2);
        matrix.translateSelf(dx, dy);
        pattern.setTransform(matrix);

        bgCtx.fillStyle = pattern;
        bgCtx.fillRect(0, 0, w, h);
    } else {
        bgCtx.fillStyle = '#1a1a1a';
        bgCtx.fillRect(0, 0, w, h);
    }
    const bgData = bgCtx.getImageData(0, 0, w, h).data;
    
    const renderData = ctx.createImageData(w, h);
    const rData = renderData.data;

    for (let i = 0; i < pixels.length; i += 4) {
        const a_src = pixels[i+3] / 255.0;
        const invA = 1.0 - a_src;
        
        // Всегда рендерим по формуле игрового движка
        rData[i]   = Math.min(255, pixels[i]   + bgData[i] * invA);
        rData[i+1] = Math.min(255, pixels[i+1] + bgData[i+1] * invA);
        rData[i+2] = Math.min(255, pixels[i+2] + bgData[i+2] * invA);
        rData[i+3] = 255;
    }
    
    ctx.putImageData(renderData, 0, 0);
}

function initPremultiplyButtons() {
    let premultiplyMouseDownStarted = false;
    premultiplyOverlay.addEventListener('mousedown', (e) => {
        premultiplyMouseDownStarted = (e.target === premultiplyOverlay);
    });
    premultiplyOverlay.addEventListener('click', (e) => {
        if (e.target === premultiplyOverlay && premultiplyMouseDownStarted) {
            requestPipelineCancel(() => {
                closePremultiplyModal();
                pendingUploadQueue = [];
                currentQueueIndex = 0;
            });
        }
        premultiplyMouseDownStarted = false;
    });

    premultCancelBtn.addEventListener('click', () => {
        closePremultiplyModal();
        pendingUploadQueue = [];
        currentQueueIndex = 0;
    });

    if (premultBackBtn) {
        premultBackBtn.addEventListener('click', () => {
            const file = premultFileObj;
            if (pipelineStepBlobs.shadowInput) {
                openShadowModal(file, pipelineStepBlobs.shadowInput, () => {
                    closePremultiplyModal();
                });
            }
        });
    }

    if (premultSkipBtn) {
        premultSkipBtn.addEventListener('click', () => {
            if (!premultRawPixels || !premultFileObj) return;
            const fileToProcess = premultFileObj;
            const w = premultCanvasA.width;
            const h = premultCanvasA.height;
            
            const pngBuffer = UPNG.encode([premultRawPixels.buffer], w, h, 0);
            const blob = new Blob([pngBuffer], { type: "image/png" });
            
            closePremultiplyModal();
            processFileAndAddToLibrary(fileToProcess, blob).then(() => {
                currentQueueIndex++;
                processNextInQueue();
            });
        });
    }

    if (premultApplyBtn) {
        premultApplyBtn.addEventListener('click', () => {
            if (!premultProcessedPixels || !premultFileObj) return;
            const fileToProcess = premultFileObj;
            const w = premultCanvasB.width;
            const h = premultCanvasB.height;
            
            const pngBuffer = UPNG.encode([premultProcessedPixels.buffer], w, h, 0);
            const blob = new Blob([pngBuffer], { type: "image/png" });
            
            closePremultiplyModal();
            processFileAndAddToLibrary(fileToProcess, blob).then(() => {
                currentQueueIndex++;
                processNextInQueue();
            });
        });
    }

    // Выбор Варианта А (Без изменений)
    premultSelectABtn.addEventListener('click', () => {
        if (!premultRawPixels || !premultFileObj) return;
        const fileToProcess = premultFileObj;
        const w = premultCanvasA.width;
        const h = premultCanvasA.height;
        
        const pngBuffer = UPNG.encode([premultRawPixels.buffer], w, h, 0);
        const blob = new Blob([pngBuffer], { type: "image/png" });
        
        closePremultiplyModal();
        processFileAndAddToLibrary(fileToProcess, blob).then(() => {
            currentQueueIndex++;
            processNextInQueue();
        });
    });

    // Выбор Варианта Б (Преумноженные пиксели)
    premultSelectBBtn.addEventListener('click', () => {
        if (!premultProcessedPixels || !premultFileObj) return;
        const fileToProcess = premultFileObj;
        const w = premultCanvasB.width;
        const h = premultCanvasB.height;
        
        const pngBuffer = UPNG.encode([premultProcessedPixels.buffer], w, h, 0);
        const blob = new Blob([pngBuffer], { type: "image/png" });
        
        closePremultiplyModal();
        processFileAndAddToLibrary(fileToProcess, blob).then(() => {
            currentQueueIndex++;
            processNextInQueue();
        });
    });

    // --- Интерактивное зажатие кнопок сравнения (Blink Comparison) ---
    
    // Кнопка А: при зажатии показываем Вариант Б
    const startCompareA = () => {
        if (premultProcessedPixels) drawPremultPreview(premultCanvasA, premultProcessedPixels);
    };
    const endCompareA = () => {
        if (premultRawPixels) drawPremultPreview(premultCanvasA, premultRawPixels);
    };

    premultCompareABtn.addEventListener('mousedown', startCompareA);
    premultCompareABtn.addEventListener('mouseup', endCompareA);
    premultCompareABtn.addEventListener('mouseleave', endCompareA);
    premultCompareABtn.addEventListener('touchstart', (e) => { e.preventDefault(); startCompareA(); });
    premultCompareABtn.addEventListener('touchend', (e) => { e.preventDefault(); endCompareA(); });

    // Кнопка Б: при зажатии показываем Вариант А
    const startCompareB = () => {
        if (premultRawPixels) drawPremultPreview(premultCanvasB, premultRawPixels);
    };
    const endCompareB = () => {
        if (premultProcessedPixels) drawPremultPreview(premultCanvasB, premultProcessedPixels);
    };

    premultCompareBBtn.addEventListener('mousedown', startCompareB);
    premultCompareBBtn.addEventListener('mouseup', endCompareB);
    premultCompareBBtn.addEventListener('mouseleave', endCompareB);
    premultCompareBBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startCompareB(); });
    premultCompareBBtn.addEventListener('touchend', (e) => { e.preventDefault(); endCompareB(); });
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
             const paddedId = String(item.GlobalIndex).padStart(3, '0');
             output += `Icon=A${paddedId}\r\n`;
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
