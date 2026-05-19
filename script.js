"use client";

// script.js

// Все папки-моды, которые у вас лежат рядом ;index.html
const ALL_MODS = ['Vanilla','Classic','Evolv','Ragnar','Crusad','Old_Hor','Pravl','Discover','Orders','Gift','Dement'/*'KREST+'/*, 'Xxxx'*/];

// порядок статов для детерминированного вывода
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

// Иконки типов для тултипов
const TOOLTIP_TYPE_ICONS = {
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

// текущий режим: 'Vanilla' или 'Evolv'
let currentMode = 'Vanilla';

// для режима сравнения: mod1 — активный, mod2 — второй для сравнения
let mod1 = 'Vanilla';
let mod2 = '';
//////////////

// Хранилище для импортированного мода
let customModData = null;

// Глобальный словарь описаний бонусов
let bonusDescriptions = {};

// --- TIER LIST VARIABLES ---
let tierMode = false;
// Структура: { 'ModName': { 1: [GlobalIndex, ...], 2: [], ..., 10: [] } }
let tierDataStorage = {}; 
// Текущий перемещаемый предмет { id, originGroup, ghostElement }
let floatingItem = null;
let floatingEl = null; // DOM элемент, который следит за курсором

// Хелпер нормализации имени бонуса: нижний регистр, замена ё -> е
function normalizeBonusName(str) {
    if (!str) return '';
    return str.trim().toLowerCase().replace(/ё/g, 'е');
}

// 0) словарь сопоставлений «ключ → текст»
const modLabelMap = {
  Vanilla:  'Vanilla',
  Evolv:    'Эволюция',
  Ragnar:   'Рагнарёк',
  Crusad:   'Крестоносцы',
  Old_Hor:  'Старые Горизонты',
  Pravl:    'Правление',
  Discover: 'Новые Открытия',
  Classic: 'ВР 1.5 от Алавар',
  Gift:   'Царский Подарок',
  Dement:   'Деменция',
  NewMod:   'Новый мод'
  // при добавлении новых модов просто расширяйте этот словарь
};

function getTooltipLabel(modKey) {
  // для Classic переопределяем
  if (modKey === 'Classic') return 'ВР 1.5';
  // для остальных — как есть или из словаря
  return modLabelMap[modKey] || modKey;
}


let compareMode = false;
let simpleFilterMode = 'any';
let diffOnly = false;
let advanced = false;

let attrModes = {};  

let simpleFilterKey = null;
let bonusFilter= 'all';
let magicFilter= 'all';
let searchQuery    = '';

// общий фон для всех НЕ-Ragnar и отдельный фон для Ragnar
let regBg = Math.random() < 0.5 ? '2background.png' : '7background.png';   // фон «обычных» модов
let ragnarBg  = 'RagnPhone.png';    // дефолт для Ragnar
///////////////////////////////////////////////////////////let krestBg   = 'KREST-bg.png';
// флаг: «были ли мы уже вручную в Ragnar?»
let syncBg = false;

// Глобальные состояния новых чекбоксов
let colorSignsEnabled = true;


// утилита: применяем фон в зависимости от currentMode
function applyBackgroundFor(mode) {
  let src;
  if (mode === 'Ragnar') {
    src = ragnarBg;
  } else if (mode === 'KREST+') {
    src = krestBg;
  } else {
    src = regBg;
  }
  document.documentElement.style.setProperty(
    '--background-tile',
    `url('${src}')`
  );
}

let panelBgEnabled = true;

// === Функция проверки ширины панели (теперь в comparator.js) ===
// Мы вызываем window.checkComparePanelState, так как она перенесена

// --- Утилита для показа всплывающих уведомлений (Toast) ---
function showNotification(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Trigger reflow for transition
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('visible');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, 3000);
}

// --- Единый обработчик открытия/закрытия и «докинга» боковой панели ---
let dockMode = window.innerWidth >= 800;

document.addEventListener('click', function onDocumentClick(e) {
  const sidePanel = document.querySelector('.side-panel');
  const actionBtnElem = e.target.closest('.action-button');

  // --- ОБРАБОТКА КНОПОК ЛЕВОЙ ПАНЕЛИ (через делегирование) ---
  
  // 2. Кнопка "Описание" (вкл/выкл)
  if (e.target.id === 'toggle-desc-btn') {
    e.stopPropagation();
    const panelContent = document.querySelector('.compare-panel-content');
    if(panelContent) panelContent.classList.toggle('hide-desc');
    return;
  }

  // Кнопка "Сетка" (вкл/выкл)
  if (e.target.id === 'toggle-grid-btn') {
    e.stopPropagation();
    document.body.classList.toggle('compare-grid-active');
    const panelContent = document.querySelector('.compare-panel-content');
    if(panelContent) panelContent.classList.toggle('grid-view');
    return;
  }

  // 3. Кнопка "Очистить"
  if (e.target.id === 'del-compare-btn') {
    e.stopPropagation();
    const panelContent = document.querySelector('.compare-panel-content');
    if (panelContent) {
        panelContent.innerHTML = '';
        window.checkComparePanelState();
        
        // Очищаем классы и Set
        window.pinnedItemIds.clear();
        document.querySelectorAll('.item.is-pinned').forEach(el => el.classList.remove('is-pinned'));
        
        // Удаляем все оторванные тултипы из body
        document.querySelectorAll('body > .tooltip.grid-tooltip-detached').forEach(t => t.remove());
    }
    return;
  }
  
  // 4. Клик ВНУТРИ закрепленного предмета (удаление)
  const pinnedItem = e.target.closest('.pinned-item');
  // Проверяем, что этот pinned-item лежит внутри нашей панели сравнения
  // (на случай, если pinned-item используется где-то еще)
  if (pinnedItem && pinnedItem.closest('.compare-panel-content')) {
     e.stopPropagation();
     
     const uid = pinnedItem.dataset.uid;
     if (uid) {
         window.pinnedItemIds.delete(uid);
         // Находим предмет в основной области и снимаем класс
         const mainCard = document.querySelector(`.item[data-uid="${uid}"]`);
         if (mainCard) mainCard.classList.remove('is-pinned');
         
         // Удаляем оторванные тултипы, которые могли залипнуть в body
         document.querySelectorAll(`.tooltip[data-pinned-uid="${uid}"]`).forEach(t => t.remove());
     }
     
     // Удаляем элемент
     pinnedItem.remove();
     
     // Вызываем проверку ширины
     window.checkComparePanelState();
     
     // На всякий случай дублируем проверку через тик, 
     // чтобы гарантировать обновление после отрисовки
     setTimeout(window.checkComparePanelState, 0);
     
     return;
  }
  
  // -----------------------------------------------------------------------------------------

  // 1) Клик по кнопке «⇔» (dock‑toggle)
  if (e.target.id === 'dock-toggle') {
    e.stopPropagation();
    dockMode = !dockMode;
    e.target.classList.toggle('active', dockMode);
    if (sidePanel && sidePanel.classList.contains('open') && dockMode) {
      document.body.classList.add('docked');
    } else {
      document.body.classList.remove('docked');
    }
    return;
  }

  // 2) Клик по кнопке‑гамбургеру (action-button)
  if (actionBtnElem) {
    e.stopPropagation();
    if (!sidePanel) return;
    sidePanel.classList.toggle('open');
    if (sidePanel.classList.contains('open') && dockMode) {
      document.body.classList.add('docked');
    } else {
      document.body.classList.remove('docked');
    }
    return;
  }
  
  // Клик по новой кнопке открытия панели сравнения
  if (e.target.id === 'btn-compare-panel') {
    e.stopPropagation();
    document.body.classList.toggle('compare-open');
    return;
  }
  // Клики внутри левой панели не должны закрывать её
  if (e.target.closest('#compare-panel')) {
    // e.stopPropagation(); 
  }

  // 3) Клик в любом другом месте — если панель не «закреплена», закрываем её
  if (!dockMode && sidePanel
      && !e.target.closest('.side-panel')
      && !e.target.closest('.action-button')
      && !floatingItem /* Не закрывать если тащим предмет */) {
    sidePanel.classList.remove('open');
    document.body.classList.remove('docked');
  }
  
  // если клик был НЕ по карточке и не по самому тултипу
  if (!e.target.closest('.item') && !e.target.closest('.tooltip') && !e.target.closest('.pinned-item')) {
    // Если мы в режиме TierMode и у нас есть плавающий предмет - этот клик сбросит его (или положит на место, если над полем)
    // Но обработка этого ниже в специальном листере, здесь только снятие выделения
    if (selectedCard && !tierMode) {
      selectedCard.classList.remove('selected');
      selectedCard.querySelectorAll('.tooltip')
                  .forEach(tt => tt.classList.remove('visible'));
      selectedCard = null;
    }
  }
 });





// сразу при загрузке показываем фон для Vanilla
applyBackgroundFor(currentMode);

// (скроет .site-title, .bar-controls, .bar-divider и #page-toggle)
document.querySelector('.top-bar .logo')
  .addEventListener('click', function(e) {
    e.stopPropagation();
    // прячем/показываем шапку
    document.body.classList.toggle('topbar-hidden');

    // а теперь меняем сам логотип
    // определяем, какой файл сейчас стоит в src
    const current = this.src.split('/').pop(); 
    // переключаем на Logo-act.png или обратно на Logo.png
    this.src = (current === 'Logo-act.png') 
      ? 'Logo.png' 
      : 'Logo-act.png';
  });

// Логика «привязки» лого к состоянию шапки через MutationObserver
/**
 * Обновляет src у логотипа в зависимости от наличия класса topbar-hidden
 */
function updateLogoByTopbarState() {
  const logo = document.querySelector('.top-bar .logo');
  if (!logo) return;
  if (document.body.classList.contains('topbar-hidden')) {
    logo.src = 'Logo-act.png';
  } else {
    logo.src = 'Logo.png';
  }
}

// Выставляем начальное состояние
updateLogoByTopbarState();

// Наблюдаем за изменениями класса у <body>, чтобы менять лого при любом toggle 
const observer = new MutationObserver(mutations => {
  for (const m of mutations) {
    if (m.attributeName === 'class') {
      updateLogoByTopbarState();
      break;
    }
  }
});
observer.observe(document.body, { attributes: true });




// --- 0) Прелоад всех нужных картинок ---
(function preloadImages() {
  const imgs = [
    // Иконки модов
    './Vanilla1.png', './Vanilla2.png', './Vanilla3.png',
    './Evolv1.png', './Evolv2.png', './Evolv3.png',
    './Ragnar1.png', './Ragnar2.png', './Ragnar3.png',
    './Old_Hor1.png', './Old_Hor2.png', './Old_Hor3.png',
    './Crusad1.png', './Crusad2.png', './Crusad3.png',
    './KREST1.png', './KREST2.png', './KREST3.png',	
    './Pravl1.png', './Pravl2.png', './Pravl3.png',	
    './Gift1.png', './Gift2.png', './Gift3.png',	  
    './Dement1.png', './Dement2.png', './Dement3.png',	
    './Orders1.png', './Orders2.png', './Orders3.png',	
    './Discover1.png', './Discover2.png', './Discover3.png',	
    './Classic1.png', './Classic2.png', './Classic3.png',
    './Newmod1.png', './Newmod2.png', './Newmod3.png',
    './NewmodIcon.png',
    
    // Кнопки интерфейса
    './about1.png', './about2.png', './about3.png',
    './btn-normal.png', './btn-hover.png', './btn-active.png',
    './editor1.png', './editor2.png', './editor3.png', /* Добавлены кнопки редактора */
    
    // Кнопки компаратора и панелей
    './compare1.png', './compare2.png', './compare3.png', './compare4.png',
    './delcompare1.png', './delcompare2.png', './delcompare3.png',
    './extend1.png', './extend2.png', './extend3.png', './extend4.png',
    './desc1.png', './desc2.png', './desc3.png', './desc4.png',
    './Grid1.png', './Grid2.png', './Grid3.png', './Grid4.png',
    
    // Чекбоксы и другие мелкие детали
    './ChkBxOn.png', './ChkBxOff.png', './ChkBxBlock.png',
    './ChkBxListOn.png', './ChkBxListOff.png',
    './ChkCompareOn.png', './ChkCompareOf.png',
    './sort-asc.png', './sort-desc.png', /* Иконки сортировки */
    
    // Фоны
    './RagnPhone.png', './YBbI.png'
  ];

  // Создаем невидимый контейнер для картинок
  const preloadContainer = document.createElement('div');
  preloadContainer.style.position = 'absolute';
  preloadContainer.style.width = '0';
  preloadContainer.style.height = '0';
  preloadContainer.style.overflow = 'hidden';
  preloadContainer.style.opacity = '0';
  preloadContainer.style.pointerEvents = 'none';
  preloadContainer.style.zIndex = '-9999';

  imgs.forEach(src => {
    const img = new Image();
    img.src = src;
    
    // Современный метод: просим браузер декодировать картинку в память видеокарты
    if ('decode' in img) {
      img.decode().catch(() => { /* игнорируем ошибки загрузки */ });
    }
    
    // Помещаем в DOM, чтобы браузер не очистил кэш
    preloadContainer.appendChild(img);
  });

  // Добавляем на страницу (ждем загрузки body, если скрипт вызвался рано)
  if (document.body) {
      document.body.appendChild(preloadContainer);
  } else {
      document.addEventListener('DOMContentLoaded', () => {
          document.body.appendChild(preloadContainer);
      });
  }
})();



// Переменные масштаба, которые будут жить вне createUICompare
let currentScale = 0.8;
const MIN_SCALE   = 0.2;
const MAX_SCALE   = 2;
const STEP        = 0.1;

let showGroups = true;  
let sortState = 0;
const EDGE_MARGIN = 20;


// возвращает относительный путь к папке с данными и картинками
function getBasePath() {
  if (currentMode === 'NewMod') {
      return './Vanilla/'; // Fallback path for base images like mod.png, if needed
  }
  return `./${currentMode}/`;
}
let ItemsData = [];
// --- ИЗМЕНЕНИЕ: Разделяем исходные данные и рабочие ---
let savedData1 = null;      // Рабочая копия (для редактора)
let savedData2 = {};        // Данные второго мода (для сравнения)
window.originalData1 = null; // Неизменяемая исходная копия (на всякий случай)

let bonusMap = { all: null };


// --- Глобальная функция для получения полного списка бонусов (для редактора) ---
window.getAllBonuses = function() {
    // 1. Начинаем со списка, содержащего "Отсутствует"
    const list = [{ value: '', text: 'Отсутствует', icon: null }];
    const addedValues = new Set(['']); // Для отслеживания уникальности

    // 2. Добавляем все стандартные бонусы из BONUS_MAP (теперь в parsers.js)
    // Ключ карты (англ) -> Иконка (bonic/Key.png)
    // Значение карты (рус) -> Текст и Value
    for (const [engKey, rusLabel] of Object.entries(window.BONUS_MAP)) {
        list.push({
            value: rusLabel, // Значение - это русское название (как в item.Bonus)
            text: rusLabel,
            icon: `bonic/${engKey}.png`
        });
        addedValues.add(rusLabel);
    }

    // 3. Добавляем любые нестандартные бонусы, найденные в текущем моде (bonusMap),
    // если их еще нет в списке.
    if (typeof bonusMap !== 'undefined') {
        for (const [key, iconPath] of Object.entries(bonusMap)) {
            if (key === 'all') continue;
            // Если такой бонус еще не добавлен (проверка по названию)
            if (!addedValues.has(key)) {
                list.push({
                    value: key,
                    text: key,
                    icon: iconPath // Используем путь, который разрешил загрузчик мода
                });
                addedValues.add(key);
            }
        }
    }
    
    return list;
};

// --- ЗАГРУЗКА СПРАВОЧНИКА БОНУСОВ ---
function loadGlobalBonusDescriptions() {
    fetch('Bonus.ini')
        .then(res => {
            if (res.ok) return res.arrayBuffer();
            throw new Error('Rus_DiscordTimes.ini not found');
        })
        .then(buffer => {
            const decoder = new TextDecoder('windows-1251');
            const text = decoder.decode(buffer);
            const lines = text.split(/\r?\n/);
            
            lines.forEach(line => {
                line = line.trim();
                // Ищем строки вида BonusN=Имя - Описание
                if (line.match(/^Bonus\d+=/)) {
                    // Разделяем по первому "="
                    const parts = line.split('=');
                    if (parts.length >= 2) {
                        // Значение после равно: "Имя - Описание"
                        // Объединяем остаток, если вдруг в описании есть "="
                        const value = parts.slice(1).join('=');
                        
                        // Разделяем по " - " (пробел тире пробел)
                        const splitVal = value.split(' - ');
                        if (splitVal.length >= 2) {
                            const name = splitVal[0].trim();
                            // Описание может содержать дефисы, поэтому объединяем остаток
                            const desc = splitVal.slice(1).join(' - ').trim();
                            
                            // Сохраняем по нормализованному ключу
                            bonusDescriptions[normalizeBonusName(name)] = desc;
                        }
                    }
                }
            });
            console.log('Справочник бонусов загружен:', Object.keys(bonusDescriptions).length);
        })
        .catch(err => {
            console.warn('Не удалось загрузить Rus_DiscordTimes.ini:', err);
        });
}

// --- 2) Type → ID контейнера ---
const GROUPS = {
  'BlowWeapon':'group-1','Armor':'group-3','Shield':'group-5',
  'Helm':'group-4','Ring':'group-8','Staff':'group-6',
  'Amulet':'group-7','Potion':'group-9','ShotWeapon':'group-2',
  'Item':'group-10'
};

let selectedCard = null;




function clearUI() {
  // удалить все карточки
  ItemsData.forEach(card => card.remove());
  ItemsData = [];

  // удалить сайд‑панель
  const oldPanel = document.querySelector('.side-panel');
  if (oldPanel) oldPanel.remove();

  // удалить блок “Все предметы”
  const oldAll = document.getElementById('group-all');
  if (oldAll) oldAll.remove();

  // подчистить группы group-1…group-10
  Object.values(GROUPS).forEach(id => {
    const ct = document.getElementById(id).querySelector('.Items');
    ct.innerHTML = '';
  });
}

// Утилита для сортировки характеристик по заданному порядку
function sortAttributes(attrs) {
    if (!attrs) return [];
    return attrs.sort((a, b) => {
        const ia = ATTR_ORDER.indexOf(a.key);
        const ib = ATTR_ORDER.indexOf(b.key);
        // Если оба не в списке - по алфавиту
        if (ia === -1 && ib === -1) return a.key.localeCompare(b.key);
        // Если одного нет в списке - он в конце
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        // Иначе по индексу
        return ia - ib;
    });
}

// Утилита colorizeSigns перемещена в comparator.js, так как используется и там

 function createUICompare(data1, data2) {

	 const supportsHover = window.matchMedia('(hover: hover)').matches;
	 
// Функция hasDifference перемещена в comparator.js

// Функция проверки, активен ли фильтр для данного ключа (или его составляющих)
// Объявлена здесь, чтобы быть доступной и в renderItems, и в processAttributes
const isStatFiltered = (key) => {
    // Внутренняя проверка конкретного ключа
    const check = (k) => {
        // Advanced mode
        if (advanced) {
            return attrModes[k] && attrModes[k] !== 'none';
        }
        // Simple mode
        return simpleFilterKey === k;
    };

    // 1. Проверяем сам ключ
    if (check(key)) return true;

    // 2. Проверяем составляющие для сгруппированных ключей
    if (key === 'Физическая атака') {
        return check('Атака рукопашная') || check('Атака стрелковая');
    }
    if (key === 'Физическая защита') {
        return check('Защита рукопашная') || check('Защита стрелковая');
    }
    if (key === 'Иммунитет к магии') {
        return check('Защита от магии жизни') || check('Защита от магии смерти') || check('Защита от магии стихий');
    }

    return false;
};

	 
	 
  const useRagnarTooltip = (currentMode === 'Ragnar' && !syncBg);
  const wasDocked = document.body.classList.contains('docked');
  const prevShowGroups = showGroups;
  compareMode = Boolean(mod2);
  // === Удаляем предыдущую панель и блок «Все предметы», сохраняя их состояние ===
  const existingPanel = document.querySelector('.side-panel');
  let preservedClasses = [];
  if (existingPanel) {
    preservedClasses = Array.from(existingPanel.classList);
    existingPanel.remove();
  }
  const existingAll = document.getElementById('group-all');
  if (existingAll) existingAll.remove();

  // Очистим массивы на всякий случай
   ItemsData = [];
   bonusMap = { all: null };

// Создадим map2: GlobalIndex → item2
const map2ByIndex = {};
Object.values(data2).forEach(it => {
  if (it.GlobalIndex !== undefined) {
    map2ByIndex[it.GlobalIndex] = it;
  }
});

  // Сбор bonusMap (как у вас было, с учетом bonic)
  Object.values(data1).forEach(item => {
    if (item.Bonus) {
      // Логика: если путь уже начинается с bonic/, используем его как есть (от корня)
      // Если нет - используем старую логику с папкой мода
      let iconPath = item.BonusIcon;
      if (iconPath && iconPath.startsWith('bonic/')) {
          bonusMap[item.Bonus] = iconPath;
      } else {
          bonusMap[item.Bonus] = iconPath
            ? `./${mod1}/` + iconPath.replace(/\\/g,'/')
            : null;
      }
    }
  });
  
  
  
  
  
  
  
  
// A) side-panel
const sidePanel = document.createElement('div');
sidePanel.className = 'side-panel';
sidePanel.innerHTML = `
  <!-- A.1) масштаб и док -->
  <div class="scale-controls">
    <button id="scale-down">−</button>
    <span id="scale-value">80%</span>
    <button id="scale-up">+</button>
    <button id="dock-toggle" class="dock-button">⇔</button>
  </div>

  <!-- A.2) панель фильтров -->
  <div class="filter-controls">

    <!-- Верхний ряд: Кнопки (слева) и Чекбоксы (справа) -->
    <div class="top-row-container">
        <!-- Кнопки: расширенные фильтры и сброс -->
        <div class="top-row-buttons">
            <button id="toggle-advanced" class="advanced-toggle">
              Расширенные фильтры
            </button>
            <button id="reset-filters" class="reset-button">Сбросить</button>
        </div>

        <!-- Сюда вставятся чекбоксы -->
        <div id="top-row-checkboxes" class="top-row-checkboxes"></div>
    </div>
 
    <!-- A.2.2) общие контролы: сортировка, группировка, сброс, сравнение -->
    <div class="common-controls">
      <div class="sort-price">
        <span>Цена</span>
        <button id="sort-none" class="sort-button sort-none active">—</button>
        <button id="sort-desc" class="sort-button sort-desc">↓</button>
        <button id="sort-asc"  class="sort-button sort-asc">↑</button>
      </div>

 <label class="group-toggle-wrapper" for="group-toggle">
   <input type="checkbox" id="group-toggle" checked>
   <span class="group-toggle-label">Группировка</span>
 </label>

      <label class="compare-toggle-wrapper">
        <input type="checkbox" id="toggle-compare">
        <span>Сравнение модов</span>
      </label>

<div class="compare-select-wrapper">
  <span>Сравнить с:</span>
  <div id="compare-dropdown"></div>
</div>

<!-- Кнопка справки убрана отсюда и будет добавлена программно в bonus-filters -->

    </div>
	
	
	
    <!-- /common-controls -->

    <!-- A.2.3) фильтр по магии -->
    <div class="magic-filter">
      <span class="filter-label">Магия</span>
      <button id="filter-magic-all" class="active">—</button>
      <button id="filter-magic-death">Смерти</button>
      <button id="filter-magic-life">Жизни</button>
      <button id="filter-magic-elemental">Стихий</button>
    </div>

    <!-- A.2.4) простые фильтры по атрибутам -->
    <div id="simple-filters" class="magic-filter"></div>

    <!-- A.2.5) продвинутые фильтры атрибутов -->
    <div id="advanced-container" style="display: none;">
      <div id="attr-filters"></div>
    </div>

    <!-- A.2.6) бонусы -->
    <div id="bonus-filters"></div>

  </div>
  <!-- /filter-controls -->
`;
document.body.append(sidePanel);

// --- ЛОГИКА ОТКРЫТИЯ СПРАВКИ ПО БОНУСАМ ---
const btnBonusHelp = document.getElementById('btn-bonus-help'); // Будет создан динамически
const bonusHelpOverlay = document.getElementById('bonus-help-overlay');
const bonusHelpList = document.getElementById('bonus-help-list');
const bonusHelpSearch = document.getElementById('bonus-help-search');
const bonusHelpClear = document.getElementById('bonus-help-clear');

function showBonusHelp(query = '') {
    // 1. Получаем список всех доступных бонусов
    const allBonuses = window.getAllBonuses ? window.getAllBonuses() : [];
    
    // 2. Генерируем HTML списка
    let html = '';
    const q = query.toLowerCase().trim();
    
    allBonuses.forEach(b => {
        if (!b.value) return; // Пропускаем "Отсутствует"
        
        const name = b.text;
        // Нормализуем имя из карты бонусов, чтобы найти его в описаниях (игнор регистра и ё)
        const normalizedKey = normalizeBonusName(name);
        const desc = bonusDescriptions[normalizedKey];
        
        if (!desc && !q) { // Предупреждаем только если нет активного поиска
            console.warn(`Описание для бонуса "${name}" не найдено в Rus_DiscordTimes.ini`);
        }
        
        const descriptionText = desc || 'Описание отсутствует.';
        
        // Фильтрация по поиску
        if (q) {
            const matchName = name.toLowerCase().includes(q);
            const matchDesc = descriptionText.toLowerCase().includes(q);
            if (!matchName && !matchDesc) return; // Пропускаем если не найдено
        }
        
        const iconSrc = b.icon || 'empty.png'; // Фоллбек если иконки нет
        
        html += `
            <div class="bonus-list-item">
                <img src="${iconSrc}" alt="${name}">
                <div class="bonus-item-content">
                    <span class="bonus-item-title">${name}</span>
                    <span class="bonus-item-desc">${descriptionText}</span>
                </div>
            </div>
        `;
    });
    
    bonusHelpList.innerHTML = html || '<div style="padding: 20px; color: #888;">Ничего не найдено</div>';
    bonusHelpOverlay.classList.add('visible');
    
    // Управление кнопкой очистки
    if (bonusHelpClear) {
        bonusHelpClear.style.display = q ? 'flex' : 'none';
    }
}

function hideBonusHelp() {
    bonusHelpOverlay.classList.remove('visible');
    if (bonusHelpSearch) {
        bonusHelpSearch.value = '';
        if (bonusHelpClear) bonusHelpClear.style.display = 'none';
    }
}

// События для поиска в бонусах
if (bonusHelpSearch) {
    bonusHelpSearch.addEventListener('input', (e) => {
        showBonusHelp(e.target.value);
    });
}
if (bonusHelpClear) {
    bonusHelpClear.addEventListener('click', () => {
        bonusHelpSearch.value = '';
        showBonusHelp('');
    });
}

// Слушатель для динамической кнопки добавляется при её создании

if (bonusHelpOverlay) {
    bonusHelpOverlay.addEventListener('click', (e) => {
        if (e.target === bonusHelpOverlay) hideBonusHelp();
    });
}


// ── вставляем чекбокс «Фон панели» рядом с контролами масштаба ──
const scaleControls = sidePanel.querySelector('.scale-controls');
const bgToggleWrapper = document.createElement('label');
bgToggleWrapper.className = 'bg-toggle-wrapper';
bgToggleWrapper.innerHTML = `
  <input type="checkbox" id="bg-toggle">
  <span>Фон панели</span>
`;
scaleControls.append(bgToggleWrapper);

// восстановим состояние из глобальной переменной
const bgToggle = document.getElementById('bg-toggle');
bgToggle.checked = panelBgEnabled;
if (!panelBgEnabled) {
  sidePanel.classList.add('no-bg');
}

// при переключении — обновляем переменную и класс для ОБЕИХ панелей
bgToggle.addEventListener('change', e => {
  panelBgEnabled = e.target.checked;
  // Правая панель
  sidePanel.classList.toggle('no-bg', !panelBgEnabled);
  // Левая панель (если она существует в DOM)
  const comparePanel = document.getElementById('compare-panel');
  if (comparePanel) {
    comparePanel.classList.toggle('no-bg', !panelBgEnabled);
  }
});

// Наблюдаем за изменениями класса у <body>, чтобы менять лого при любом toggle
const checkboxContainer = sidePanel.querySelector('#top-row-checkboxes');

// ── Вставляем чекбокс «Цвет +/-» в правую часть верхнего ряда ──
const colorSignWrapper = document.createElement('label');
colorSignWrapper.className = 'bg-toggle-wrapper'; // используем тот же класс для стиля
colorSignWrapper.innerHTML = `
  <input type="checkbox" id="color-sign-toggle">
  <span>Цвет +/-</span>
`;
checkboxContainer.append(colorSignWrapper);

const colorSignToggle = document.getElementById('color-sign-toggle');
colorSignToggle.checked = colorSignsEnabled;

colorSignToggle.addEventListener('change', e => {
  colorSignsEnabled = e.target.checked;
  // Если выключено -> добавляем класс no-color-signs, который переопределяет цвета
  document.body.classList.toggle('no-color-signs', !colorSignsEnabled);
});

// Инициализируем состояние класса body
document.body.classList.toggle('no-color-signs', !colorSignsEnabled);

// ── устанавливаем начальное состояние докинга ──
const dockToggle = document.getElementById('dock-toggle');
// помечаем кнопку «⇔» активной, если док закреплён
dockToggle.classList.toggle('active', dockMode);

document.getElementById('group-toggle').checked = prevShowGroups;

// восстановим чекбокс «Группировка» из прошлого состояния
document.getElementById('group-toggle').checked = prevShowGroups;

// 1) собираем список опций (с первым «none» для сброса сравнения)
const modOptions = [
  { key: 'none', label: '— нет сравнения —', icon: null },
  ...ALL_MODS
    .filter(m => m !== mod1)
    .map(m => ({
      key:  m,
      // если в словаре нет, показываем сам m
      label: modLabelMap[m] || m,
      icon:  m === 'NewMod' ? 'NewmodIcon.png' : `./${m}/mod.png`
    }))
];

// 2) инициализируем кастомный дропдаун
const compareContainer = document.getElementById('compare-dropdown');
setupBonusFilter(
  modOptions,
  compareContainer,
  selectedKey => {
    if (selectedKey === 'none') {
      mod2 = '';
      compareMode = false;
      savedData2 = {}; // сбрасываем данные сравнения
      createUICompare(savedData1, savedData2);
    } else {
      mod2 = selectedKey;
      compareMode = true;
      fetchModData(mod2 || ALL_MODS[0])
        .then(d2 => {
            savedData2 = d2; // сохраняем данные сравнения
            createUICompare(savedData1, savedData2);
        })
        .catch(console.error);
    }
  }
);

// 3) Спрячем лейбл «Бонус» и выставим в дропдауне текущий mod2 (или «нет сравнения»)
const lbl = compareContainer.querySelector('.filter-label');
if (lbl) lbl.style.display = 'none';


 
  // --- простой чекбокс "Сравнить с Vanilla" для простого режима ---
  const simpleCompareWrapper = document.createElement('label');
  simpleCompareWrapper.className = 'simple-compare-wrapper';
  simpleCompareWrapper.innerHTML = `
    <input type="checkbox" id="compare-vanilla">
    <span>Сравнить с Vanilla</span>
  `;
  sidePanel.querySelector('.common-controls').append(simpleCompareWrapper);
  
  // === NEW TIER LIST CHECKBOX ===
  const tierModeWrapper = document.createElement('label');
  tierModeWrapper.className = 'simple-compare-wrapper';
  tierModeWrapper.style.marginLeft = '12px';
  tierModeWrapper.innerHTML = `
    <input type="checkbox" id="tier-mode-toggle">
    <span>Tier List</span>
  `;
  // Вставляем сразу после сравнения с Ваниллой
  simpleCompareWrapper.after(tierModeWrapper);
  
  const tierToggle = tierModeWrapper.querySelector('#tier-mode-toggle');
  tierToggle.checked = tierMode;
  
  tierToggle.addEventListener('change', e => {
      tierMode = e.target.checked;
      document.body.classList.toggle('tier-mode', tierMode);
      
      // Инициализация хранилища для текущего мода при включении
      if (tierMode && !tierDataStorage[currentMode]) {
          // Если данных еще нет, все отображаемые предметы падают в группу 10
          tierDataStorage[currentMode] = {};
          for(let i=1; i<=10; i++) tierDataStorage[currentMode][i] = [];
          
          // Предварительная инициализация: можно просто оставить пустым,
          // renderItems сам отправит их в 10 группу
      }
      
      renderItems();
  });
  // ==============================

  const compareSelectWrapper = sidePanel.querySelector('.compare-select-wrapper');
  const compareVanillaCheckbox = simpleCompareWrapper.querySelector('#compare-vanilla');
  compareVanillaCheckbox.checked = (mod2 === 'Vanilla');
    // если основной мод — Vanilla, делаем чекбокс неактивным
  if (mod1 === 'Vanilla') {
    compareVanillaCheckbox.disabled = true;
  }
  compareVanillaCheckbox.addEventListener('change', e => {
    if (e.target.checked) {
      mod2 = 'Vanilla';
      compareMode = true;
      // подгружаем данные Vanilla для сравнения и пересоздаем UI
      fetchModData(mod2)
        .then(d2 => {
            savedData2 = d2; // сохраняем
            createUICompare(savedData1, savedData2);
        })
        .catch(console.error);
    } else {
      mod2 = '';
      compareMode = false;
      savedData2 = {}; // очищаем
      // пересоздаем UI без сравнения
      createUICompare(savedData1, savedData2);
    }
  });
 


const toggle = compareContainer.querySelector('.dropdown-toggle');
const Items  = compareContainer.querySelectorAll('.dropdown-item');

// ——— 4) чекбокс «Только отличия» ———
const diffWrapper = document.createElement('label');
diffWrapper.className = 'diff-toggle-wrapper';
diffWrapper.innerHTML = `
  <input type="checkbox" id="diff-only">
  <span>Только отличия</span>  
`;
// при повторной отрисовке ставим чек, если флаг остался true
const diffInput = diffWrapper.querySelector('#diff-only');
diffInput.checked = diffOnly;

sidePanel
  .querySelector('.compare-select-wrapper')
  .insertAdjacentElement('afterend', diffWrapper);

// слушатель для переключения
document.getElementById('diff-only')
  .addEventListener('change', e => {
    diffOnly = e.target.checked;
    renderItems();
  });

// --- Чекбокс "Подсветка" в левой панели компаратора ---
const compareDiffCheckbox = document.getElementById('compare-diff-checkbox');
if (compareDiffCheckbox) {
  compareDiffCheckbox.addEventListener('change', e => {
    window.compareDiffEnabled = e.target.checked;
    if (!window.compareDiffEnabled) {
      window.clearComparison();
    } else {
      const hovered = document.querySelector('.item.hovered') || document.querySelector('.pinned-item.hovered');
      if (hovered) window.applyComparison(hovered);
    }
  });
}

// Сначала уберём все метки active
Items.forEach(it => it.classList.remove('active'));

if (!mod2) {
  // без сравнения
  toggle.textContent = '— нет сравнения —';
} else {
  // найдем пункт с данным mod2 и сделаем его активным
  const activeItem = compareContainer.querySelector(`.dropdown-item[data-bonus="${mod2}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
    // скопируем его содержимое (иконка + текст) в кнопку
    toggle.innerHTML = '';  
    // если есть иконка, клонируем её
    const icon = activeItem.querySelector('img');
    if (icon) {
      const img = icon.cloneNode();
      img.style.marginRight = '6px';
      toggle.append(img);
    }
    // и текст
    const txt = activeItem.querySelector('span').textContent;
    toggle.append(document.createTextNode(txt));
  }
}




  // ——— Восстанавливаем активную кнопку сортировки по цене ———
  document.querySelectorAll('.sort-button').forEach(btn =>
    btn.classList.remove('active')
  );
  if (sortState === 0) {
    document.getElementById('sort-none').classList.add('active');
  } else if (sortState === 1) {
    document.getElementById('sort-desc').classList.add('active');
  } else {
    document.getElementById('sort-asc').classList.add('active');
  }



  if (wasDocked) {
    const dockToggle = document.getElementById('dock-toggle');
    dockToggle.classList.add('active');
    document.body.classList.add('docked');
	sidePanel.classList.add('open');
  }

  // === Восстанавливаем состояние (open, advanced-open и пр.) ===
  if (preservedClasses.length) {
    sidePanel.className = preservedClasses.join(' ');
    if (preservedClasses.includes('open') &&
        document.body.classList.contains('docked')) {
      document.body.classList.add('docked');
    }
  }







const compareToggle = document.getElementById('toggle-compare');
// выставляем состояние UI в соответствии с глобальным флагом
compareToggle.checked = compareMode;
document.body.classList.toggle('compare-mode-active', compareMode);

compareToggle.addEventListener('change', () => {
  compareMode = compareToggle.checked;
  document.body.classList.toggle('compare-mode-active', compareMode);

  // прячем/показываем H3-суффиксы
  document.querySelectorAll('.tooltip-1 h3').forEach(h3 => {
   h3.textContent = h3.textContent.replace(/ \[.*\]$/, '');
   if (compareMode) h3.textContent += ` [${getTooltipLabel(mod1)}]`;
  });
  document.querySelectorAll('.tooltip-2 h3').forEach(h3 => {
   h3.textContent = h3.textContent.replace(/ \[.*\]$/, '');
   if (compareMode) h3.textContent += ` [${getTooltipLabel(mod2)}]`;
  });

  // скрыть лишние тултипы, как было
  if (!compareMode) {
    document.querySelectorAll('.tooltip-2.visible')
            .forEach(tt => tt.classList.remove('visible'));
  }
});


// =====  Добавляем внизу боковой панели выбор фона  =====
(() => {
  // Список доступных фонов (файл фоны должны лежать рядом с index.html)
  const backgrounds = [
    'background.png',
    '2background.png',
	'3background.png',
	'4background.png',
	'5background.png',
	'6background.png',
  '7background.png'
  ];

  // Создаём контейнер
  const bgControls = document.createElement('div');
  bgControls.className = 'background-controls';

  // Генерируем кнопку для каждого фона
  backgrounds.forEach(src => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bg-btn';
    btn.dataset.bg = src;
    // Устанавливам мини-картинку как фон кнопки
    btn.style.backgroundImage = `url('${src}')`;
    bgControls.append(btn);

    // По клику — меняем CSS‑переменную для фоновой плитки
btn.addEventListener('click', () => {
  if (!syncBg) {
    if (currentMode === 'Ragnar') {
      // первый клик в Ragnar: синхронизируем оба
      ragnarBg = src;
      regBg    = src;
      syncBg   = true;
    }
    else if (currentMode === 'KREST+') {
      // меняем фон только для KREST+
      krestBg = src;
    }
    else {
      // обычный режим до синхронизации меняем только общий фон
      regBg = src;
    }
  } else {
    // после синхронизации (syncBg===true) — всегда синхронизируем Ragnar↔reg,
    // а для KREST+ меняем только его собственный фон
    if (currentMode === 'KREST+') {
      krestBg = src;
    } else {
      ragnarBg = src;
      regBg    = src;
    }
  }

  // 1) Обновляем фон страницы
  applyBackgroundFor(currentMode);

  // 2) Если мы сейчас в Ragnar — обновляем фон всех тултипов тут же
  if (currentMode === 'Ragnar') {
    // какой фон должен быть у тултипов?
    // если syncBg === false (пока что дефолт) — tooltip-ragn
    // после первого клика syncBg===true → tooltip-bg
    const img = syncBg
      ? 'tooltip-bg.png'
      : 'tooltip-ragn.png';

    // пробегаем по всем тултипам и перезаписываем inline-стиль
    document.querySelectorAll('.tooltip').forEach(tt => {
      tt.style.backgroundImage = `url('${img}')`;
    });
  }
});

  });

  // Приклеиваем блок в конец .side-panel
  sidePanel.append(bgControls);

  // === ДОБАВЛЯЕМ КНОПКИ ИМПОРТА ПОД ФОНАМИ ===
  const importContainer = document.createElement('div');
  importContainer.className = 'import-controls';
  importContainer.innerHTML = `
      <div class="import-group">
          <label for="import-ini" class="import-btn">Импорт .ini</label>
          <input type="file" id="import-ini" accept=".ini">
      </div>
      <div class="import-group">
          <label for="import-ugs" class="import-btn">Импорт .ugs</label>
          <input type="file" id="import-ugs" accept=".ugs">
      </div>
  `;
  sidePanel.append(importContainer);
  
  // Логика импорта INI
  // Вынесено в отдельную функцию для повторного использования
  // ТЕПЕРЬ ГЛОБАЛЬНАЯ, ЧТОБЫ ЕЁ ВИДЕЛА КНОПКА ПОДТВЕРЖДЕНИЯ МОДАЛЬНОГО ОКНА
  window.processImportINI = function(file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const text = ev.target.result;
              customModData = window.parseINI(text); // Используем функцию из parsers.js
              
              // Показываем кнопку "Новый мод"
              const btnNewMod = document.getElementById('btn-NewMod');
              if (btnNewMod) btnNewMod.hidden = false;
              
              // Очищаем инпут чтобы можно было выбрать тот же файл снова
              document.getElementById('import-ini').value = '';
              
              // Если мы уже в режиме NewMod, принудительно обновляем данные
              if (currentMode === 'NewMod') {
                  // Явно сбрасываем сохраненные данные, чтобы forced reload сработал
                  savedData1 = null; 
                  // Вызываем proceedSwitchMode напрямую, чтобы обойти проверку "тот же мод"
                  proceedSwitchMode('NewMod');
              } else {
                  // Переключаемся на Новый мод
                  switchMode('NewMod');
              }
              
              // Уведомление об успехе
              showNotification('Rus_Artefacts.ini успешно импортирован!', 'success');
          } catch (err) {
              console.error(err);
              showNotification('Ошибка импорта INI файла.', 'error');
          }
      };
      // Читаем как windows-1251, так как большинство ini файлов игры в этой кодировке
      reader.readAsText(file, 'windows-1251');
  };

  document.getElementById('import-ini').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // ЖЕЛЕЗОБЕТОННО: Проверка на несохраненные изменения ДЛЯ ВСЕХ МОДОВ
      if (typeof isGlobalDirty === 'function' && isGlobalDirty()) {
          pendingImportFile = file;
          const overlay = document.getElementById('mod-switch-overlay');
          if (overlay) overlay.classList.add('visible');
          return;
      }
      
      window.processImportINI(file);
  });

  // Логика импорта UGS
  document.getElementById('import-ugs').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Показываем лоадер
      const loader = document.getElementById('loading-overlay');
      if(loader) loader.classList.add('visible');
      
      const reader = new FileReader();
      reader.onload = (ev) => {
          // Делаем задержку, чтобы UI успел отрисовать лоадер
          setTimeout(() => {
            try {
                const buffer = ev.target.result;
                
                // Сохраняем и индексируем для 'NewMod' через глобальные объекты parsers.js
                window.modUGS['NewMod'] = buffer;
                window.indexUGS('NewMod', buffer); 
                
                // Очищаем кэш иконок для нового мода
                if (window.modUGSCache['NewMod']) {
                    window.modUGSCache['NewMod'] = {};
                }
                
                // Очищаем инпут
                e.target.value = '';
                
                // Если мы уже в режиме NewMod, обновляем UI
                if (currentMode === 'NewMod') {
                    // Просто пересоздаем UI, так как данные (savedData1) не изменились, 
                    // но картинки должны обновиться
                    createUICompare(savedData1, savedData2 || {});
                }
                
                showNotification('Items.ugs успешно импортирован!', 'success');
            } catch (err) {
                console.error(err);
                showNotification('Ошибка импорта UGS файла.', 'error');
            } finally {
                // Скрываем лоадер
                if(loader) loader.classList.remove('visible');
            }
          }, 50);
      };
      
      reader.onerror = () => {
          console.error(reader.error);
          showNotification('Ошибка чтения файла.', 'error');
          if(loader) loader.classList.remove('visible');
      };
      
      reader.readAsArrayBuffer(file);
  });

})();


    // «Все предметы»
    const allGroup = document.createElement('div');
    allGroup.id = 'group-all';
    allGroup.className = 'group';
    allGroup.innerHTML = `<h2>Все предметы</h2><div class="Items"></div>`;
    document.body.append(allGroup);
    const allContainer = allGroup.querySelector('.Items');

    //
    // B) advanced‑toggle: показать/скрыть продвинутые
    //
    // B) advanced-toggle: показать/скрыть продвинутые
    const advToggle       = document.getElementById('toggle-advanced');
    const advContainer    = document.getElementById('advanced-container');
    const simpleContainer = document.getElementById('simple-filters');
    // Восстанавливаем класс панели из глобального флага:
    if (advanced) {
	
	
	
	
  advContainer.style.display    = '';
  simpleContainer.style.display = 'none';
  advToggle.classList.add('active');
  simpleContainer.style.display = 'none';
} else {
  advContainer.style.display    = 'none';
  simpleContainer.style.display = 'flex';
  advToggle.classList.remove('active');
}

  // сразу находи блок, обёртку дропдауна, и ставь видимость для compare-UI
  const compareDropdownWrapper = sidePanel.querySelector('.compare-select-wrapper');
  // сам выпадающий дропдаун
  compareContainer.style.display       = advanced ? ''        : 'none';
  // его обёртка (лейбл + кнопка + дропдаун)
  compareDropdownWrapper.style.display = advanced ? ''        : 'none';
  // чекбокс "Сравнить с Vanilla" и Tier
  simpleCompareWrapper.style.display   = advanced ? 'none'    : 'inline-flex';
  tierModeWrapper.style.display        = advanced ? 'none'    : 'inline-flex';

advToggle.addEventListener('click', e => {
  e.stopPropagation();
  advanced = !advanced;
  advToggle.classList.toggle('active', advanced);
  sidePanel.classList.toggle('advanced-open', advanced);

  if (advanced) {
    // показываем продвинутое, скрываем простое
    advContainer.style.display    = '';
    simpleContainer.style.display = 'none';
    // в расширённом режиме: дропдаун виден, чекбокс скрыт
    compareContainer.style.display      = '';
	compareSelectWrapper.style.display   = '';
    simpleCompareWrapper.style.display  = 'none';
    tierModeWrapper.style.display       = 'none';

    // **сбрасываем выделение простых кнопок:**
    simpleFilterKey = null;
    simpleContainer
      .querySelectorAll('button')
      .forEach(b => b.classList.remove('active'));

  } else {
    // обратно — показываем простое, скрываем продвинутое
    advContainer.style.display    = 'none';
    simpleContainer.style.display = 'flex';
    // в простом режиме: дропдаун скрыт, показываем чекбокс
    compareContainer.style.display     = 'none';
    compareSelectWrapper.style.display  = 'none';
    simpleCompareWrapper.style.display = 'inline-flex';
    tierModeWrapper.style.display      = 'inline-flex';

    // убираем прежнее !important-скрытие простых фильтров и кнопок режима
    const simpleFilters = document.getElementById('simple-filters');
    if (simpleFilters) {
      simpleFilters.style.removeProperty('display');
    }
    const modeCtr = document.getElementById('simple-mode-controls');
    if (modeCtr) {
      modeCtr.style.removeProperty('display');
    }

    // **сбрасываем все продвинутые фильтры:**
    Object.keys(attrModes).forEach(k=> attrModes[k] = 'none');
    document
      .querySelectorAll('#attr-filters .attr-filter-row button')
      .forEach(b => b.classList.remove('active'));
    // и возвращаем «none» как активную кнопку у каждого атрибута:
    document
      .querySelectorAll('#attr-filters .attr-filter-row button[data-mode="none"]')
      .forEach(b => b.classList.add('active'));
  }

  renderItems();
});

    //
    // C) гамбургер & dock‑mode & сброс выделения карт


    //
    // D) масштаб + динамический gap
    //
    function updateScale() {
      document.documentElement.style.setProperty('--global-scale', currentScale);
      document.getElementById('scale-value').textContent =
        `${Math.round(currentScale*100)}%`;
      
      // Логика динамического масштабирования заголовков и отступов
      // Базовый масштаб = 0.8 (80%). При нем коэффициенты = 1.
      const relativeScale = currentScale / 0.8;
      document.documentElement.style.setProperty('--header-scale-ratio', relativeScale);
      
      // Для gap внутри списка иконок (сохраняем старую логику или упрощаем)
      const gapScale = currentScale <= 1
        ? Math.pow(currentScale, 4)
        : Math.pow(currentScale, 1/4);
      document.documentElement.style.setProperty(
        '--group-gap',
        `${40 * gapScale}px`
      );
      
      // Для отступа между группами (линейное масштабирование)
      document.documentElement.style.setProperty(
        '--group-margin-dynamic',
        `${40 * relativeScale}px`
      );
    }
    document.getElementById('scale-down').addEventListener('click', e => {
      e.stopPropagation();
      currentScale = Math.max(MIN_SCALE, currentScale - STEP);
      updateScale();
    });
    document.getElementById('scale-up').addEventListener('click', e => {
      e.stopPropagation();
      currentScale = Math.min(MAX_SCALE, currentScale + STEP);
      updateScale();
    });
    updateScale();

    //
    // E) состояния фильтров/сортировок
    //
	//	magicFilter= 'all',
	//	bonusFilter= 'all',
	//	simpleFilterKey = null,
	//	searchQuery    = '';

    // — элементы общих и продвинутых фильтров —
    const btnNone     = document.getElementById('sort-none');
    const btnDesc     = document.getElementById('sort-desc');
    const btnAsc      = document.getElementById('sort-asc');
    const groupToggle = document.getElementById('group-toggle');
    const magicBtns   = {
      all:       document.getElementById('filter-magic-all'),
      death:     document.getElementById('filter-magic-death'),
      life:      document.getElementById('filter-magic-life'),
      elemental: document.getElementById('filter-magic-elemental')
    };
	
	// ← Восстанавливаем подсветку magic-фильтра
Object.values(magicBtns).forEach(b => b.classList.remove('active'));
if (magicBtns[magicFilter]) {
  magicBtns[magicFilter].classList.add('active');
}

	
    const resetBtn    = document.getElementById('reset-filters');

    const searchInput = document.querySelector('.search-input');
	const eggOverlay  = document.getElementById('egg-overlay');
    // Добавляем ссылку на кнопку очистки поиска
    const searchClearBtn = document.getElementById('search-clear');

searchInput.addEventListener('input', e => {
  // 1. Берём «сырую» строку без обрезания регистра:
  const rawQuery = e.target.value.trim();

  // 2. Приводим к нижнему для поиска по названию:
  searchQuery = rawQuery.toLowerCase();
  
  // Логика кнопки очистки
  if (rawQuery.length > 0) {
    searchClearBtn.classList.add('visible');
  } else {
    searchClearBtn.classList.remove('visible');
  }

  // ——— Пасхалка ———
  // Срабатывает **только** если пользователь ввёл ровно
  // "увы" (строчными), "УВЫ" (прописными) или "YBbI" (с точным регистром):
  if (
    rawQuery === 'увы'  ||
    rawQuery === 'УВЫ'  ||
    rawQuery === 'YBbI'
  ) {
    eggOverlay.classList.add('visible');
    return;
  } else {
    eggOverlay.classList.remove('visible');
  }
  // ——————————

  // остальная логика поиска/фильтрации:
  renderItems();
});

// Слушатель для кнопки очистки поиска
searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  searchClearBtn.classList.remove('visible');
  eggOverlay.classList.remove('visible');
  renderItems();
});
		
    // группировка
    groupToggle.addEventListener('change', () => {
      showGroups = groupToggle.checked;
      renderItems();
    });

    // сортировка цены
    function setSort(s) {
      sortState = s;
      [btnNone, btnDesc, btnAsc].forEach(b => b.classList.remove('active'));
      if (s === 0) btnNone .classList.add('active');
      if (s === 1) btnDesc .classList.add('active');
      if (s === 2) btnAsc  .classList.add('active');
      renderItems();
    }
    [btnNone, btnDesc, btnAsc].forEach((b,i)=>
      b.addEventListener('click', e=>{ e.stopPropagation(); setSort(i); })
    );

    // фильтр магии
    Object.entries(magicBtns).forEach(([key,btn]) => {
      btn.addEventListener('click', ()=>{
        Object.values(magicBtns).forEach(x=>x.classList.remove('active'));
        btn.classList.add('active');
        magicFilter = key;
        renderItems();
      });
    });

    // сброс всеобщий
    resetBtn.addEventListener('click', e=>{
      e.stopPropagation();
	    // 1) сброс состояния “Только отличия”
  diffOnly = false;
  const diffCheckbox = document.getElementById('diff-only');
  if (diffCheckbox) diffCheckbox.checked = false;
      setSort(0);
      groupToggle.checked = true; showGroups = true;
      Object.values(magicBtns).forEach(x=>x.classList.remove('active'));
      magicBtns.all.classList.add('active');
      magicFilter = 'all';
      Object.keys(attrModes).forEach(k=>{
        attrModes[k] = 'none';
        document.querySelectorAll(`.attr-filter-row button[data-key="${k}"]`)
          .forEach(x=>x.classList.remove('active'));
        document.querySelector(`.attr-filter-row button[data-key="${k}"][data-mode="none"]`)
          .classList.add('active');
      });
      // бонусный сброс
      bonusFilter = 'all';
      document.querySelectorAll('#bonus-filters .dropdown-item')
        .forEach(x=>x.classList.remove('active'));
      document.querySelector('#bonus-filters .dropdown-item[data-bonus="all"]')
        .classList.add('active');
      document.querySelector('#bonus-filters .dropdown-toggle')
        .textContent = 'Vanilla';
		      // — сброс простого фильтра —
      simpleFilterKey = null;
      // убрать «active» со всех простых кнопок
	  document
		.getElementById('simple-filters')
		.querySelectorAll('button[data-key]')
		.forEach(b => b.classList.remove('active'));

	  // --- нововведение: сброс режима простого фильтра в '*' (any) ---
	  simpleFilterMode = 'any';
	  const modeBtns = document
		.getElementById('simple-mode-controls')
		.querySelectorAll('button');
	  modeBtns.forEach(b => b.classList.remove('active'));
	  document
		.querySelector('#simple-mode-controls button[data-mode="any"]')
		.classList.add('active');

  // Сброс сравнения модов:
  mod2 = '';
  compareMode = false;
  const compareToggle = document.getElementById('toggle-compare');
compareToggle.checked = false;
compareToggle.dispatchEvent(new Event('change'));
  // — Сброс визуального состояния чекбокса "Сравнить с Vanilla"
  const compareVanillaCheckbox = document.getElementById('compare-vanilla');
  if (compareVanillaCheckbox) {
    compareVanillaCheckbox.checked = false;
    // чтобы изменения вступили в силу и UI пересоздался
    compareVanillaCheckbox.dispatchEvent(new Event('change'));
  }
  // — Сброс чекбокса Tier Mode
  const tierToggle = document.getElementById('tier-mode-toggle');
  if (tierToggle) {
      tierMode = false;
      document.body.classList.remove('tier-mode');
      tierToggle.checked = false;
  }
  
  const compareContainer = document.getElementById('compare-dropdown');
  if (compareContainer) {
    // убираем active у всех пунктов
    compareContainer
      .querySelectorAll('.dropdown-item.active')
      .forEach(it => it.classList.remove('active'));
    // и возвращаем текст кнопки к дефолту
    const toggleBtn = compareContainer.querySelector('.dropdown-toggle');
    if (toggleBtn) toggleBtn.textContent = '— нет сравнения —';
  }

  document.querySelectorAll('.tooltip-2.visible')
          .forEach(tt=>tt.classList.remove('visible'));

  // 2) Сброс поиска:
  searchQuery = '';
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.value = '';
    // Скрываем крестик при сбросе
    searchClearBtn.classList.remove('visible');
  }

	  renderItems();
	});



// Вместо Object.values(data).forEach(item => { … });
Object.values(data1).forEach(item1 => {
  const item2 = map2ByIndex[item1.GlobalIndex];

  // общие данные
  const name1 = item1.Name;
  const name2 = item2 ? item2.Name : name1;
  const gid    = GROUPS[item1.Type];
  if (!gid) return;           // если нет группы — не рендерим

  // описания и стоимость
  const desc1 = item1.Descript;
  const cost1 = Number(item1.Cost);
  const desc2 = item2 ? item2.Descript : '';
  const cost2 = item2 ? Number(item2.Cost) : null;

// ————————————————————————
//  1) Вычисляем icon1Url (Updated for UGS support)
// ————————————————————————
const icon1Url = window.resolveIconUrl(mod1, item1);

// ————————————————————————
//  2) Вычисляем icon2Url (при сравнении)
// ————————————————————————
let icon2Url = null;
if (item2 && item2.Icon) {
  icon2Url = window.resolveIconUrl(mod2, item2);
}

  // --- Иконки типов ---
  const typeIcon1 = TOOLTIP_TYPE_ICONS[item1.Type] || '';
  const typeIcon2 = item2 ? (TOOLTIP_TYPE_ICONS[item2.Type] || '') : '';

  // --- Иконки модов ---
  const modIcon1 = mod1 === 'NewMod' ? 'NewmodIcon.png' : `./${mod1}/mod.png`;
  const modIcon2 = mod2 === 'NewMod' ? 'NewmodIcon.png' : `./${mod2}/mod.png`;

  // --- НОВАЯ ЛОГИКА ГРУППИРОВКИ ---
  const processAttributes = (item) => {
      const grouped = {};
      (item._attrs || []).forEach(a => {
          if (!grouped[a.key]) grouped[a.key] = [];
          grouped[a.key].push(a.value);
      });
      
      // --- GROUPING LOGIC START ---
      const getGroupStr = (k) => (grouped[k] || []).slice().sort().join('|');

      // 1. Phys Attack
      if (grouped['Атака рукопашная'] && grouped['Атака стрелковая']) {
          if (getGroupStr('Атака рукопашная') === getGroupStr('Атака стрелковая')) {
              grouped['Физическая атака'] = grouped['Атака рукопашная'];
              delete grouped['Атака рукопашная'];
              delete grouped['Атака стрелковая'];
          }
      }
      // 2. Phys Defense
      if (grouped['Защита рукопашная'] && grouped['Защита стрелковая']) {
          if (getGroupStr('Защита рукопашная') === getGroupStr('Защита стрелковая')) {
              grouped['Физическая защита'] = grouped['Защита рукопашная'];
              delete grouped['Защита рукопашная'];
              delete grouped['Защита стрелковая'];
          }
      }
      // 3. Magic Immunity
      if (grouped['Защита от магии жизни'] && grouped['Защита от магии смерти'] && grouped['Защита от магии стихий']) {
          const sLife = getGroupStr('Защита от магии жизни');
          const sDeath = getGroupStr('Защита от магии смерти');
          const sElem = getGroupStr('Защита от магии стихий');
          if (sLife === sDeath && sLife === sElem) {
              grouped['Иммунитет к магии'] = grouped['Защита от магии жизни'];
              delete grouped['Защита от магии жизни'];
              delete grouped['Защита от магии смерти'];
              delete grouped['Защита от магии стихий'];
          }
      }
      // --- GROUPING LOGIC END ---
      
      // 1. Object for dataset (Key -> "Val1 Val2")
      const datasetObj = {};
      Object.keys(grouped).forEach(k => {
          // --- СОРТИРОВКА ЗНАЧЕНИЙ ---
          // Порядок: Set (=), Flat (+/-), Percent (%)
          grouped[k].sort((a, b) => {
              const typeA = a.startsWith('=') ? 0 : (a.endsWith('%') ? 2 : 1);
              const typeB = b.startsWith('=') ? 0 : (b.endsWith('%') ? 2 : 1);
              return typeA - typeB;
          });
          // ---------------------------
          datasetObj[k] = grouped[k].join(' ');
      });

      // 2. HTML generation
      // Sort keys
      const sortedKeys = Object.keys(grouped).sort((a, b) => {
           const ia = ATTR_ORDER.indexOf(a);
           const ib = ATTR_ORDER.indexOf(b);
           if (ia === -1 && ib === -1) return a.localeCompare(b);
           if (ia === -1) return 1;
           if (ib === -1) return -1;
           return ia - ib;
      });
      
      const html = sortedKeys.map(k => {
          let valStr;
          if (item.Type === 'Potion' && k === 'Жизнь (хиты)') {
              const parts = grouped[k].map(val => {
                  if (val.startsWith('=')) {
                      let v = val.substring(1);
                      if (!v.startsWith('-') && !v.startsWith('+')) v = '+' + v;
                      return `текущее ${v}`;
                  } else if (val.endsWith('%')) {
                      return `макс ${val}`;
                  } else {
                      return `макс ${val}`;
                  }
              });
              valStr = parts.join(', ');
          } else {
              valStr = grouped[k].join(' ');
          }
          // ВСЕГДА вставляем точку, видимость управляется классом родителя через CSS
          return `<li data-key="${k}" data-val="${grouped[k].join(' ')}"><span class="filter-dot"></span>${k.replace(/-/g,' ')}: ${window.colorizeSigns(valStr)}</li>`;
      }).join('');

      return { datasetObj, html };
  };

  // Processing item1
  const p1 = processAttributes(item1);
  const aobj1 = p1.datasetObj;
  const attrsArr1 = p1.html;

  let extra1 = [];
  if (item1.Bonus) {
    const t = item1.Bonus;
    
    if (item1.BonusIcon) {
      // ИСПОЛЬЗУЕМ ОБЩИЙ ПУТЬ bonic/ ЕСЛИ ОН ЕСТЬ, ИНАЧЕ СТАРЫЙ СПОСОБ
      const isShared = item1.BonusIcon.startsWith('bonic/');
      const p = isShared
        ? item1.BonusIcon
        : `./${mod1}/` + item1.BonusIcon.replace(/\\/g,'/');
        
      extra1.push(`<li class="bonus-line" data-key="bonus">
        <span class="filter-dot"></span><span class="bonus-text" style="--bonus-icon:url('${p}')">${t}</span>
      </li>`);
    } else {
      extra1.push(`<li class="bonus-line" data-key="bonus"><span class="filter-dot"></span><span class="bonus-text">${t}</span></li>`);
    }
  }
  let mType1 = '';
  if (item1.Magic) {
    const M = item1.Magic.toLowerCase();
    if (M.includes('смерти'))      mType1 = 'death';
    else if (M.includes('жизни'))  mType1 = 'life';
    else if (M.includes('стихий')) mType1 = 'elemental';
    
    extra1.push(`<li class="magic-line magic-${mType1}" data-key="magic">
      <span class="filter-dot"></span><span class="bonus-text">${item1.Magic}</span>
    </li>`);
  }

  // Processing item2
  let attrsArr2 = '', aobj2 = {};
  let extra2 = [], mType2 = '';
  if (item2) {
    const p2 = processAttributes(item2);
    aobj2 = p2.datasetObj;
    attrsArr2 = p2.html;
    
    if (item2.Bonus) {
      const t = item2.Bonus;
      
      if (item2.BonusIcon) {
        // ИСПОЛЬЗУЕМ ОБЩИЙ ПУТЬ bonic/ ДЛЯ MOD2
        const isShared = item2.BonusIcon.startsWith('bonic/');
        const p = isShared
            ? item2.BonusIcon
            : `./${mod2}/` + item2.BonusIcon.replace(/\\/g,'/');
            
        extra2.push(`<li class="bonus-line" data-key="bonus">
          <span class="filter-dot"></span><span class="bonus-text" style="--bonus-icon:url('${p}')">${t}</span>
        </li>`);
      } else {
        extra2.push(`<li class="bonus-line" data-key="bonus"><span class="filter-dot"></span><span class="bonus-text">${t}</span></li>`);
      }
    }
    if (item2.Magic) {
      const M2 = item2.Magic.toLowerCase();
      if (M2.includes('смерти'))      mType2 = 'death';
      else if (M2.includes('жизни'))  mType2 = 'life';
      else if (M2.includes('стихий')) mType2 = 'elemental';
      
      extra2.push(`<li class="magic-line magic-${mType2}" data-key="magic">
        <span class="filter-dot"></span><span class="bonus-text">${item2.Magic}</span>
      </li>`);
    }
  }

  // создаём карточку
  const card = document.createElement('div');
  card.className = 'item';
  card.dataset.magicType = mType1;
  card.dataset.group     = gid;
  card.dataset.name      = name1.toLowerCase();
  card.dataset.desc      = (desc1 || '').toLowerCase(); // Сохраняем описание для поиска
  card.dataset.cost      = cost1;
  card.dataset.type      = item1.Type;
  card.dataset.globalId  = item1.GlobalIndex; // For ID tracking
  card.dataset.uid       = mod1 + '_' + item1.GlobalIndex; // Уникальный ID для мода
  card.dataset.attrs     = JSON.stringify(aobj1); // Теперь тут сгруппированная строка
  card.dataset.bonus = item1.Bonus || 'all';
  card.dataset.bonus2 = item2 ? (item2.Bonus || 'all') : 'all';
  card.dataset.magicType2 = item2 ? mType2 : '';

  if (item2) {
    card.dataset.type2 = item2.Type;
    card.dataset.cost2 = cost2;
    card.dataset.attrs2 = JSON.stringify(aobj2); // Теперь тут сгруппированная строка
    // Сохраняем URL второй иконки в dataset для использования в панели сравнения
    if (icon2Url) card.dataset.icon2 = icon2Url;
  }

  // вёрстка двойных тултипов
  card.innerHTML = `
    <img src="${icon1Url}" alt="${name1}">
    <div class="tooltip tooltip-1"
         style="background-image: url('${
           useRagnarTooltip ? 'tooltip-ragn.png' : 'tooltip-bg.png'
         }')">
      ${typeIcon1 ? `<img src="${typeIcon1}" class="type-icon">` : ''}
      <img src="${modIcon1}" class="mod-icon" data-mod="${mod1}" alt="mod">
      <h3>${name1}${compareMode ? ` [${getTooltipLabel(mod1)}]` : ''}</h3>
      <p>${desc1}</p>
      <ul class="attrs">
        ${attrsArr1}
        ${extra1.join('')}
        <li class="spacer"></li>
      </ul>
      <div class="tooltip-id">ID: ${item1.GlobalIndex}</div>
      <div class="tooltip-price">
        ${cost1}<img src="gold.png" class="gold-icon" alt="Gold">
      </div>
    </div>
    ${item2 && mod2 ? `
    <div class="tooltip tooltip-2"
         style="background-image: url('${
           useRagnarTooltip ? 'tooltip-ragn.png' : 'tooltip-bg.png'
         }')">
      ${typeIcon2 ? `<img src="${typeIcon2}" class="type-icon">` : ''}
      <img src="${modIcon2}" class="mod-icon" data-mod="${mod2}" alt="mod">
      <h3>${name2}${compareMode ? ` [${getTooltipLabel(mod2)}]` : ''}</h3>
      <p>${desc2}</p>
      <ul class="attrs">
        ${attrsArr2}
        ${extra2.join('')}
        <li class="spacer"></li>
      </ul>
      <div class="tooltip-id">ID: ${item2.GlobalIndex}</div>
      <div class="tooltip-price">
        ${cost2}<img src="gold.png" class="gold-icon" alt="Gold">
      </div>
    </div>
    ` : ''}
  `;

  // позиционирование
  const tt1 = card.querySelector('.tooltip-1');
  const tt2 = card.querySelector('.tooltip-2');

  // Хелпер для определения верхней границы
  const getTopBoundary = () => {
    const isTopbarHidden = document.body.classList.contains('topbar-hidden');
    if (isTopbarHidden) return 5;
    // Высота шапки 60px + небольшой отступ
    const topBarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--top-bar-height')) || 60;
    return topBarHeight + 23;
  };

 function positionSingle(tt, side, isPair = false) {
  // ——— Вертикальный fallback, если нет места слева и справа ———
  const cR = card.getBoundingClientRect();
  const tR = tt.getBoundingClientRect();
  const topBoundary = getTopBoundary();
  
  
  // вычисляем правую границу с учётом док-панели
  const panelLeft = sidePanel.getBoundingClientRect().left;
  const usableRight = (dockMode && sidePanel.classList.contains('open'))
                      ? panelLeft
                      : window.innerWidth;
                      
  // Вычисляем левую границу с учетом новой левой панели сравнения
  // Ширина зависит от класса compare-wide
  const leftPanelWidth = document.body.classList.contains('compare-wide') ? 600 : 400;
  
  const usableLeft = (document.body.classList.contains('compare-open')) 
                     ? leftPanelWidth 
                     : 0;

  // проверяем, влезет ли тултип справа или слева
  const fitsRight = cR.right + tR.width <= usableRight - EDGE_MARGIN;
  const fitsLeft  = cR.left  - tR.width >= usableLeft + EDGE_MARGIN;
  
    // === ПАТЧ: если включён compareMode, но второй тултип нет (tt2===null),
  // и справа нет места из‑за док-панели — сразу вертикальный фолбэк ===
  if (compareMode && !tt2 && side === 'right' && dockMode
      && sidePanel.classList.contains('open') && !fitsRight) {
    const gap = 8;
    // сначала пробуем под карточкой
    const below = cR.bottom + gap;
    let top;
    if (below + tR.height <= window.innerHeight) {
      top = below;
    } else {
      // иначе — над карточкой
      top = Math.max(topBoundary, cR.top - gap - tR.height);
    }
    // центрируем по горизонтали, но не выходим за пределы
    const centerX = cR.left + (cR.width - tR.width) / 2;
    const left = Math.max(
      usableLeft + EDGE_MARGIN,
      Math.min(centerX, usableRight - tR.width - EDGE_MARGIN)
    );
    tt.classList.add('visible');
    tt.style.left = `${left}px`;
    tt.style.top  = `${top}px`;
    return;
  }
  // === /ПАТЧ ===
  
  if (!fitsRight && !fitsLeft) {
    const gap = 8;
    // сначала пробуем под карточкой
    const below = cR.bottom + gap;
    let top;
    if (below + tR.height <= window.innerHeight) {
      // помещается под предметом
      top = below;
    } else {
      // иначе — над предметом
      top = Math.max(topBoundary, cR.top - gap - tR.height);
    }
    // по горизонтали — прижимаем к соответствующему краю
    let left;
    if (side === 'left') {
      // левый край доступной области
      left = usableLeft + EDGE_MARGIN;
    } else {
      // правый край / док‑панель
      left = usableRight - tR.width - EDGE_MARGIN;
    }
    tt.classList.add('visible');
    tt.style.left = `${left}px`;
    tt.style.top  = `${top}px`;
    return;
  }
     tt.classList.add('visible');
     tt.style.left = tt.style.top = '0';
    let left;

    // если режим сравнения выключен, то при правом side проверяем выход за правый край
    if (!compareMode && side === 'right') {
      // если справа не помещается — рисуем слева
      if (cR.right + tR.width > window.innerWidth) {
        left = cR.left - tR.width;
      } else {
        left = cR.right;
      }
    } else {
      // обычная логика (для сравнения или для левых подсказок)
      left = side === 'right'
        ? cR.right
        : cR.left - tR.width;
    }
// проверка док-режима ТОЛЬКО если выключено сравнение
if (!compareMode && side === 'right' && dockMode && sidePanel.classList.contains('open')) {
  const max = sidePanel.getBoundingClientRect().left;
  if (left + tR.width > max) {
    left = cR.left - tR.width;
  }
}

  // ограничиваем левый край с отступом EDGE_MARGIN от скроллбара
  left = Math.max(
    usableLeft + EDGE_MARGIN,
    Math.min(left, window.innerWidth - tR.width - EDGE_MARGIN)
  );
  // сначала обычная «идеальная» позиция по центру
  const desiredTop = cR.top + (cR.height - tR.height) / 2;

  let top;
  // если выходит за верх — прижимаем к верху (мнимому)
  if (desiredTop < topBoundary) {
    top = topBoundary;
  }
  // если выходит за низ
  else if (desiredTop + tR.height > window.innerHeight) {
    // только для ПРАВОЙ подсказки в простом режиме
    if (!compareMode && side === 'right') {
      // рисуем над карточкой
      top = Math.max(topBoundary, cR.top - tR.height);
    } else {
      // fallback — зажмём к низу
      top = window.innerHeight - tR.height;
    }
  } else {
    // вполне помещается — ставим как центр
    top = desiredTop;
  }
  
    // ——— дополнительная коррекция для случая одной подсказки в compareMode ———
  if (compareMode) {
	  
    const gap = 8;
    // 1) не упираться в док‑панель (если открыта)
    if (dockMode && sidePanel.classList.contains('open')) {
      const panelL = sidePanel.getBoundingClientRect().left;
      if (left + tR.width > panelL - EDGE_MARGIN) {
        left = panelL - tR.width - EDGE_MARGIN;
      }
    }
    // 2) не вылезать за низ экрана
    const r = { top, left, width: tR.width, height: tR.height };
    if (r.top + r.height > window.innerHeight - EDGE_MARGIN) {
      // фоллбэк: поднимаем над карточкой
      const newTop = cR.top - gap - tR.height;
      top = Math.max(topBoundary, newTop);
    }
  }

  // --- Анти-перекрытие с закрепленным тултипом (selectedCard) ---
  if (selectedCard && selectedCard !== card) {
    const selTooltips = Array.from(selectedCard.querySelectorAll('.tooltip.visible'));
    
    const isOverlap = (l, t, w, h) => {
      for (const selTt of selTooltips) {
        const aR = selTt.getBoundingClientRect();
        const gap = 8;
        if (!(l + w + gap <= aR.left || l >= aR.right + gap || t + h + gap <= aR.top || t >= aR.bottom + gap)) {
          return aR;
        }
      }
      return null;
    };

    let overlapRect = isOverlap(left, top, tR.width, tR.height);
    if (overlapRect) {
      const gap = 8;
      let newTop, newLeft;
      let resolved = false;

      // 1. Под закрепленным
      newTop = overlapRect.bottom + gap;
      if (newTop + tR.height <= window.innerHeight && !isOverlap(left, newTop, tR.width, tR.height)) {
        top = newTop;
        resolved = true;
      }
      
      // 2. Над закрепленным
      if (!resolved) {
        newTop = overlapRect.top - gap - tR.height;
        if (newTop >= topBoundary && !isOverlap(left, newTop, tR.width, tR.height)) {
          top = newTop;
          resolved = true;
        }
      }
      
      // 3. С другой стороны карточки
      if (!resolved) {
        newLeft = (left >= cR.right) 
                  ? Math.max(usableLeft + EDGE_MARGIN, cR.left - tR.width) 
                  : Math.min(usableRight - tR.width - EDGE_MARGIN, cR.right);
        newTop = cR.top + (cR.height - tR.height) / 2;
        if (newTop < topBoundary) newTop = topBoundary;
        if (newTop + tR.height > window.innerHeight) newTop = Math.max(topBoundary, cR.top - tR.height);

        if (!isOverlap(newLeft, newTop, tR.width, tR.height)) {
          left = newLeft;
          top = newTop;
          resolved = true;
        }
      }
      
      // 4. Над самой карточкой
      if (!resolved) {
        newTop = cR.top - gap - tR.height;
        if (newTop >= topBoundary && !isOverlap(left, newTop, tR.width, tR.height)) {
          top = newTop;
          resolved = true;
        }
      }
      
      // 5. Под самой карточкой
      if (!resolved) {
        newTop = cR.bottom + gap;
        if (newTop + tR.height <= window.innerHeight && !isOverlap(left, newTop, tR.width, tR.height)) {
          top = newTop;
          resolved = true;
        }
      }
    }
  }

     tt.style.left = `${left}px`;
     tt.style.top  = `${top}px`;
   }


function positionBoth() {
	  tt1.classList.add('visible');
  if (tt2) tt2.classList.add('visible');
	const cR = card.getBoundingClientRect();
  const topBoundary = getTopBoundary();

// 1) Сначала позиционируем оба тултипа по-умолчанию

  const panelLeft = sidePanel.getBoundingClientRect().left;
  const usableRight = (dockMode && sidePanel.classList.contains('open'))
                      ? panelLeft
                      : window.innerWidth;
  
  // Динамический расчет ширины левой панели
  const leftPanelWidth = document.body.classList.contains('compare-wide') ? 600 : 400;
  const usableLeft = (document.body.classList.contains('compare-open')) 
                     ? leftPanelWidth 
                     : 0;
                     
  const gap = 8;
  // === SPECIAL CASE: оба тултипа не влазят по горизонтали ===
  if (tt2) {
    const t1R = tt1.getBoundingClientRect();
    const t2R = tt2.getBoundingClientRect();
    const fitsRight1 = cR.right + t1R.width <= usableRight - EDGE_MARGIN;
    const fitsLeft2  = cR.left  - t2R.width >= usableLeft + EDGE_MARGIN;
    if (!fitsRight1 && !fitsLeft2) {
      // левый тултип (tt2) — сперва снизу, иначе сверху
      const below2 = cR.bottom + gap;
      let top2, t2Above = false;
      if (below2 + t2R.height <= window.innerHeight) {
        top2 = below2;
      } else {
        top2 = Math.max(topBoundary, cR.top - gap - t2R.height);
        t2Above = true;
      }
      tt2.style.top  = `${top2}px`;
      tt2.style.left = `${usableLeft + EDGE_MARGIN}px`;

      // правый тултип (tt1) — сперва над карточкой
      const above1 = cR.top - gap - t1R.height;
      tt1.style.top  = `${Math.max(topBoundary, above1)}px`;
      tt1.style.left = `${usableRight - t1R.width - EDGE_MARGIN}px`;



      // если оба тултипа оказались сверху — сдвигаем правый дальше, чтобы не перекрывать
      if (t2Above) {
        const newTop1 = top2 - gap - t1R.height;
        tt1.style.top = `${Math.max(topBoundary, newTop1)}px`;
      }

      // === НОВАЯ НАДСТРОЙКА ===
      // В режиме сравнения, если правая подсказка уперлась в верх,
      // рисуем её под карточкой и левую — сразу под правой.
      if (compareMode) {
        const r1check = tt1.getBoundingClientRect();
        // detect top edge (using boundary)
        if (r1check.top <= topBoundary + EDGE_MARGIN) {
          // 1) смещаем правую вниз под карточку
          tt1.style.top = `${cR.bottom + gap}px`;
          // 2) и левую сразу под ней
          tt2.style.top = `${tt1.getBoundingClientRect().bottom + gap}px`;
          tt2.style.left = `${usableLeft + EDGE_MARGIN}px`;
        }
      }
// после всех setTop/setLeft, но до return:
[tt1, tt2].forEach(tt => {
  const r = tt.getBoundingClientRect();
  if (r.bottom > window.innerHeight) {
    tt.style.top = `${Math.max(topBoundary, window.innerHeight - r.height)}px`;
  }
});

  {
    const gap = 8;
    const r1 = tt1.getBoundingClientRect();
    const r2 = tt2.getBoundingClientRect();

    // если tt2 свалилась ниже видимой области
    if (r2.bottom > window.innerHeight) {
      const newTop2 = r1.top - gap - r2.height;
      tt2.style.top = `${Math.max(topBoundary, newTop2)}px`;
    }
  }
  
    // === НОВОЕ: если вторая подсказка свалилась за низ — ставим её над первой ===
  {
    const r1 = tt1.getBoundingClientRect();
    const r2 = tt2.getBoundingClientRect();
    if (r2.bottom > window.innerHeight) {
      const newTop2 = r1.top - gap - r2.height;
      tt2.style.top = `${Math.max(topBoundary, newTop2)}px`;
    }
  }

  // === НОВОЕ: если ОДНА из подсказок упёрлась в верх — вторая под её низ ===
  {
    const r1 = tt1.getBoundingClientRect();
    const r2 = tt2.getBoundingClientRect();

    // если правая (tt1) упрелась в верх, то левая (tt2) — сразу под ней
    if (r1.top <= topBoundary + EDGE_MARGIN) {
      const newTop2 = r1.bottom + gap;
      tt2.style.top = `${newTop2}px`;
    }
    // или наоборот: если левая упрелась в верх — правая под ней
    else if (r2.top <= topBoundary + EDGE_MARGIN && r1.top > topBoundary + EDGE_MARGIN) {
      tt1.style.top = `${r2.bottom + gap}px`;
    }
  }
  

      return;
    }

  }


  // ——— Правый тултип (tt1) ———
  {
    const t1R = tt1.getBoundingClientRect();
    const fitsRight1 = cR.right + t1R.width <= usableRight - EDGE_MARGIN;
    if (!fitsRight1) {
      // вертикальный фолбэк для tt1
      const below1 = cR.bottom + gap;
      const top1 = (below1 + t1R.height <= window.innerHeight)
        ? below1
        : Math.max(topBoundary, cR.top - gap - t1R.height);
      // прижать к правому краю / док‑панели
      const left1 = usableRight - t1R.width - EDGE_MARGIN;
      tt1.style.top  = `${top1}px`;
      tt1.style.left = `${left1}px`;
    } else {
      positionSingle(tt1, 'right');
    }
  }

if (!tt2) return;
{
  // 1) Сначала обычная позиция (боковая или вертикальная) через ваш код:
  const t2R = tt2.getBoundingClientRect();
  const fitsLeft2 = cR.left - t2R.width >= usableLeft + EDGE_MARGIN;
  if (!fitsLeft2) {
    // вертикальный фолбэк для tt2
    const below2 = cR.bottom + gap;
      const top2 = (below2 + t2R.height <= window.innerHeight)
        ? below2
        : Math.max(topBoundary, cR.top - gap - t2R.height);
      // прижать к левому краю
      const left2 = usableLeft + EDGE_MARGIN;
    tt2.style.top  = `${top2}px`;
    tt2.style.left = `${left2}px`;
  } else {
    positionSingle(tt2, 'left');
  }

  // 2) Анти-оверлейп: корректируем tt2 только если она сама не поместилась слева
  const r1 = tt1.getBoundingClientRect();
  const r2new = tt2.getBoundingClientRect();
  const overlapVertically   = !(r2new.bottom <= r1.top   || r2new.top >= r1.bottom);
  const overlapHorizontally = !(r2new.right  <= r1.left  || r2new.left >= r1.right);
  // fitsLeft2 уже был рассчитан выше при первом getBoundingClientRect(tt2)
  if (!fitsLeft2 && overlapVertically && overlapHorizontally) {
    const belowOther = r1.bottom + gap;
    const newTop = (belowOther + r2new.height <= window.innerHeight)
      ? belowOther
      : Math.max(topBoundary, r1.top - gap - r2new.height);
    tt2.style.top = `${newTop}px`;
  }
  
}

///



  // 2) Получаем их текущие rect
  let r1 = tt1.getBoundingClientRect();
  let r2 = tt2.getBoundingClientRect();

  // 3) --- НОВАЯ ЛОГИКА: падение из-за док-панели ---
if (compareMode && dockMode && sidePanel.classList.contains('open')) {
  const panelLeft = sidePanel.getBoundingClientRect().left;
  // 1) детектим упор в панель
  if (r1.right > panelLeft) {
    const gap = 8;
    // — «прижимаем» к панели
    const clampedLeft = panelLeft - r1.width;
    tt1.style.left = `${clampedLeft}px`;

    // 2) считаем, куда бы мы его опустили под левым тултипом
    const belowTop = r2.bottom + gap;

    // 3) проверяем: если это место + высота тултипа уходит за экран,
    //     рисуем над карточкой, иначе — внизу
    if (belowTop + r1.height > window.innerHeight) {
      // берём r2.top, как в общем правиле: рисуем над второй подсказкой
      const aboveTop = r2.top - gap - r1.height;
      top = Math.max(topBoundary, aboveTop);
      tt1.style.top = `${top}px`;
    } else {
      tt1.style.top = `${belowTop}px`;
    }

    return;  // дальше ничего не делаем
  }
}


  // 4) Ваши уже существующие «край экрана» правила
  // 4.1) если второй тултип упёрся в левый край
  if (r2.left <= usableLeft + EDGE_MARGIN) {
    const gap = 8;
    tt2.style.top = `${r1.bottom + gap}px`;
  }
  // 4.2) если первый (правый) тултип упёрся в правый край — прижимаем к границе и делаем vertical‑fallback
  else {
    const rightScreenEdge = window.innerWidth;
    const panelLeft = sidePanel.getBoundingClientRect().left;
    const usableRight = (dockMode && sidePanel.classList.contains('open'))
                        ? panelLeft
                        : rightScreenEdge;

    if (r1.right >= usableRight - EDGE_MARGIN) {
      const gap = 8;
      // прижимаем к правому краю / док‑панели
      const clampedLeft = usableRight - r1.width - EDGE_MARGIN;
      tt1.style.left = `${clampedLeft}px`;
      // vertical‑fallback: сперва пытаемся отрисоваться ПОД tt2, иначе — НАД ним
      const below = r2.bottom + gap;
      const top = (below + r1.height <= window.innerHeight)
        ? below
        : Math.max(topBoundary, r2.top - gap - r1.height);
      tt1.style.top = `${top}px`;
    }
  }
  
  
// --- Новая проверка: если тултипы уезжают за низ экрана ---
if (compareMode) {
  const gap = 8;

  // Если первый тултип опустился слишком низко — поднимаем над карточкой
  if (r1.bottom > window.innerHeight) {
    const height1 = r1.height;
    const newTop1 = cR.top - gap - height1;
    tt1.style.top = `${Math.max(topBoundary, newTop1)}px`;
    // сразу пересчитываем r1
    r1 = tt1.getBoundingClientRect();
  }

  // **ПЕРЕСЧИТЫВАЕМ r2** перед тем, как решать, куда ставить вторую подсказку
  r2 = tt2.getBoundingClientRect();

  // Если второй тултип опустился слишком низко — поднимаем над первой
  if (r2.bottom > window.innerHeight) {
    const height2 = r2.height;
    // используем уже обновлённое r1.top
    const newTop2 = r1.top - gap - height2;
    tt2.style.top = `${Math.max(topBoundary, newTop2)}px`;
  }
}
  
  

    // === НОВЫЙ КЕЙС: если один тултип прижался вверху, второй — сбоку — 
  //              опустим его под «верхний» ===
  if (tt2) {
    const r1 = tt1.getBoundingClientRect();
    const r2 = tt2.getBoundingClientRect();
    // если tt1 упёрлась в верх, а tt2 стоит сбоку
    if (r1.top <= topBoundary + EDGE_MARGIN && r2.top > topBoundary + EDGE_MARGIN) {
      tt2.style.top = `${r1.bottom + gap}px`;
    }
    // или наоборот: если tt2 упёрлась в верх, а tt1 — сбоку
    else if (r2.top <= topBoundary + EDGE_MARGIN && r1.top > topBoundary + EDGE_MARGIN) {
      tt1.style.top = `${r2.bottom + gap}px`;
    }
  }

  // --- Анти-перекрытие с закрепленным тултипом (selectedCard) для positionBoth ---
  if (selectedCard && selectedCard !== card) {
    const selTooltips = Array.from(selectedCard.querySelectorAll('.tooltip.visible'));
    
    const isOverlap = (l, t, w, h) => {
      for (const selTt of selTooltips) {
        const aR = selTt.getBoundingClientRect();
        const gap = 8;
        if (!(l + w + gap <= aR.left || l >= aR.right + gap || t + h + gap <= aR.top || t >= aR.bottom + gap)) {
          return aR;
        }
      }
      return null;
    };

    const resolveOverlap = (ttEl) => {
      let rect = ttEl.getBoundingClientRect();
      let l = rect.left, t = rect.top, w = rect.width, h = rect.height;
      let overlapRect = isOverlap(l, t, w, h);
      
      if (overlapRect) {
        const gap = 8;
        let newTop;
        
        // 1. Пробуем под закрепленным
        newTop = overlapRect.bottom + gap;
        if (newTop + h <= window.innerHeight && !isOverlap(l, newTop, w, h)) {
          ttEl.style.top = `${newTop}px`;
          return;
        }
        // 2. Пробуем над закрепленным
        newTop = overlapRect.top - gap - h;
        if (newTop >= topBoundary && !isOverlap(l, newTop, w, h)) {
          ttEl.style.top = `${newTop}px`;
          return;
        }
        // 3. Под карточкой
        newTop = cR.bottom + gap;
        if (newTop + h <= window.innerHeight && !isOverlap(l, newTop, w, h)) {
          ttEl.style.top = `${newTop}px`;
          return;
        }
        // 4. Над карточкой
        newTop = cR.top - gap - h;
        if (newTop >= topBoundary && !isOverlap(l, newTop, w, h)) {
          ttEl.style.top = `${newTop}px`;
          return;
        }
      }
    };

    resolveOverlap(tt1);
    resolveOverlap(tt2);
  }
  
}




if (supportsHover) {
// mouseenter
card.addEventListener('mouseenter', () => {
  card.classList.add('hovered');
  
  // ЗАПУСКАЕМ СРАВНЕНИЕ (через window)
  window.applyComparison(card);
  
  // В режиме Tier: если мы тащим предмет, подсвечиваем цель
  if (tierMode && floatingItem) {
      // Логика визуального призрака
      // Она обрабатывается в handleTierMove, здесь только hover эффект CSS
  }

  if (card.classList.contains('selected')) return;
  
  // Если Tier Mode включен, тултипы показываем только если не тащим предмет
  if (tierMode && floatingItem) return;
  
  // если режим сравнения включён и второй тултип есть — рисуем оба
  if (compareMode && tt2) {
    positionBoth();
  } else {
    // иначе — только первый (mod1)
    positionSingle(tt1, 'right');
  }
});

// mouseleave
card.addEventListener('mouseleave', () => {
  card.classList.remove('hovered');
  
  // СБРАСЫВАЕМ СРАВНЕНИЕ (через window)
  window.clearComparison();
  
  if (card.classList.contains('selected')) return;

  tt1.classList.remove('visible');
  if (tt2) tt2.classList.remove('visible');
});
}

// click (выбор)
card.addEventListener('click', e => {
  e.stopPropagation();
  
  // === TIER MODE LOGIC ===
  if (tierMode) {
      handleTierClick(card);
      return;
  }
  // =======================
  
  // === НОВАЯ ЛОГИКА: если открыта левая панель, закрепляем предмет там ===
  if (document.body.classList.contains('compare-open')) {
    const uid = card.dataset.uid;
    if (window.pinnedItemIds && window.pinnedItemIds.has(uid)) {
        // Уже закреплен - открепляем
        const pinned = document.querySelector(`.compare-panel-content .pinned-item[data-uid="${uid}"]`);
        if (pinned) pinned.remove();
        window.pinnedItemIds.delete(uid);
        card.classList.remove('is-pinned');
        window.checkComparePanelState();
    } else {
        // Закрепляем
        window.addToComparePanel(card);
    }
    return;
  }
  
  if (selectedCard && selectedCard !== card) {
    selectedCard.classList.remove('selected');
    selectedCard.querySelectorAll('.tooltip').forEach(x=>x.classList.remove('visible'));
  }
  const isSel = card.classList.toggle('selected');
  if (isSel) {
    // при клике рисуем тултипы в зависимости от режима
    if (compareMode && tt2) {
      positionBoth();
    } else {
      positionSingle(tt1, 'right');
    }
    selectedCard = card;
  } else {
    tt1.classList.remove('visible');
    if (tt2) tt2.classList.remove('visible');
    selectedCard = null;
  }
});
  
  
  
  
  
  window.addEventListener('resize', () => {
    if (selectedCard === card) positionBoth();
  });

  ItemsData.push(card);
});


// ОБРАБОТЧИКИ КНОПОК ПЕРЕНЕСЕНЫ В ГЛОБАЛЬНЫЙ ДЕЛЕГАТ (onDocumentClick)
// это решает проблему с их "отключением" при смене модов

// --- TIER LIST LOGIC FUNCTIONS ---

// Структура для хранения временной цели перетаскивания (Group + Index)
// Используется для стабильной вставки и предотвращения мерцания
let dropTargetState = { group: null, index: null, ghostInDom: false };

function handleTierClick(card) {
    const globalId = card.dataset.globalId;
    
    // Если мы уже тащим что-то
    if (floatingItem) {
        // Кликнули второй раз - бросаем
        dropFloatingItem(); 
    } else {
        // Кликнули первый раз - поднимаем
        pickupFloatingItem(card, globalId);
    }
}

function pickupFloatingItem(card, id) {
    // 1. Создаем визуальную копию для курсора
    floatingEl = card.cloneNode(true);
    floatingEl.className = 'item tier-floating';
    floatingEl.style.width = card.style.width;
    floatingEl.style.height = card.style.height;
    
    // Убираем тултипы из копии, чтобы не мешали
    floatingEl.querySelectorAll('.tooltip').forEach(el => el.remove());
    
    document.body.appendChild(floatingEl);
    
    // 2. Скрываем оригинал (или делаем полупрозрачным)
    card.classList.add('tier-picked-up');
    
    // 3. Запоминаем состояние
    // Ищем, в какой группе сейчас этот ID
    let originGroup = 10;
    const currentTierData = tierDataStorage[currentMode];
    
    // Находим группу
    for (let grp in currentTierData) {
        if (currentTierData[grp].includes(id)) {
            originGroup = parseInt(grp);
            break;
        }
    }
    
    floatingItem = {
        id: id,
        originGroup: originGroup,
        element: card
    };
    
    // Инициализируем состояние броска
    dropTargetState = { group: null, index: null, ghostInDom: false };
    
    // Создаем элемент-призрак (он будет перемещаться по DOM)
    // Но пока не вставляем его
    const ghost = document.createElement('div');
    ghost.className = 'item tier-ghost';
    ghost.id = 'active-tier-ghost';
    // Храним ссылку глобально (или в floatingItem), но лучше найти по ID когда нужно
}

// Отмена перетаскивания
function cancelTierDrag() {
    if (!floatingItem) return;
    
    // Удаляем флоатер
    if (floatingEl) floatingEl.remove();
    
    // Возвращаем оригинал
    if (floatingItem.element) {
        floatingItem.element.classList.remove('tier-picked-up');
    }
    
    // Удаляем призрак
    const ghost = document.getElementById('active-tier-ghost');
    if (ghost) ghost.remove();
    
    // Сбрасываем переменные
    floatingItem = null;
    floatingEl = null;
    dropTargetState = { group: null, index: null, ghostInDom: false };
}

function dropFloatingItem() {
    if (!floatingItem) return;
    
    // 1. Смотрим, где сейчас находится ПРИЗРАК в DOM
    const ghost = document.getElementById('active-tier-ghost');
    
    // Если призрак не в DOM (бросили мимо группы), просто отменяем
    if (!ghost) {
        cancelTierDrag();
        return;
    }
    
    // 2. Определяем целевую группу
    const groupDiv = ghost.closest('.group');
    if (!groupDiv) {
        cancelTierDrag();
        return;
    }
    
    // Парсим ID группы (group-X)
    const targetGroupNum = parseInt(groupDiv.id.replace('group-', ''));
    if (isNaN(targetGroupNum)) {
        cancelTierDrag();
        return;
    }
    
    // 3. Определяем индекс вставки
    // Для этого смотрим, каким по счету ребенком является ghost в своем контейнере
    // Исключаем сам ghost из подсчета, но нам важен его индекс среди .item:not(.tier-ghost)
    // НО: данные хранят ID. Нам нужно вставить ID в массив в нужное место.
    
    const itemsContainer = groupDiv.querySelector('.Items');
    const children = Array.from(itemsContainer.children);
    
    // Находим индекс призрака среди всех детей
    const ghostIndex = children.indexOf(ghost);
    
    // Теперь нужно понять, какой это индекс в массиве данных.
    // Фильтруем детей, оставляя только "настоящие" предметы (исключая picked-up оригинал)
    // ВАЖНО: tier-picked-up всё еще в DOM, но мы его будем переносить.
    // При формировании нового списка для группы, мы:
    // 1. Берем ID всех видимых .item (кроме ghost и picked-up)
    // 2. Вставляем ID нашего предмета в позицию, соответствующую ghost.
    
    const newGroupIds = [];
    let inserted = false;
    
    children.forEach(child => {
        if (child === ghost) {
            newGroupIds.push(floatingItem.id);
            inserted = true;
        } else if (child.classList.contains('item') && !child.classList.contains('tier-picked-up')) {
            newGroupIds.push(child.dataset.globalId);
        }
    });
    
    // Если по какой-то причине призрак был последним и цикл не сработал (хотя forEach пройдет по нему)
    // или контейнер был пуст
    if (!inserted && children.includes(ghost)) { 
         // Это fallback, скорее всего не нужен при правильном цикле
         newGroupIds.push(floatingItem.id);
    }
    
    // 4. Обновляем данные
    const currentTierData = tierDataStorage[currentMode];
    
    // Удаляем ID из старой группы (если она другая или та же - не важно, мы уже сформировали новый список для новой группы)
    // НО: если группа та же, мы уже сформировали новый список.
    // А если группа другая, надо из старой удалить.
    
    if (targetGroupNum !== floatingItem.originGroup) {
        // Удаляем из старой
        const oldList = currentTierData[floatingItem.originGroup];
        const idx = oldList.indexOf(floatingItem.id);
        if (idx > -1) oldList.splice(idx, 1);
    } else {
        // Если группа та же, старый список нам больше не нужен, мы его перезапишем новым
    }
    
    // Записываем новый список в целевую группу
    currentTierData[targetGroupNum] = newGroupIds;
    
    // 5. Очистка и перерисовка
    if (floatingEl) floatingEl.remove();
    if (floatingItem.element) floatingItem.element.classList.remove('tier-picked-up'); // На всякий случай
    ghost.remove();
    
    floatingItem = null;
    floatingEl = null;
    dropTargetState = { group: null, index: null, ghostInDom: false };
    
    renderItems();
}

// Глобальный слушатель движения мыши для "прилипания"
let lastMouseX = 0, lastMouseY = 0;
let isDragUpdatePending = false;

document.addEventListener('mousemove', (e) => {
    if (!tierMode || !floatingItem || !floatingEl) return;
    
    // 1. Мгновенное визуальное обновление (CSS pointer-events: none делает это безопасным)
    floatingEl.style.left = (e.clientX + 10) + 'px';
    floatingEl.style.top = (e.clientY + 10) + 'px';
    
    // Сохраняем координаты для троттлинга
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    
    // 2. Троттлинг тяжелой логики (поиск позиции)
    if (isDragUpdatePending) return;
    
    isDragUpdatePending = true;
    requestAnimationFrame(() => {
        performDragLogic(lastMouseX, lastMouseY);
        isDragUpdatePending = false;
    });
});

function performDragLogic(x, y) {
    // ВАЖНО: Если мы уже отпустили предмет, но RAF сработал позже - очищаем и выходим
    if (!floatingItem) {
        const ghost = document.getElementById('active-tier-ghost');
        if (ghost) ghost.remove();
        return;
    }

    // ВАЖНО: Мы НЕ скрываем floatingEl (display: none/block), так как у него есть pointer-events: none в CSS.
    // Это избавляет от двойного Reflow/Layout Thrashing на каждом движении.
    const elemBelow = document.elementFromPoint(x, y);
    
    if (!elemBelow) return;
    
    // Определяем группу под курсором
    const groupDiv = elemBelow.closest('.group');
    if (!groupDiv) return;
    
    const itemsContainer = groupDiv.querySelector('.Items');
    if (!itemsContainer) return;
    
    // Создаем или находим призрак
    let ghost = document.getElementById('active-tier-ghost');
    if (!ghost) {
        // --- ИЗМЕНЕНИЕ: Клонируем оригинальный элемент, чтобы получить картинку ---
        ghost = floatingItem.element.cloneNode(true);
        ghost.className = 'item tier-ghost';
        ghost.id = 'active-tier-ghost';
        
        // Очищаем классы состояний и тултипы, чтобы они не мешали
        ghost.classList.remove('selected', 'hovered', 'tier-picked-up');
        ghost.querySelectorAll('.tooltip').forEach(el => el.remove());
    }
    
    // Вычисляем позицию вставки
    const siblings = Array.from(itemsContainer.children).filter(child => 
        child.classList.contains('item') && 
        !child.classList.contains('tier-ghost') && 
        !child.classList.contains('tier-floating') && 
        !child.classList.contains('tier-picked-up')
    );
    
    // Находим элемент, ПЕРЕД которым нужно вставить призрак
    const nextSibling = siblings.find(sibling => {
        const rect = sibling.getBoundingClientRect();
        
        // Если курсор Y ниже низа элемента - точно после (идем дальше)
        if (y > rect.bottom) return false;
        
        // Если курсор внутри вертикальных границ (в той же строке):
        if (y < rect.bottom && y > rect.top) {
             // Проверяем горизонталь: если курсор левее центра
             const centerX = rect.left + rect.width / 2;
             return x < centerX;
        }
        
        // Если курсор выше середины строки
        const centerY = rect.top + rect.height / 2;
        if (y < centerY) {
             return true;
        }
        
        return false;
    });
    
    // Вставляем призрак
    if (nextSibling) {
        // Оптимизация: проверяем, не стоит ли уже призрак там
        if (ghost.nextElementSibling !== nextSibling) {
            itemsContainer.insertBefore(ghost, nextSibling);
        }
    } else {
        // Если nextSibling не найден, значит в конец списка
        if (ghost.nextElementSibling) { // Если призрак не последний
             itemsContainer.appendChild(ghost);
        } else if (ghost.parentElement !== itemsContainer) {
             itemsContainer.appendChild(ghost);
        }
    }
}

// Слушатель для клика по пустым местам групп (если кликнули не в предмет, а в padding группы)
// Хотя дроп теперь обрабатывается в handleTierClick по клику, нам нужен listener для "броска в пустоту" группы
document.addEventListener('click', (e) => {
    if (!tierMode || !floatingItem) return;
    
    // Если клик по карточке - обработано в card.click -> handleTierClick
    if (e.target.closest('.item')) return;
    
    // Если у нас в руках предмет, и мы кликнули в любое свободное место
    // (на заголовок, фон страницы, промежуток) — отпускаем предмет.
    // Логика dropFloatingItem сама найдет призрака в DOM и вставит предмет туда.
    dropFloatingItem();
});

// Отмена переноса по Escape ИЛИ Right Click
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tierMode && floatingItem) {
        cancelTierDrag();
    }
});

// Глобальный обработчик контекстного меню для отмены перетаскивания
document.addEventListener('contextmenu', (e) => {
    if (tierMode && floatingItem) {
        e.preventDefault(); // Не показываем меню
        e.stopPropagation();
        cancelTierDrag(); // Отменяем драг
        return false;
    }
});

///////

//
// F) фильтры по атрибутам и бонусам
//
//const attrModes = {};


// 1) Собираем все ключи
const attrKeys = new Set();
Object.values(data1).forEach(item=>
  (item._attrs||[]).forEach(a=>attrKeys.add(a.key))
);

// 2) Формируем массив {key,label}
const rawAttrs = Array.from(attrKeys).map(k=>({
  key:   k,
  label: k.replace(/-/g,' ')
}));

// 3) Точно такие же excludedKeys, как в filters.js:
const excludedKeys = [
  'Физическая защита',
  'Физическая атака',
  'Иммунитет к магии'
];

// 4) Тот же ATTR_ORDER уже определен глобально в начале файла

// 5) Формируем простую версию списка (без excluded) и сортируем по ATTR_ORDER
const simpleList = rawAttrs
  .filter(a => !excludedKeys.includes(a.key))
  .sort((a, b) => {
    const ia = ATTR_ORDER.indexOf(a.key);
    const ib = ATTR_ORDER.indexOf(b.key);
    if (ia === -1 && ib === -1) return a.label.localeCompare(b.label);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

// 6') Рисуем простые кнопки в два столбика
simpleContainer.innerHTML = '';
const modeControls = document.createElement('div');
modeControls.id = 'simple-mode-controls';
modeControls.innerHTML = `
  <button data-mode="any">—</button>
  <button data-mode="minus">-x</button>
  <button data-mode="plus">+x</button>
  <button data-mode="eq">=x</button>
`;
 // выставляем активную кнопку в соответствие с глобальным simpleFilterMode
 modeControls.querySelectorAll('button').forEach(b => b.classList.remove('active'));
 const activeBtn = modeControls.querySelector(`button[data-mode="${simpleFilterMode}"]`);
 if (activeBtn) activeBtn.classList.add('active');
modeControls.addEventListener('click', e => {
  if (e.target.tagName !== 'BUTTON') return;
  modeControls.querySelectorAll('button')
              .forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  simpleFilterMode = e.target.dataset.mode;
  renderItems();
});

 // Вставляем #simple-mode-controls сразу под фильтром по магии
 const filterControls = sidePanel.querySelector('.filter-controls');
 const magicFilterDiv = filterControls.querySelector('.magic-filter');
 magicFilterDiv.insertAdjacentElement('afterend', modeControls);

const firstCount = Math.floor(simpleList.length / 2);
simpleList.forEach(({ key, label }, i) => {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.dataset.key = key;
    // если до этого уже был выбран простой фильтр — подсветить его
  if (simpleFilterKey === key) {
    btn.classList.add('active');
  }
  btn.addEventListener('click', () => {
    if (simpleFilterKey === key) {
      simpleFilterKey = null;
      btn.classList.remove('active');
    } else {
      simpleFilterKey = key;
      simpleContainer
        .querySelectorAll('button[data-key]')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    renderItems();
  });
  // рассчитываем позицию в гриде:
  const row = (i < firstCount ? i : i - firstCount) + 1;
  const col = i < firstCount ? 1 : 2;
  btn.style.gridRow    = row;
  btn.style.gridColumn = col;

  simpleContainer.append(btn);
  
    // ← здесь восстанавливаем подсветку для уже выбранного простого фильтра
  if (simpleFilterKey) {
    const prevBtn = simpleContainer.querySelector(`button[data-key="${simpleFilterKey}"]`);
    if (prevBtn) prevBtn.classList.add('active');
  }
});

// 7) Для продвинутых фильтров далаём отдельный attrList
//    (они сами внутри setupAttributeFilters ещё раз отфильтруют и отсортируют):
const attrList = rawAttrs.slice();
const attrContainer = document.getElementById('attr-filters');
window.setupAttributeFilters(
  attrList,
  attrContainer,
  (k,m) => { attrModes[k] = m; renderItems(); }
);

  // ↓ вот этот блок — восстанавливает визуальную подсветку
  Object.entries(attrModes).forEach(([key, mode]) => {
    const btn = attrContainer.querySelector(
      `.attr-filter-row button[data-key="${key}"][data-mode="${mode}"]`
    );
    if (!btn) return;
    const row = btn.closest('.attr-filter-row');
    row.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });

// 8) Бонус‑фильтр остаётся без изменений:
const bonusList = [
  ...Object.entries(bonusMap).map(([k, icon]) => ({
    key:   k,
    label: k === 'all' ? 'Все' : k,
    icon
  })),
  { key: 'has',  label: 'ЛЮБОЙ',       icon: null },
  { key: 'none', label: 'ОТСУТСТВУЕТ', icon: null }
];
window.setupBonusFilter(
  bonusList,
  document.getElementById('bonus-filters'),
  key => { bonusFilter = key; renderItems(); }
);

// --- Вставка кнопки справки под выпадающий список бонусов ---
// Мы делаем это здесь, так как setupBonusFilter может пересоздавать внутренности контейнера
const bonusContainer = document.getElementById('bonus-filters');
const btnHelp = document.createElement('button');
btnHelp.textContent = 'Справка';
btnHelp.className = 'import-btn'; // Используем базовый стиль кнопки
// Переопределяем стили для соответствия новому дизайну
btnHelp.style.cssText = `
    margin-top: 8px;
    width: 60%;
    margin-left: auto;
    margin-right: auto;
    background: #707090; /* Мягкий серо-фиолетовый */
    font-size: 0.85em;
    padding: 4px;
    display: block;
`;
btnHelp.addEventListener('click', () => showBonusHelp(''));
bonusContainer.appendChild(btnHelp);


// ← причина: восстанавливаем визуальную подсветку бонус‑фильтра
// 1) снимем active со всех пунктов
const bonusItems = bonusContainer.querySelectorAll('.dropdown-item');
bonusItems.forEach(it => it.classList.remove('active'));

// 2) найдём текущий bonusFilter и поставим ему active
const activeBonus = bonusContainer.querySelector(
  `.dropdown-item[data-bonus="${bonusFilter}"]`
);
if (activeBonus) {
  activeBonus.classList.add('active');

  // 3) обновим текст кнопки‑тоггла (если ваша реализация это использует)
const toggleBtn = bonusContainer.querySelector('.dropdown-toggle');
if (toggleBtn) {
  // 1) очистили
  toggleBtn.innerHTML = '';
  // 2) скопировали иконку
  const icon = activeBonus.querySelector('img');
  if (icon) {
    const img = icon.cloneNode();
    img.style.marginRight = '6px';
    toggleBtn.append(img);
  }
  // 3) и текстовую метку
  const label = activeBonus.querySelector('span').textContent;
  toggleBtn.append(document.createTextNode(label));
}}



    //
    // G) рендер (группировка, магия, цена, атрибуты, бонусы)
    //
    function renderItems(){
      // очистка
      Object.values(GROUPS).forEach(id=>{
        const ct = document.getElementById(id).querySelector('.Items');
        ct.innerHTML = '';
        
        // --- TIER MODE: Override Headers ---
        const h2 = document.getElementById(id).querySelector('h2');
        if (tierMode) {
            // ID: group-1, group-2... Extract number
            const num = id.replace('group-', '');
            h2.textContent = `Категория ${num}`;
            // В режиме тира всегда показываем группы, даже если showGroups false? 
            // Нет, showGroups всё еще может управлять видимостью (хотя странно).
            // Оставим логику ниже.
        } else {
             // Reset headers to default. This logic is tricky because we don't have the original text stored easily.
             // We can use a Map or switch.
             // Reverse lookup GROUPS
             const type = Object.keys(GROUPS).find(key => GROUPS[key] === id);
             const defaultNames = {
              'BlowWeapon':'Оружие ближнего боя','Armor':'Броня','Shield':'Щиты',
              'Helm':'Шлемы','Ring':'Кольца','Staff':'Посохи',
              'Amulet':'Амулеты','Potion':'Зелья','ShotWeapon':'Оружие дальнего боя',
              'Item':'Предметы'
             };
             if (type) h2.textContent = defaultNames[type];
        }
        
        document.getElementById(id).style.display = showGroups?'block':'none';
      });
      allContainer.innerHTML = '';
      allGroup.style.display = showGroups?'none':'block';

      // фильтр магии
      let visible = ItemsData.filter(c=>
        magicFilter==='all' || c.dataset.magicType===magicFilter
      );
      // сортировка цены (ТОЛЬКО ЕСЛИ НЕ TIER MODE)
      if (!tierMode) {
          if (sortState===1) visible.sort((a,b)=>b.dataset.cost - a.dataset.cost);
          else if (sortState===2) visible.sort((a,b)=>a.dataset.cost - b.dataset.cost);
      }

      // фильтрация по атрибутам
		if (advanced) {
		  // старый продвинутый режим
		  visible = Object.entries(attrModes).reduce((list,[k,mode]) =>
			window.applyAttributeFilter(list, k, mode),
			visible
		  );
			} else if (simpleFilterKey) {
			  visible = window.applyAttributeFilter(
				visible,
				simpleFilterKey,
				simpleFilterMode
			  );
			}

		  // фильтрация по бонусам
			visible = visible.filter(c => {
			  // 1) «Все»
			  if (bonusFilter === 'all') return true;

			  // 2) «ЛЮБОЙ» — предметы, у которых есть любой бонус
			  if (bonusFilter === 'has') {
				return c.dataset.bonus !== 'all';
			  }

			  // 3) «ОТСУТСТВУЕТ» — предметы без бонуса
			  if (bonusFilter === 'none') {
				return c.dataset.bonus === 'all';
			  }

			  // 4) конкретный бонус
			  return c.dataset.bonus === bonusFilter;
			});



		  // поиск по названию и описанию
		  if (searchQuery) {
			visible = visible.filter(c =>
			  c.dataset.name.toLowerCase().includes(searchQuery) ||
			  (c.dataset.desc && c.dataset.desc.includes(searchQuery))
			);
		  }

// фильтр «только отличия» в режиме сравнения
if (compareMode && diffOnly) {
  visible = visible.filter(card => window.hasDifference(card));
}

// --- НОВАЯ ЛОГИКА: Обновляем видимость индикаторов фильтра ---
visible.forEach(card => {
    card.querySelectorAll('li[data-key]').forEach(li => {
        const k = li.dataset.key;
        let isActive = false;
        
        if (k === 'bonus') {
            isActive = (bonusFilter !== 'all');
        } else if (k === 'magic') {
            isActive = (magicFilter !== 'all');
        } else {
            // Используем глобально доступную isStatFiltered
            isActive = isStatFiltered(k);
        }
        
        if (isActive) li.classList.add('filtered');
        else li.classList.remove('filtered');
    });
});

// --- НОВАЯ ЛОГИКА: Обновляем прозрачность закрепленных ---
if (window.pinnedItemIds) {
    visible.forEach(card => {
        if (window.pinnedItemIds.has(card.dataset.uid)) {
            card.classList.add('is-pinned');
        } else {
            card.classList.remove('is-pinned');
        }
    });
}

		  // вставка в DOM
		  if (showGroups) {
		    if (tierMode) {
		        // --- TIER RENDER LOGIC ---
		        // 1. Инициализируем хранилище если пусто (при первом рендере может быть)
		        if (!tierDataStorage[currentMode]) tierDataStorage[currentMode] = {};
		        const currentTierData = tierDataStorage[currentMode];
		        
		        // 2. Создаем Set видимых ID для быстрого поиска
		        const visibleIds = new Set(visible.map(c => c.dataset.globalId));
		        const handledIds = new Set();
		        
		        // 3. Проходим по группам 1-10
		        for (let i = 1; i <= 10; i++) {
		            if (!currentTierData[i]) currentTierData[i] = [];
		            const groupList = currentTierData[i];
		            const groupContainer = document.getElementById(`group-${i}`).querySelector('.Items');
		            
		            groupList.forEach(id => {
		                if (visibleIds.has(id)) {
		                    // Находим DOM элемент в visible
		                    const card = visible.find(c => c.dataset.globalId === id);
		                    if (card) {
		                        groupContainer.append(card);
		                        handledIds.add(id);
		                    }
		                }
		            });
		        }
		        
		        // 4. Все, что видимо, но не распределено (новые предметы), кидаем в 10
		        visible.forEach(card => {
		            const id = card.dataset.globalId;
		            if (!handledIds.has(id)) {
		                // Добавляем в данные
		                if (!currentTierData[10]) currentTierData[10] = [];
		                currentTierData[10].push(id);
		                // Рендерим
		                document.getElementById('group-10').querySelector('.Items').append(card);
		            }
		        });
		        
		    } else {
                // STANDARD RENDER
                visible.forEach(c=>
                  document.getElementById(c.dataset.group)
                          .querySelector('.Items').append(c)
                );
            }
      } else {
        visible.forEach(c=>allContainer.append(c));
      }
    }

     renderItems();
     // ——————————— ГАРАНТИЯ СКРЫТИЯ ПРОСТЫХ ФИЛЬТРОВ ———————————
     if (advanced) {
       const simple = document.getElementById('simple-filters');
       if (simple) {
         simple.style.setProperty('display', 'none', 'important');
       }
      const modeCtr = document.getElementById('simple-mode-controls');
      if (modeCtr) {
        modeCtr.style.setProperty('display', 'none', 'important');
      }
     }
     
     // Обновляем видимость иконок модов на закрепленных предметах
     function updatePinnedModIcons() {
         document.querySelectorAll('.compare-panel-content .mod-icon, .grid-tooltip-detached .mod-icon').forEach(icon => {
             if (icon.dataset.mod !== currentMode) {
                 icon.classList.add('force-visible');
             } else {
                 icon.classList.remove('force-visible');
             }
         });
     }
     updatePinnedModIcons();
   }
  
// --- ВСПЛЫВАЮЩЕЕ ОПИСАНИЕ БОНУСА ПРИ НАВЕДЕНИИ НА ЗАМОРОЖЕННЫЙ ТУЛТИП ---
const bonusDescTooltip = document.getElementById('bonus-desc-tooltip');

document.addEventListener('mouseover', (e) => {
    const bonusLine = e.target.closest('.item.selected .tooltip .bonus-line');
    if (bonusLine && bonusDescTooltip) {
        const textSpan = bonusLine.querySelector('.bonus-text');
        if (textSpan) {
            const rawName = textSpan.textContent.trim();
            const normName = normalizeBonusName(rawName);
            const desc = bonusDescriptions[normName];

            if (desc) {
                // Обновляем текст только если навели на другой бонус
                if (!bonusDescTooltip.classList.contains('visible') || bonusDescTooltip.dataset.currentBonus !== rawName) {
                    bonusDescTooltip.innerHTML = '<span class="bd-name">' + rawName + '</span>' + desc;
                    bonusDescTooltip.dataset.currentBonus = rawName;
                    bonusDescTooltip.classList.add('visible');
                }
            }
        }
    }
});

document.addEventListener('mousemove', (e) => {
    if (bonusDescTooltip && bonusDescTooltip.classList.contains('visible')) {
        let x = e.clientX + 15;
        let y = e.clientY + 15;
        const rect = bonusDescTooltip.getBoundingClientRect();
        
        // Предотвращаем выход за края экрана
        if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - 10;
        if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - 10;
        
        bonusDescTooltip.style.left = x + 'px';
        bonusDescTooltip.style.top = y + 'px';
    }
});

document.addEventListener('mouseout', (e) => {
    const bonusLine = e.target.closest('.item.selected .tooltip .bonus-line');
    if (bonusLine && bonusDescTooltip) {
        // Предотвращаем мерцание при переходе мыши между дочерними элементами (иконкой и текстом)
        if (e.relatedTarget && bonusLine.contains(e.relatedTarget)) {
            return;
        }
        bonusDescTooltip.classList.remove('visible');
    }
});

// Скрываем тултип бонуса при любом клике (чтобы он не зависал при закрытии/откреплении основного тултипа)
document.addEventListener('mousedown', () => {
    if (bonusDescTooltip) {
        bonusDescTooltip.classList.remove('visible');
    }
});
  
// === 3) loadData и switchMode после createUI ===

/**
 * Загружает данные мода.
 * Приоритет:
 * 1. Rus_Artefacts.ini (кодировка windows-1251)
 * 2. data.ini (кодировка utf-8)
 *
 * ТАКЖЕ: Параллельно пытается загрузить Items.ugs
 */
function fetchModData(modName) {
  // Специальная проверка для импортированного мода
  if (modName === 'NewMod') {
      // Start fetching UGS (from memory check)
      const ugsPromise = window.loadUGS(modName);
      
      return Promise.all([Promise.resolve(customModData), ugsPromise]).then(([data, ugsBuf]) => {
          return data || {}; // Return empty object if no data imported yet
      });
  }

  const nativePath = `./${modName}/Rus_Artefacts.ini`;
  const oldPath    = `./${modName}/data.ini`;

  // Start fetching UGS immediately via global parser
  const ugsPromise = window.loadUGS(modName);

  const iniPromise = fetch(nativePath)
    .then(res => {
      if (res.ok) {
        return res.arrayBuffer().then(buf => {
          const decoder = new TextDecoder('windows-1251');
          return decoder.decode(buf);
        });
      }
      throw new Error('Native INI not found');
    })
    .catch(() => {
      // Fallback
      return fetch(oldPath).then(r => r.text());
    })
    .then(text => window.parseINI(text));
    
  // Wait for both, but return INI text
  return Promise.all([iniPromise, ugsPromise]).then(([iniText, ugsBuf]) => {
      return iniText;
  });
}

function loadData() {
  fetchModData(mod1)
    .then(d1 => {
      // КЛОНИРОВАНИЕ ДАННЫХ
      // originalData1 - неизменяемая копия
      window.originalData1 = JSON.parse(JSON.stringify(d1));
      // savedData1 - рабочая копия, которую будет менять редактор
      savedData1 = JSON.parse(JSON.stringify(d1));

      // если у нас нет второго мода — пропускаем fetch
      if (!mod2) {
        return Promise.resolve({});
      }
      // иначе подгружаем data2
      return fetchModData(mod2);
    })
    .then(d2 => {
      if (d2) savedData2 = d2; // сохраняем данные второго мода в глобальную
      createUICompare(savedData1, savedData2 || {});  // рендерим UI with both
    })
    .catch(console.error);
}

// Новая функция для обновления интерфейса из редактора
window.refreshApp = function() {
    createUICompare(savedData1, savedData2 || {});
}

// --- ФУНКЦИИ ПРОВЕРКИ ИЗМЕНЕНИЙ ПРИ ПЕРЕКЛЮЧЕНИИ МОДОВ ---

let pendingSwitchMode = null;
let pendingImportFile = null; // Файл, который ждет подтверждения импорта
const modSwitchOverlay = document.getElementById('mod-switch-overlay');
const modSwitchCancel = document.getElementById('mod-switch-cancel');
const modSwitchConfirm = document.getElementById('mod-switch-confirm');

// Обработчики кнопок модального окна
if (modSwitchCancel) {
    modSwitchCancel.addEventListener('click', () => {
        modSwitchOverlay.classList.remove('visible');
        pendingSwitchMode = null;
        pendingImportFile = null;
        // Очищаем инпут импорта, чтобы можно было снова выбрать тот же файл снова
        document.getElementById('import-ini').value = '';
    });
}

if (modSwitchConfirm) {
    modSwitchConfirm.addEventListener('click', () => {
        modSwitchOverlay.classList.remove('visible');
        if (pendingSwitchMode) {
            proceedSwitchMode(pendingSwitchMode);
            pendingSwitchMode = null;
        } else if (pendingImportFile) {
            // Если подтвердили импорт - запускаем обработку через глобальную функцию
            window.processImportINI(pendingImportFile);
            pendingImportFile = null;
        }
    });
}

// Закрытие модального окна при клике на оверлей
if (modSwitchOverlay) {
    modSwitchOverlay.addEventListener('click', (e) => {
        if (e.target === modSwitchOverlay) {
            modSwitchOverlay.classList.remove('visible');
            pendingSwitchMode = null;
            pendingImportFile = null;
            document.getElementById('import-ini').value = '';
        }
    });
}

// Умное сравнение объектов без учета порядка характеристик
function isDataEqual(dataA, dataB) {
    if (!dataA || !dataB) return false;
    const keysA = Object.keys(dataA);
    const keysB = Object.keys(dataB);
    if (keysA.length !== keysB.length) return false;

    for (let k of keysA) {
        if (!dataB[k]) return false;
        const itemA = dataA[k];
        const itemB = dataB[k];

        // Проверка базовых свойств
        if (itemA.Name !== itemB.Name || itemA.Descript !== itemB.Descript || 
            itemA.Cost !== itemB.Cost || itemA.Type !== itemB.Type || 
            itemA.Icon !== itemB.Icon || itemA.Magic !== itemB.Magic || 
            itemA.Bonus !== itemB.Bonus || itemA.BonusIcon !== itemB.BonusIcon) {
            return false;
        }

        // Независимая от порядка проверка характеристик
        const attrsA = itemA._attrs || [];
        const attrsB = itemB._attrs || [];
        if (attrsA.length !== attrsB.length) return false;

        const setB = new Set(attrsB.map(b => b.key + '::' + b.value));
        for (let attr of attrsA) {
            if (!setB.has(attr.key + '::' + attr.value)) return false;
        }
    }
    return true;
}

// Проверяет, изменился ли глобальный набор данных
function isGlobalDirty() {
    if (!savedData1 || !window.originalData1) return false;
    return !isDataEqual(savedData1, window.originalData1);
}

function switchMode(mode) {
  if (mode === mod1) return;       // тот же мод — ничего не делаем

  // Проверяем на наличие несохраненных изменений в глобальном наборе данных
  if (isGlobalDirty()) {
      pendingSwitchMode = mode;
      modSwitchOverlay.classList.add('visible');
      return;
  }

  proceedSwitchMode(mode);
}

function proceedSwitchMode(mode) {
  // === CRITICAL FIX: Cancel any active drag operation before switching ===
  if (tierMode && floatingItem) {
      cancelTierDrag();
  }
  
  // Сброс всех фильтров при полном переключении основного мода
  simpleFilterKey  = null;
  simpleFilterMode = 'any';
  magicFilter      = 'all';
  bonusFilter      = 'all';
  tierMode         = false; // Сброс Tier Mode
  document.body.classList.remove('tier-mode');
  
    // Сброс поиска
  searchQuery = '';
  const searchInput = document.querySelector('.search-input');
  if (searchInput) searchInput.value = '';
  
  const prev = mod1;               // запомним старый
  mod1 = mode;                     // новый активный
  if (mod2 === mod1) mod2 = '';
  currentMode = mode;              // для getBasePath()
  savedData2 = {}; // очищаем второй мод при переключении
  
    // Обновляем картинку модификации
  if (currentMode === 'NewMod') {
      modeIcon.src = 'NewmodIcon.png';
  } else {
      modeIcon.src = getBasePath() + 'mod.png';
  }
  
  applyBackgroundFor(currentMode);

  // 1) Скрываем боковую панель фильтров, если она открыта
  //let sidePanel = document.querySelector('.side-panel');
  //if (sidePanel) sidePanel.classList.remove('open');
  //document.body.classList.remove('docked');

  // 2) Скрываем панель «Моды», если она открыта
  const pagePanel = document.getElementById('page-panel');
  if (pagePanel) pagePanel.classList.remove('open');

  // 3) Убираем старый UI и перезагружаем данные
  clearUI();
  loadData();
}

// Навешиваем обработчики на кнопки в панели «Моды»
document.getElementById('btn-Evolv')
        .addEventListener('click', () => switchMode('Evolv'));
document.getElementById('btn-Vanilla')
        .addEventListener('click', () => switchMode('Vanilla'));
document.getElementById('btn-Ragnar')
        .addEventListener('click', () => switchMode('Ragnar'));
document.getElementById('btn-Xxxx')
        .addEventListener('click', () => switchMode('Xxxx'));
document.getElementById('btn-Crusad')
        .addEventListener('click', () => switchMode('Crusad'));
document.getElementById('btn-Old_Hor')
        .addEventListener('click', () => switchMode('Old_Hor'));		
document.getElementById('btn-KREST+')
        .addEventListener('click', () => switchMode('KREST+'));				
document.getElementById('btn-Pravl')
        .addEventListener('click', () => switchMode('Pravl'));		
document.getElementById('btn-Discover')
        .addEventListener('click', () => switchMode('Discover'));			
document.getElementById('btn-Orders')
        .addEventListener('click', () => switchMode('Orders'));		
document.getElementById('btn-Classic')
        .addEventListener('click', () => switchMode('Classic'));
document.getElementById('btn-NewMod')
        .addEventListener('click', () => switchMode('NewMod'));
document.getElementById('btn-Gift')
        .addEventListener('click', () => switchMode('Gift'));
document.getElementById('btn-Dement')
        .addEventListener('click', () => switchMode('Dement'));		

// Первый запуск
loadData();
loadGlobalBonusDescriptions(); // Загружаем справочник бонусов

// === Автоматически скрыть шапку на мобилках через 5 сек после загрузки ===
window.addEventListener('load', () => {
  // проверяем мобильный breakpoint
  if (window.matchMedia('(max-width: 800px)').matches) {
    // даём пользователю 5 сек на «ознакомление»
    setTimeout(() => {
      document.body.classList.add('topbar-hidden');
    }, 5000);
  }
});

    // ===== ВСТАВЛЯЕМ ЗДЕСЬ КОД ДЛЯ ОКНА «О САЙТЕ» =====
    // получаем элементы по id
const aboutBtn = document.getElementById('about-button');
const overlay  = document.getElementById('about-overlay');
const popup    = document.getElementById('about-popup');

// утилита: показать
function showAbout() {
  overlay.classList.add('visible');
  popup.classList.add('visible');
}

// утилита: скрыть
function hideAbout() {
  overlay.classList.remove('visible');
  popup.classList.remove('visible');
}

// показать по кнопке
aboutBtn.addEventListener('click', e => {
  e.stopPropagation();
  showAbout();
});

// закрыть при клике на overlay и не дать клику «просочиться» дальше
overlay.addEventListener('click', e => {
  e.stopPropagation();
  hideAbout();
});


// чтобы клики внутри popup не проксировались на overlay
popup.addEventListener('click', e => {
  e.stopPropagation();
});

// === «Закладка»: панель сверху, выезжающая вниз ===
const pagePanel  = document.getElementById('page-panel');
const pageToggle = document.getElementById('page-toggle');
const modeIcon = document.createElement('img');
modeIcon.className = 'mode-icon';
// Установим сразу иконку из текущей папки (например Vanilla/mod.png)
// ВНИМАНИЕ: Если мы загружаемся в NewMod (вдруг), ставим спец иконку
if (currentMode === 'NewMod') {
    modeIcon.src = 'NewmodIcon.png';
} else {
    modeIcon.src = getBasePath() + 'mod.png';
}

// Вставляем перед текстом
pageToggle.insertBefore(
  modeIcon,
  pageToggle.querySelector('.page-toggle-text')
);

// по клику на кнопку-тумблер в шапке
pageToggle.addEventListener('click', e => {
  e.stopPropagation();
  // если панель открыта — мы закрываем её → добавляем флаг .closing,
  // чтобы временно отключить hover‑выезд
  if (pagePanel.classList.contains('open')) {
    pagePanel.classList.add('closing');
    // после окончания анимации по top убираем флаг
    const onTransitionEnd = evt => {
      if (evt.propertyName === 'top') {
        pagePanel.classList.remove('closing');
        pagePanel.removeEventListener('transitionend', onTransitionEnd);
      }
    };
    pagePanel.addEventListener('transitionend', onTransitionEnd);
  }
  // собственно toggle open/closed
  pagePanel.classList.toggle('open');
});

// клики вне панели её закрывают
document.addEventListener('click', e => {
  if (!e.target.closest('#page-panel') && !e.target.closest('#page-toggle')) {
    pagePanel.classList.remove('open');
  }
});

// внутри панели клики не закрывают
pagePanel.addEventListener('click', e => {
  e.stopPropagation();
});

// === FIX: Auto-monitor compare panel changes ===
// Гарантируем, что проверка ширины запускается при любом изменении списка детей
function initPanelObserver() {
    const cPanelContent = document.querySelector('.compare-panel-content');
    if (cPanelContent) {
      // 1. Observer
      // Используем Observer для реакции на изменения DOM
      const obs = new MutationObserver((mutations) => {
        // Задержка 0, чтобы стек очистился
        setTimeout(window.checkComparePanelState, 0);
      });
      
      obs.observe(cPanelContent, { childList: true, subtree: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPanelObserver);
} else {
    initPanelObserver();
}

// Логика импорта INI
// Вынесено в отдельную функцию для повторного использования
// ТЕПЕРЬ ГЛОБАЛЬНАЯ, ЧТОБЫ ЕЁ ВИДЕЛА КНОПКА ПОДТВЕРЖДЕНИЯ МОДАЛЬНОГО ОКНА
window.processImportINI = function(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const text = ev.target.result;
            customModData = window.parseINI(text); // Используем функцию из parsers.js
            
            // Показываем кнопку "Новый мод"
            const btnNewMod = document.getElementById('btn-NewMod');
            if (btnNewMod) btnNewMod.hidden = false;
            
            // Очищаем инпут чтобы можно было выбрать тот же файл снова
            document.getElementById('import-ini').value = '';
            
            // Если мы уже в режиме NewMod, принудительно обновляем данные
            if (currentMode === 'NewMod') {
                // Явно сбрасываем сохраненные данные, чтобы forced reload сработал
                savedData1 = null; 
                // Вызываем proceedSwitchMode напрямую, чтобы обойти проверку "тот же мод"
                proceedSwitchMode('NewMod');
            } else {
                // Переключаемся на Новый мод
                switchMode('NewMod');
            }
            
            // Уведомление об успехе
            showNotification('Rus_Artefacts.ini успешно импортирован!', 'success');
        } catch (err) {
            console.error(err);
            showNotification('Ошибка импорта INI файла.', 'error');
        }
    };
    // Читаем как windows-1251, так как большинство ini файлов игры в этой кодировке
    reader.readAsText(file, 'windows-1251');
};
