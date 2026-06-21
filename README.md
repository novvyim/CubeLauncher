<p align="center">
  <img src="public/logo.png" alt="CubeLauncher Logo" width="150">
</p>

<h1 align="center">CubeLauncher</h1>

<p align="center">
  <em>The ultimate bridge between complex console tools and a highly accessible, user-friendly UI for Minecraft Server management.</em>
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <img alt="License" src="https://img.shields.io/badge/License-GPL--3.0-blue.svg" />
  <img alt="Electron" src="https://img.shields.io/badge/Electron-Latest-312450.svg?logo=electron" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-React-black.svg?logo=next.js" />
</p>

---

<details open>
<summary>🇬🇧 <strong>English</strong> (Default)</summary>

## ✨ About the Project
**CubeLauncher** is designed as the ultimate bridge between complex console tools and a highly accessible, user-friendly UI. It creates a fully local, isolated environment for your Minecraft servers, taking the friction out of server configuration so you can focus entirely on gameplay and development.

<p align="center">
  <img src="public/dashboard.png" alt="CubeLauncher Dashboard" width="800" style="border-radius: 10px;">
</p>

## 🎯 Target Audience
* 🛡️ **Server Administrators:** Quickly deploy networks and manage configurations without battling the command line.
* 💻 **Mod/Plugin Developers:** Instantly spin up isolated test servers to debug plugins under various environments.
* 🎮 **Casual Players & Enthusiasts:** Run a private local server for friends in just a few clicks.

## 🚀 Key Features
* ⚡ **One-Click Core Installation:** Instantly download and provision Vanilla, Paper, or Fabric server cores.
* 📊 **Advanced Telemetry:** Monitor your server health with real-time, precise CPU load metrics, allocated RAM footprint, and normalized TPS tracking.
* 📁 **Built-in File Manager:** Safely browse your workspace and natively edit `.properties` and `.yml` files.
* 🔒 **Isolated Architecture:** Keep instances strictly separated to prevent plugin and file conflicts between different server profiles.

<p align="center">
  <img src="public/stats.png" alt="CubeLauncher Stats" width="800" style="border-radius: 10px;">
</p>

## 🏗️ Architecture & Logic
At its core, CubeLauncher relies on a robust **Client-Server desktop architecture**. The modern React frontend handles state and rendering, constantly communicating with the Node.js native background processes via secure Electron IPC channels to manage system hardware and filesystem I/O safely.

<p align="center">
  <img src="public/architecture.png" alt="CubeLauncher Architecture" width="800" style="border-radius: 10px;">
</p>

## 🛠️ Tech Stack
<p>
  <img alt="Next JS" src="https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" />
  <img alt="TailwindCSS" src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img alt="Electron.js" src="https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white" />
  <img alt="NodeJS" src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" />
</p>

## 📦 Installation Guide
```bash
git clone https://github.com/CTPAX4OK/CubeLauncher.git
cd CubeLauncher
npm install
npm run desktop
```
</details>

---

<details>
<summary>🇷🇺 <strong>Русский</strong></summary>

## ✨ О проекте
**CubeLauncher** создан как идеальный мост между сложными консольными инструментами и удобным пользовательским интерфейсом. Он создает полностью локальную, изолированную среду для ваших серверов Minecraft, устраняя сложности настройки, чтобы вы могли полностью сосредоточиться на игре или разработке.

<p align="center">
  <img src="public/dashboard.png" alt="CubeLauncher Dashboard" width="800" style="border-radius: 10px;">
</p>

## 🎯 Целевая аудитория
* 🛡️ **Администраторы серверов:** Быстро развертывайте сети и управляйте конфигурациями без борьбы с командной строкой.
* 💻 **Разработчики модов/плагинов:** Мгновенно запускайте изолированные тестовые серверы для отладки плагинов в различных средах.
* 🎮 **Обычные игроки и энтузиасты:** Запускайте приватный локальный сервер для друзей всего за пару кликов.

## 🚀 Ключевые особенности
* ⚡ **Установка ядра в один клик:** Мгновенно загружайте и настраивайте ядра Vanilla, Paper или Fabric.
* 📊 **Расширенная телеметрия:** Контролируйте состояние сервера с помощью точных показателей нагрузки ЦП в реальном времени, выделенного объема ОЗУ и отслеживания нормализованного TPS.
* 📁 **Встроенный файловый менеджер:** Безопасно просматривайте рабочее пространство и редактируйте файлы `.properties` и `.yml` нативно.
* 🔒 **Изолированная архитектура:** Строго разделяйте экземпляры, чтобы предотвратить конфликты плагинов и файлов между различными профилями серверов.

<p align="center">
  <img src="public/stats.png" alt="CubeLauncher Stats" width="800" style="border-radius: 10px;">
</p>

## 🏗️ Архитектура и логика
В основе CubeLauncher лежит надежная десктопная архитектура Клиент-Сервер. Современный фронтенд на React управляет состоянием и рендерингом, постоянно взаимодействуя с нативными фоновыми процессами Node.js через безопасные IPC каналы Electron для безопасного управления системным оборудованием и файловой системой.

<p align="center">
  <img src="public/architecture.png" alt="CubeLauncher Architecture" width="800" style="border-radius: 10px;">
</p>

## 🛠️ Технологии
<p>
  <img alt="Next JS" src="https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" />
  <img alt="TailwindCSS" src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img alt="Electron.js" src="https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white" />
  <img alt="NodeJS" src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" />
</p>

## 📦 Руководство по установке
```bash
git clone https://github.com/CTPAX4OK/CubeLauncher.git
cd CubeLauncher
npm install
npm run desktop
```
</details>

---

<details>
<summary>🇺🇦 <strong>Українська</strong></summary>

## ✨ Про проект
**CubeLauncher** створений як ідеальний міст між складними консольными інструментами та зручним інтерфейсом користувача. Він створює повністю локальне, ізольоване середовище для ваших серверів Minecraft, знімаючи всі складнощі налаштування, щоб ви могли зосередитися виключно на грі або розробці.

<p align="center">
  <img src="public/dashboard.png" alt="CubeLauncher Dashboard" width="800" style="border-radius: 10px;">
</p>

## 🎯 Цільова аудиторія
* 🛡️ **Адміністратори серверів:** Швидко розгортайте мережі та керуйте конфігураціями без боротьби з командним рядком.
* 💻 **Розробники модів/плагинів:** Миттєво запускайте ізольовані тестові сервери для налагодження плагінів у різних середовищах.
* 🎮 **Звичайні гравці та ентузіасти:** Запускайте приватний локальний сервер для друзів всього за кілька кліків.

## 🚀 Ключові можливості
* ⚡ **Встановлення ядра в один клік:** Миттєво завантажуйте та налаштовуйте ядра Vanilla, Paper або Fabric.
* 📊 **Розширена телеметрія:** Контролюйте стан сервера за допомогою точних показників навантаження ЦП у реальному часі, виділеного обсягу ОЗП та відстеження нормалізованого TPS.
* 📁 **Вбудований файловий менеджер:** Безпечно переглядайте робочий простір і редагуйте файли `.properties` та `.yml` нативно.
* 🔒 **Ізольована архітектура:** Суворо відокремлюйте екземпляри, щоб запобігти конфліктам плагінів та файлів між різними профілями серверів.

<p align="center">
  <img src="public/stats.png" alt="CubeLauncher Stats" width="800" style="border-radius: 10px;">
</p>

## 🏗️ Архітектура та логіка
В основі CubeLauncher лежить надійна десктопная архітектура Клієнт-Сервер. Сучасний фронтенд на React керує станом і рендерингом, постійно взаємодіючи з нативними фоновими процесами Node.js через безпечні IPC канали Electron для безпечного керування системним обладнанням і файловою системою.

<p align="center">
  <img src="public/architecture.png" alt="CubeLauncher Architecture" width="800" style="border-radius: 10px;">
</p>

## 🛠️ Технології
<p>
  <img alt="Next JS" src="https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" />
  <img alt="TailwindCSS" src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img alt="Electron.js" src="https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white" />
  <img alt="NodeJS" src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" />
</p>

## 📦 Інструкція зі встановлення
```bash
git clone https://github.com/CTPAX4OK/CubeLauncher.git
cd CubeLauncher
npm install
npm run desktop
```
</details>
