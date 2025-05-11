// filters.js

/**
 * Рисует UI‑фильтры по характеристикам.
 *
 * @param {{ key: string, label: string }[]} attrList
 * @param {HTMLElement} container
 * @param {(key:string, mode:'none'|'minus'|'plus'|'eq'|'any')=>void} onFilterChange
 */
function setupAttributeFilters(attrList, container, onFilterChange) {
  // 1) порядок отрисовки — ключи в том порядке, в каком хотим видеть
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
    'Количество действий', 
	
    // ...далее остальные ключи в желаемом порядке
  ];

  // 2) убираем «Физическая защита» (она руками вшивается в две предыдущие)
	const excludedKeys = ['Физическая защита', 'Физическая атака', 'Иммунитет к магии'];
	const filtered = attrList.filter(a => !excludedKeys.includes(a.key));

  // 3) сортируем по ATTR_ORDER (остальные идут в конец в алф. порядке меток)
  filtered.sort((a, b) => {
    const ia = ATTR_ORDER.indexOf(a.key);
    const ib = ATTR_ORDER.indexOf(b.key);
    if (ia === -1 && ib === -1) {
      // оба вне списка — по алфавиту названий
      return a.label.localeCompare(b.label);
    }
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  // 4) теперь отрисовываем в нужном порядке
  filtered.forEach(attr => {
    const row = document.createElement('div');
    row.className = 'attr-filter-row';
    row.innerHTML = `
      <span class="attr-filter-label">${attr.label}</span>
      <button data-key="${attr.key}" data-mode="none">—</button>
      <button data-key="${attr.key}" data-mode="minus">-x</button>
      <button data-key="${attr.key}" data-mode="plus">+x</button>
      <button data-key="${attr.key}" data-mode="eq">=x</button>
      <button data-key="${attr.key}" data-mode="any">✓</button>
    `;
    container.append(row);

    // по‑умолчанию “none”
    row.querySelector('button[data-mode="none"]').classList.add('active');

    row.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        row.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onFilterChange(btn.dataset.key, btn.dataset.mode);
      });
    });
  });
}

/**
 * Фильтрует карточки по одной характеристике.
 *
 * @param {HTMLElement[]} cards
 * @param {string} key
 * @param {'none'|'minus'|'plus'|'eq'|'any'} mode
 * @return {HTMLElement[]}
 */
function applyAttributeFilter(cards, key, mode) {
  if (mode === 'none') return cards;

  return cards.filter(card => {
    let obj;
    try {
      obj = JSON.parse(card.dataset.attrs || '{}');
    } catch {
      return false;
    }

    // достаём raw‑значение
    let raw = '';
    if (obj[key] !== undefined) {
      raw = String(obj[key]);
	} else {
	  // special-case: Physical → двух видов защиты
	  const physKeys = ['Защита рукопашная', 'Защита стрелковая'];
	  if (physKeys.includes(key) && obj['Физическая защита'] !== undefined) {
		raw = String(obj['Физическая защита']);
	  }
	  // special-case: Immunity → любой magic-def
	  const magKeys = [
		'Защита от магии смерти',
		'Защита от магии стихий',
		'Защита от магии жизни'
	  ];
	  if (!raw && magKeys.includes(key) && obj['Иммунитет к магии'] !== undefined) {
		raw = String(obj['Иммунитет к магии']);
	  }
	  // *** ещё одна комбинация ***
	  const AtackKeys = ['Атака рукопашная', 'Атака стрелковая'];            
	  if (!raw && AtackKeys.includes(key) && obj['Физическая атака'] !== undefined) {
		raw = String(obj['Физическая атака']);
	  }
	}

    if (!raw) return false;

    // ровно
    if (mode === 'eq') {
      return raw.startsWith('=');
    }

    // остальные пропускают «=…», кроме any
    if (raw.startsWith('=')) {
      return mode === 'any';
    }

    if (mode === 'any') return true;

    // парсим остаток как число
    const num = parseFloat(raw.replace(/^[+\s]+/, ''));
    if (isNaN(num)) return false;
    if (mode === 'plus')  return num > 0;
    if (mode === 'minus') return num < 0;
    return false;
  });
}

window.setupAttributeFilters = setupAttributeFilters;
window.applyAttributeFilter  = applyAttributeFilter;



/**
 * Рисует UI‑список фильтрации по бонусам.
 * @param {{key:string,label:string,icon:string|null}[]} bonusList
 * @param {HTMLElement} container
 * @param {(key:string)=>void} onChange
 */
function setupBonusFilter(bonusList, container, onChange) {
  container.classList.add('bonus-filter');
  // метка
  const label = document.createElement('span');
  label.className = 'filter-label';
  label.textContent = 'Бонус';
  container.append(label);

  // обёртка дропдауна
  const dd = document.createElement('div');
  dd.className = 'dropdown';

  // кнопка-выбор
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'dropdown-toggle';
  toggle.textContent = 'Все';
  dd.append(toggle);

  // меню
  const menu = document.createElement('div');
  menu.className = 'dropdown-menu';
  
  
  
  bonusList.forEach(b => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.dataset.bonus = b.key;
    if (b.icon) {
      const img = document.createElement('img');
      img.src = b.icon;
      img.alt = '';
      img.width = 20; img.height = 20;
      img.style.marginRight = '6px';
      item.append(img);
    }
    const span = document.createElement('span');
    span.textContent = b.label;
    item.append(span);

    // клик по пункту
    item.addEventListener('click', e => {
      e.stopPropagation();
      // выделяем
      menu.querySelectorAll('.dropdown-item').forEach(x => x.classList.remove('active'));
      item.classList.add('active');
      // меняем текст на кнопке
		toggle.innerHTML = '';
		// если у бонуса есть иконка — добавляем её
		if (b.icon) {
		  const iconEl = document.createElement('img');
		  iconEl.src = b.icon;
		  iconEl.alt = '';
		  iconEl.width = 20;
		  iconEl.height = 20;
		  iconEl.style.marginRight = '6px';
		  toggle.append(iconEl);
		}
		// и добавляем текст
		toggle.append(document.createTextNode(b.label));
		// прячем меню и вызываем колбэк
		menu.classList.remove('show');
		onChange(b.key);
    });

    menu.append(item);
  });

  dd.append(menu);
  container.append(dd);

  // показываем/скрываем меню
  toggle.addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('show');
  });
  // клик вне — закрываем
  document.addEventListener('click', e => {
    if (!container.contains(e.target)) {
      menu.classList.remove('show');
    }
  });
}

