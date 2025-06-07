// Navigation service - handles navigation UI and module/word selection logic
// Note: `this` in these functions will refer to the Alpine component instance

export function extractModulesFromWordsIfNeeded() {
    if ((!this.modules || this.modules.length === 0) && this.allWordsFlat.length > 0) {
        console.log('[navigationService] Extracting modules from words data...');
        const moduleMap = new Map();
        this.allWordsFlat.forEach(word => {
            if (word.module_id && !moduleMap.has(word.module_id)) {
                moduleMap.set(word.module_id, {
                    id: word.module_id,
                    name: word.module_name || `Módulo ${word.module_id}`,
                    description: word.module_description || `Módulo que contiene palabras`
                });
            }
        });
        this.modules = Array.from(moduleMap.values());
        console.log('[navigationService] Extracted modules:', this.modules);
    }
}

export function populateNavigation() {
    console.log('[navigationService] Total modules available:', this.modules.length);
    if (this.modules && this.modules.length > 0) {
        this.populateModulesOnly();
    } else {
        this.populateWordNavigation();
    }
}

export function fallbackToModulesOnly() {
    if (this.modules && this.modules.length > 0) {
        console.log('[navigationService] Fallback: showing modules without words');
        this.populateModulesOnly();
    }
}

export function populateModulesOnly() {
    const navList = document.getElementById('word-navigation-list');
    if (!navList) {
        console.error('[navigationService] Navigation list element not found');
        return;
    }

    console.log('[navigationService] Populating navigation with modules only');
    this.clearNavigationList(navList);

    // Sort modules by ID to ensure consistent ordering
    const sortedModules = [...this.modules].sort((a, b) => a.id - b.id);

    // Create module items
    sortedModules.forEach(module => {
        this.createModuleNavigationItem(module, navList);
    });

    console.log('[navigationService] Navigation populated with modules only');
}

export function populateWordNavigation() {
    const navList = document.getElementById('word-navigation-list');
    if (!navList) {
        console.error('[navigationService] Navigation list element not found');
        return;
    }

    if (!this.allWordsFlat || this.allWordsFlat.length === 0) {
        console.warn('[navigationService] No words available for navigation');
        return;
    }

    console.log('[navigationService] Populating fallback word navigation with', this.allWordsFlat.length, 'words');
    navList.innerHTML = '<div class="p-4 text-gray-500">Cargando navegación de palabras...</div>';
}

export function clearNavigationList(navList) {
    const loadingIndicator = navList.querySelector('[x-show="isLoading"]');
    navList.innerHTML = '';
    if (loadingIndicator) navList.appendChild(loadingIndicator);
}

export function createModuleNavigationItem(module, navList) {
    const isFree = this.isModuleFree(module.id);
    const moduleHeader = this.createModuleHeader(module, isFree);
    const wordsContainer = this.createWordsContainer(module.id);

    this.addModuleClickHandler(moduleHeader, wordsContainer, module, isFree);

    navList.appendChild(moduleHeader);
    navList.appendChild(wordsContainer);
}

export function createModuleHeader(module, isFree) {
    const moduleHeader = document.createElement('li');
    moduleHeader.className = 'font-semibold text-purple-700 mt-4 mb-2 border border-purple-200 rounded-lg p-3 cursor-pointer hover:bg-purple-50 transition-colors';
    moduleHeader.innerHTML = `
        <div class="flex justify-between items-center">
            <div class="flex-1">
                <div class="text-sm font-bold flex items-center gap-2">
                    ${module.name}
                    ${isFree ? '<span class="bg-green-500 text-white text-xs px-2 py-1 rounded">GRATIS</span>' : '<svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg>'}
                </div>
                ${module.description ? `<div class="text-xs text-purple-600 font-normal mt-1">${module.description}</div>` : ''}
            </div>
            <span class="module-toggle text-purple-500">▼</span>
        </div>
    `;
    return moduleHeader;
}

export function createWordsContainer(moduleId) {
    const wordsContainer = document.createElement('ul');
    wordsContainer.className = 'module-words hidden mt-2 ml-4 space-y-1';
    wordsContainer.setAttribute('data-module-id', moduleId);
    return wordsContainer;
}

export function addModuleClickHandler(moduleHeader, wordsContainer, module, isFree) {
    moduleHeader.addEventListener('click', async () => {
        if (!isFree) {
            this.showPaymentPopup();
            return;
        }

        const toggle = moduleHeader.querySelector('.module-toggle');
        const isExpanded = !wordsContainer.classList.contains('hidden');

        if (isExpanded) {
            wordsContainer.classList.add('hidden');
            toggle.textContent = '▼';
        } else {
            if (wordsContainer.children.length === 0) {
                await this.loadWordsForModuleNavigation(module.id, wordsContainer);
            }
            wordsContainer.classList.remove('hidden');
            toggle.textContent = '▲';
            this.selectModule(module.id);
        }
    });
}

export async function selectWordFromNav(wordId) {
    console.log('[navigationService] selectWordFromNav()', wordId);
    this.selectedWordId = wordId;
    this.closeMobileMenu();
    await this.showWordDetail(wordId);
}