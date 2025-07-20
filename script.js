// script.js

// Все папки-моды, которые у вас лежат рядом с index.html
const ALL_MODS = ['Vanilla','Evolv','Ragnar','Crusad','Old_Hor','Pravl','Discover','Orders','Classic'/*'KREST+'/*, 'Xxxx'*/];

// текущий режим: 'Vanilla' или 'Evolv'
let currentMode = 'Vanilla';

// для режима сравнения: mod1 — активный, mod2 — второй для сравнения
let mod1 = 'Vanilla';
let mod2 = '';
//////////////


// 0) словарь сопоставлений «ключ → текст»
const modLabelMap = {
  Vanilla:  'Vanilla',
  Evolv:    'Эволюция',
  Ragnar:   'Рагнарёк',
  Crusad:   'Крестоносцы',
  Old_Hor:  'Старые Горизонты',
  Pravl:    'Правление',
  Discover: 'Новые Открытия',
  Classic: 'ВР 1.5 от Алавар'  
  // при добавлении новых модов просто расширяйте этот словарь
};

function getTooltipLabel(modKey) {
  // для Classic переопределяем
  if (modKey === 'Classic') return 'ВР 1.5';
  // для остальных — как есть или из словаря
  return modLabelMap[modKey] || modKey;
}


// 0) Загрузка мапы предвычисленных хешей иконок
 let iconCRC = {};
 fetch('./icon-crc32.json')
   .then(r => r.json())
   .then(json => { iconCRC = json; })
   .catch(err => console.error('Не удалось загрузить icon-crc32.json', err));



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
let regBg     = 'background.png';   // фон «обычных» модов
let ragnarBg  = 'RagnPhone.png';    // дефолт для Ragnar
///////////////////////////////////////////////////////////let krestBg   = 'KREST-bg.png';
// флаг: «были ли мы уже вручную в Ragnar?»
let syncBg = false;


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

// --- Единый обработчик открытия/закрытия и «докинга» боковой панели ---
let dockMode = window.innerWidth >= 700;

document.addEventListener('click', function onDocumentClick(e) {
  const sidePanel = document.querySelector('.side-panel');
  const actionBtnElem = e.target.closest('.action-button');

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

  // 3) Клик в любом другом месте — если панель не «закреплена», закрываем её
  if (!dockMode && sidePanel
      && !e.target.closest('.side-panel')
      && !e.target.closest('.action-button')) {
    sidePanel.classList.remove('open');
    document.body.classList.remove('docked');
  }

  // если клик был НЕ по карточке и не по самому тултипу
  if (!e.target.closest('.item') && !e.target.closest('.tooltip')) {
    if (selectedCard) {
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
  // пути относительно index.html
  const imgs = [
    // иконки модов
    './Vanilla1.png',
	'./Vanilla2.png',
	'./Vanilla3.png',
	'./Evolv1.png',
	'./Evolv2.png',
	'./Evolv3.png',
	'./Ragnar1.png',
	'./Ragnar2.png',
	'./Ragnar3.png',
	'./Old_Hor1.png',
	'./Old_Hor2.png',
	'./Old_Hor3.png',
	'./Crusad1.png',
	'./Crusad2.png',
	'./Crusad3.png',
	'./KREST1.png',
	'./KREST2.png',
	'./KREST3.png',	
	'./Pravl1.png',	
	'./Pravl2.png',	
	'./Pravl3.png',	
	'./Orders1.png',	
	'./Orders2.png',	
	'./Orders3.png',	
	'./Discover1.png',	
	'./Discover2.png',	
	'./Discover3.png',	
	'./Classic1.png',	
	'./Classic2.png',	
	'./Classic3.png',	
    './about1.png',
	'./about2.png',
	'./about3.png',
	'./RagnPhone.png',
	'./btn-normal.png',
	'./btn-hover.png',
	'./btn-active.png',
	'./YBbI.png',
  ];
  imgs.forEach(src => {
    const img = new Image();
    img.src = src;
  });
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
  return `./${currentMode}/`;
}
let ItemsData = [];
let savedData1 = null;
let bonusMap = { all: null };

// --- 1) INI‑парсер (без изменений) ---
function parseINI(text) {
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
    const [k, ...rest] = line.split('=');
    const key   = k.trim();
    const value = rest.join('=').trim();
    if (inAttrs) {
      if (!Array.isArray(data[section]._attrs)) data[section]._attrs = [];
      data[section]._attrs.push({ key, value });
    } else {
      data[section][key] = value;
    }
  }
  return data;
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





 function createUICompare(data1, data2) {

	 const supportsHover = window.matchMedia('(hover: hover)').matches;
	 /**
 * Проверяет, есть ли хоть одно отличие между модами в карточке.
 * Сравнивает атрибуты, бонус, магию и цену.
 */
function hasDifference(card) {
  const attrs1 = JSON.parse(card.dataset.attrs  || '{}');
  const attrs2 = JSON.parse(card.dataset.attrs2 || '{}');
  // 1) атрибуты
  const allKeys = new Set([...Object.keys(attrs1), ...Object.keys(attrs2)]);
  for (let k of allKeys) {
    if ((attrs1[k] || '') !== (attrs2[k] || '')) {
      return true;
    }
  }
  // 2) бонус
  if (card.dataset.bonus  !== card.dataset.bonus2)    return true;
  // 3) тип магии
  if (card.dataset.magicType  !== card.dataset.magicType2) return true;
  // 4) цена
  if (Number(card.dataset.cost) !== Number(card.dataset.cost2)) return true;
  // 5) тип/категория предмета
  if (card.dataset.type !== card.dataset.type2) return true;
  
  return false;
}

	 
	 
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

  // Сбор bonusMap (как у вас было)
  Object.values(data1).forEach(item => {
    if (item.Bonus) {
      bonusMap[item.Bonus] = item.BonusIcon
        ? `./${mod1}/` + item.BonusIcon.replace(/\\/g,'/')
        : null;
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

    <!-- A.2.1) кнопка «расширенные» -->
    <button id="toggle-advanced" class="advanced-toggle">
      Расширенные фильтры
    </button>
	
 <button id="reset-filters" class="reset-button">Сбросить</button>
 
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

// при переключении — обновляем переменную и класс
bgToggle.addEventListener('change', e => {
  panelBgEnabled = e.target.checked;
  sidePanel.classList.toggle('no-bg', !panelBgEnabled);
});



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
      icon:  `./${m}/mod.png`
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
    } else {
      mod2 = selectedKey;
      compareMode = true;
    }
    fetch(`./${mod2 || ALL_MODS[0]}/data.ini`)
      .then(r => r.text())
      .then(parseINI)
      .then(d2 => createUICompare(savedData1, d2))
      .catch(console.error);
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
      fetch(`./${mod2}/data.ini`)
        .then(r => r.text())
        .then(parseINI)
        .then(d2 => createUICompare(savedData1, d2))
        .catch(console.error);
    } else {
      mod2 = '';
      compareMode = false;
      // пересоздаем UI без сравнения
      createUICompare(savedData1, {});
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

compareToggle.addEventListener('change', () => {
  compareMode = compareToggle.checked;

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
	'6background.png'
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
  // чекбокс "Сравнить с Vanilla"
  simpleCompareWrapper.style.display   = advanced ? 'none'    : 'inline-flex';

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
      const gapScale = currentScale <= 1
        ? Math.pow(currentScale, 4)
        : Math.pow(currentScale, 1/4);
      document.documentElement.style.setProperty(
        '--group-gap',
        `${40 * gapScale}px`
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

searchInput.addEventListener('input', e => {
  // 1. Берём «сырую» строку без обрезания регистра:
  const rawQuery = e.target.value.trim();

  // 2. Приводим к нижнему для поиска по названию:
  searchQuery = rawQuery.toLowerCase();

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
//  1) Вычисляем icon1Url
// ————————————————————————
const id = item1.GlobalIndex;
let icon1Url = `./${mod1}/` + item1.Icon.replace(/\\/g,'/');

// если это не ваниль и есть CRC32 и у ванилы, и у текущего
if (mod1 !== 'Vanilla' &&
    iconCRC.Vanilla?.[id] &&
    iconCRC[mod1]?.[id] &&
    iconCRC[mod1][id] === iconCRC.Vanilla[id]
) {
  // совпадает CRC32 — берём ванильный URL
  icon1Url = `./Vanilla/` + item1.Icon.replace(/\\/g,'/');
}

// ————————————————————————
//  2) Вычисляем icon2Url (при сравнении)
// ————————————————————————
let icon2Url = null;
if (item2 && item2.Icon) {
  icon2Url = `./${mod2}/` + item2.Icon.replace(/\\/g,'/');
  if (mod2 !== 'Vanilla' &&
      iconCRC.Vanilla?.[id] &&
      iconCRC[mod2]?.[id] &&
      iconCRC[mod2][id] === iconCRC.Vanilla[id]
  ) {
    icon2Url = `./Vanilla/` + item2.Icon.replace(/\\/g,'/');
  }
}


  // attrs → data-attrs и рендер списка
  const aobj1 = {};
  (item1._attrs || []).forEach(a => aobj1[a.key] = a.value);
  const attrsArr1 = (item1._attrs || []).map(o =>
    `${o.key.replace(/-/g,' ')}: ${o.value}`
  );
  let extra1 = [];
  if (item1.Bonus) {
    const t = item1.Bonus;
    if (item1.BonusIcon) {
      const p = '/' + item1.BonusIcon.replace(/\\/g,'/');
      extra1.push(`<li class="bonus-line">
        <span class="bonus-text" style="--bonus-icon:url('${p}')">${t}</span>
      </li>`);
    } else {
      extra1.push(`<li class="bonus-line"><span class="bonus-text">${t}</span></li>`);
    }
  }
  let mType1 = '';
  if (item1.Magic) {
    const M = item1.Magic.toLowerCase();
    if (M.includes('смерти'))      mType1 = 'death';
    else if (M.includes('жизни'))  mType1 = 'life';
    else if (M.includes('стихий')) mType1 = 'elemental';
    extra1.push(`<li class="magic-line magic-${mType1}">
      <span class="bonus-text">${item1.Magic}</span>
    </li>`);
  }

  // аналогично для mod2, если есть
  let attrsArr2 = [], extra2 = [], mType2 = '';
  if (item2) {
    const aobj2 = {};
    (item2._attrs || []).forEach(a => aobj2[a.key] = a.value);
    attrsArr2 = (item2._attrs || []).map(o =>
      `${o.key.replace(/-/g,' ')}: ${o.value}`
    );
    if (item2.Bonus) {
      const t = item2.Bonus;
      if (item2.BonusIcon) {
        const p = '/' + item2.BonusIcon.replace(/\\/g,'/');
        extra2.push(`<li class="bonus-line">
          <span class="bonus-text" style="--bonus-icon:url('${p}')">${t}</span>
        </li>`);
      } else {
        extra2.push(`<li class="bonus-line"><span class="bonus-text">${t}</span></li>`);
      }
    }
    if (item2.Magic) {
      const M2 = item2.Magic.toLowerCase();
      if (M2.includes('смерти'))      mType2 = 'death';
      else if (M2.includes('жизни'))  mType2 = 'life';
      else if (M2.includes('стихий')) mType2 = 'elemental';
      extra2.push(`<li class="magic-line magic-${mType2}">
        <span class="bonus-text">${item2.Magic}</span>
      </li>`);
    }
  }

  // создаём карточку
  const card = document.createElement('div');
  card.className = 'item';
  card.dataset.magicType = mType1;
  card.dataset.group     = gid;
  card.dataset.name      = name1.toLowerCase();
  card.dataset.cost      = cost1;
  card.dataset.type      = item1.Type;
  card.dataset.attrs     = JSON.stringify(aobj1);
  card.dataset.bonus = item1.Bonus || 'all';
  card.dataset.bonus2 = item2 ? (item2.Bonus || 'all') : 'all';
  card.dataset.magicType2 = item2 ? mType2 : '';

  if (item2) {
    card.dataset.type2 = item2.Type;
    card.dataset.cost2 = cost2;
    card.dataset.attrs2 = JSON.stringify(
      (item2._attrs || []).reduce((o,a)=>{ o[a.key]=a.value; return o; }, {})
    );
  }

  // вёрстка двойных тултипов
  card.innerHTML = `
    <img src="${icon1Url}" alt="${name1}">
    <div class="tooltip tooltip-1"
         style="background-image: url('${
           useRagnarTooltip ? 'tooltip-ragn.png' : 'tooltip-bg.png'
         }')">
      <h3>${name1}${compareMode ? ` [${getTooltipLabel(mod1)}]` : ''}</h3>
      <p>${desc1}</p>
      <ul class="attrs">
        ${attrsArr1.map(a=>`<li>${a}</li>`).join('')}
        ${extra1.join('')}
        <li class="spacer"></li>
      </ul>
      <div class="tooltip-price">
        ${cost1}<img src="gold.png" class="gold-icon" alt="Gold">
      </div>
    </div>
    ${item2 && mod2 ? `
    <div class="tooltip tooltip-2"
         style="background-image: url('${
           useRagnarTooltip ? 'tooltip-ragn.png' : 'tooltip-bg.png'
         }')">
      <h3>${name2}${compareMode ? ` [${getTooltipLabel(mod2)}]` : ''}</h3>
      <p>${desc2}</p>
      <ul class="attrs">
        ${attrsArr2.map(a=>`<li>${a}</li>`).join('')}
        ${extra2.join('')}
        <li class="spacer"></li>
      </ul>
      <div class="tooltip-price">
        ${cost2}<img src="gold.png" class="gold-icon" alt="Gold">
      </div>
    </div>
    ` : ''}
  `;

  // позиционирование
  const tt1 = card.querySelector('.tooltip-1');
  const tt2 = card.querySelector('.tooltip-2');



 function positionSingle(tt, side, isPair = false) {
  // ——— Вертикальный fallback, если нет места слева и справа ———
  const cR = card.getBoundingClientRect();
  const tR = tt.getBoundingClientRect();
  
  
  
  // вычисляем правую границу с учётом док-панели
  const panelLeft = sidePanel.getBoundingClientRect().left;
  const usableRight = (dockMode && sidePanel.classList.contains('open'))
                      ? panelLeft
                      : window.innerWidth;
  // проверяем, влезет ли тултип справа или слева
  const fitsRight = cR.right + tR.width <= usableRight - EDGE_MARGIN;
  const fitsLeft  = cR.left  - tR.width >= EDGE_MARGIN;
  
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
      top = Math.max(0, cR.top - gap - tR.height);
    }
    // центрируем по горизонтали, но не выходим за пределы
    const centerX = cR.left + (cR.width - tR.width) / 2;
    const left = Math.max(
      EDGE_MARGIN,
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
      top = Math.max(0, cR.top - gap - tR.height);
    }
    // по горизонтали — прижимаем к соответствующему краю
    let left;
    if (side === 'left') {
      // левый край экрана
      left = EDGE_MARGIN;
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
    EDGE_MARGIN,
    Math.min(left, window.innerWidth - tR.width - EDGE_MARGIN)
  );
  // сначала обычная «идеальная» позиция по центру
  const desiredTop = cR.top + (cR.height - tR.height) / 2;

  let top;
  // если выходит за верх — прижимаем к верху
  if (desiredTop < 0) {
    top = 0;
  }
  // если выходит за низ
  else if (desiredTop + tR.height > window.innerHeight) {
    // только для ПРАВОЙ подсказки в простом режиме
    if (!compareMode && side === 'right') {
      // рисуем над карточкой
      top = cR.top - tR.height;
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
      top = Math.max(0, newTop);
    }
  }
  
     tt.style.left = `${left}px`;
     tt.style.top  = `${top}px`;
   }


function positionBoth() {
	  tt1.classList.add('visible');
  if (tt2) tt2.classList.add('visible');
	const cR = card.getBoundingClientRect();

// 1) Сначала позиционируем оба тултипа по-умолчанию

  const panelLeft = sidePanel.getBoundingClientRect().left;
  const usableRight = (dockMode && sidePanel.classList.contains('open'))
                      ? panelLeft
                      : window.innerWidth;
  const gap = 8;
  // === SPECIAL CASE: оба тултипа не влазят по горизонтали ===
  if (tt2) {
    const t1R = tt1.getBoundingClientRect();
    const t2R = tt2.getBoundingClientRect();
    const fitsRight1 = cR.right + t1R.width <= usableRight - EDGE_MARGIN;
    const fitsLeft2  = cR.left  - t2R.width >= EDGE_MARGIN;
    if (!fitsRight1 && !fitsLeft2) {
      // левый тултип (tt2) — сперва снизу, иначе сверху
      const below2 = cR.bottom + gap;
      let top2, t2Above = false;
      if (below2 + t2R.height <= window.innerHeight) {
        top2 = below2;
      } else {
        top2 = Math.max(0, cR.top - gap - t2R.height);
        t2Above = true;
      }
      tt2.style.top  = `${top2}px`;
      tt2.style.left = `${EDGE_MARGIN}px`;

      // правый тултип (tt1) — сперва над карточкой
      const above1 = cR.top - gap - t1R.height;
      tt1.style.top  = `${Math.max(0, above1)}px`;
      tt1.style.left = `${usableRight - t1R.width - EDGE_MARGIN}px`;



      // если оба тултипа оказались сверху — сдвигаем правый дальше, чтобы не перекрывать
      if (t2Above) {
        const newTop1 = top2 - gap - t1R.height;
        tt1.style.top = `${Math.max(0, newTop1)}px`;
      }

      // === НОВАЯ НАДСТРОЙКА ===
      // В режиме сравнения, если правая подсказка уперлась в верх,
      // рисуем её под карточкой и левую — сразу под правой.
      if (compareMode) {
        const r1check = tt1.getBoundingClientRect();
        // detect top edge
        if (r1check.top <= EDGE_MARGIN) {
          // 1) смещаем правую вниз под карточку
          tt1.style.top = `${cR.bottom + gap}px`;
          // 2) и левую сразу под ней
          tt2.style.top = `${tt1.getBoundingClientRect().bottom + gap}px`;
          tt2.style.left = `${EDGE_MARGIN}px`;
        }
      }
// после всех setTop/setLeft, но до return:
[tt1, tt2].forEach(tt => {
  const r = tt.getBoundingClientRect();
  if (r.bottom > window.innerHeight) {
    tt.style.top = `${Math.max(0, window.innerHeight - r.height)}px`;
  }
});

  {
    const gap = 8;
    const r1 = tt1.getBoundingClientRect();
    const r2 = tt2.getBoundingClientRect();

    // если tt2 свалилась ниже видимой области
    if (r2.bottom > window.innerHeight) {
      const newTop2 = r1.top - gap - r2.height;
      tt2.style.top = `${Math.max(0, newTop2)}px`;
    }
  }
  
    // === НОВОЕ: если вторая подсказка свалилась за низ — ставим её над первой ===
  {
    const r1 = tt1.getBoundingClientRect();
    const r2 = tt2.getBoundingClientRect();
    if (r2.bottom > window.innerHeight) {
      const newTop2 = r1.top - gap - r2.height;
      tt2.style.top = `${Math.max(0, newTop2)}px`;
    }
  }

  // === НОВОЕ: если ОДНА из подсказок упёрлась в верх — вторая под её низ ===
  {
    const r1 = tt1.getBoundingClientRect();
    const r2 = tt2.getBoundingClientRect();

    // если правая (tt1) упрелась в верх, то левая (tt2) — сразу под ней
    if (r1.top <= EDGE_MARGIN) {
      const newTop2 = r1.bottom + gap;
      tt2.style.top = `${newTop2}px`;
    }
    // или наоборот: если левая упрелась в верх — правая под ней
    else if (r2.top <= EDGE_MARGIN) {
      const newTop1 = r2.bottom + gap;
      tt1.style.top = `${newTop1}px`;
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
        : Math.max(0, cR.top - gap - t1R.height);
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
  const fitsLeft2 = cR.left - t2R.width >= EDGE_MARGIN;
  if (!fitsLeft2) {
    // вертикальный фолбэк для tt2
    const below2 = cR.bottom + gap;
      const top2 = (below2 + t2R.height <= window.innerHeight)
        ? below2
        : Math.max(0, cR.top - gap - t2R.height);
      // прижать к левому краю
      const left2 = EDGE_MARGIN;
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
      : Math.max(0, r1.top - gap - r2new.height);
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
      tt1.style.top = `${Math.max(0, aboveTop)}px`;
    } else {
      tt1.style.top = `${belowTop}px`;
    }

    return;  // дальше ничего не делаем
  }
}


  // 4) Ваши уже существующие «край экрана» правила
  // 4.1) если второй тултип упёрся в левый край
  if (r2.left <= EDGE_MARGIN) {
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
        : Math.max(0, r2.top - gap - r1.height);
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
    tt1.style.top = `${Math.max(0, newTop1)}px`;
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
    tt2.style.top = `${Math.max(0, newTop2)}px`;
  }
}
  
  

    // === НОВЫЙ КЕЙС: если один тултип прижался вверху, второй — сбоку — 
  //              опустим его под «верхний» ===
  if (tt2) {
    const r1 = tt1.getBoundingClientRect();
    const r2 = tt2.getBoundingClientRect();
    // если tt1 упёрлась в верх, а tt2 стоит сбоку
    if (r1.top <= EDGE_MARGIN && r2.top > EDGE_MARGIN) {
      tt2.style.top = `${r1.bottom + gap}px`;
    }
    // или наоборот: если tt2 упёрлась в верх, а tt1 — сбоку
    else if (r2.top <= EDGE_MARGIN && r1.top > EDGE_MARGIN) {
      tt1.style.top = `${r2.bottom + gap}px`;
    }
  }
  
  
  
  
}




if (supportsHover) {
// mouseenter
card.addEventListener('mouseenter', () => {
  card.classList.add('hovered');
  if (card.classList.contains('selected')) return;
  
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
  if (card.classList.contains('selected')) return;

  tt1.classList.remove('visible');
  if (tt2) tt2.classList.remove('visible');
});
}

// click (выбор)
card.addEventListener('click', e => {
  e.stopPropagation();
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

// 4) Тот же ATTR_ORDER, что в filters.js:
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
  // остальные — пойдут в конец в алфавитном порядке
];

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

// ← причина: восстанавливаем визуальную подсветку бонус‑фильтра
const bonusContainer = document.getElementById('bonus-filters');

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
        document.getElementById(id).style.display = showGroups?'block':'none';
      });
      allContainer.innerHTML = '';
      allGroup.style.display = showGroups?'none':'block';

      // фильтр магии
      let visible = ItemsData.filter(c=>
        magicFilter==='all' || c.dataset.magicType===magicFilter
      );
      // сортировка цены
      if (sortState===1) visible.sort((a,b)=>b.dataset.cost - a.dataset.cost);
      else if (sortState===2) visible.sort((a,b)=>a.dataset.cost - b.dataset.cost);

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



		  // поиск по названию
		  if (searchQuery) {
			visible = visible.filter(c =>
			  c.dataset.name.toLowerCase().includes(searchQuery)
			);
		  }

// фильтр «только отличия» в режиме сравнения
if (compareMode && diffOnly) {
  visible = visible.filter(card => hasDifference(card));
}


		  // вставка в DOM
		  if (showGroups) {
        visible.forEach(c=>
          document.getElementById(c.dataset.group)
                  .querySelector('.Items').append(c)
        );
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
   }
  
  

// === 3) loadData и switchMode после createUI ===
function loadData() {
  // 1) подгружаем data1
  fetch(`./${mod1}/data.ini`)
    .then(r => r.text())
    .then(parseINI)
    .then(d1 => {
      savedData1 = d1;                   // сохраняем
      // 2) если у нас нет второго мода — пропускаем fetch
      if (!mod2) {
        return Promise.resolve({});
      }
      // иначе подгружаем data2
      return fetch(`./${mod2}/data.ini`)
        .then(r => r.text())
        .then(parseINI);
    })
    .then(d2 => {
      createUICompare(savedData1, d2);  // рендерим UI с обоими
    })
    .catch(console.error);
}

function switchMode(mode) {
  if (mode === mod1) return;       // тот же мод — ничего не делаем
  // Сброс всех фильтров при полном переключении основного мода
  simpleFilterKey  = null;
  simpleFilterMode = 'any';
  magicFilter      = 'all';
  bonusFilter      = 'all';
  
    // Сброс поиска
  searchQuery = '';
  const searchInput = document.querySelector('.search-input');
  if (searchInput) searchInput.value = '';
  
  const prev = mod1;               // запомним старый
  mod1 = mode;                     // новый активный
  if (mod2 === mod1) mod2 = '';
  currentMode = mode;              // для getBasePath()
  
    // Обновляем картинку модификации
  modeIcon.src = getBasePath() + 'mod.png';
  
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
		
// Первый запуск
loadData();

// === Автоматически скрыть шапку на мобилках через 5 сек после загрузки ===
window.addEventListener('load', () => {
  // проверяем мобильный breakpoint
  if (window.matchMedia('(max-width: 700px)').matches) {
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
modeIcon.src = getBasePath() + 'mod.png';
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



