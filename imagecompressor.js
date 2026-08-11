/**
 * ==========================================================================
 * IMAGECOMPRESSOR.JS - Modular & Smart Image Compressor Engine
 * (Self-Contained UI, CSS, Events, Target Size Search & Canvas Processing Logic)
 * ==========================================================================
 */

(function () {
    'use strict';

    // ==========================================================================
    // 1. DYNAMIC CSS INJECTION (Compressor Specific UI & Toggle Switches)
    // ==========================================================================
    const compressorStyles = `
        /* Toggle Switch Styling */
        .toggle-switch-wrapper {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
            flex-shrink: 0;
        }

        .toggle-switch-wrapper input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--card-border, #cbd5e1);
            transition: .3s cubic-bezier(0.25, 0.8, 0.25, 1);
            border-radius: 9999px;
        }

        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .3s cubic-bezier(0.25, 0.8, 0.25, 1);
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }

        input:checked + .toggle-slider {
            background-color: var(--primary-color, #6366f1);
        }

        input:checked + .toggle-slider:before {
            transform: translateX(20px);
        }

        /* Tooltip Styling */
        .tooltip-container {
            position: relative;
            display: inline-flex;
            align-items: center;
        }

        /* Target Size Input Focus Ring */
        .target-size-input:focus {
            border-color: var(--primary-color, #6366f1) !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
    `;

    function injectStyles() {
        if (!document.getElementById('imgcon-compressor-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'imgcon-compressor-styles';
            styleEl.textContent = compressorStyles;
            document.head.appendChild(styleEl);
        }
    }

    // ==========================================================================
    // 2. DYNAMIC HTML TEMPLATE INJECTION
    // ==========================================================================
    const compressorOptionsHTML = `
        <template id="compressorOptionsTemplate">
            <div class="compressor-options-wrapper space-y-4 animate__animated animate__fadeIn">
                <!-- Header -->
                <div class="flex items-center justify-between pb-1 border-b" style="border-color: var(--card-border);">
                    <h3 class="text-base font-black uppercase tracking-wider" style="color: var(--text-dark);">
                        <i class="fas fa-compress-arrows-alt text-green-500 mr-2"></i>Compressor Options
                    </h3>
                    <span class="text-xxs px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-950/80 dark:text-green-400 font-extrabold uppercase tracking-wider">Smart Engine</span>
                </div>

                <!-- Strip Metadata Toggle Card -->
                <div class="flex items-center justify-between p-3.5 rounded-2xl border transition-all hover:border-indigo-200" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                    <div>
                        <label for="metadata-toggle" class="font-bold text-xs sm:text-sm cursor-pointer block" style="color: var(--text-dark);">Strip EXIF Metadata</label>
                        <p class="text-xxs font-medium" style="color: var(--text-light);">Removes GPS location & camera info for extra size reduction</p>
                    </div>
                    <label class="toggle-switch-wrapper">
                        <input type="checkbox" id="metadata-toggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <!-- Quality Control Slider Card -->
                <div class="options-section p-4 rounded-2xl border space-y-2" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                    <div class="flex items-center justify-between">
                        <label class="font-bold text-xs sm:text-sm" style="color: var(--text-dark);">
                            Compression Level: <span class="quality-value text-indigo-500 text-sm font-black">80</span>%
                        </label>
                        <div id="png-info" class="tooltip-container hidden text-xs opacity-75 hover:opacity-100">
                            <i class="fas fa-info-circle text-indigo-500 mr-1"></i>
                            <span class="text-xxs font-semibold" style="color: var(--text-light);">Lossless Mode</span>
                        </div>
                    </div>
                    <input type="range" class="quality-slider w-full cursor-pointer accent-indigo-500" min="1" max="100" value="80" step="1">
                </div>

                <!-- Target File Size Control Card -->
                <div class="p-4 rounded-2xl border space-y-3" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                    <div class="flex items-center justify-between">
                        <div>
                            <label for="target-size-toggle" class="font-bold text-xs sm:text-sm cursor-pointer block" style="color: var(--text-dark);">Set Target File Size</label>
                            <p class="text-xxs font-medium" style="color: var(--text-light);">Specify exact KB/MB limit (e.g., 100 KB)</p>
                        </div>
                        <label class="toggle-switch-wrapper">
                            <input type="checkbox" id="target-size-toggle">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="target-size-input-container hidden flex items-center gap-2 pt-1">
                        <input type="number" id="target-size-kb-input" class="target-size-input w-full p-2.5 rounded-xl border text-xs font-bold transition-all outline-none" style="border-color: var(--card-border); background-color: var(--card-bg); color: var(--text-dark);" placeholder="e.g., 100" value="100" min="1">
                        <select id="target-size-unit-select" class="target-size-unit p-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer" style="border-color: var(--card-border); background-color: var(--card-bg); color: var(--text-dark);">
                            <option value="KB">KB</option>
                            <option value="MB">MB</option>
                        </select>
                    </div>
                    <p class="target-size-status text-xxs font-semibold text-center hidden text-indigo-500"></p>
                </div>

                <!-- Slider Orientation Card -->
                <div class="flex items-center justify-between p-3.5 rounded-2xl border" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                    <label for="split-orientation" class="font-bold text-xs sm:text-sm" style="color: var(--text-dark);">Preview Orientation</label>
                    <select id="split-orientation" class="p-2 rounded-xl border text-xs font-bold outline-none cursor-pointer" style="border-color: var(--card-border); background-color: var(--card-bg); color: var(--text-dark);">
                        <option value="horizontal-split">Horizontal Split</option>
                        <option value="vertical-split">Vertical Split</option>
                    </select>
                </div>

                <!-- Live Before/After Preview Toggle -->
                <div class="flex items-center justify-between p-3.5 rounded-2xl border" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                    <div>
                        <label for="before-after-toggle" class="font-bold text-xs sm:text-sm cursor-pointer block" style="color: var(--text-dark);">Live Size Estimator</label>
                        <p class="text-xxs font-medium" style="color: var(--text-light);">Estimates compressed size in real-time</p>
                    </div>
                    <label class="toggle-switch-wrapper">
                        <input type="checkbox" id="before-after-toggle">
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <!-- Live Estimated Size Box -->
                <div class="realtime-preview-info p-4 rounded-2xl border text-center hidden animate__animated animate__fadeIn" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                    <p class="font-extrabold text-xs uppercase tracking-wider text-gray-400">Estimated Output Size</p>
                    <div class="flex justify-center items-baseline gap-3 mt-1.5">
                        <span class="original-size text-xs text-light line-through" style="color: var(--text-light);">0 KB</span>
                        <i class="fas fa-arrow-right text-xxs opacity-60" style="color: var(--text-light);"></i>
                        <span class="new-size text-lg font-black text-green-500">0 KB</span>
                    </div>
                </div>
            </div>
        </template>
    `;

    function injectTemplate() {
        if (!document.getElementById('compressorOptionsTemplate')) {
            const div = document.createElement('div');
            div.innerHTML = compressorOptionsHTML.trim();
            document.body.appendChild(div.firstElementChild);
        }
    }

    // ==========================================================================
    // 3. CORE COMPRESSION ENGINE LOGIC (Canvas & Target Size Search)
    // ==========================================================================

    /**
     * Helper to render canvas to blob with given format & quality
     */
    async function renderToBlob(bitmap, width, height, mimeType, quality) {
        let canvas, ctx;
        if (typeof OffscreenCanvas !== 'undefined') {
            canvas = new OffscreenCanvas(width, height);
            ctx = canvas.getContext('2d');
        } else {
            canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            ctx = canvas.getContext('2d');
        }

        // Fill white background for JPEGs
        if (mimeType === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(bitmap, 0, 0, width, height);

        if (canvas.convertToBlob) {
            return await canvas.convertToBlob({ type: mimeType, quality });
        } else {
            return await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
        }
    }

    /**
     * Compresses an image file with standard quality or Target Size Search
     * @param {File} file 
     * @param {Object} options - Compression options
     * @returns {Promise<Object>} Compression result
     */
    async function processImage(file, options = {}) {
        const quality = typeof options.quality === 'number' ? options.quality : 0.8;
        const targetActive = !!options.targetSizeActive;
        const targetKB = parseFloat(options.targetSizeKB) || 100;
        const targetUnit = options.targetUnit || 'KB';

        const bitmap = await createImageBitmap(file);
        const width = bitmap.width;
        const height = bitmap.height;

        // Determine MIME Type based on file extension
        let mimeType = 'image/jpeg';
        let extension = 'jpg';
        if (file.type === 'image/webp') {
            mimeType = 'image/webp';
            extension = 'webp';
        } else if (file.type === 'image/png') {
            mimeType = 'image/png';
            extension = 'png';
        }

        let finalBlob;

        // TARGET FILE SIZE BINARY SEARCH ALGORITHM
        if (targetActive && (mimeType === 'image/jpeg' || mimeType === 'image/webp')) {
            const targetBytes = targetKB * (targetUnit === 'MB' ? 1048576 : 1024);
            let low = 0.05;
            let high = 0.98;
            let bestBlob = null;

            // Run 5-iteration binary search to find best quality setting
            for (let iter = 0; iter < 5; iter++) {
                const mid = (low + high) / 2;
                const testBlob = await renderToBlob(bitmap, width, height, mimeType, mid);

                if (testBlob.size <= targetBytes) {
                    bestBlob = testBlob;
                    low = mid + 0.01; // Try higher quality
                } else {
                    high = mid - 0.01; // Reduce quality
                }
            }

            // Fallback to lowest compression if target size is too small
            finalBlob = bestBlob || await renderToBlob(bitmap, width, height, mimeType, 0.05);
        } else {
            // STANDARD COMPRESSION MODE
            finalBlob = await renderToBlob(bitmap, width, height, mimeType, quality);
        }

        if (typeof bitmap.close === 'function') bitmap.close();

        const newFileName = file.name.replace(/\.[^/.]+$/, "") + '.' + extension;

        return {
            success: true,
            blob: finalBlob,
            fileName: newFileName,
            intendedFormat: extension,
            newWidth: width,
            newHeight: height
        };
    }

    // ==========================================================================
    // 4. EVENT BINDINGS & COMPRESSOR LOGIC
    // ==========================================================================
    function initCompressorEvents(container) {
        if (!container) return;

        const targetToggle = container.querySelector('#target-size-toggle');
        const unitContainer = container.querySelector('.target-size-input-container');

        if (targetToggle && unitContainer) {
            targetToggle.addEventListener('change', () => {
                unitContainer.classList.toggle('hidden', !targetToggle.checked);
                if (typeof window.triggerRealtimeSizeUpdate === 'function') {
                    window.triggerRealtimeSizeUpdate();
                }
            });
        }

        container.querySelector('#target-size-kb-input')?.addEventListener('input', () => {
            if (typeof window.triggerRealtimeSizeUpdate === 'function') {
                window.triggerRealtimeSizeUpdate();
            }
        });

        container.querySelector('#target-size-unit-select')?.addEventListener('change', () => {
            if (typeof window.triggerRealtimeSizeUpdate === 'function') {
                window.triggerRealtimeSizeUpdate();
            }
        });

        const beforeAfterToggle = container.querySelector('#before-after-toggle');
        const previewInfo = container.querySelector('.realtime-preview-info');

        if (beforeAfterToggle && previewInfo) {
            beforeAfterToggle.addEventListener('change', () => {
                previewInfo.classList.toggle('hidden', !beforeAfterToggle.checked);
                if (beforeAfterToggle.checked && typeof window.triggerRealtimeSizeUpdate === 'function') {
                    window.triggerRealtimeSizeUpdate();
                }
            });
        }
    }

    // Inject CSS & HTML Template on DOM Ready
    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        injectTemplate();
    });

    // ==========================================================================
    // 5. EXPOSE MODULE GLOBALLY
    // ==========================================================================
    window.ImageCompressorModule = {
        processImage,
        initCompressorEvents
    };

})();