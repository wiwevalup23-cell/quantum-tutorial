# Как вносить изменения в проект

## Структура проекта

```
web_tutorial/
├── index.html          # Основной HTML файл (точка входа для GitHub Pages)
├── css/
│   └── styles.css      # Основные стили
├── js/
│   ├── canvases.js     # Анимации и canvas-эффекты
│   └── navigation.js   # Навигация между билетами
├── katex/              # Локальный KaTeX (математика без интернета)
├── fonts/              # Шрифты (Lora)
├── src/                # Исходники для сборки (если используется assemble.py)
│   ├── layout.html
│   ├── tickets/
│   └── css/, js/
├── assemble.py         # Скрипт сборки (если нужен)
└── chunks.json         # Данные для сборки
```

## Рабочий процесс

### 1. Локальные изменения
```bash
# Перейди в папку проекта
cd /home/sega/Документы/work/спбгу/квантмех/web_tutorial

# Внеси изменения в файлы
# Основной файл для редактирования: index.html
# Стили: css/styles.css
# Анимации: js/canvases.js
# Навигация: js/navigation.js
```

### 2. Проверка локально
Открой `index.html` в браузере напрямую (двойной клик) или через локальный сервер:
```bash
python3 -m http.server 8000
# Затем открой http://localhost:8000
```

### 3. Коммит и пуш
```bash
git add .
git commit -m "Описание изменений: что и зачем"
git push origin main
```

### 4. Автодеплой
GitHub Pages автоматически пересоберёт сайт за 1-2 минуты после пуша в `main`.
Проверить статус: https://github.com/wiwevalup23-cell/quantum-tutorial/actions

---

## Правила редактирования

### ✅ Что можно править прямо в `index.html`
- Текст билетов, формулы, объяснения
- Добавление новых разделов/аккордеонов
- Изменение порядка билетов в навигации (sidebar)
- Цвета, отступы через inline-стили или CSS-переменные

### ⚠️ Что лучше править в отдельных файлах
- **Стили** → `css/styles.css` (не inline в HTML)
- **Анимации/Canvas** → `js/canvases.js`
- **Навигация/JS логика** → `js/navigation.js`

### 🔧 Если используешь `assemble.py` (сборка из `src/`)
1. Редактируй файлы в `src/` (layout.html, tickets/, css/, js/)
2. Запусти сборку: `python3 assemble.py`
3. Проверь результат в `index.html`
4. Коммить **только** `index.html` (и изменённые исходники в `src/`)

---

## Добавление нового билета

1. В `index.html` — добавь `<button>` в sidebar (nav)
2. Добавь `<section id="ticket-N" class="ticket-section">` с контентом
3. В `js/navigation.js` — обнови массив билетов, если нужен динамический рендеринг

---

## Полезные команды

```bash
# Статус изменений
git status

# Посмотреть дифф
git diff

# Откатить последний коммит (если не пушил)
git reset --soft HEAD~1

# Принудительный пуш (ОСТОРОЖНО, только если ты один работаешь)
git push --force-with-lease origin main
```

---

## Ссылки

- **Сайт**: https://wiwevalup23-cell.github.io/quantum-tutorial/
- **Репозиторий**: https://github.com/wiwevalup23-cell/quantum-tutorial
- **GitHub Pages настройки**: Settings → Pages