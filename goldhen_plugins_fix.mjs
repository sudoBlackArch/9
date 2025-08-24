/* Copyright (C) 2025 anonymous

This file is part of PSFree.

PSFree is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

PSFree is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.  */

// GoldHEN Plugins Auto-Reactivation Fix
// Автоматически переактивирует плагины GoldHEN для исправления зависания игр при первом запуске

import { Int } from './module/int64.mjs';
import { mem } from './module/mem.mjs';
import { log, hex, sleep } from './module/utils.mjs';
import { Chain } from './module/chain.mjs';
import { Buffer } from './module/view.mjs';

// Функция для автоматической переактивации плагинов GoldHEN
export async function fixGoldHENPlugins(chain) {
    log('Applying GoldHEN plugins auto-reactivation fix...');
    
    try {
        // Создаем payload для переактивации плагинов
        const goldhen_config_fix = createPluginFixPayload();
        
        // Выполняем переактивацию через системные вызовы
        await reactivatePlugins(chain, goldhen_config_fix);
        
        log('GoldHEN plugins fix applied successfully!');
        return true;
    } catch (error) {
        log(`Error applying GoldHEN plugins fix: ${error}`);
        return false;
    }
}

// Создает payload для переключения плагинов
function createPluginFixPayload() {
    // Payload для работы с настройками GoldHEN
    const GOLDHEN_CONFIG_PATH = '/data/GoldHEN/config.ini';
    const PLUGINS_INI_PATH = '/data/GoldHEN/plugins.ini';
    
    // Структура для работы с файловой системой
    const config_operations = new Buffer(0x1000);
    
    // Команды для переактивации плагинов:
    // 1. Временно отключить Enable Plugins Loader
    // 2. Временно отключить Enable Game Patch Plugin  
    // 3. Включить обратно Enable Plugins Loader
    // 4. Включить обратно Enable Game Patch Plugin
    
    const fix_sequence = [
        // Отключение плагинов
        { setting: 'enable_plugins_loader', value: '0' },
        { setting: 'enable_game_patch_plugin', value: '0' },
        // Небольшая задержка
        { delay: 100 },
        // Включение плагинов обратно
        { setting: 'enable_plugins_loader', value: '1' },
        { setting: 'enable_game_patch_plugin', value: '1' }
    ];
    
    return {
        config_path: GOLDHEN_CONFIG_PATH,
        plugins_path: PLUGINS_INI_PATH,
        operations: fix_sequence,
        buffer: config_operations
    };
}

// Выполняет переактивацию плагинов
async function reactivatePlugins(chain, fix_payload) {
    log('Starting plugins reactivation sequence...');
    
    for (const operation of fix_payload.operations) {
        if (operation.delay) {
            log(`Waiting ${operation.delay}ms for plugin state change...`);
            await sleep(operation.delay);
            continue;
        }
        
        // Модифицируем настройку в GoldHEN config
        await modifyGoldHENSetting(chain, fix_payload.config_path, operation.setting, operation.value);
        
        // Небольшая задержка между операциями
        await sleep(50);
    }
    
    // Принудительно перезагружаем плагины
    await forcePluginsReload(chain, fix_payload);
    
    log('Plugins reactivation sequence completed');
}

// Модифицирует настройку в конфигурационном файле GoldHEN
async function modifyGoldHENSetting(chain, config_path, setting, value) {
    log(`Setting ${setting} = ${value}`);
    
    try {
        // Открываем конфигурационный файл
        const fd = chain.sysi('open', config_path, 0x602); // O_RDWR | O_CREAT
        
        if (fd < 0) {
            log(`Warning: Could not open config file: ${config_path}`);
            return false;
        }
        
        // Создаем буфер для чтения/записи
        const buffer = new Buffer(0x4000);
        
        // Читаем текущий конфиг
        const bytes_read = chain.sysi('read', fd, buffer.addr, buffer.size);
        
        if (bytes_read > 0) {
            // Парсим и обновляем настройку
            const config_text = buffer.read_string(bytes_read);
            const updated_config = updateConfigSetting(config_text, setting, value);
            
            // Записываем обновленный конфиг
            chain.sysi('lseek', fd, 0, 0); // SEEK_SET
            chain.sysi('ftruncate', fd, 0);
            chain.sysi('write', fd, updated_config, updated_config.length);
        }
        
        // Закрываем файл
        chain.sysi('close', fd);
        
        return true;
    } catch (error) {
        log(`Error modifying GoldHEN setting: ${error}`);
        return false;
    }
}

// Обновляет конкретную настройку в тексте конфига
function updateConfigSetting(config_text, setting, value) {
    const lines = config_text.split('\n');
    let found = false;
    
    // Ищем и обновляем настройку
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(setting)) {
            lines[i] = `${setting}=${value}`;
            found = true;
            break;
        }
    }
    
    // Если настройка не найдена, добавляем её
    if (!found) {
        lines.push(`${setting}=${value}`);
    }
    
    return lines.join('\n');
}

// Принудительно перезагружает плагины
async function forcePluginsReload(chain, fix_payload) {
    log('Force reloading GoldHEN plugins...');
    
    try {
        // Пытаемся выгрузить и заново загрузить плагины через системные вызовы
        
        // 1. Выгружаем текущие плагины
        await unloadPlugins(chain);
        await sleep(200);
        
        // 2. Заново загружаем плагины
        await loadPlugins(chain, fix_payload.plugins_path);
        await sleep(200);
        
        log('Plugins reload completed');
        return true;
    } catch (error) {
        log(`Error during plugins reload: ${error}`);
        return false;
    }
}

// Выгружает текущие плагины
async function unloadPlugins(chain) {
    // Список основных плагинов GoldHEN для выгрузки
    const plugins_to_unload = [
        'game_patch.prx',
        'cheat_manager.prx',
        'browser_patch.prx'
    ];
    
    for (const plugin of plugins_to_unload) {
        try {
            // Пытаемся найти и выгрузить плагин
            const handle = chain.sysi('dynlib_get_list', plugin, 0);
            if (handle > 0) {
                chain.sysi('dynlib_unload_prx', handle);
                log(`Unloaded plugin: ${plugin}`);
            }
        } catch (error) {
            // Игнорируем ошибки выгрузки - плагин может быть уже выгружен
        }
    }
}

// Загружает плагины заново
async function loadPlugins(chain, plugins_path) {
    try {
        // Открываем файл plugins.ini для чтения списка плагинов
        const fd = chain.sysi('open', plugins_path, 0); // O_RDONLY
        
        if (fd >= 0) {
            const buffer = new Buffer(0x1000);
            const bytes_read = chain.sysi('read', fd, buffer.addr, buffer.size);
            chain.sysi('close', fd);
            
            if (bytes_read > 0) {
                const plugins_text = buffer.read_string(bytes_read);
                const plugin_paths = parsePluginsList(plugins_text);
                
                // Загружаем каждый плагин
                for (const plugin_path of plugin_paths) {
                    try {
                        const handle = chain.sysi('dynlib_load_prx', plugin_path, 0);
                        if (handle > 0) {
                            log(`Loaded plugin: ${plugin_path}`);
                        }
                    } catch (error) {
                        log(`Error loading plugin ${plugin_path}: ${error}`);
                    }
                }
            }
        }
    } catch (error) {
        log(`Error loading plugins: ${error}`);
    }
}

// Парсит список плагинов из plugins.ini
function parsePluginsList(plugins_text) {
    const lines = plugins_text.split('\n');
    const plugin_paths = [];
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('[') && !trimmed.startsWith('#') && trimmed.includes('.prx')) {
            plugin_paths.push(trimmed);
        }
    }
    
    return plugin_paths;
}

// Проверяет, нужно ли применять фикс
export function shouldApplyPluginsFix() {
    // Проверяем localStorage флаг
    if (localStorage.getItem('goldhen_plugins_fixed') === 'true') {
        return false;
    }
    
    // Проверяем sessionStorage флаг
    if (sessionStorage.getItem('goldhen_plugins_fixed') === 'true') {
        return false;
    }
    
    return true;
}

// Устанавливает флаг что фикс применен
export function markPluginsFixApplied() {
    localStorage.setItem('goldhen_plugins_fixed', 'true');
    sessionStorage.setItem('goldhen_plugins_fixed', 'true');
    log('GoldHEN plugins fix flag set - no need to reapply until reboot');
}

// Сбрасывает флаг фикса (для принудительного повторного применения)
export function resetPluginsFixFlag() {
    localStorage.removeItem('goldhen_plugins_fixed');
    sessionStorage.removeItem('goldhen_plugins_fixed');
    log('GoldHEN plugins fix flag reset');
}
