// --- State Management ---
let files = [], originalFileDetails = [], processedResults = [], currentImageIdx = 0, selectedFormat = null, workerPool = [], activeTool = null, debouncedPreview, lazyLoadObserver, deferredInstallPrompt = null, watermarkImage = null;
const SESSION_STORAGE_KEY = 'imgcon_session_v3';

// --- DOM Elements ---
const allScreens = document.querySelectorAll('.screen');
const homeBtn = document.getElementById('homeBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const previewModal = document.getElementById('previewModal');
const mainContainer = document.querySelector('main.app-container');
const mainFooter = document.getElementById('main-footer');
const cardFooter = document.getElementById('card-footer');

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered successfully.', reg.scope))
            .catch(err => console.error('Service Worker registration failed.', err));
    });
}

// --- SPA Client-Side Router ---
const routes = {
    '/': { screen: 'homeScreen', title: 'ImgCon - Free Online Image Converter & Compressor' },
    '/image-converter': { screen: 'toolScreen', tool: 'converter', title: 'Image Converter - Convert JPG, PNG, WebP Online' },
    '/image-compressor': { screen: 'toolScreen', tool: 'compressor', title: 'Image Compressor - Reduce Image Size' },
    '/image-resizer': { screen: 'toolScreen', tool: 'resizer', title: 'Image Resizer - Resize Images Online' },
    '/image-watermark': { screen: 'toolScreen', tool: 'watermark', title: 'Watermark Tool - Protect Your Images' },
    '/about-us': { screen: 'aboutScreen', title: 'About Us - ImgCon Team Story' },
    '/blog': { screen: 'blogScreen', title: 'ImgCon Blog - Image Optimization Tips' },
    '/privacy-policy': { screen: 'privacyScreen', title: 'Privacy Policy - ImgCon' },
    '/terms-conditions': { screen: 'termsScreen', title: 'Terms and Conditions - ImgCon' },
    // Blog post routes
    '/blog/png-vs-jpg-difference': { screen: 'blogScreen', title: 'PNG vs JPG Differences | ImgCon Blog', isPost: true },
    '/blog/how-to-reduce-photo-size': { screen: 'blogScreen', title: 'How to Reduce Photo Size | ImgCon Blog', isPost: true },
    '/blog/webp-the-future-of-web-images': { screen: 'blogScreen', title: 'Why WebP is the Future | ImgCon Blog', isPost: true }
};

const router = async () => {
    const path = window.location.pathname;
    const route = routes[path] || routes['/'];

    document.title = route.title;

    if (route.screen === 'blogScreen') {
        showPage('blogScreen');
        const blogListing = document.getElementById('blog-listing');
        const blogPost = document.getElementById('blog-post');
        const blogPostContent = document.getElementById('blog-post-content');

        if (route.isPost) {
            const slug = path.split('/').pop();
            const postTemplate = document.getElementById('blogPostsTemplate');
            const postContent = postTemplate.content.querySelector(`[data-slug="${slug}"]`);
            if (postContent) {
                blogPostContent.innerHTML = postContent.innerHTML;
                blogListing.classList.add('hidden');
                blogPost.classList.remove('hidden');
            } else {
                blogListing.classList.remove('hidden');
                blogPost.classList.add('hidden');
            }
        } else {
            blogListing.classList.remove('hidden');
            blogPost.classList.add('hidden');
        }
    } else if (route.tool) {
        if (activeTool !== route.tool) {
            showTool(route.tool);
        }
    } else {
        showPage(route.screen);
    }
};

const navigateTo = (e) => {
    const link = e.target.closest('a');
    if (link && link.hostname === window.location.hostname && !link.href.includes('mailto:') && !link.target) {
        e.preventDefault();
        if (window.location.pathname !== link.pathname) {
            history.pushState({}, '', link.pathname);
            router();
        }
    }
};

// --- Web Worker Engine ---
function initializeWorkerPool() {
    if (workerPool.length > 0) return; 
    const numWorkers = navigator.hardwareConcurrency || 4;
    const workerCode = `self.onmessage=async e=>{let{imageBitmap:t,fileName:i,fileIndex:o,tool:a,options:s}=e.data;try{let e,n;const l=new OffscreenCanvas(t.width,t.height),d=l.getContext("2d");if(d.drawImage(t,0,0),"resizer"===a||"watermark"===a){const{newWidth:e,newHeight:i}=s;l.width=e,l.height=i,d.drawImage(t,0,0,e,i)}if("watermark"===a){const{type:t,text:i,opacity:o,scale:a,position:n,watermarkBitmap:r}=s,c=l.width*.03;let m,h;if(d.globalAlpha=o,"text"===t){const e=Math.max(12,.1*l.width*a);d.font=\`bold \${e}px Arial\`,d.fillStyle="white",d.shadowColor="rgba(0,0,0,0.7)",d.shadowBlur=5,d.shadowOffsetX=2,d.shadowOffsetY=2;const s={x:0,y:0};switch(n){case"top-left":case"center-left":case"bottom-left":d.textAlign="left",s.x=c;break;case"top-center":case"center":case"bottom-center":d.textAlign="center",s.x=l.width/2;break;case"top-right":case"center-right":case"bottom-right":d.textAlign="right",s.x=l.width-c}switch(n){case"top-left":case"top-center":case"top-right":d.textBaseline="top",s.y=c;break;case"center-left":case"center":case"center-right":d.textBaseline="middle",s.y=l.height/2;break;case"bottom-left":case"bottom-center":case"bottom-right":d.textBaseline="bottom",s.y=l.height-c}d.fillText(i,s.x,s.y)}else if("image"===t&&r){const t=r.width/r.height;let e=l.width*a,i=e/t;i>l.height*a&&(i=l.height*a,e=i*t);const o={x:0,y:0};switch(n){case"top-left":case"center-left":case"bottom-left":o.x=c;break;case"top-center":case"center":case"bottom-center":o.x=(l.width-e)/2;break;case"top-right":case"center-right":case"bottom-right":o.x=l.width-e-c}switch(n){case"top-left":case"top-center":case"top-right":o.y=c;break;case"center-left":case"center":case"center-right":o.y=(l.height-i)/2;break;case"bottom-left":case"bottom-center":case"bottom-right":o.y=l.height-i-c}d.drawImage(r,o.x,o.y,e,i)}}const r="image/"+(s.format||"jpeg"),c=await l.convertToBlob({type:r,quality:s.quality});self.postMessage({success:!0,blob:c,fileName:i,intendedFormat:s.format||"jpeg",fileIndex:o,newWidth:l.width,newHeight:l.height})}catch(e){self.postMessage({success:!1,error:e.message,fileName:i,fileIndex:o})}}`;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    for (let i = 0; i < numWorkers; i++) workerPool.push({ worker: new Worker(workerUrl), busy: false });
}

// --- UI Navigation ---
function showPage(pageId) {
    allScreens.forEach(s => s.classList.add('hidden'));
    const activeScreen = document.getElementById(pageId);
    if (activeScreen) {
         activeScreen.classList.remove('hidden');
         mainContainer.style.minHeight = activeScreen.clientHeight + 'px';
    }

    const isHomePage = pageId === 'homeScreen';
    homeBtn.classList.toggle('hidden', isHomePage);
    
    if (isHomePage) {
        mainFooter.style.display = 'block';
        cardFooter.style.display = 'none';
    } else {
        mainFooter.style.display = 'none';
        cardFooter.style.display = 'block';
    }
    
    if (pageId !== 'toolScreen') activeTool = null;
    window.scrollTo(0, 0);
}

function showTool(toolName, preloadedFiles = null) {
    activeTool = toolName;
    showPage('toolScreen');
    setupToolUI(activeTool);
    if (preloadedFiles) handleFiles(preloadedFiles);
}

function setupToolUI(toolName) {
    const toolScreen = document.getElementById('toolScreen');
    const toolLayout = document.getElementById('toolLayoutTemplate').content.cloneNode(true);
    toolScreen.innerHTML = '';
    toolScreen.appendChild(toolLayout);

    const optionsContainer = toolScreen.querySelector('.options-container');
    const optionsTemplateId = `${toolName}OptionsTemplate`;
    optionsContainer.appendChild(document.getElementById(optionsTemplateId).content.cloneNode(true));
    
    const fileInput = toolScreen.querySelector('.file-input');
    const addMoreInput = toolScreen.querySelector('.add-more-files-input');
    if (toolName === 'compressor') {
        fileInput.accept = 'image/jpeg, image/webp';
        addMoreInput.accept = 'image/jpeg, image/webp';
    } else {
        fileInput.accept = 'image/*';
        addMoreInput.accept = 'image/*';
    }

    attachToolEventListeners(toolScreen);
}

function resetTool() {
    if (!activeTool) return;
    files = []; originalFileDetails = []; processedResults = []; selectedFormat = null; currentImageIdx = 0; watermarkImage = null;
    setupToolUI(activeTool);
}

// --- Core App Functionality ---
function handleFiles(fileList, isAddingMore = false) {
    let newFiles = Array.from(fileList);
    if (newFiles.length === 0) return;
    if (isAddingMore) {
        const startIndex = files.length;
        files.push(...newFiles);
        populateFileDetails(newFiles, startIndex).then(() => {
            displayFiles();
            renderFileManagementUI();
            showFilePreview(files.length - 1);
        });
    } else {
        files = newFiles;
        renderStagingArea();
    }
}

function renderStagingArea() {
    const toolScreen = document.getElementById('toolScreen');
    const dropZone = toolScreen.querySelector('#dropZone');
    const initialMessage = dropZone.querySelector('.initial-drop-message');
    const stagingArea = dropZone.querySelector('.staging-area');
    const thumbnailGrid = stagingArea.querySelector('.thumbnail-grid');
    const fileSummary = stagingArea.querySelector('.file-summary');
    const confirmBtn = stagingArea.querySelector('.confirm-btn');

    if (files.length === 0) {
        initialMessage.classList.remove('hidden');
        stagingArea.classList.add('hidden');
        return;
    }

    initialMessage.classList.add('hidden');
    stagingArea.classList.remove('hidden');
    let totalSize = files.reduce((acc, file) => acc + file.size, 0);
    fileSummary.textContent = `Selected ${files.length} file(s) (${formatBytes(totalSize)})`;
    thumbnailGrid.innerHTML = files.map((file, index) => `<div class="relative p-1 border rounded-md"><img src="${URL.createObjectURL(file)}" class="w-full h-16 object-cover rounded-sm"><button class="staging-delete-btn absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" data-index="${index}">&times;</button></div>`).join('');
    thumbnailGrid.querySelectorAll('.staging-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); files.splice(parseInt(btn.dataset.index, 10), 1); renderStagingArea(); });
    });
    confirmBtn.onclick = () => confirmSelection();
}

async function populateFileDetails(fileList, startIndex = 0) {
    await Promise.all(fileList.map((file, i) => new Promise(resolve => {
        const index = startIndex + i;
        const img = new Image();
        img.onload = () => { originalFileDetails[index] = { width: img.width, height: img.height, size: file.size, name: file.name, type: file.type, ratio: img.width / img.height }; URL.revokeObjectURL(img.src); resolve(); };
        img.onerror = () => { originalFileDetails[index] = { width: 0, height: 0, size: file.size, name: file.name, type: file.type, ratio: 0 }; resolve(); };
        img.src = URL.createObjectURL(file);
    })));
}

async function confirmSelection() {
    const toolScreen = document.getElementById('toolScreen');
    toolScreen.querySelector('.drop-zone-container').classList.add('hidden');
    toolScreen.querySelector('.process-ui').classList.remove('hidden');
    await populateFileDetails(files);
    displayFiles();
    renderFileManagementUI();
    showFilePreview(0);
}

function displayFiles() {
    const toolScreen = document.getElementById('toolScreen');
    const galleryContainer = toolScreen.querySelector('.gallery-container');
    galleryContainer.innerHTML = files.map(file => `<div class="gallery-item w-full h-full flex-shrink-0 flex items-center justify-center p-2"><img src="${URL.createObjectURL(file)}" class="max-w-full max-h-full object-contain"></div>`).join('');
}

function showFilePreview(index) {
    if (index < 0 || index >= files.length) return;
    currentImageIdx = index;
    const toolScreen = document.getElementById('toolScreen');
    toolScreen.querySelector('.gallery-container').style.transform = `translateX(-${index * 100}%)`;
    toolScreen.querySelector('.current-image-index').textContent = index + 1;
    toolScreen.querySelector('.total-images').textContent = files.length;
}

function renderFileManagementUI() {
    const toolScreen = document.getElementById('toolScreen');
    const listContainer = toolScreen.querySelector('.file-list-container');
    if (!listContainer) return;
    listContainer.innerHTML = files.map((file, index) => {
        const details = originalFileDetails[index] || { size: file.size, width: '?', height: '?' };
        const thumbSrc = URL.createObjectURL(file);
        return `<div class="file-item flex items-center gap-2 p-1.5 rounded-md hover:bg-card-bg cursor-grab" draggable="true" data-index="${index}"><img src="${thumbSrc}" class="w-10 h-10 object-cover rounded"><div class="flex-grow truncate text-sm"><p class="font-semibold truncate">${file.name}</p><p class="text-xs text-light">${formatBytes(details.size)} &middot; ${details.width}x${details.height}</p></div><button class="delete-file-btn p-1 rounded-full text-red-500" data-index="${index}"><i class="fas fa-times"></i></button></div>`;
    }).join('');
    attachFileManagementListeners();
}

function deleteFile(index) {
    URL.revokeObjectURL(files[index]);
    files.splice(index, 1);
    originalFileDetails.splice(index, 1);
    if (files.length === 0) { resetTool(); return; }
    if (currentImageIdx >= files.length) currentImageIdx = files.length - 1;
    displayFiles(); renderFileManagementUI(); showFilePreview(currentImageIdx);
}

function attachFileManagementListeners() {
    const toolScreen = document.getElementById('toolScreen');
    const listContainer = toolScreen.querySelector('.file-list-container');
    if (!listContainer) return;
    listContainer.addEventListener('click', e => { 
        const deleteBtn = e.target.closest('.delete-file-btn'); 
        if (deleteBtn) deleteFile(parseInt(deleteBtn.dataset.index, 10)); 
    });
}

async function processFiles() {
    const toolScreen = document.getElementById('toolScreen');
    if (activeTool === 'converter' && !selectedFormat) { showToast('Please select an output format.'); return; }

    toolScreen.querySelector('.options-container').classList.add('hidden');
    toolScreen.querySelector('.output-section .start-btn').classList.add('hidden');
    const conversionProcess = toolScreen.querySelector('.conversion-process');
    conversionProcess.classList.remove('hidden');
    toolScreen.querySelector('.processing-text').innerHTML = `<i class="fas fa-cog fa-spin mr-2"></i>Processing...`;

    initializeWorkerPool();
    const results = new Array(files.length);
    let filesProcessed = 0;
    
    for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const originalDetails = originalFileDetails[index];
        const options = { quality: 0.85, format: selectedFormat || file.type.split('/')[1] };

        const freeWorker = workerPool.find(w => !w.busy);
        if (freeWorker) {
            freeWorker.busy = true;
            freeWorker.worker.onmessage = e => {
                if (e.data.success) results[e.data.fileIndex] = e.data;
                filesProcessed++;
                toolScreen.querySelector('.progress-bar-fill').style.width = `${(filesProcessed / files.length) * 100}%`;
                freeWorker.busy = false;
                if (filesProcessed === files.length) {
                    toolScreen.querySelector('.processing-text').innerHTML = `<i class="fas fa-check-circle text-green-500 mr-2"></i>Complete!`;
                    setTimeout(() => handleCompletion(results), 500);
                }
            };
            const imageBitmap = await createImageBitmap(file);
            freeWorker.worker.postMessage({ imageBitmap, fileName: file.name, fileIndex: index, tool: activeTool, options }, [imageBitmap]);
        }
    }
}

function handleCompletion(results) {
    const toolScreen = document.getElementById('toolScreen');
    processedResults = results;
    const resultsContainer = toolScreen.querySelector('.results-container');
    resultsContainer.innerHTML = '';
    
    resultsContainer.insertAdjacentHTML('beforeend', `<div class="results-summary text-center"><h3 class="text-lg font-bold">Processing Complete!</h3><p class="text-light">Processed ${results.length} files successfully.</p></div>`);
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn upload-button w-full justify-center py-3 text-lg';
    downloadBtn.innerHTML = `<i class="fas fa-download mr-3"></i><span>Download All</span>`;
    
    downloadBtn.onclick = async () => {
        if (results.length > 1) {
            const zip = new JSZip();
            results.forEach(r => zip.file(r.fileName, r.blob));
            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `optimized_images.zip`);
        } else {
            saveAs(results[0].blob, results[0].fileName);
        }
    };
    
    resultsContainer.appendChild(downloadBtn);
    toolScreen.querySelector('.conversion-process').classList.add('hidden');
    resultsContainer.classList.remove('hidden');
}

function attachToolEventListeners(container) {
    const dropZone = container.querySelector('#dropZone'), fileInput = container.querySelector('.file-input');
    if (dropZone) {
        dropZone.addEventListener('dragover', e => e.preventDefault());
        dropZone.addEventListener('drop', e => { e.preventDefault(); handleFiles(e.dataTransfer.files); });
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', e => handleFiles(e.target.files));
    }
    container.querySelector('.add-more-files-input')?.addEventListener('change', e => handleFiles(e.target.files, true));
    container.querySelector('.prev-image-btn')?.addEventListener('click', () => showFilePreview(currentImageIdx - 1));
    container.querySelector('.next-image-btn')?.addEventListener('click', () => showFilePreview(currentImageIdx + 1));
    container.querySelector('.start-btn')?.addEventListener('click', processFiles);
    container.querySelector('.clear-all-btn')?.addEventListener('click', resetTool);
    
    if (activeTool === 'converter') {
        container.querySelectorAll('.format-card').forEach(card => card.addEventListener('click', () => {
            container.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedFormat = card.dataset.format;
        }));
    }
}

// --- Helper Utilities ---
function showToast(message) { toastMessage.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
function formatBytes(bytes) { if (!+bytes) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`; }
function debounce(func, wait) { let timeout; return function (...args) { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); }; }

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', navigateTo);
    window.addEventListener('popstate', router);
    router();
});
