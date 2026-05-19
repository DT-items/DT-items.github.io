
// comparator.js
// Модуль отвечает за логику сравнения предметов, вычисление разницы характеристик
// и управление левой панелью закрепленных предметов.

window.pinnedItemIds = window.pinnedItemIds || new Set();

/**
 * Утилита для раскраски знаков + и -
 * Используется и в основном рендере (script.js), и в компараторе.
 */
window.colorizeSigns = function(text) {
    if (!text) return '';
    return text.replace(/([+\-])/g, (match) => 
        match === '+' ? '<span class="sign-plus">+</span>' : '<span class="sign-minus">-</span>'
    );
};

/**
 * Проверяет, есть ли хоть одно отличие между модами в карточке.
 * Сравнивает атрибуты, бонус, магию и цену.
 */
window.hasDifference = function(card) {
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
};

/**
 * Проверяет состояние панели сравнения:
 * Если есть закрепленные предметы — расширяет body (класс compare-wide).
 * Если нет — сужает.
 */
window.checkComparePanelState = function() {
  const panel = document.getElementById('compare-panel');
  const panelContent = document.querySelector('.compare-panel-content');
  if (!panelContent || !panel) return;

  const pinnedItems = panelContent.querySelectorAll('.pinned-item');

  // Если панель пуста — ОБЯЗАТЕЛЬНО сбрасываем подсветку сравнения
  if (pinnedItems.length === 0) {
      window.clearComparison();
      document.body.classList.remove('compare-wide');
      panel.classList.add('is-empty');
      return;
  } else {
      panel.classList.remove('is-empty');
  }

  // Ищем все элементы, которые ИМЕЮТ класс double
  const doubleItems = panelContent.querySelectorAll('.pinned-item.double');
  
  // Если есть хотя бы один — включаем широкий режим
  if (doubleItems.length > 0) {
    document.body.classList.add('compare-wide');
  } else {
    document.body.classList.remove('compare-wide');
  }
};

/**
 * Добавляет карточку предмета в левую панель сравнения (Pinning).
 */
window.addToComparePanel = function(originalCard) {
  const panelContent = document.querySelector('.compare-panel-content');
  
  // Создаем контейнер для закрепленного предмета
  const pinnedItem = document.createElement('div');
  pinnedItem.className = 'pinned-item';
  
  // Проверяем наличие второго тултипа для режима сравнения.
  // compareMode - глобальная переменная из script.js
  const tt2 = originalCard.querySelector('.tooltip-2');
  
  // ВАЖНО: Сначала определяем класс, потом добавляем в DOM
  if (tt2 && window.compareMode) {
    // ДВОЙНОЙ РЕЖИМ
    pinnedItem.classList.add('double');
  } else {
    // ОДИНАРНЫЙ РЕЖИМ
    pinnedItem.classList.add('single');
  }

  // Присваиваем UID и сохраняем в глобальный Set
  const uid = originalCard.dataset.uid;
  if (uid) {
      pinnedItem.dataset.uid = uid;
      window.pinnedItemIds.add(uid);
      originalCard.classList.add('is-pinned');
  }

  // Создаем контейнер для иконок (одной или двух)
  const iconContainer = document.createElement('div');
  iconContainer.className = 'pinned-icon-container';
  
  // 1. Первая иконка (всегда есть)
  const originalImg = originalCard.querySelector('img');
  if (originalImg) {
    iconContainer.appendChild(originalImg.cloneNode(true));
  }
  
  if (tt2 && window.compareMode) {
    // 2. Вторая иконка (если есть в dataset)
    if (originalCard.dataset.icon2) {
      const img2 = document.createElement('img');
      img2.src = originalCard.dataset.icon2;
      iconContainer.appendChild(img2);
    }
  }
  
  // Добавляем контейнер иконок в карточку
  pinnedItem.appendChild(iconContainer);
  
  // Клонируем первый тултип
  const tt1 = originalCard.querySelector('.tooltip-1');
  if (tt1) {
    const tt1Clone = tt1.cloneNode(true);
    // Сбрасываем инлайновые стили позиционирования
    tt1Clone.style.left = '';
    tt1Clone.style.top = '';
    tt1Clone.classList.remove('visible'); // Видимость будет управляться CSS
    tt1Clone.dataset.pinnedUid = uid; // Привязываем тултип к UID для очистки
    pinnedItem.appendChild(tt1Clone);
  }
  
  // Клонируем второй тултип, если нужен
  if (tt2 && window.compareMode) {
    const tt2Clone = tt2.cloneNode(true);
    tt2Clone.style.left = '';
    tt2Clone.style.top = '';
    tt2Clone.classList.remove('visible');
    tt2Clone.dataset.pinnedUid = uid; // Привязываем тултип к UID для очистки
    pinnedItem.appendChild(tt2Clone);
  }
  
  // Логика для появления тултипов при наведении в режиме сетки
  let activeTooltips = [];

  pinnedItem.addEventListener('mouseenter', () => {
      const panelContent = document.querySelector('.compare-panel-content');
      if (!panelContent || !panelContent.classList.contains('grid-view')) return;

      pinnedItem.classList.add('hovered');

      const rect = pinnedItem.getBoundingClientRect();
      
      // Ищем тултипы либо внутри предмета, либо в body (если они в процессе исчезновения)
      const t1 = pinnedItem.querySelector('.tooltip-1') || activeTooltips.find(t => t.classList.contains('tooltip-1'));
      const t2 = pinnedItem.querySelector('.tooltip-2') || activeTooltips.find(t => t.classList.contains('tooltip-2'));

      // Очищаем таймеры исчезновения, если быстро навели курсор обратно
      if (t1 && t1._hideTimer) clearTimeout(t1._hideTimer);
      if (t2 && t2._hideTimer) clearTimeout(t2._hideTimer);
      
      activeTooltips = [];

      const isTopbarHidden = document.body.classList.contains('topbar-hidden');
      const topBarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--top-bar-height')) || 60;
      const topBoundary = isTopbarHidden ? 5 : topBarHeight + 23;

      const gap = 10;
      let leftPos = rect.right + gap;

      if (t1) {
          // Если тултип еще не в body, перемещаем его туда
          if (t1.parentNode !== document.body) {
              document.body.appendChild(t1);
          }
          t1.classList.add('grid-tooltip-detached');
          activeTooltips.push(t1);

          t1.style.left = `${leftPos}px`;
          let topPos = rect.top;
          
          if (topPos < topBoundary) {
              topPos = topBoundary;
          } else if (topPos + t1.offsetHeight > window.innerHeight) {
              topPos = Math.max(topBoundary, window.innerHeight - t1.offsetHeight - 10);
          }
          t1.style.top = `${topPos}px`;

          // Принудительно вызываем перерисовку для срабатывания CSS transition
          void t1.offsetWidth;
          t1.classList.add('visible');

          if (t2) {
              if (t2.parentNode !== document.body) {
                  document.body.appendChild(t2);
              }
              t2.classList.add('grid-tooltip-detached');
              activeTooltips.push(t2);

              let leftPos2 = leftPos + t1.offsetWidth + gap;
              t2.style.left = `${leftPos2}px`;
              let topPos2 = rect.top;
              
              if (topPos2 < topBoundary) {
                  topPos2 = topBoundary;
              } else if (topPos2 + t2.offsetHeight > window.innerHeight) {
                  topPos2 = Math.max(topBoundary, window.innerHeight - t2.offsetHeight - 10);
              }
              t2.style.top = `${topPos2}px`;
              
              void t2.offsetWidth;
              t2.classList.add('visible');
          }
      }
  });

  pinnedItem.addEventListener('mouseleave', () => {
      pinnedItem.classList.remove('hovered');
      
      // Плавно скрываем тултипы
      activeTooltips.forEach(t => {
          t.classList.remove('visible'); // Запускает CSS opacity transition
          
          if (t._hideTimer) clearTimeout(t._hideTimer);
          
          // Возвращаем в DOM карточки только после окончания анимации (200мс)
          t._hideTimer = setTimeout(() => {
              t.classList.remove('grid-tooltip-detached');
              t.style.left = '';
              t.style.top = '';
              if (t.parentNode === document.body) {
                  pinnedItem.appendChild(t);
              }
          }, 200); 
      });
  });
  
  // Добавляем в панель
  panelContent.appendChild(pinnedItem);
  
  // Проверяем, нужно ли расширить панель
  window.checkComparePanelState();
};

// --- ЛОГИКА СРАВНЕНИЯ ХАРАКТЕРИСТИК ПРИ НАВЕДЕНИИ ---

/**
 * Очищает визуальные маркеры сравнения (скобки с разницей)
 */
window.clearComparison = function() {
  // Ищем все span с классом comp-diff и удаляем их
  document.querySelectorAll('.comp-diff').forEach(el => el.remove());
  // Ищем все "фантомные" li, которые мы добавили, и удаляем их
  document.querySelectorAll('.comp-ghost-li').forEach(el => el.remove());
};

/**
 * Запускает логику сравнения для наведенной карточки.
 * Сравнивает наведенную карточку с закрепленными в панели.
 */
window.applyComparison = function(hoveredCard) {
  // Сначала всегда чистим всё, чтобы не накладывались старые скобки
  window.clearComparison();

  // Ищем все закрепленные предметы
  const pinnedItems = document.querySelectorAll('.compare-panel-content .pinned-item');
  if (pinnedItems.length === 0) return;

  const isPanelOpen = document.body.classList.contains('compare-open');

  // 1. Закрепленные предметы ВСЕГДА сравнивают себя с наведенным
  pinnedItems.forEach(pinned => {
    // Сравниваем tooltip-1 (pinned) vs tooltip-1 (hovered)
    const hT1 = hoveredCard.querySelector('.tooltip-1');
    const pT1 = pinned.querySelector('.tooltip-1');
    if (hT1 && pT1) window.compareTooltips(pT1, hT1); // target=pinned, source=hovered

    // Сравниваем tooltip-2 (pinned) vs tooltip-2 (hovered), если есть у обоих
    const hT2 = hoveredCard.querySelector('.tooltip-2');
    const pT2 = pinned.querySelector('.tooltip-2');
    if (hT2 && pT2) window.compareTooltips(pT2, hT2);
  });

  // 2. Наведенный предмет сравнивает себя с закрепленным ТОЛЬКО если 1 закреплен и панель открыта
  if (pinnedItems.length === 1 && isPanelOpen) {
      const pinned = pinnedItems[0];
      const hT1 = hoveredCard.querySelector('.tooltip-1');
      const pT1 = pinned.querySelector('.tooltip-1');
      if (hT1 && pT1) window.compareTooltips(hT1, pT1); // target=hovered, source=pinned

      const hT2 = hoveredCard.querySelector('.tooltip-2');
      const pT2 = pinned.querySelector('.tooltip-2');
      if (hT2 && pT2) window.compareTooltips(hT2, pT2);
  }
};

/**
 * Парсит строковое значение атрибута (например "+10%", "=50").
 */
window.parseAttrValue = function(str) {
    if (!str) return null;
    str = str.trim();
    let type = 'flat'; // по умолчанию просто число
    let num = 0;

    // Определяем тип и чистое число
    if (str.endsWith('%')) {
        type = 'percent';
        num = parseFloat(str);
    } else if (str.startsWith('=')) {
        type = 'set';
        // вырезаем '=' и парсим
        num = parseFloat(str.substring(1));
    } else {
        // Обычное число (включая "+5", "-2", "10")
        type = 'flat';
        num = parseFloat(str);
    }

    if (isNaN(num)) return null; // если там текст "Да/Нет" или мусор

    return { type, num, raw: str };
};

/**
 * Вспомогательная функция для добавления текстовой скобки (разница в тексте)
 */
window.addTextDiffSpan = function(parentEl, sourceText, isSourceBetter = false, options = {}) {
    const span = document.createElement('span');
    span.className = 'comp-diff';
    
    if (options.newLine) {
        span.classList.add('comp-diff-newline');
    }
    
    // Если переданы классы магии - используем их вместо стандартных цветов
    if (options.magicClass) {
        span.classList.add(options.magicClass);
    } else {
        // Логика цвета для текста:
        // isSourceBetter = true -> Зеленый
        // isSourceBetter = false -> Красный
        if (isSourceBetter) {
            span.classList.add('comp-green');
        } else {
            span.classList.add('comp-red');
        }
    }

    // New format: (<Icon> Text) with Space before
    span.appendChild(document.createTextNode(' ('));

    // Если передан стиль иконки - добавляем иконку
    if (options.iconStyle) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'comp-bonus-img';
        iconSpan.style.backgroundImage = options.iconStyle;
        span.appendChild(iconSpan);
    }
    
    // Добавляем текст и закрывающую скобку
    span.appendChild(document.createTextNode(sourceText + ')'));
    
    parentEl.appendChild(span);
};

/**
 * Вспомогательная для фантомного текста (бонус/магия), которого нет в исходном предмете
 */
window.createGhostTextLi = function(ul, spacer, text, className, isNew, options = {}) {
    const li = document.createElement('li');
    li.className = `comp-ghost-li ${className}`;
    
    // Пишем заглушку
    const spanContent = document.createElement('span');
    spanContent.className = 'bonus-text';
    spanContent.textContent = 'Нет';
    li.appendChild(spanContent);
    
    // Добавляем скобку с новым значением
    window.addTextDiffSpan(li, text, true, options); // true = green (новое)
    
    ul.insertBefore(li, spacer);
};

/**
 * Сравнение двух конкретных тултипов: targetTt получает скобки со значениями из sourceTt
 */
window.compareTooltips = function(targetTt, sourceTt) {

  // 1. Parsing Helper
  const parseVals = (str) => {
    const res = { flat: null, set: null, percent: null };
    if (!str) return res;
    // Split by space, filtering empties
    const parts = str.split(' ').filter(Boolean);
    parts.forEach(p => {
        if (p.endsWith('%')) {
            res.percent = parseFloat(p);
        } else if (p.startsWith('=')) {
            res.set = parseFloat(p.substring(1));
        } else {
            res.flat = parseFloat(p);
        }
    });
    return res;
  };

  // 2. Extract Stats
  const getStats = (tt) => {
    const map = {};
    // Exclude bonus/magic lines
    tt.querySelectorAll('li[data-key]:not([data-key="bonus"]):not([data-key="magic"])').forEach(li => {
      const k = li.dataset.key;
      map[k] = {
        val: parseVals(li.dataset.val),
        li: li
      };
    });
    return map;
  };

  const tStats = getStats(targetTt);
  const sStats = getStats(sourceTt);

  // 3. Union of keys
  const allKeys = new Set([...Object.keys(tStats), ...Object.keys(sStats)]);
  
  const targetUl = targetTt.querySelector('ul.attrs');
  const spacer = targetUl.querySelector('.spacer');

  allKeys.forEach(key => {
      const t = tStats[key];
      const s = sStats[key];
      
      const tVal = t ? t.val : { flat: null, set: null, percent: null };
      const sVal = s ? s.val : { flat: null, set: null, percent: null };

      // Determine union of types present in EITHER item
      const hasFlat = tVal.flat !== null || sVal.flat !== null;
      const hasSet  = tVal.set !== null || sVal.set !== null;
      const hasPercent = tVal.percent !== null || sVal.percent !== null;

      const parts = [];

      // Helper to generate comparison HTML for a component
      // type: 'flat' | 'set' | 'percent'
      const buildPart = (type) => {
          const tv = tVal[type] !== null ? tVal[type] : 0;
          const sv = sVal[type] !== null ? sVal[type] : 0;
          
          let text = '';
          // Formatting Source Value
          // Use '—' for missing or zero values (except set=0)
          const isZeroOrNull = (sVal[type] === null) || (sVal[type] === 0 && type !== 'set');
          
          if (isZeroOrNull) {
              text = '-';
          } else {
              const v = sVal[type];
              if (type === 'percent') text = (v > 0 ? `+${v}` : v) + '%';
              else if (type === 'set') text = `=${v}`;
              else text = (v > 0 ? `+${v}` : v);
          }

          // Coloring: Source vs Target
          let cls = '';
          if (sv > tv) cls = 'comp-green';
          else if (sv < tv) cls = 'comp-red';
          
          return `<span class="${cls}">${text}</span>`;
      };

      // Strict Order: Set, Flat, Percent
      if (hasSet)  parts.push(buildPart('set'));
      if (hasFlat) parts.push(buildPart('flat'));
      if (hasPercent) parts.push(buildPart('percent'));

      if (parts.length > 0) {
          const diffHtml = parts.join(' '); // Space separated
          const span = document.createElement('span');
          span.className = 'comp-diff';
          // Space before parenthesis
          span.innerHTML = ` (${diffHtml})`;

          if (t && t.li) {
              t.li.appendChild(span);
          } else {
              // Ghost LI
              const li = document.createElement('li');
              li.className = 'comp-ghost-li';
              
              // Build base text for Target (which is effectively 0s)
              // We construct it based on what types are present in Source
              const baseArr = [];
              if (sVal.set !== null)  baseArr.push('0');
              if (sVal.flat !== null) baseArr.push('0');
              if (sVal.percent !== null) baseArr.push('0%');
              
              const baseText = baseArr.length ? baseArr.join(' ') : '0';
              
              li.innerHTML = `${key.replace(/-/g, ' ')}: ${window.colorizeSigns(baseText)}`;
              li.appendChild(span);
              targetUl.insertBefore(li, spacer);
          }
      }
  });

  // -- Сравнение БОНУСОВ и МАГИИ --
  const getTextVal = (tt, key) => {
      const li = tt.querySelector(`li[data-key="${key}"]`);
      if (!li) return null;
      const span = li.querySelector('.bonus-text');
      // Пытаемся достать иконку из inline-стиля
      let iconStyle = '';
      if (span && span.style.getPropertyValue('--bonus-icon')) {
          iconStyle = span.style.getPropertyValue('--bonus-icon');
      }
      // Пытаемся достать класс магии
      let magicClass = '';
      if (key === 'magic') {
           if (li.classList.contains('magic-death')) magicClass = 'magic-death';
           else if (li.classList.contains('magic-life')) magicClass = 'magic-life';
           else if (li.classList.contains('magic-elemental')) magicClass = 'magic-elemental';
      }

      return { el: li, text: span ? span.textContent.trim() : '', iconStyle, magicClass };
  };

  ['bonus', 'magic'].forEach(key => {
      const t = getTextVal(targetTt, key);
      const s = getTextVal(sourceTt, key);

      if (t && s) {
          // Есть у обоих
          if (t.text !== s.text) {
              // Тексты разные -> (Другой текст)
              window.addTextDiffSpan(t.el, s.text, false, { 
                  magicClass: s.magicClass,
                  iconStyle: s.iconStyle,
                  newLine: true
              }); 
          }
      } else if (t && !s) {
          // Есть у Target, нет у Source -> (Нет) красный
          window.addTextDiffSpan(t.el, 'Нет', false);
      } else if (!t && s) {
          // Нет у Target, есть у Source -> Фантомная строка (Текст) зеленый/цвет магии
          // Класс для линии берем magic-line или bonus-line
          const className = (key === 'magic') ? `magic-line ${s.magicClass}` : 'bonus-line';
          window.createGhostTextLi(targetUl, spacer, s.text, className, true, {
              magicClass: s.magicClass,
              iconStyle: s.iconStyle
          });
      }
  });


  // -- Сравнение цены (ИНВЕРТИРОВАНО: меньше — лучше) --
  const getPrice = (tt) => {
    const el = tt.querySelector('.tooltip-price');
    if (!el) return null;
    const txt = el.textContent.trim();
    // Убираем возможные скобки если они уже есть
    const cleanTxt = txt.split('(')[0].trim();
    const val = parseFloat(cleanTxt);
    return isNaN(val) ? null : { val, el, raw: cleanTxt };
  };

  const tPrice = getPrice(targetTt);
  const sPrice = getPrice(sourceTt);

  if (tPrice && sPrice) {
      if (tPrice.val !== sPrice.val) {
          const span = document.createElement('span');
          span.className = 'comp-diff';
          // Space before parenthesis
          span.textContent = ` (${sPrice.raw})`;

          // Для цены: Меньше = Лучше (Зеленый)
          if (sPrice.val < tPrice.val) {
              span.classList.add('comp-green');
          } else {
              span.classList.add('comp-red');
          }
          
          tPrice.el.appendChild(span);
      }
  }
};
