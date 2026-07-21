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

// --- Dynamic External Library Loader (Removes TBT & FCP penalty) ---
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

// --- PWA Service Worker ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered successfully.', reg.scope))
            .catch(err => console.error('Service Worker registration failed.', err));
    });
}

// --- Router (Auto-Reset & Hash Routing for 100% 404 Prevention on Refresh) ---
const routes = {
    '/': { screen: 'homeScreen', title: 'ImgCon - Free Online Image Converter & Compressor' },
    '/image-converter': { screen: 'toolScreen', tool: 'converter', title: 'Image Converter - Convert JPG, PNG, WebP' },
    '/image-compressor': { screen: 'toolScreen', tool: 'compressor', title: 'Image Compressor - Reduce Image Size' },
    '/image-resizer': { screen: 'toolScreen', tool: 'resizer', title: 'Image Resizer - Resize Images Online' },
    '/image-watermark': { screen: 'toolScreen', tool: 'watermark', title: 'Watermark Tool - Protect Your Images' },
    '/about-us': { screen: 'aboutScreen', title: 'About Us - ImgCon Team Story' },
    '/blog': { screen: 'blogScreen', title: 'ImgCon Blog - Image Optimization Tips' },
    '/privacy-policy': { screen: 'privacyScreen', title: 'Privacy Policy - ImgCon' },
    '/terms-conditions': { screen: 'termsScreen', title: 'Terms and Conditions - ImgCon' },
    '/blog/png-vs-jpg-difference': { screen: 'blogScreen', title: 'PNG vs JPG Differences | ImgCon Blog', isPost: true },
    '/blog/how-to-reduce-photo-size': { screen: 'blogScreen', title: 'How to Reduce Photo Size | ImgCon Blog', isPost: true },
    '/blog/webp-the-future-of-web-images': { screen: 'blogScreen', title: 'Why WebP is the Future | ImgCon Blog', isPost: true },
    '/blog/avif-vs-webp-speed-battle': { screen: 'blogScreen', title: 'AVIF vs WebP Speed Battle | ImgCon Blog', isPost: true },
    '/blog/image-compression-seo-pagespeed': { screen: 'blogScreen', title: 'Image Compression for SEO & PageSpeed | ImgCon Blog', isPost: true }
};

const router = async () => {
    // यदि यूआरएल में हैश नहीं है, तो डिफ़ॉल्ट रूप से '#/' सेट करें
    if (!window.location.hash || window.location.hash === '#') {
        window.history.replaceState(null, '', '#/');
    }
    
    // हैश के बाद का पैथ पढ़ें (जैसे '#/image-compressor' से '/image-compressor')
    const path = window.location.hash.slice(1) || '/';
    const route = routes[path] || routes['/'];
    document.title = route.title;

    if (route.screen === 'blogScreen') {
        if (activeTool) resetTool();
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
            if (activeTool) resetTool();
            showTool(route.tool);
        }
    } else {
        if (activeTool) resetTool();
        showPage(route.screen);
    }
};

const navigateTo = (e) => {
    const link = e.target.closest('a');
    if (link) {
        if (link.hasAttribute('download') || link.href.startsWith('blob:') || link.hostname !== window.location.hostname || link.href.includes('mailto:') || link.target) {
            return; 
        }
        e.preventDefault();
        
        // गिटहब पेजेस के लिए सामान्य पाथ को सुरक्षित हैश पाथ में बदलें
        const targetHash = '#' + link.pathname;
        if (window.location.hash !== targetHash) {
            history.pushState(null, '', targetHash);
            router();
        }
    }
};

// --- Web Worker Engine ---
function initializeWorkerPool() {
    if (workerPool.length > 0) return; 
    const numWorkers = navigator.hardwareConcurrency || 4;
    const workerCode = `self.onmessage=async e=>{let{imageBitmap:t,fileName:i,fileIndex:o,tool:a,options:s}=e.data;try{let e,n;const l=new OffscreenCanvas(t.width,t.height),d=l.getContext("2d");if(d.drawImage(t,0,0),"resizer"===a||"watermark"===a){const{newWidth:e,newHeight:i}=s;l.width=e,l.height=i,d.drawImage(t,0,0,e,i)}if("watermark"===a){const{watermarkType:t,watermarkText:i,watermarkOpacity:o,watermarkScale:a,watermarkPosition:n,watermarkBitmap:r}=s,c=l.width*.03;let m,h;if(d.globalAlpha=o,"text"===t){const e=Math.max(12,.1*l.width*a);d.font=\`bold \${e}px Arial\`,d.fillStyle="white",d.shadowColor="rgba(0,0,0,0.7)",d.shadowBlur=5,d.shadowOffsetX=2,d.shadowOffsetY=2;const s={x:0,y:0};switch(n){case"top-left":case"center-left":case"bottom-left":d.textAlign="left",s.x=c;break;case"top-center":case"center":case"bottom-center":d.textAlign="center",s.x=l.width/2;break;case"top-right":case"center-right":case"bottom-right":d.textAlign="right",s.x=l.width-c}switch(n){case"top-left":case"top-center":case"top-right":d.textBaseline="top",s.y=c;break;case"center-left":case"center":case"center-right":d.textBaseline="middle",s.y=l.height/2;break;case"bottom-left":case"bottom-center":case"bottom-right":d.textBaseline="bottom",s.y=l.height-c}d.fillText(i,s.x,s.y)}else if("image"===t&&r){const t=r.width/r.height;let e=l.width*a,i=e/t;i>l.height*a&&(i=l.height*a,e=i*t);const o={x:0,y:0};switch(n){case"top-left":case"center-left":case"bottom-left":o.x=c;break;case"top-center":case"center":case"bottom-center":o.x=(l.width-e)/2;break;case"top-right":case"center-right":case"bottom-right":o.x=l.width-e-c}switch(n){case"top-left":case"top-center":case"top-right":o.y=c;break;case"center-left":case"center":case"center-right":o.y=(l.height-i)/2;break;case"bottom-left":case"bottom-center":case"bottom-right":o.y=l.height-i-c}d.drawImage(r,o.x,o.y,e,i)}}const r="image/"+(s.format||"jpeg"),c=await l.convertToBlob({type:r,quality:s.quality});self.postMessage({success:!0,blob:c,fileName:i,intendedFormat:s.format||"jpeg",fileIndex:o,newWidth:l.width,newHeight:l.height})}catch(e){self.postMessage({success:!1,error:e.message,fileName:i,fileIndex:o})}}`;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    for (let i = 0; i < numWorkers; i++) workerPool.push({ worker: new Worker(workerUrl), busy: false });
}

// --- UI Navigation with clientHeight Reflow fix ---
function showPage(pageId) {
    allScreens.forEach(s => s.classList.add('hidden'));
    const activeScreen = document.getElementById(pageId);
    if (activeScreen) {
         activeScreen.classList.remove('hidden');
         requestAnimationFrame(() => {
             const h = activeScreen.clientHeight;
             requestAnimationFrame(() => {
                 mainContainer.style.minHeight = h + 'px';
             });
         });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    files.forEach(f => { 
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); 
    });
    
    if (processedResults && processedResults.length > 0) {
        processedResults.forEach(r => {
            if (r.blob) URL.revokeObjectURL(URL.createObjectURL(r.blob));
        });
    }
    
    files = []; 
    originalFileDetails = []; 
    processedResults = []; 
    selectedFormat = null; 
    currentImageIdx = 0; 
    watermarkImage = null;
    activeTool = null;
    
    const toolScreen = document.getElementById('toolScreen');
    if (toolScreen) {
        toolScreen.innerHTML = ''; 
    }
}

// --- Core App Functionality ---
function handleFiles(fileList, isAddingMore = false) {
    let newFiles = Array.from(fileList);
    if (newFiles.length === 0) return;
    
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
            originalFileDetails[index] = { width: img.width, height: img.height, size: file.size, name: file.name, type: file.type, ratio: img.width / img.height }; 
            resolve(); 
        };
        img.onerror = () => { 
            originalFileDetails[index] = { width: 0, height: 0, size: file.size, name: file.name, type: file.type, ratio: 0 }; 
            resolve(); 
        };
        img.src = file.previewUrl;
    })));
}

async function confirmSelection() {
    const toolScreen = document.getElementById('toolScreen');
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
    const galleryContainer = toolScreen.querySelector('.gallery-container');
    galleryContainer.innerHTML = files.map(file => `<div class="gallery-item w-full h-full flex-shrink-0 flex items-center justify-center p-2"><img src="${file.previewUrl}" class="max-w-full max-h-full object-contain" loading="lazy"></div>`).join('');
}

function showFilePreview(index) {
    if (index < 0 || index >= files.length) return;
    currentImageIdx = index;
    const toolScreen = document.getElementById('toolScreen');
    toolScreen.querySelector('.gallery-container').style.transform = `translateX(-${index * 100}%)`;
    toolScreen.querySelector('.current-image-index').textContent = index + 1;
    toolScreen.querySelector('.total-images').textContent = files.length;
    
    if (activeTool === 'resizer' && originalFileDetails[index]) {
        const widthInput = toolScreen.querySelector('#resize-width');
        const heightInput = toolScreen.querySelector('#resize-height');
        if (widthInput && heightInput) {
            widthInput.value = originalFileDetails[index].width;
            heightInput.value = originalFileDetails[index].height;
        }
    }
}

function renderFileManagementUI() {
    const toolScreen = document.getElementById('toolScreen');
    const listContainer = toolScreen.querySelector('.file-list-container');
    if (!listContainer) return;
    listContainer.innerHTML = files.map((file, index) => {
        const details = originalFileDetails[index] || { size: file.size, width: '?', height: '?' };
        return `<div class="file-item flex items-center gap-2 p-1.5 rounded-md hover:bg-card-bg cursor-grab transition-all border border-transparent hover:border-indigo-200" draggable="true" data-index="${index}"><img src="${file.previewUrl}" class="w-10 h-10 object-cover rounded shadow-sm" loading="lazy"><div class="flex-grow truncate text-xs"><p class="font-bold truncate" style="color: var(--text-dark);">${file.name}</p><p class="text-xxs text-light" style="color: var(--text-light);">${formatBytes(details.size)} &middot; ${details.width}x${details.height}</p></div><button class="delete-file-btn p-1 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" data-index="${index}"><i class="fas fa-times"></i></button></div>`;
    }).join('');
    
    attachFileManagementListeners();
    initDragAndDropReorder(listContainer);
}

function initDragAndDropReorder(listContainer) {
    let dragSrcEl = null;
    const items = listContainer.querySelectorAll('.file-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            dragSrcEl = item;
            e.dataTransfer.effectAllowed = 'move';
            item.classList.add('opacity-40');
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            return false;
        });
        item.addEventListener('dragenter', () => {
            item.classList.add('bg-indigo-50', 'dark:bg-indigo-950/30', 'border-indigo-300');
        });
        item.addEventListener('dragleave', () => {
            item.classList.remove('bg-indigo-50', 'dark:bg-indigo-950/30', 'border-indigo-300');
        });
        item.addEventListener('drop', (e) => {
            e.stopPropagation();
            if (dragSrcEl !== item) {
                const srcIndex = parseInt(dragSrcEl.dataset.index, 10);
                const targetIndex = parseInt(item.dataset.index, 10);
                
                const tempFile = files[srcIndex];
                files[srcIndex] = files[targetIndex];
                files[targetIndex] = tempFile;
                
                const tempDetails = originalFileDetails[srcIndex];
                originalFileDetails[srcIndex] = originalFileDetails[targetIndex];
                originalFileDetails[targetIndex] = tempDetails;
                
                displayFiles();
                renderFileManagementUI();
                showFilePreview(targetIndex);
            }
            return false;
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('opacity-40');
            items.forEach(i => i.classList.remove('bg-indigo-50', 'dark:bg-indigo-950/30', 'border-indigo-300'));
        });
    });
}

function deleteFile(index) {
    if (files[index] && files[index].previewUrl) {
        URL.revokeObjectURL(files[index].previewUrl);
    }
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

function runSingleCompressionPromise(workerItem, file, quality, targetWidth, targetHeight, format) {
    return new Promise(async (resolve) => {
        workerItem.worker.onmessage = (e) => {
            resolve(e.data);
        };
        const imageBitmap = await createImageBitmap(file);
        workerItem.worker.postMessage({
            imageBitmap,
            fileName: file.name,
            fileIndex: 0,
            tool: 'compressor',
            options: { quality, format, newWidth: targetWidth, newHeight: targetHeight }
        }, [imageBitmap]);
    });
}

// --- Dynamic PDF Compilation Handler (On-demand library load) ---
async function compilePDF(results) {
    await loadExternalLibrary('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (i > 0) pdf.addPage();
        
        const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(res.blob);
        });
        
        const width = res.newWidth || 800;
        const height = res.newHeight || 600;
        pdf.addImage(dataUrl, 'JPEG', 10, 10, 190, (190 * height) / width);
    }
    return pdf.output('blob');
}

// --- Web Worker Process Flow ---
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
    
    let qualitySlider = toolScreen.querySelector('.quality-slider');
    let qualityVal = qualitySlider ? parseInt(qualitySlider.value, 10) / 100 : 0.85;

    const isTargetSizeActive = document.getElementById('target-size-toggle')?.checked;
    
    for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const originalDetails = originalFileDetails[index];
        let targetWidth = originalDetails.width;
        let targetHeight = originalDetails.height;

        if (activeTool === 'resizer') {
            const mode = toolScreen.querySelector('.resize-by-btn.active').dataset.mode;
            if (mode === 'pixels') {
                targetWidth = parseInt(document.getElementById('resize-width').value, 10) || originalDetails.width;
                targetHeight = parseInt(document.getElementById('resize-height').value, 10) || originalDetails.height;
            } else {
                const scale = parseInt(document.getElementById('percentage-slider').value, 10) / 100;
                targetWidth = Math.round(originalDetails.width * scale);
                targetHeight = Math.round(originalDetails.height * scale);
            }
        }

        const formatExt = selectedFormat || file.type.split('/')[1] || 'jpeg';

        if (activeTool === 'compressor' && isTargetSizeActive) {
            const targetSizeInputVal = parseFloat(document.getElementById('target-size-kb-input').value) || 100;
            const targetUnit = document.getElementById('target-size-unit-select').value;
            const targetBytes = targetSizeInputVal * (targetUnit === 'MB' ? 1024 * 1024 : 1024);

            toolScreen.querySelector('.processing-text').innerHTML = `<i class="fas fa-search-dollar fa-spin mr-2"></i>Finding optimal settings...`;
            
            let low = 0.05, high = 0.98, bestResult = null;
            const freeWorker = workerPool.find(w => !w.busy) || workerPool[0];
            if (freeWorker) {
                freeWorker.busy = true;
                for (let iter = 0; iter < 5; iter++) {
                    let mid = (low + high) / 2;
                    let trailResult = await runSingleCompressionPromise(freeWorker, file, mid, targetWidth, targetHeight, formatExt);
                    if (trailResult.success) {
                        if (trailResult.blob.size <= targetBytes) {
                            bestResult = trailResult;
                            low = mid + 0.01;
                        } else {
                            high = mid - 0.01;
                        }
                    }
                }
                freeWorker.busy = false;
                if (bestResult) {
                    bestResult.fileIndex = index;
                    results[index] = bestResult;
                } else {
                    const defaultResult = await runSingleCompressionPromise(freeWorker, file, 0.1, targetWidth, targetHeight, formatExt);
                    defaultResult.fileIndex = index;
                    results[index] = defaultResult;
                }
                filesProcessed++;
                toolScreen.querySelector('.progress-bar-fill').style.width = `${(filesProcessed / files.length) * 100}%`;
                if (filesProcessed === files.length) {
                    toolScreen.querySelector('.processing-text').innerHTML = `<i class="fas fa-check-circle text-green-500 mr-2"></i>Complete!`;
                    setTimeout(() => handleCompletion(results), 500);
                }
            }
            continue;
        }

        const options = { 
            quality: qualityVal, 
            format: formatExt,
            newWidth: targetWidth,
            newHeight: targetHeight
        };

        if (activeTool === 'watermark') {
            const activeType = toolScreen.querySelector('.watermark-type-btn.active').dataset.type;
            const textValue = document.getElementById('watermark-text')?.value || '© ImgCon';
            const opacity = parseInt(document.getElementById('opacity-slider')?.value || '70', 10) / 100;
            const scale = parseInt(document.getElementById('scale-slider')?.value || '20', 10) / 100;
            const position = toolScreen.querySelector('.position-btn.active')?.dataset.position || 'center';
            
            options.newWidth = originalDetails.width;
            options.newHeight = originalDetails.height;
            options.watermarkType = activeType;
            options.watermarkText = textValue;
            options.watermarkOpacity = opacity;
            options.watermarkScale = scale;
            options.watermarkPosition = position;
            options.watermarkBitmap = watermarkImage || null;
        }

        const freeWorker = workerPool.find(w => !w.busy) || workerPool[0];
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

async function handleCompletion(results) {
    const toolScreen = document.getElementById('toolScreen');
    processedResults = results;
    const resultsContainer = toolScreen.querySelector('.results-container');
    resultsContainer.innerHTML = '';
    
    if (activeTool === 'converter' && selectedFormat === 'pdf') {
        toolScreen.querySelector('.processing-text').innerHTML = `<i class="fas fa-file-pdf text-red-500 mr-2"></i>Compiling PDF...`;
        const pdfBlob = await compilePDF(results);
        processedResults = [{ blob: pdfBlob, fileName: 'compiled_images.pdf', intendedFormat: 'pdf', fileIndex: 0 }];
    }

    resultsContainer.insertAdjacentHTML('beforeend', `
        <div class="results-summary text-center p-4 rounded-2xl mb-6 border animate__animated animate__fadeIn" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
            <h3 class="text-sm font-black uppercase tracking-wider text-indigo-500">Processing Complete!</h3>
            <p class="text-xs font-semibold" style="color: var(--text-light);">Successfully processed ${processedResults.length} file(s).</p>
        </div>
    `);
    
    processedResults.forEach((res, i) => {
        const originalFile = files[res.fileIndex];
        const originalDetails = originalFileDetails[res.fileIndex];
        const isPdf = res.intendedFormat === 'pdf';
        
        const savedPercent = Math.round(((originalDetails.size - res.blob.size) / originalDetails.size) * 100);
        const isSavedPositive = savedPercent >= 0;
        const downloadUrl = URL.createObjectURL(res.blob);
        
        const fileNode = document.createElement('div');
        fileNode.className = 'result-card p-5 sm:p-6 rounded-2xl border mb-5 shadow-sm hover:shadow-md transition-all duration-300 animate__animated animate__slideInUp';
        fileNode.style.borderColor = 'var(--card-border)';
        fileNode.style.backgroundColor = 'var(--card-bg)';
        
        fileNode.innerHTML = `
            <div class="flex items-center gap-4 mb-5 border-b pb-4" style="border-color: var(--bg-subtle);">
                <div class="relative w-14 h-14 rounded-xl overflow-hidden border shadow-sm" style="border-color: var(--card-border);">
                    <img src="${originalFile.previewUrl}" class="w-full h-full object-cover" loading="lazy">
                </div>
                <div class="flex-grow truncate">
                    <h4 class="font-bold text-sm truncate" style="color: var(--text-dark);">${res.fileName}</h4>
                    <div class="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider" style="background-color: var(--bg-subtle); color: var(--text-light);">
                        <span>${originalFile.type.split('/')[1]?.toUpperCase() || 'IMG'}</span>
                        <i class="fas fa-arrow-right text-xxs opacity-60"></i>
                        <span style="color: var(--primary-color);">${res.intendedFormat ? res.intendedFormat.toUpperCase() : 'OUT'}</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 text-center mb-5 p-3 rounded-xl" style="background-color: var(--bg-subtle);">
                <div class="border-r" style="border-color: var(--card-border);">
                    <p class="text-xxs font-extrabold uppercase tracking-widest text-gray-400">Before</p>
                    <p class="text-lg font-black mt-1" style="color: var(--text-dark);">${formatBytes(originalDetails.size)}</p>
                    <p class="text-xxs font-semibold opacity-75" style="color: var(--text-light);">${originalDetails.width} x ${originalDetails.height}px</p>
                </div>
                <div>
                    <p class="text-xxs font-extrabold uppercase tracking-widest text-gray-400">After</p>
                    <p class="text-lg font-black mt-1 ${isSavedPositive ? 'text-green-500' : 'text-yellow-600'}">${formatBytes(res.blob.size)}</p>
                    <p class="text-xxs font-semibold opacity-75" style="color: var(--text-light);">${res.newWidth || originalDetails.width} x ${res.newHeight || originalDetails.height}px</p>
                </div>
            </div>

            <div class="space-y-2 mb-6">
                <div class="flex justify-between items-center text-xs font-bold">
                    <span style="color: var(--text-light);">${isSavedPositive ? 'File Size Reduced' : 'Lossless Re-encoding Increase'}</span>
                    <span class="${isSavedPositive ? 'text-green-500' : 'text-yellow-600'}">
                        Saved: ${isSavedPositive ? '+' : ''}${savedPercent}%
                    </span>
                </div>
                <div class="w-full h-2 rounded-full overflow-hidden" style="background-color: var(--bg-main);">
                    <div class="savings-bar-fill h-full rounded-full transition-all duration-1000 ease-out" 
                         style="width: 0%; background: ${isSavedPositive ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)'};">
                    </div>
                </div>
                ${!isSavedPositive ? `
                    <p class="text-xxs font-semibold opacity-80 mt-1" style="color: var(--text-light);">
                        💡 Pro-tip: Convert PNG to WEBP/AVIF format for efficient client-side savings.
                    </p>
                ` : ''}
            </div>

            <div class="flex flex-wrap items-center justify-center gap-3">
                ${!isPdf ? `
                    <button class="preview-before-after-btn flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800" style="background-color: var(--card-bg); border-color: var(--card-border); color: var(--text-dark);" data-index="${i}">
                        <i class="fas fa-eye text-sm opacity-85"></i> Preview
                    </button>
                ` : ''}
                <a href="${downloadUrl}" download="${res.fileName}" class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 hover:opacity-90 text-white" style="background: linear-gradient(135deg, var(--primary-color), var(--primary-hover)); border-color: var(--primary-color);">
                    <i class="fas fa-download text-sm"></i> Download
                </a>
                <button class="delete-result-btn flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 hover:bg-red-50 hover:text-red-600" style="background-color: var(--card-bg); border-color: var(--card-border); color: var(--text-dark);" data-index="${i}">
                    <i class="fas fa-trash-alt text-sm opacity-85"></i> Delete
                </button>
            </div>
        `;
        
        resultsContainer.appendChild(fileNode);
        
        setTimeout(() => {
            const bar = fileNode.querySelector('.savings-bar-fill');
            if (bar) {
                bar.style.width = isSavedPositive ? `${savedPercent}%` : `${Math.abs(savedPercent)}%`;
            }
        }, 150);
    });

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

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn upload-button w-full justify-center py-3.5 text-sm mt-4 shadow-md';
    downloadBtn.innerHTML = `<i class="fas fa-file-archive mr-3"></i><span>Download All (ZIP)</span>`;
    
    // Dynamic JSZip and FileSaver loading inside trigger to optimize performance
    downloadBtn.onclick = async () => {
        if (processedResults.length > 1) {
            downloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-3"></i><span>Creating ZIP...</span>`;
            try {
                await Promise.all([
                    loadExternalLibrary('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'),
                    loadExternalLibrary('https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js')
                ]);
                const zip = new JSZip();
                processedResults.forEach(r => zip.file(r.fileName.replace(/\.[^/.]+$/, "") + '.' + r.intendedFormat, r.blob));
                const zipBlob = await zip.generateAsync({ type: "blob" });
                saveAs(zipBlob, `optimized_images.zip`);
            } catch (err) {
                showToast("Failed to compile ZIP archive.");
            } finally {
                downloadBtn.innerHTML = `<i class="fas fa-file-archive mr-3"></i><span>Download All (ZIP)</span>`;
            }
        } else {
            await loadExternalLibrary('https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js');
            saveAs(processedResults[0].blob, processedResults[0].fileName);
        }
    };
    
    if (processedResults.length > 1) {
        resultsContainer.appendChild(downloadBtn);
    }
    
    toolScreen.querySelector('.conversion-process').classList.add('hidden');
    resultsContainer.classList.remove('hidden');
}

// --- Open Comparison Modal ---
function openComparisonModal(index) {
    const result = processedResults[index];
    const originalFile = files[result.fileIndex];
    const splitDirection = document.getElementById('split-orientation')?.value || 'horizontal-split';

    const container = document.getElementById('modalPreviewContainer');
    container.className = `before-after-container h-full w-full ${splitDirection}`;
    
    const beforeImg = container.querySelector('.before-image');
    const afterImg = container.querySelector('.after-image');
    
    beforeImg.src = originalFile.previewUrl;
    afterImg.src = URL.createObjectURL(result.blob);
    
    document.getElementById('modalFileName').textContent = `Quality Comparison: ${result.fileName}`;
    previewModal.classList.add('show');
    
    const viewport = container.querySelector('.comparison-viewport');
    if (viewport) {
        viewport.style.transform = `translate(0px, 0px) scale(1)`;
    }

    initBeforeAfterSlider(container);
}

// --- Zoom & Pan Before-After Slider System ---
function initBeforeAfterSlider(container) {
    const slider = container.querySelector('.before-after-slider');
    const clipper = container.querySelector('.before-image-clipper');
    const viewport = container.querySelector('.comparison-viewport');
    
    if (!slider || !clipper || !viewport) return;
    
    let isSliderDragging = false;
    let isPanning = false;
    
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let startX = 0;
    let startY = 0;

    const isVertical = container.classList.contains('vertical-split');

    const updateSliderPosition = (clientX, clientY) => {
        const rect = container.getBoundingClientRect();
        if (isVertical) {
            let y = clientY - rect.top;
            if (y < 0) y = 0;
            if (y > rect.height) y = rect.height;
            const pct = (y / rect.height) * 100;
            slider.style.top = `${pct}%`;
            clipper.style.clipPath = `inset(0 0 ${100 - pct}% 0)`;
        } else {
            let x = clientX - rect.left;
            if (x < 0) x = 0;
            if (x > rect.width) x = rect.width;
            const pct = (x / rect.width) * 100;
            slider.style.left = `${pct}%`;
            clipper.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        }
    };

    const updateViewportTransform = () => {
        viewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    };

    const handleDown = (e) => {
        const target = e.target;
        if (target === slider || slider.contains(target)) {
            isSliderDragging = true;
            e.preventDefault();
        } else {
            isPanning = true;
            startX = (e.touches ? e.touches[0].clientX : e.clientX) - translateX;
            startY = (e.touches ? e.touches[0].clientY : e.clientY) - translateY;
            e.preventDefault();
        }
        
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);
    };

    const handleMove = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (isSliderDragging) {
            updateSliderPosition(clientX, clientY);
        } else if (isPanning && scale > 1) {
            translateX = clientX - startX;
            translateY = clientY - startY;
            updateViewportTransform();
        }
    };

    const handleUp = () => {
        isSliderDragging = false;
        isPanning = false;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchend', handleUp);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        
        scale += e.deltaY < 0 ? zoomIntensity : -zoomIntensity;
        scale = Math.min(Math.max(1, scale), 5);

        if (scale === 1) {
            translateX = 0;
            translateY = 0;
        }
        updateViewportTransform();
    };

    container.addEventListener('mousedown', handleDown);
    container.addEventListener('touchstart', handleDown, { passive: false });
    container.addEventListener('wheel', handleWheel, { passive: false });
}

// --- Debounced Real-Time Quality Size Estimator Helper ---
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
    const previewInfo = toolScreen.querySelector('.realtime-preview-info');
    if (!previewInfo || previewInfo.classList.contains('hidden')) return;

    const qualitySlider = toolScreen.querySelector('.quality-slider');
    if (!qualitySlider) return;

    const qualityVal = parseInt(qualitySlider.value, 10) / 100;
    const currentFile = files[currentImageIdx];
    const formatExt = selectedFormat || currentFile.type.split('/')[1] || 'jpeg';

    initializeWorkerPool();
    const freeWorker = workerPool.find(w => !w.busy) || workerPool[0];
    if (freeWorker) {
        freeWorker.busy = true;
        const result = await runSingleCompressionPromise(freeWorker, currentFile, qualityVal, originalFileDetails[currentImageIdx].width, originalFileDetails[currentImageIdx].height, formatExt);
        freeWorker.busy = false;
        
        if (result.success) {
            const originalSizeSpan = previewInfo.querySelector('.original-size');
            const newSizeSpan = previewInfo.querySelector('.new-size');
            if (originalSizeSpan && newSizeSpan) {
                originalSizeSpan.textContent = formatBytes(originalFileDetails[currentImageIdx].size);
                newSizeSpan.textContent = formatBytes(result.blob.size);
            }
        }
    }
}, 250);

// --- Attach Action Event Listeners ---
function attachToolEventListeners(container) {
    const dropZone = container.querySelector('#dropZone'), fileInput = container.querySelector('.file-input');
    
    if (dropZone) {
        dropZone.addEventListener('dragover', e => e.preventDefault());
        dropZone.addEventListener('dragenter', () => dropZone.classList.add('border-indigo-500', 'bg-indigo-50/20'));
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/20'));
        dropZone.addEventListener('drop', e => { e.preventDefault(); handleFiles(e.dataTransfer.files); });
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', e => handleFiles(e.target.files));
    }
    
    container.querySelector('.add-more-files-input')?.addEventListener('change', e => handleFiles(e.target.files, true));
    container.querySelector('.prev-image-btn')?.addEventListener('click', () => { showFilePreview(currentImageIdx - 1); triggerRealtimeSizeUpdate(); });
    container.querySelector('.next-image-btn')?.addEventListener('click', () => { showFilePreview(currentImageIdx + 1); triggerRealtimeSizeUpdate(); });
    container.querySelector('.start-btn')?.addEventListener('click', processFiles);
    container.querySelector('.clear-all-btn')?.addEventListener('click', resetTool);
    
    container.querySelectorAll('.quality-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const parent = slider.closest('.options-section') || slider.parentElement;
            const valSpan = parent.querySelector('.quality-value');
            if (valSpan) {
                valSpan.textContent = e.target.value;
                valSpan.style.transform = 'scale(1.25)';
                setTimeout(() => valSpan.style.transform = 'scale(1)', 100);
            }
            triggerRealtimeSizeUpdate();
        });
    });

    if (activeTool === 'converter') {
        container.querySelectorAll('.format-card').forEach(card => card.addEventListener('click', () => {
            container.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedFormat = card.dataset.format;
            
            const pdfSection = container.querySelector('#pdfOptionsSection');
            if (pdfSection) pdfSection.classList.toggle('hidden', selectedFormat !== 'pdf');
            triggerRealtimeSizeUpdate();
        }));
    }

    if (activeTool === 'watermark') {
        const typeButtons = container.querySelectorAll('.watermark-type-btn');
        typeButtons.forEach(btn => btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.type;
            container.querySelector('#text-watermark-options').classList.toggle('hidden', type !== 'text');
            container.querySelector('#image-watermark-options').classList.toggle('hidden', type !== 'image');
        }));

        const logoInput = container.querySelector('#watermark-image-input');
        logoInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                watermarkImage = await createImageBitmap(file);
                const preview = container.querySelector('#watermark-preview');
                preview.src = URL.createObjectURL(file);
                preview.classList.remove('hidden');
            }
        });

        container.querySelector('#opacity-slider')?.addEventListener('input', (e) => {
            container.querySelector('#opacity-value').textContent = e.target.value;
        });
        container.querySelector('#scale-slider')?.addEventListener('input', (e) => {
            container.querySelector('#scale-value').textContent = e.target.value;
        });

        const posButtons = container.querySelectorAll('.position-btn');
        posButtons.forEach(btn => btn.addEventListener('click', () => {
            posButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }));
    }

    if (activeTool === 'compressor') {
        const toggle = container.querySelector('#target-size-toggle');
        const unitContainer = container.querySelector('.target-size-input-container');
        toggle?.addEventListener('change', () => {
            unitContainer.classList.toggle('hidden', !toggle.checked);
        });

        const beforeAfterToggle = container.querySelector('#before-after-toggle');
        const previewInfo = container.querySelector('.realtime-preview-info');
        beforeAfterToggle?.addEventListener('change', () => {
            if (previewInfo) {
                previewInfo.classList.toggle('hidden', !beforeAfterToggle.checked);
                if (beforeAfterToggle.checked) {
                    triggerRealtimeSizeUpdate();
                }
            }
        });
    }

    if (activeTool === 'resizer') {
        const modeButtons = container.querySelectorAll('.resize-by-btn');
        const widthInput = container.querySelector('#resize-width');
        const heightInput = container.querySelector('#resize-height');
        const aspectToggle = container.querySelector('#aspect-ratio-toggle');
        const socialPresets = container.querySelector('#social-presets');

        modeButtons.forEach(btn => btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const isPixels = btn.dataset.mode === 'pixels';
            container.querySelector('#pixels-mode-container').classList.toggle('hidden', !isPixels);
            container.querySelector('#percentage-mode-container').classList.toggle('hidden', isPixels);
        }));

        container.querySelector('#percentage-slider')?.addEventListener('input', (e) => {
            container.querySelector('#percentage-value').textContent = e.target.value;
        });

        socialPresets?.addEventListener('change', () => {
            if (socialPresets.value !== 'custom') {
                const [w, h] = socialPresets.value.split('x').map(Number);
                if (widthInput && heightInput) {
                    widthInput.value = w;
                    heightInput.value = h;
                }
            }
        });

        widthInput?.addEventListener('input', () => {
            if (aspectToggle?.checked && files.length > 0) {
                const ratio = originalFileDetails[currentImageIdx].ratio;
                if (ratio && heightInput) {
                    heightInput.value = Math.round(parseInt(widthInput.value, 10) / ratio) || '';
                }
            }
        });

        heightInput?.addEventListener('input', () => {
            if (aspectToggle?.checked && files.length > 0) {
                const ratio = originalFileDetails[currentImageIdx].ratio;
                if (ratio && widthInput) {
                    widthInput.value = Math.round(parseInt(heightInput.value, 10) * ratio) || '';
                }
            }
        });
    }
}

// --- Theme Switcher ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
}

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// --- Helper Utilities ---
function showToast(message) { toastMessage.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
function formatBytes(bytes) { if (!+bytes) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`; }

document.getElementById('copyLinkBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!');
});

document.getElementById('modalCloseBtn')?.addEventListener('click', () => {
    previewModal.classList.remove('show');
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    document.body.addEventListener('click', navigateTo);
    window.addEventListener('popstate', router);
    window.addEventListener('hashchange', router); // Listen to hash changes for perfect refresh support
    router();
});
