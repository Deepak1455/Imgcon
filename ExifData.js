/**
 * ImgCon - EXIF Data Viewer & Stripper (100% Private Client-Side Engine)
 * Pure Binary ArrayBuffer Parser + Clean Canvas Stripper
 */

(function () {
  // --- Inject Custom Component CSS ---
  const exifStyles = `
        .exif-container {
            max-width: 80rem;
            margin: 0 auto;
        }
        .exif-badge-danger {
            background-color: rgba(239, 68, 68, 0.15);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .exif-badge-success {
            background-color: rgba(16, 185, 129, 0.15);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .exif-card-section {
            background-color: var(--bg-subtle);
            border: 1px solid var(--card-border);
            border-radius: 1rem;
            padding: 1.25rem;
            transition: var(--transition-smooth);
        }
        .exif-data-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px dashed var(--card-border);
            font-size: 0.85rem;
        }
        .exif-data-row:last-child {
            border-bottom: none;
        }
        .exif-data-label {
            color: var(--text-light);
            font-weight: 600;
        }
        .exif-data-val {
            color: var(--text-dark);
            font-weight: 700;
            text-align: right;
            word-break: break-all;
        }
        .exif-strip-btn {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            box-shadow: 0 4px 15px -3px rgba(239, 68, 68, 0.4);
        }
        .exif-strip-btn:hover {
            transform: translate3d(0, -2px, 0);
            box-shadow: 0 8px 25px -5px rgba(239, 68, 68, 0.6);
        }
    `;

  const styleTag = document.createElement("style");
  styleTag.id = "exif-custom-styles";
  styleTag.innerHTML = exifStyles;
  document.head.appendChild(styleTag);

  // --- Binary EXIF Reader Logic ---
  class ExifParser {
    static parse(buffer) {
      const view = new DataView(buffer);
      if (view.getUint16(0, false) !== 0xffd8) return null; // Not JPEG

      let length = view.byteLength,
        offset = 2;

      while (offset < length) {
        if (view.getUint16(offset, false) === 0xffe1) {
          return ExifParser.readEXIFData(view, offset + 4);
        }
        offset += 2 + view.getUint16(offset + 2, false);
      }
      return null;
    }

    static readEXIFData(view, start) {
      if (
        view.getUint32(start, false) !== 0x45786966 ||
        view.getUint16(start + 4, false) !== 0x0000
      ) {
        return null; // Not valid Exif header
      }

      const tiffOffset = start + 6;
      const littleEndian = view.getUint16(tiffOffset, false) === 0x4949;
      const tags = {};

      const firstIFDOffset = view.getUint32(tiffOffset + 4, littleEndian);
      if (firstIFDOffset) {
        ExifParser.readTags(
          view,
          tiffOffset,
          tiffOffset + firstIFDOffset,
          littleEndian,
          tags
        );
      }

      return tags;
    }

    static readTags(view, tiffOffset, dirOffset, little, tags) {
      try {
        const entries = view.getUint16(dirOffset, little);
        for (let i = 0; i < entries; i++) {
          const entryOffset = dirOffset + 2 + i * 12;
          const tag = view.getUint16(entryOffset, little);
          const type = view.getUint16(entryOffset + 2, little);
          const count = view.getUint32(entryOffset + 4, little);
          const valueOffset = entryOffset + 8;

          const tagName = ExifParser.tagNames[tag];
          if (tagName) {
            const val = ExifParser.readTagValue(
              view,
              valueOffset,
              type,
              count,
              tiffOffset,
              little
            );
            tags[tagName] = val;
          }

          // Sub IFDs
          if (tag === 0x8769 || tag === 0x8825) {
            // Exif IFD or GPS IFD
            const subDirOffset = view.getUint32(valueOffset, little);
            ExifParser.readTags(
              view,
              tiffOffset,
              tiffOffset + subDirOffset,
              little,
              tags
            );
          }
        }
      } catch (e) {
        console.warn("EXIF Parsing warning:", e);
      }
    }

    static readTagValue(view, offset, type, count, tiffOffset, little) {
      if (type === 2) {
        // ASCII String
        let strOffset = count > 4 ? tiffOffset + view.getUint32(offset, little) : offset;
        let str = "";
        for (let n = 0; n < count - 1; n++) {
          str += String.fromCharCode(view.getUint8(strOffset + n));
        }
        return str.trim();
      }
      if (type === 3) return view.getUint16(offset, little); // Short
      if (type === 4) return view.getUint32(offset, little); // Long
      if (type === 5) { // Rational
        const realOffset = tiffOffset + view.getUint32(offset, little);
        const num = view.getUint32(realOffset, little);
        const den = view.getUint32(realOffset + 4, little);
        return den !== 0 ? (num / den).toFixed(2) : num;
      }
      if (type === 10) { // SRational Array / Values
        const realOffset = tiffOffset + view.getUint32(offset, little);
        const vals = [];
        for (let i = 0; i < count; i++) {
          const num = view.getInt32(realOffset + i * 8, little);
          const den = view.getInt32(realOffset + i * 8 + 4, little);
          vals.push(den !== 0 ? num / den : num);
        }
        return vals;
      }
      return null;
    }
  }

  ExifParser.tagNames = {
    0x010f: "Make",
    0x0110: "Model",
    0x0131: "Software",
    0x0132: "DateTime",
    0x829a: "ExposureTime",
    0x829d: "FNumber",
    0x8827: "ISO",
    0x920a: "FocalLength",
    0xa002: "ExifImageWidth",
    0xa003: "ExifImageHeight",
    0x0001: "GPSLatitudeRef",
    0x0002: "GPSLatitude",
    0x0003: "GPSLongitudeRef",
    0x0004: "GPSLongitude",
    0x0006: "GPSAltitude",
  };

  // --- UI Module Engine ---
  window.ExifModule = {
    currentFile: null,
    exifData: null,

    renderUI(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = `
                <div class="exif-container space-y-6 animate__animated animate__fadeIn">
                    <div class="text-center max-w-2xl mx-auto mb-8">
                        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3 border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                            <i class="fas fa-shield-alt"></i> 100% Private Metadata Inspector
                        </div>
                        <h2 class="text-3xl sm:text-4xl font-black tracking-tight mb-2" style="color: var(--text-dark);">EXIF Data Cleaner & Inspector</h2>
                        <p class="text-sm" style="color: var(--text-light);">View hidden camera settings, device details, and GPS location inside your photos. Remove them instantly with 1-click for privacy.</p>
                    </div>

                    <!-- Drop Zone -->
                    <div id="exifDropZone" class="drop-zone rounded-3xl p-8 sm:p-12 text-center cursor-pointer border-2 border-dashed transition-all duration-300 hover:shadow-lg" style="border-color: var(--card-border); background-color: var(--bg-subtle);">
                        <i class="fas fa-search-location text-6xl text-indigo-500 mb-4 animate-pulse"></i>
                        <p class="text-xl font-bold mb-2" style="color: var(--text-dark);">Select Photo to Inspect EXIF Data</p>
                        <p class="text-xs mb-4" style="color: var(--text-light);">Drag & drop or browse image from your device</p>
                        <button class="upload-button text-xs"><i class="fas fa-folder-open mr-1"></i> Choose Image</button>
                        <input type="file" id="exifFileInput" class="hidden" accept="image/jpeg, image/jpg, image/tiff">
                    </div>

                    <!-- Processed Data Container -->
                    <div id="exifResultArea" class="hidden grid md:grid-cols-12 gap-8 animate__animated animate__fadeInUp">
                        <!-- Left Column: Photo Preview & Stripper Action -->
                        <div class="md:col-span-5 space-y-4">
                            <div class="p-4 rounded-2xl border text-center relative overflow-hidden" style="background-color: var(--card-bg); border-color: var(--card-border);">
                                <img id="exifImagePreview" class="max-h-80 mx-auto object-contain rounded-xl shadow-md mb-4" src="" alt="Preview">
                                <div id="exifPrivacyStatus" class="p-3 rounded-xl mb-4 font-bold text-xs flex items-center justify-center gap-2"></div>
                                <button id="stripExifBtn" class="upload-button exif-strip-btn w-full justify-center py-3 text-sm font-bold">
                                    <i class="fas fa-user-shield mr-2"></i> Clean & Strip EXIF Data
                                </button>
                                <p class="text-xxs opacity-70 mt-2" style="color: var(--text-light);">Exports a sanitized copy with ZERO hidden device tracking data.</p>
                            </div>
                        </div>

                        <!-- Right Column: EXIF Details Report -->
                        <div class="md:col-span-7 space-y-4">
                            <!-- Camera & Device -->
                            <div class="exif-card-section">
                                <h3 class="font-extrabold text-sm uppercase tracking-wider mb-3 text-indigo-500 flex items-center gap-2">
                                    <i class="fas fa-camera text-lg"></i> Device & Camera Details
                                </h3>
                                <div class="space-y-1">
                                    <div class="exif-data-row"><span class="exif-data-label">Device Manufacturer</span><span class="exif-data-val" id="valMake">N/A</span></div>
                                    <div class="exif-data-row"><span class="exif-data-label">Camera Model</span><span class="exif-data-val" id="valModel">N/A</span></div>
                                    <div class="exif-data-row"><span class="exif-data-label">Software / Firmware</span><span class="exif-data-val" id="valSoftware">N/A</span></div>
                                    <div class="exif-data-row"><span class="exif-data-label">Original Date & Time</span><span class="exif-data-val" id="valDateTime">N/A</span></div>
                                </div>
                            </div>

                            <!-- Exposure & Lens -->
                            <div class="exif-card-section">
                                <h3 class="font-extrabold text-sm uppercase tracking-wider mb-3 text-indigo-500 flex items-center gap-2">
                                    <i class="fas fa-sliders-h text-lg"></i> Camera Shot Settings
                                </h3>
                                <div class="grid grid-cols-2 gap-2 text-center">
                                    <div class="p-2 rounded-lg border" style="background-color: var(--card-bg); border-color: var(--card-border);">
                                        <p class="text-xxs font-bold text-gray-400 uppercase">ISO</p>
                                        <p class="text-base font-black mt-0.5" style="color: var(--text-dark);" id="valISO">N/A</p>
                                    </div>
                                    <div class="p-2 rounded-lg border" style="background-color: var(--card-bg); border-color: var(--card-border);">
                                        <p class="text-xxs font-bold text-gray-400 uppercase">Aperture</p>
                                        <p class="text-base font-black mt-0.5" style="color: var(--text-dark);" id="valAperture">N/A</p>
                                    </div>
                                    <div class="p-2 rounded-lg border" style="background-color: var(--card-bg); border-color: var(--card-border);">
                                        <p class="text-xxs font-bold text-gray-400 uppercase">Shutter Speed</p>
                                        <p class="text-base font-black mt-0.5" style="color: var(--text-dark);" id="valShutter">N/A</p>
                                    </div>
                                    <div class="p-2 rounded-lg border" style="background-color: var(--card-bg); border-color: var(--card-border);">
                                        <p class="text-xxs font-bold text-gray-400 uppercase">Focal Length</p>
                                        <p class="text-base font-black mt-0.5" style="color: var(--text-dark);" id="valFocal">N/A</p>
                                    </div>
                                </div>
                            </div>

                            <!-- GPS Location -->
                            <div class="exif-card-section border-indigo-200 dark:border-indigo-900">
                                <h3 class="font-extrabold text-sm uppercase tracking-wider mb-3 text-red-500 flex items-center gap-2">
                                    <i class="fas fa-map-marker-alt text-lg"></i> GPS & Location Tracking
                                </h3>
                                <div class="space-y-1">
                                    <div class="exif-data-row"><span class="exif-data-label">Latitude</span><span class="exif-data-val" id="valLat">Not Detected</span></div>
                                    <div class="exif-data-row"><span class="exif-data-label">Longitude</span><span class="exif-data-val" id="valLng">Not Detected</span></div>
                                </div>
                                <div id="mapLinkContainer" class="mt-3 hidden">
                                    <a id="googleMapsLink" href="#" target="_blank" rel="noopener noreferrer" class="secondary-btn w-full flex items-center justify-center py-2 rounded-xl text-xs font-bold text-indigo-500 hover:underline">
                                        <i class="fas fa-external-link-alt mr-2"></i> View Exact Location on Google Maps
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      this.attachEvents();
    },

    attachEvents() {
      const dropZone = document.getElementById("exifDropZone");
      const fileInput = document.getElementById("exifFileInput");
      const stripBtn = document.getElementById("stripExifBtn");

      if (dropZone) {
        dropZone.addEventListener("click", () => fileInput.click());
        dropZone.addEventListener("dragover", (e) => e.preventDefault());
        dropZone.addEventListener("drop", (e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) this.handleFileSelect(e.dataTransfer.files[0]);
        });
      }

      fileInput?.addEventListener("change", (e) => {
        if (e.target.files.length > 0) this.handleFileSelect(e.target.files[0]);
      });

      stripBtn?.addEventListener("click", () => this.stripAndDownload());
    },

    async handleFileSelect(file) {
      if (!file.type.match("image/jpeg") && !file.type.match("image/tiff")) {
        alert("Please select a JPEG image to parse EXIF metadata.");
        return;
      }

      this.currentFile = file;
      const previewImg = document.getElementById("exifImagePreview");
      previewImg.src = URL.createObjectURL(file);

      document.getElementById("exifDropZone").classList.add("hidden");
      document.getElementById("exifResultArea").classList.remove("hidden");

      // Parse ArrayBuffer
      const buffer = await file.arrayBuffer();
      this.exifData = ExifParser.parse(buffer);
      this.displayReport(this.exifData);
    },

    displayReport(tags) {
      const statusBox = document.getElementById("exifPrivacyStatus");
      const mapContainer = document.getElementById("mapLinkContainer");

      if (!tags || Object.keys(tags).length === 0) {
        statusBox.className = "p-3 rounded-xl mb-4 font-bold text-xs flex items-center justify-center gap-2 exif-badge-success";
        statusBox.innerHTML = `<i class="fas fa-check-circle text-base"></i> Photo is Clean! No EXIF Metadata Found.`;

        document.getElementById("valMake").textContent = "Clean / None";
        document.getElementById("valModel").textContent = "Clean / None";
        document.getElementById("valSoftware").textContent = "Clean / None";
        document.getElementById("valDateTime").textContent = "Clean / None";
        document.getElementById("valISO").textContent = "N/A";
        document.getElementById("valAperture").textContent = "N/A";
        document.getElementById("valShutter").textContent = "N/A";
        document.getElementById("valFocal").textContent = "N/A";
        document.getElementById("valLat").textContent = "None";
        document.getElementById("valLng").textContent = "None";
        mapContainer.classList.add("hidden");
        return;
      }

      const hasGPS = tags.GPSLatitude && tags.GPSLongitude;

      if (hasGPS) {
        statusBox.className = "p-3 rounded-xl mb-4 font-bold text-xs flex items-center justify-center gap-2 exif-badge-danger animate__animated animate__pulse animate__infinite";
        statusBox.innerHTML = `<i class="fas fa-exclamation-triangle text-base"></i> Privacy Risk! GPS Location Data Detected!`;
      } else {
        statusBox.className = "p-3 rounded-xl mb-4 font-bold text-xs flex items-center justify-center gap-2 exif-badge-danger";
        statusBox.innerHTML = `<i class="fas fa-info-circle text-base"></i> Hidden Camera & Device Information Found.`;
      }

      document.getElementById("valMake").textContent = tags.Make || "Unknown";
      document.getElementById("valModel").textContent = tags.Model || "Unknown";
      document.getElementById("valSoftware").textContent = tags.Software || "Standard System";
      document.getElementById("valDateTime").textContent = tags.DateTime || "Not Stamped";

      document.getElementById("valISO").textContent = tags.ISO || "Auto";
      document.getElementById("valAperture").textContent = tags.FNumber ? `f/${tags.FNumber}` : "N/A";
      document.getElementById("valShutter").textContent = tags.ExposureTime ? `${tags.ExposureTime}s` : "N/A";
      document.getElementById("valFocal").textContent = tags.FocalLength ? `${tags.FocalLength}mm` : "N/A";

      if (hasGPS) {
        const lat = this.convertDMSToDD(tags.GPSLatitude, tags.GPSLatitudeRef);
        const lng = this.convertDMSToDD(tags.GPSLongitude, tags.GPSLongitudeRef);

        document.getElementById("valLat").textContent = `${lat.toFixed(5)}° (${tags.GPSLatitudeRef || "N"})`;
        document.getElementById("valLng").textContent = `${lng.toFixed(5)}° (${tags.GPSLongitudeRef || "E"})`;

        document.getElementById("googleMapsLink").href = `https://www.google.com/maps?q=${lat},${lng}`;
        mapContainer.classList.remove("hidden");
      } else {
        document.getElementById("valLat").textContent = "Not Stamped";
        document.getElementById("valLng").textContent = "Not Stamped";
        mapContainer.classList.add("hidden");
      }
    },

    convertDMSToDD(dms, ref) {
      if (!Array.isArray(dms)) return 0;
      let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
      if (ref === "S" || ref === "W") dd = dd * -1;
      return dd;
    },

    async stripAndDownload() {
      if (!this.currentFile) return;

      const img = new Image();
      img.src = URL.createObjectURL(this.currentFile);

      await new Promise((resolve) => (img.onload = resolve));

      // Draw onto Canvas (Renders pure pixel payload, completely stripping ALL EXIF markers)
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (cleanBlob) => {
          const downloadUrl = URL.createObjectURL(cleanBlob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = `sanitized_${this.currentFile.name}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          if (window.showToast) {
            window.showToast("EXIF metadata stripped successfully!");
          } else {
            alert("Cleaned photo downloaded successfully!");
          }
        },
        "image/jpeg",
        0.95
      );
    },
  };
})();
