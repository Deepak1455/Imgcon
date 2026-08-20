/**
 * ==========================================================================
 * SCRIPT.JS - ImgCon Central Orchestrator & Application Manager (Ultra-Fast)
 * Features: Self-Healing DOM, Clean SPA Routing, Memory Management & GPU UI
 * ==========================================================================
 */

// --- Global State Management ---
let files = [];
let originalFileDetails = [];
let processedResults = [];
let currentImageIdx = 0;
let selectedFormat = null;
let activeTool = null;
let deferredInstallPrompt = null;
let watermarkImage = null;
let currentModalBlobUrl = null;

// --- Window Setter Helper for External Modules ---
window.setSelectedFormat = function(fmt) {
    selectedFormat = fmt;
    window.selectedFormat = fmt;
};

// --- DOM Elements Cache ---
const homeBtn = document.getElementById('homeBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const mainContainer = document.querySelector('main.app-container');
const mainFooter = document.getElementById('main-footer');
const cardFooter = document.getElementById('card-footer');

// --- Dynamic External Library Loader (Cached Promise Engine) ---
const loadedLibraries = {};
function loadExternalLibrary(src) {
    if (loadedLibraries[src]) return loadedLibraries[src];
    loadedLibraries[src] = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (err) => {
            delete loadedLibraries[src];
            reject(err);
        };
        document.head.appendChild(script);
    });
    return loadedLibraries[src];
}
window.loadExternalLibrary = loadExternalLibrary;

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .catch(err => console.warn('Service Worker registration skipped:', err));
    });
}

// --- SELF-HEALING: Inject Required Global Templates & Modals If Missing ---
function ensureGlobalTemplates() {
    // 1. Tool Layout Template
    if (!document.getElementById('toolLayoutTemplate')) {
        const tpl = document.createElement('template');
        tpl.id = 'toolLayoutTemplate';
        tpl.innerHTML = `
            <div class="tool-container transition-all duration-500">
                <div class="tool-header-banner text-center max-w-3xl mx-auto mb-6">
                    <span class="tool-header-badge inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xxs font-black uppercase tracking-wider mb-2 border shadow-xs" style="background-color: var(--bg-subtle); border-color: var(--card-border); color: var(--primary-color);">
                        ⚡ 100% Private Image Tool
                    </span>
                    <h2 class="tool-header-title text-2xl sm:text-3xl font-black tracking-tight mb-2" style="color: var(--text-dark);">
                        Image Tool
                    </h2>
                    <p class="tool-header-desc text-xs sm:text-sm font-medium leading-relaxed" style="color: var(--text-light);">
                        Process images directly in your browser with zero server uploads.
                    </p>
                </div>

                <div class="drop-zone-container">
                    <div class="drop-zone drop-zone-modern rounded-3xl p-8 sm:p-10 text-center cursor-pointer mb-6 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 relative overflow-hidden group" id="dropZone" style="border-color: var(--card-border); background-color: var(--bg-subtle);">
                        <div class="drop-zone-glow"></div>
                        <div class="initial-drop-message relative z-10 flex flex-col items-center">
                            <div class="drop-icon-wrapper mb-4 relative flex items-center justify-center">
                                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-500 flex items-center justify-center text-3xl sm:text-4xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    <i class="fas fa-cloud-upload-alt animate-pulse"></i>
                                </div>
                                <span class="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-xxs font-extrabold bg-indigo-500 text-white shadow-md animate-bounce tracking-wider">BATCH</span>
                            </div>
                            <p class="tool-header-prompt text-sm sm:text-base font-black mb-4" style="color: var(--text-dark);">
                                Drag & drop or browse files from your local storage
                            </p>
                            <div class="flex flex-wrap items-center justify-center gap-1.5 mb-4 opacity-90">
                                <span class="format-pill">JPG</span>
                                <span class="format-pill">PNG</span>
                                <span class="format-pill">WEBP</span>
                                <span class="format-pill">AVIF</span>
                                <span class="format-pill">HEIC</span>
                                <span class="format-pill">PDF</span>
                            </div>
                        </div>

                        <div class="staging-area hidden w-full relative z-10">
                            <div class="thumbnail-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-5 max-h-56 overflow-y-auto p-3 rounded-2xl border shadow-inner" style="background-color: var(--card-bg); border-color: var(--card-border);"></div>
                            <p class="file-summary font-black text-base mb-4" style="color: var(--text-dark);"></p>
                            <button class="confirm-btn upload-button py-3 px-8 text-sm shadow-md">
                                <i class="fas fa-arrow-right mr-2"></i>Continue to Process
                            </button>
                        </div>

                        <input type="file" class="hidden file-input" accept="image/*" multiple>
                    </div>
                </div>

                <div class="process-ui grid md:grid-cols-2 gap-8 hidden animate__animated animate__fadeInUp">
                    <div class="left-column space-y-5">
                        <div class="preview-container h-64 md:h-96 rounded-2xl relative flex items-center justify-center overflow-hidden border shadow-inner transition-all duration-300" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                            <div class="gallery-container w-full h-full flex transition-transform duration-500 ease-out"></div>
                        </div>

                        <div class="flex justify-between items-center px-3 py-2 rounded-xl border shadow-xs" style="background-color: var(--bg-subtle); border-color: var(--card-border); color: var(--text-dark);">
                            <button class="prev-image-btn p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" aria-label="Previous Image">
                                <i class="fas fa-chevron-left text-sm"></i>
                            </button>
                            <div class="font-black text-xs uppercase tracking-wider">
                                Image <span class="current-image-index text-indigo-500">1</span> of <span class="total-images">1</span>
                            </div>
                            <button class="next-image-btn p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" aria-label="Next Image">
                                <i class="fas fa-chevron-right text-sm"></i>
                            </button>
                        </div>

                        <div class="file-management-section p-4 rounded-2xl border space-y-3" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                            <div class="flex justify-between items-center pb-2 border-b" style="border-color: var(--card-border);">
                                <h3 class="text-xs font-black uppercase tracking-wider" style="color: var(--text-dark);">
                                    <i class="fas fa-list-ul text-indigo-500 mr-1.5"></i>Manage Files
                                </h3>
                                <button class="clear-all-btn text-xs font-bold text-red-500 hover:text-red-600 px-2.5 py-1 rounded-lg transition-colors">
                                    <i class="fas fa-trash-alt mr-1"></i>Clear All
                                </button>
                            </div>
                            <div class="file-list-container max-h-48 overflow-y-auto p-2 rounded-xl space-y-2 border shadow-inner" style="background-color: var(--card-bg); border-color: var(--card-border);"></div>
                            <label class="secondary-btn w-full flex items-center justify-center py-2.5 rounded-xl cursor-pointer font-bold text-xs transition-all hover:shadow-sm">
                                <i class="fas fa-plus mr-2 text-indigo-500"></i> Add More Images
                                <input type="file" class="hidden add-more-files-input" accept="image/*" multiple>
                            </label>
                        </div>
                    </div>

                    <div class="right-column space-y-6">
                        <div class="options-container space-y-4"></div>
                        
                        <div class="conversion-process hidden text-center p-5 rounded-2xl border shadow-sm animate__animated animate__fadeIn" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                            <div class="progress-bar-container mb-3 shadow-inner">
                                <div class="progress-bar-fill" style="width: 0%;"></div>
                            </div>
                            <p class="font-bold text-xs uppercase tracking-wider processing-text" style="color: var(--text-dark);"></p>
                        </div>

                        <div class="output-section">
                            <button class="start-btn upload-button w-full justify-center py-3.5 text-base mb-3 shadow-lg">
                                <i class="fas fa-cogs text-lg mr-2"></i><span>Start Processing</span>
                            </button>
                            <div class="results-container hidden space-y-4 animate__animated animate__fadeIn"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(tpl);
    }

    // 2. Toast Notification
    if (!document.getElementById('toast')) {
        const toastDiv = document.createElement('div');
        toastDiv.id = 'toast';
        toastDiv.className = 'toast';
        toastDiv.innerHTML = '<i class="fas fa-check-circle mr-2 text-green-500"></i><span id="toastMessage"></span>';
        document.body.appendChild(toastDiv);
    }

    // 3. Preview Modal
    if (!document.getElementById('previewModal')) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'previewModal';
        modalDiv.className = 'preview-modal';
        modalDiv.innerHTML = `
            <div class="modal-content w-full max-w-4xl">
                <div class="modal-header flex justify-between items-center pb-2 border-b" style="border-color: var(--card-border);">
                    <h3 class="text-lg font-bold" id="modalFileName" style="color: var(--text-dark);">Image Preview</h3>
                    <button id="modalCloseBtn" class="secondary-btn rounded-full w-8 h-8 flex items-center justify-center p-0 transition-transform hover:scale-105">&times;</button>
                </div>
                <div class="modal-body overflow-hidden py-4">
                    <p class="text-xxs text-center mb-2 font-bold opacity-75 uppercase tracking-wider" style="color: var(--text-light);">💡 Wheel to Zoom • Left Click drag to Pan • Slide to Compare</p>
                    <div class="before-after-container h-full w-full horizontal-split" id="modalPreviewContainer">
                        <div class="comparison-viewport">
                            <div class="before-image-clipper"><img class="before-image" src="" alt="Before" width="800" height="600"></div>
                            <img class="after-image" src="" alt="After" width="800" height="600">
                        </div>
                        <div class="before-after-slider"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalDiv);

        document.getElementById('modalCloseBtn')?.addEventListener('click', () => {
            modalDiv.classList.remove('show');
            if (currentModalBlobUrl) {
                try { URL.revokeObjectURL(currentModalBlobUrl); } catch (e) {}
                currentModalBlobUrl = null;
            }
        });
    }
}

// --- Router Maps with Meta Descriptions & Titles ---
const routes = {
    '/': { screen: 'homeScreen', title: 'ImgCon - Free Online Image Converter, Compressor & Resizer', desc: 'ImgCon is a free online tool to convert, compress, resize, watermark, and clean EXIF metadata from images.' },
    '/blog': { screen: 'blogScreen', title: 'ImgCon Blog - Image Optimization, Web Performance & Photography Guides', desc: 'Welcome to ImgCon Blog! Read tutorials, guides, and tips about image compression, WebP, AVIF, and web speed.' },
    '/image-converter': { screen: 'toolScreen', tool: 'converter', title: 'Image Converter - Convert JPG, PNG, WebP, AVIF, PDF Online | ImgCon', desc: 'Convert image formats instantly in your browser. Supports batch PNG, JPG, WebP, AVIF, PDF.' },
    '/image-compressor': { screen: 'toolScreen', tool: 'compressor', title: 'Image Compressor - Reduce Image File Size Online | ImgCon', desc: 'Compress JPG and WebP images without losing quality using target size settings.' },
    '/image-resizer': { screen: 'toolScreen', tool: 'resizer', title: 'Image Resizer - Resize Photo Pixels & Percentage | ImgCon', desc: 'Resize photos by pixels or ratio for Instagram, Facebook, Twitter, and web.' },
    '/image-watermark': { screen: 'toolScreen', tool: 'watermark', title: 'Watermark Tool - Protect Images with Custom Text & Logo | ImgCon', desc: 'Add text or logo watermarks to your photos safely without uploading.' },
    '/exif-cleaner': { screen: 'exifScreen', title: 'EXIF Data Cleaner & GPS Location Remover | ImgCon', desc: 'Inspect camera model, timestamp, and remove GPS location tracking data from JPEG photos.' },
    '/about-us': { screen: 'aboutScreen', title: 'About Us - ImgCon Team Story', desc: 'Learn about ImgCon and our mission to provide 100% private client-side image processing.' },
    '/privacy-policy': { screen: 'privacyScreen', title: 'Privacy Policy - ImgCon', desc: 'Our zero-upload privacy policy guarantees your files never leave your device.' },
    '/terms-conditions': { screen: 'termsScreen', title: 'Terms and Conditions - ImgCon', desc: 'Terms and conditions for using ImgCon online tools.' }
};

// --- Smart Clean URLs HTML5 Router Engine ---
const router = async () => {
    ensureGlobalTemplates();

    let path = window.location.pathname || '/';
    if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    if (path.endsWith('.html')) {
        path = path.replace('.html', '');
    }

    let route = routes[path];

    if (!route && path.startsWith('/blog/')) {
        route = {
            screen: 'blogScreen',
            title: 'ImgCon Blog Guide',
            isPost: true,
            desc: 'Read image optimization guides and tutorials on ImgCon.'
        };
    }

    if (!route) {
        route = routes['/'];
        path = '/';
    }

    document.title = route.title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && route.desc) {
        metaDesc.setAttribute("content", route.desc);
    }

    const canonicalTag = document.querySelector('link[rel="canonical"]');
    if (canonicalTag) {
        canonicalTag.setAttribute("href", "https://imgcon.online" + path);
    }

    if (route.screen === 'blogScreen') {
        if (activeTool) resetTool();
        showPage('blogScreen');
        if (typeof handleRouteChanges === 'function') handleRouteChanges();
    } else if (route.screen === 'exifScreen') {
        if (activeTool) resetTool();
        showPage('exifScreen');
        if (window.ExifModule && typeof window.ExifModule.renderUI === 'function') {
            window.ExifModule.renderUI('exifToolApp');
        }
    } else if (route.tool) {
        if (activeTool !== route.tool) {
            if (activeTool) resetTool();
            showTool(route.tool);
        }
    } else {
        if (activeTool) resetTool();
        showPage(route.screen);
    }
};

// Clean Navigation Interceptor
const navigateTo = (e) => {
    const link = e.target.closest('a');
    if (link) {
        if (link.hasAttribute('download') || link.href.startsWith('blob:') || link.hostname !== window.location.hostname || link.href.includes('mailto:') || link.target) {
            return; 
        }
        e.preventDefault();
        
        let targetPath = link.pathname;
        if (targetPath.endsWith('.html')) targetPath = targetPath.replace('.html', '');
        
        if (window.location.pathname !== targetPath) {
            history.pushState(null, '', targetPath);
            router();
        }
    }
};

// --- UI Navigation Manager ---
function showPage(pageId) {
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(s => s.classList.add('hidden'));
    
    const activeScreen = document.getElementById(pageId);
    if (activeScreen) {
        activeScreen.classList.remove('hidden');
        requestAnimationFrame(() => {
            const h = activeScreen.clientHeight;
            if (mainContainer && h > 0) mainContainer.style.minHeight = h + 'px';
        });
    }

    const isHomePage = pageId === 'homeScreen';
    if (homeBtn) homeBtn.classList.toggle('hidden', isHomePage);
    
    if (isHomePage) {
        if (mainFooter) mainFooter.style.display = 'block';
        if (cardFooter) cardFooter.style.display = 'none';
    } else {
        if (mainFooter) mainFooter.style.display = 'none';
        if (cardFooter) cardFooter.style.display = 'block';
    }
    
    if (pageId !== 'toolScreen') activeTool = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showTool(toolName, preloadedFiles = null) {
    ensureGlobalTemplates();
    activeTool = toolName;
    showPage('toolScreen');
    setupToolUI(activeTool);
    if (preloadedFiles) handleFiles(preloadedFiles);
}

// --- Dynamic Tool Header Metadata Map ---
const toolMetaDetails = {
    converter: {
        badge: "⚡ 100% Private Format Converter",
        title: "Image Converter & Batch Format Switcher",
        desc: "Convert PNG, JPG, WebP, AVIF, HEIC, PDF & ICO formats instantly in your browser. Batch processing with 100% private zero-server upload.",
        prompt: "Drag & drop or browse images from your device to start converting"
    },
    compressor: {
        badge: "📉 100% Private File Size Reducer",
        title: "Image Compressor & Size Optimizer",
        desc: "Shrink JPG, WebP & PNG file sizes up to 90% without losing visual quality. Set custom target KB/MB sizes with live comparison preview.",
        prompt: "Drag & drop or browse photos from your device to start compressing"
    },
    resizer: {
        badge: "📐 100% Private Image Resizer",
        title: "Image Resizer & Dimension Scaler",
        desc: "Resize photos by exact pixels or percentage. Maintain aspect ratio lock and apply built-in social media presets for Instagram, Facebook & Twitter.",
        prompt: "Drag & drop or browse photos from your device to start resizing"
    },
    watermark: {
        badge: "🛡️ 100% Private Copyright Protection",
        title: "Image Watermark & Logo Overlay Tool",
        desc: "Protect your photography copyright with custom text or transparent logo watermarks. Full opacity, scale, and positioning control.",
        prompt: "Drag & drop or browse photos from your device to add watermarks"
    }
};

// --- Setup Tool UI Engine ---
function setupToolUI(toolName) {
    ensureGlobalTemplates();
    activeTool = toolName;
    selectedFormat = null;
    window.selectedFormat = null;
    
    let toolScreen = document.getElementById('toolScreen');
    if (!toolScreen) {
        toolScreen = document.createElement('section');
        toolScreen.id = 'toolScreen';
        toolScreen.className = 'screen';
        mainContainer.appendChild(toolScreen);
    }

    const toolTemplate = document.getElementById('toolLayoutTemplate');
    if (!toolTemplate) return;

    const toolLayout = toolTemplate.content.cloneNode(true);
    toolScreen.innerHTML = '';
    toolScreen.appendChild(toolLayout);

    const meta = toolMetaDetails[toolName];
    if (meta) {
        const badgeEl = toolScreen.querySelector('.tool-header-badge');
        const titleEl = toolScreen.querySelector('.tool-header-title');
        const descEl = toolScreen.querySelector('.tool-header-desc');
        const promptEl = toolScreen.querySelector('.tool-header-prompt');

        if (badgeEl) badgeEl.textContent = meta.badge;
        if (titleEl) titleEl.textContent = meta.title;
        if (descEl) descEl.textContent = meta.desc;
        if (promptEl) promptEl.innerHTML = `${meta.prompt} or <span class="text-indigo-500 underline font-bold cursor-pointer">click to browse</span>`;
    }

    const optionsContainer = toolScreen.querySelector('.options-container');
    const optionsTemplate = document.getElementById(`${toolName}OptionsTemplate`);
    if (optionsContainer && optionsTemplate) {
        optionsContainer.appendChild(optionsTemplate.content.cloneNode(true));
    }
    
    const fileInput = toolScreen.querySelector('.file-input');
    const addMoreInput = toolScreen.querySelector('.add-more-files-input');
    const acceptType = (toolName === 'compressor') ? 'image/jpeg, image/webp, image/png' : 'image/*';

    if (fileInput) fileInput.accept = acceptType;
    if (addMoreInput) addMoreInput.accept = acceptType;

    attachToolEventListeners(toolScreen);

    if (typeof renderToolSeoGuide === 'function') {
        renderToolSeoGuide(toolName, toolScreen);
    }
}

// --- Reset Tool Engine ---
function resetTool(softReset = false) {
    if (Array.isArray(files)) {
        files.forEach(f => { 
            if (f && f.previewUrl) {
                try { URL.revokeObjectURL(f.previewUrl); } catch (e) {}
            } 
        });
    }
    
    if (currentModalBlobUrl) {
        try { URL.revokeObjectURL(currentModalBlobUrl); } catch (e) {}
        currentModalBlobUrl = null;
    }

    if (watermarkImage && typeof watermarkImage.close === 'function') {
        try { watermarkImage.close(); } catch (e) {}
    }
    if (window.watermarkImage && typeof window.watermarkImage.close === 'function') {
        try { window.watermarkImage.close(); } catch (e) {}
        window.watermarkImage = null;
    }
    
    const currentTool = activeTool;

    files = []; 
    originalFileDetails = []; 
    processedResults = []; 
    selectedFormat = null; 
    window.selectedFormat = null;
    currentImageIdx = 0; 
    watermarkImage = null;
    
    const toolScreen = document.getElementById('toolScreen');
    
    if ((softReset || (toolScreen && !toolScreen.classList.contains('hidden'))) && currentTool) {
        setupToolUI(currentTool);
    } else {
        activeTool = null;
        if (toolScreen) toolScreen.innerHTML = ''; 
    }
}

// --- File Handling Engine ---
function handleFiles(fileList, isAddingMore = false) {
    let newFiles = Array.from(fileList);
    if (newFiles.length === 0) return;
    
    if (!isAddingMore && files.length > 0) {
        files.forEach(f => {
            if (f && f.previewUrl) {
                try { URL.revokeObjectURL(f.previewUrl); } catch (e) {}
            }
        });
    }

    newFiles.forEach(file => {
        file.previewUrl = URL.createObjectURL(file);
    });

    if (isAddingMore) {
        const startIndex = files.length;
        files.push(...newFiles);
        populateFileDetails(newFiles, startIndex).then(() => {
            displayFiles();
            renderFileManagementUI();
            showFilePreview(files.length - 1);
            triggerRealtimeSizeUpdate();
        });
    } else {
        files = newFiles;
        confirmSelection();
    }
}

async function populateFileDetails(fileList, startIndex = 0) {
    await Promise.all(fileList.map((file, i) => new Promise(resolve => {
        const index = startIndex + i;
        const img = new Image();
        img.onload = () => { 
            originalFileDetails[index] = { 
                width: img.naturalWidth || img.width, 
                height: img.naturalHeight || img.height, 
                size: file.size, 
                name: file.name, 
                type: file.type, 
                ratio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height) 
            }; 
            resolve(); 
        };
        img.onerror = () => { 
            originalFileDetails[index] = { width: 0, height: 0, size: file.size, name: file.name, type: file.type, ratio: 1 }; 
            resolve(); 
        };
        img.src = file.previewUrl;
    })));
}

async function confirmSelection() {
    const toolScreen = document.getElementById('toolScreen');
    if (!toolScreen) return;

    const processUI = toolScreen.querySelector('.process-ui');
    const dropZoneContainer = toolScreen.querySelector('.drop-zone-container');
    
    if (dropZoneContainer) dropZoneContainer.classList.add('hidden');
    if (processUI) {
        processUI.classList.remove('hidden');
        processUI.classList.add('animate__animated', 'animate__fadeInUp');
    }
    
    await populateFileDetails(files);
    displayFiles();
    renderFileManagementUI();
    showFilePreview(0);
    
    if (activeTool === 'resizer' && originalFileDetails[0]) {
        const widthInput = toolScreen.querySelector('#resize-width');
        const heightInput = toolScreen.querySelector('#resize-height');
        if (widthInput && heightInput) {
            widthInput.value = originalFileDetails[0].width;
            heightInput.value = originalFileDetails[0].height;
        }
    }
    
    triggerRealtimeSizeUpdate();
}

function displayFiles() {
    const toolScreen = document.getElementById('toolScreen');
    const galleryContainer = toolScreen?.querySelector('.gallery-container');
    if (!galleryContainer) return;
    galleryContainer.innerHTML = files.map(file => `<div class="gallery-item w-full h-full flex-shrink-0 flex items-center justify-center p-2"><img src="${file.previewUrl}" class="max-w-full max-h-full object-contain" loading="lazy" alt="Preview"></div>`).join('');
}

function showFilePreview(index) {
    if (index < 0 || index >= files.length) return;
    currentImageIdx = index;
    const toolScreen = document.getElementById('toolScreen');
    if (!toolScreen) return;

    const gallery = toolScreen.querySelector('.gallery-container');
    if (gallery) gallery.style.transform = `translateX(-${index * 100}%)`;
    
    const curSpan = toolScreen.querySelector('.current-image-index');
    const totSpan = toolScreen.querySelector('.total-images');
    if (curSpan) curSpan.textContent = index + 1;
    if (totSpan) totSpan.textContent = files.length;
}

function renderFileManagementUI() {
    const toolScreen = document.getElementById('toolScreen');
    const listContainer = toolScreen?.querySelector('.file-list-container');
    if (!listContainer) return;
    listContainer.innerHTML = files.map((file, index) => {
        const details = originalFileDetails[index] || { size: file.size, width: '?', height: '?' };
        return `<div class="file-item flex items-center gap-2 p-1.5 rounded-md hover:bg-card-bg cursor-grab transition-all border border-transparent hover:border-indigo-200" draggable="true" data-index="${index}"><img src="${file.previewUrl}" class="w-10 h-10 object-cover rounded shadow-sm" loading="lazy" alt="Item"><div class="flex-grow truncate text-xs"><p class="font-bold truncate" style="color: var(--text-dark);">${file.name}</p><p class="text-xxs text-light" style="color: var(--text-light);">${formatBytes(details.size)} &middot; ${details.width}x${details.height}</p></div><button class="delete-file-btn p-1 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" data-index="${index}" aria-label="Remove image"><i class="fas fa-times"></i></button></div>`;
    }).join('');
    
    attachFileManagementListeners();
}

function attachFileManagementListeners() {
    const toolScreen = document.getElementById('toolScreen');
    const listContainer = toolScreen?.querySelector('.file-list-container');
    if (!listContainer) return;
    
    listContainer.onclick = e => { 
        const deleteBtn = e.target.closest('.delete-file-btn'); 
        if (deleteBtn) {
            e.stopPropagation();
            const index = parseInt(deleteBtn.dataset.index, 10);
            if (files[index] && files[index].previewUrl) {
                try { URL.revokeObjectURL(files[index].previewUrl); } catch (e) {}
            }
            files.splice(index, 1);
            originalFileDetails.splice(index, 1);
            
            if (files.length === 0) { 
                resetTool(true); 
                return; 
            }
            if (currentImageIdx >= files.length) currentImageIdx = files.length - 1;
            displayFiles(); 
            renderFileManagementUI(); 
            showFilePreview(currentImageIdx);
            triggerRealtimeSizeUpdate();
        }
    };
}

// --- Collect Settings & Run Execution ---
function collectCurrentToolOptions(container) {
    const qualitySlider = container.querySelector('.quality-slider');
    const qualityVal = qualitySlider ? parseInt(qualitySlider.value, 10) / 100 : 0.85;
    
    let fmt = selectedFormat || window.selectedFormat || 'webp';
    if (fmt === 'jpeg') fmt = 'jpg';

    const opts = { quality: qualityVal, format: fmt };

    if (activeTool === 'compressor') {
        opts.targetSizeActive = !!document.getElementById('target-size-toggle')?.checked;
        opts.targetSizeKB = parseFloat(document.getElementById('target-size-kb-input')?.value) || 100;
        opts.targetUnit = document.getElementById('target-size-unit-select')?.value || 'KB';
        opts.stripExif = !!document.getElementById('metadata-toggle')?.checked;
    } else if (activeTool === 'resizer') {
        const mode = container.querySelector('.resize-by-btn.active')?.dataset.mode || 'pixels';
        opts.mode = mode;
        if (mode === 'pixels') {
            opts.width = parseInt(document.getElementById('resize-width')?.value, 10);
            opts.height = parseInt(document.getElementById('resize-height')?.value, 10);
        } else {
            opts.percentage = parseInt(document.getElementById('percentage-slider')?.value, 10) || 50;
        }
        opts.maintainAspectRatio = !!document.getElementById('aspect-ratio-toggle')?.checked;
    } else if (activeTool === 'watermark') {
        opts.watermarkType = container.querySelector('.watermark-type-btn.active')?.dataset.type || 'text';
        opts.watermarkText = document.getElementById('watermark-text')?.value || '© ImgCon';
        opts.watermarkOpacity = parseInt(document.getElementById('opacity-slider')?.value || '70', 10) / 100;
        opts.watermarkScale = parseInt(document.getElementById('scale-slider')?.value || '20', 10) / 100;
        opts.watermarkPosition = container.querySelector('.position-btn.active')?.dataset.position || 'center';
        opts.watermarkBitmap = window.watermarkImage || watermarkImage || null;
    }

    return opts;
}

async function processFiles() {
    const toolScreen = document.getElementById('toolScreen');
    if (!toolScreen || files.length === 0) return;

    toolScreen.querySelector('.options-container')?.classList.add('hidden');
    toolScreen.querySelector('.output-section .start-btn')?.classList.add('hidden');
    
    const conversionProcess = toolScreen.querySelector('.conversion-process');
    if (conversionProcess) conversionProcess.classList.remove('hidden');

    const processingText = toolScreen.querySelector('.processing-text');
    const progressBarFill = toolScreen.querySelector('.progress-bar-fill');

    if (progressBarFill) progressBarFill.style.width = '0%';
    if (processingText) {
        processingText.innerHTML = `<i class="fas fa-cog fa-spin mr-2"></i>Processing ${files.length} file(s)...`;
    }

    const results = new Array(files.length);
    let filesProcessed = 0;
    const options = collectCurrentToolOptions(toolScreen);

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            let result = null;
            if (activeTool === 'converter' && window.ImageConverterModule?.processImage) {
                result = await window.ImageConverterModule.processImage(file, options);
            } else if (activeTool === 'compressor' && window.ImageCompressorModule?.processImage) {
                result = await window.ImageCompressorModule.processImage(file, options);
            } else if (activeTool === 'resizer' && window.ImageResizerModule?.processImage) {
                result = await window.ImageResizerModule.processImage(file, options);
            } else if (activeTool === 'watermark' && window.ImageWatermarkModule?.processImage) {
                result = await window.ImageWatermarkModule.processImage(file, options);
            } else if (window.ImageConverterModule?.processImage) {
                result = await window.ImageConverterModule.processImage(file, options);
            }

            if (result) {
                result.fileIndex = i;
                results[i] = result;
            }
        } catch (err) {
            console.error(`Error processing file ${i}:`, err);
            results[i] = { success: false, fileName: file.name, fileIndex: i, error: err.message };
        }

        filesProcessed++;
        if (progressBarFill) progressBarFill.style.width = `${(filesProcessed / files.length) * 100}%`;
    }

    if (processingText) processingText.innerHTML = `<i class="fas fa-check-circle text-green-500 mr-2"></i>Complete!`;
    setTimeout(() => handleCompletion(results), 300);
}

// --- Render Output Result Cards ---
async function handleCompletion(results) {
    const toolScreen = document.getElementById('toolScreen');
    if (!toolScreen) return;
    
    processedResults = results;
    const resultsContainer = toolScreen.querySelector('.results-container');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (activeTool === 'converter' && selectedFormat === 'pdf') {
        const procText = toolScreen.querySelector('.processing-text');
        if (procText) procText.innerHTML = `<i class="fas fa-file-pdf text-red-500 mr-2"></i>Compiling PDF...`;
        
        if (window.ImageConverterModule?.compilePDF) {
            try {
                const pdfBlob = await window.ImageConverterModule.compilePDF(results);
                processedResults = [{ blob: pdfBlob, fileName: 'compiled_images.pdf', intendedFormat: 'pdf', fileIndex: 0 }];
            } catch (pdfErr) {
                showToast("Failed to compile PDF. Reverting to separate images.");
            }
        }
    }

    resultsContainer.insertAdjacentHTML('beforeend', `
        <div class="results-summary text-center p-3.5 rounded-2xl mb-4 border animate__animated animate__fadeIn w-full overflow-hidden" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
            <h3 class="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-500">Processing Complete!</h3>
            <p class="text-xxs sm:text-xs font-semibold" style="color: var(--text-light);">Successfully processed ${processedResults.length} file(s).</p>
        </div>
    `);
    
    processedResults.forEach((res, i) => {
        if (!res.blob) return;

        const originalFile = files[res.fileIndex] || { previewUrl: '', type: 'image/png' };
        const originalDetails = originalFileDetails[res.fileIndex] || { size: res.blob.size || 0, width: '?', height: '?' };
        const isPdf = res.intendedFormat === 'pdf';
        
        const origSize = originalDetails.size || 1;
        const savedPercent = Math.round(((origSize - res.blob.size) / origSize) * 100);
        const isSavedPositive = savedPercent >= 0;
        const downloadUrl = URL.createObjectURL(res.blob);
        
        const fileNode = document.createElement('div');
        fileNode.className = 'result-card p-4 sm:p-5 rounded-2xl border mb-4 shadow-sm hover:shadow-md transition-all duration-300 animate__animated animate__slideInUp w-full max-w-full overflow-hidden';
        fileNode.style.borderColor = 'var(--card-border)';
        fileNode.style.backgroundColor = 'var(--card-bg)';
        
        fileNode.innerHTML = `
            <div class="flex items-center gap-3 mb-3.5 border-b pb-3 w-full overflow-hidden" style="border-color: var(--bg-subtle);">
                <div class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border shadow-sm flex-shrink-0" style="border-color: var(--card-border);">
                    <img src="${originalFile.previewUrl}" class="w-full h-full object-cover" loading="lazy" alt="Original Preview">
                </div>
                <div class="min-w-0 flex-1">
                    <h4 class="font-bold text-xs sm:text-sm truncate" style="color: var(--text-dark);" title="${res.fileName}">${res.fileName}</h4>
                    <div class="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider" style="background-color: var(--bg-subtle); color: var(--text-light);">
                        <span>${originalFile.type ? originalFile.type.split('/')[1]?.toUpperCase() : 'IMG'}</span>
                        <i class="fas fa-arrow-right text-xxs opacity-60"></i>
                        <span style="color: var(--primary-color);">${res.intendedFormat ? res.intendedFormat.toUpperCase() : 'OUT'}</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-center mb-3.5 p-2.5 rounded-xl w-full" style="background-color: var(--bg-subtle);">
                <div class="border-r pr-1" style="border-color: var(--card-border);">
                    <p class="text-xxs font-extrabold uppercase tracking-widest text-gray-400">Before</p>
                    <p class="text-sm sm:text-base font-black mt-0.5 truncate" style="color: var(--text-dark);">${formatBytes(originalDetails.size)}</p>
                    <p class="text-xxs font-semibold opacity-75 truncate" style="color: var(--text-light);">${originalDetails.width} x ${originalDetails.height}px</p>
                </div>
                <div class="pl-1">
                    <p class="text-xxs font-extrabold uppercase tracking-widest text-gray-400">After</p>
                    <p class="text-sm sm:text-base font-black mt-0.5 truncate ${isSavedPositive ? 'text-green-500' : 'text-yellow-600'}">${formatBytes(res.blob.size)}</p>
                    <p class="text-xxs font-semibold opacity-75 truncate" style="color: var(--text-light);">${res.newWidth || originalDetails.width} x ${res.newHeight || originalDetails.height}px</p>
                </div>
            </div>

            <div class="space-y-1.5 mb-4 w-full">
                <div class="flex justify-between items-center text-xxs sm:text-xs font-bold">
                    <span style="color: var(--text-light);">${isSavedPositive ? 'File Size Reduced' : 'Lossless Re-encoding'}</span>
                    <span class="${isSavedPositive ? 'text-green-500' : 'text-yellow-600'}">
                        Saved: ${isSavedPositive ? '+' : ''}${savedPercent}%
                    </span>
                </div>
                <div class="w-full h-2 rounded-full overflow-hidden" style="background-color: var(--bg-main);">
                    <div class="savings-bar-fill h-full rounded-full transition-all duration-1000 ease-out" 
                         style="width: 0%; background: ${isSavedPositive ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)'};">
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-2 w-full">
                ${!isPdf ? `
                    <button class="preview-before-after-btn flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xxs sm:text-xs font-bold transition-all duration-200" style="background-color: var(--card-bg); border-color: var(--card-border); color: var(--text-dark);" data-index="${i}">
                        <i class="fas fa-eye"></i> <span>Preview</span>
                    </button>
                ` : ''}
                <a href="${downloadUrl}" download="${res.fileName}" class="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xxs sm:text-xs font-bold transition-all duration-200 text-white ${isPdf ? 'col-span-2' : ''}" style="background: linear-gradient(135deg, var(--primary-color), var(--primary-hover)); border-color: var(--primary-color);">
                    <i class="fas fa-download"></i> <span>Save</span>
                </a>
                <button class="delete-result-btn flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xxs sm:text-xs font-bold transition-all duration-200 text-red-500 hover:bg-red-50" style="background-color: var(--card-bg); border-color: var(--card-border);" data-index="${i}">
                    <i class="fas fa-trash-alt"></i> <span>Delete</span>
                </button>
            </div>
        `;
        
        resultsContainer.appendChild(fileNode);
        
        setTimeout(() => {
            const bar = fileNode.querySelector('.savings-bar-fill');
            if (bar) {
                const barWidth = Math.min(100, Math.max(0, Math.abs(savedPercent)));
                bar.style.width = `${barWidth}%`;
            }
        }, 100);
    });

    // Attach Listeners
    resultsContainer.querySelectorAll('.preview-before-after-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.closest('.preview-before-after-btn').dataset.index, 10);
            openComparisonModal(idx);
        });
    });

    resultsContainer.querySelectorAll('.delete-result-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.closest('.delete-result-btn').dataset.index, 10);
            processedResults.splice(idx, 1);
            if (processedResults.length === 0) {
                resetTool();
            } else {
                handleCompletion(processedResults);
            }
        });
    });

    // Batch ZIP Download
    if (processedResults.length > 1) {
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn upload-button w-full justify-center py-3 text-xs sm:text-sm mt-3 shadow-md';
        downloadBtn.innerHTML = `<i class="fas fa-file-archive mr-2"></i><span>Download All (ZIP)</span>`;
        
        downloadBtn.onclick = async () => {
            downloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i><span>Creating ZIP...</span>`;
            try {
                await Promise.all([
                    loadExternalLibrary('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'),
                    loadExternalLibrary('https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js')
                ]);
                const zip = new JSZip();
                processedResults.forEach(r => zip.file(r.fileName.replace(/\.[^/.]+$/, "") + '.' + r.intendedFormat, r.blob));
                const zipBlob = await zip.generateAsync({ type: "blob" });
                saveAs(zipBlob, `imgcon_optimized_images.zip`);
            } catch (err) {
                showToast("Failed to compile ZIP archive.");
            } finally {
                downloadBtn.innerHTML = `<i class="fas fa-file-archive mr-2"></i><span>Download All (ZIP)</span>`;
            }
        };
        resultsContainer.appendChild(downloadBtn);
    }
    
    toolScreen.querySelector('.conversion-process')?.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
}

// --- Realtime Size Estimation (Debounced) ---
function debounce(func, delay) {
    let debounceTimer;
    return function(...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
}

const triggerRealtimeSizeUpdate = debounce(async () => {
    if (files.length === 0 || !activeTool) return;
    const toolScreen = document.getElementById('toolScreen');
    const previewInfo = toolScreen?.querySelector('.realtime-preview-info');
    if (!previewInfo || previewInfo.classList.contains('hidden')) return;

    const currentFile = files[currentImageIdx];
    if (!currentFile) return;

    const options = collectCurrentToolOptions(toolScreen);
    let result = null;

    if (activeTool === 'converter' && window.ImageConverterModule?.processImage) {
        result = await window.ImageConverterModule.processImage(currentFile, options);
    } else if (activeTool === 'compressor' && window.ImageCompressorModule?.processImage) {
        result = await window.ImageCompressorModule.processImage(currentFile, options);
    } else if (activeTool === 'resizer' && window.ImageResizerModule?.processImage) {
        result = await window.ImageResizerModule.processImage(currentFile, options);
    } else if (activeTool === 'watermark' && window.ImageWatermarkModule?.processImage) {
        result = await window.ImageWatermarkModule.processImage(currentFile, options);
    }

    if (result && result.blob) {
        const originalSizeSpan = previewInfo.querySelector('.original-size');
        const newSizeSpan = previewInfo.querySelector('.new-size');
        if (originalSizeSpan && newSizeSpan) {
            originalSizeSpan.textContent = formatBytes(originalFileDetails[currentImageIdx]?.size || currentFile.size);
            newSizeSpan.textContent = formatBytes(result.blob.size);
        }
    }
}, 250);
window.triggerRealtimeSizeUpdate = triggerRealtimeSizeUpdate;

// --- Event Listeners Attachment ---
function attachToolEventListeners(container) {
    const dropZone = container.querySelector('#dropZone');
    const fileInput = container.querySelector('.file-input');
    
    if (dropZone) {
        dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragenter', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('drag-over'); });
        dropZone.addEventListener('drop', e => { 
            e.preventDefault(); 
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer && e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files); 
            }
        });
        dropZone.addEventListener('click', e => {
            if (!e.target.closest('.confirm-btn')) fileInput?.click();
        });
        fileInput?.addEventListener('change', e => handleFiles(e.target.files));
    }
    
    container.querySelector('.confirm-btn')?.addEventListener('click', () => confirmSelection());
    container.querySelector('.add-more-files-input')?.addEventListener('change', e => handleFiles(e.target.files, true));
    container.querySelector('.prev-image-btn')?.addEventListener('click', () => { showFilePreview(currentImageIdx - 1); triggerRealtimeSizeUpdate(); });
    container.querySelector('.next-image-btn')?.addEventListener('click', () => { showFilePreview(currentImageIdx + 1); triggerRealtimeSizeUpdate(); });
    container.querySelector('.start-btn')?.addEventListener('click', processFiles);
    container.querySelector('.clear-all-btn')?.addEventListener('click', () => resetTool(true));
    
    container.querySelectorAll('.quality-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const parent = slider.closest('.options-section') || slider.parentElement || container;
            const valSpan = parent.querySelector('.quality-value');
            if (valSpan) {
                valSpan.textContent = e.target.value;
                valSpan.style.transform = 'scale(1.25)';
                setTimeout(() => valSpan.style.transform = 'scale(1)', 100);
            }

            const presetBtns = container.querySelectorAll('.preset-btn');
            presetBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.quality === e.target.value);
            });

            triggerRealtimeSizeUpdate();
        });
    });

    if (activeTool === 'converter' && window.ImageConverterModule?.initConverterEvents) {
        window.ImageConverterModule.initConverterEvents(container);
    } else if (activeTool === 'compressor' && window.ImageCompressorModule?.initCompressorEvents) {
        window.ImageCompressorModule.initCompressorEvents(container);
    } else if (activeTool === 'resizer' && window.ImageResizerModule?.initResizerEvents) {
        window.ImageResizerModule.initResizerEvents(container);
    } else if (activeTool === 'watermark' && window.ImageWatermarkModule?.initWatermarkEvents) {
        window.ImageWatermarkModule.initWatermarkEvents(container);
    }
}

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleThemeWithRipple() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

themeToggleBtn?.addEventListener('click', toggleThemeWithRipple);

// --- Global Utilities ---
function showToast(message) { 
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toastMessage || !toast) return;
    toastMessage.textContent = message; 
    toast.classList.add('show'); 
    setTimeout(() => toast.classList.remove('show'), 3000); 
}
window.showToast = showToast;

function formatBytes(bytes) { 
    if (!+bytes) return '0 Bytes'; 
    const k = 1024; 
    const sizes = ['Bytes', 'KB', 'MB']; 
    const i = Math.floor(Math.log(bytes) / Math.log(k)); 
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`; 
}

document.getElementById('copyLinkBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!');
});

// --- Scroll & Subtitle Rotator ---
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

    revealElements.forEach(el => {
        el.classList.remove('revealed');
        observer.observe(el);
    });
}

let subtitleTimer = null;
function initSubtitleRotator() {
    if (subtitleTimer) clearInterval(subtitleTimer);
    const container = document.getElementById('rotatingSubtitleContainer');
    if (!container) return;
    const phrases = container.querySelectorAll('.rotating-phrase');
    if (phrases.length <= 1) return;

    let idx = 0;
    subtitleTimer = setInterval(() => {
        const cur = phrases[idx];
        idx = (idx + 1) % phrases.length;
        const next = phrases[idx];

        cur.classList.remove('active');
        cur.classList.add('exit');
        next.classList.remove('exit');
        next.classList.add('active');

        setTimeout(() => cur.classList.remove('exit'), 600);
    }, 3200);
}

// --- App Bootloader ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    ensureGlobalTemplates();
    document.body.addEventListener('click', navigateTo);
    window.addEventListener('popstate', router);
    
    initScrollReveal();
    initSubtitleRotator();
    router();
});
