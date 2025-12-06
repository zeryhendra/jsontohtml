/**
 * html2json 
 *
 * https://stackoverflow.com/questions/12980648/map-html-to-json
 * 
 */
const html2json = (e) => {
	const TextElem = (e) => ({
		type: 'TextElem',
		textContent: e.textContent
	});

	const Elem = (e) => ({
		type: 'Elem',
		tagName: e.tagName,
		attributes: Array.from(e.attributes, ({ name, value }) => [name, value]),
		children: Array.from(e.childNodes, fromNode)
	});

	const fromNode = (e) => {
		switch (e?.nodeType) {
		case 1: return Elem(e);
		case 3: return TextElem(e);
		default: throw Error(`unsupported nodeType: ${e.nodeType}`);
		}
	};

	return JSON.stringify(Elem(e), null, '  ');
};

/**
 * Convert structured JSON (custom DOM representation) into real DOM nodes.
 *
 * @param {Object} jsonItem
 *     Objek JSON yang mewakili element atau text node.
 *
 * @param {Object} [options={}]
 * @param {string[]} [options.removeTags=[]]
 *     Daftar nama tag (lowercase) yang harus dihapus. Contoh: ['script', 'style'].
 *
 * @param {string[]} [options.removeClasses=[]]
 *     Daftar nama class yang harus dihapus. Jika suatu element memiliki class ini,
 *     seluruh tag akan dihapus dan hanya children-nya yang dipakai.
 *
 * @param {string} [options.basePath='']
 *     Base path yang akan ditambahkan sebelum nama file, misalnya '/assets/'.
 *     Tidak mengubah nama file, hanya prepend path.
 *
 * @param {string[]} [options.applyBasePathTo=[]]
 *     Daftar target spesifik untuk penambahan base path.
 *     Format: "tag:attribute"
 *     Contoh: ['img:src', 'a:href'].
 *
 * @param {boolean} [options.applyBasePathToAll=false]
 *     Jika true → semua atribut yang berupa path (kecuali http/https/berawalan '/')
 *     akan otomatis ditambahkan base path.
 *
 * @param {string|null} [options.fallbackMissingFile=null]
 *     Path fallback jika file tidak ditemukan. Contoh: '/uploads/404.png'.
 *
 * @param {Function|null} [options.checkFileExists=null]
 *     Function optional untuk memeriksa apakah file benar-benar ada.
 *     format: (path) => boolean atau Promise<boolean>.
 *
 * @param {boolean} [options.ignoreHttp=true]
 *     Jika true abaikan http/https (SELALU override basePath)
 * 
 * @param {boolean} [options.forceBasePath=false]
 *     paksa semua src/href gunakan basePath
 * 
 * @returns {DocumentFragment|Node}
 *     Mengembalikan DOM Node hasil konversi.
 * 
 * example:
 * 
 * const jsonArtikel = data;
 *
 * let isiJson;
 * try {
 *   isiJson = JSON.parse(JSON.parse(jsonArtikel.isi));
 * } catch (e) {
 *   console.error("Gagal parse JSON isi:", e);
 *   return;
 * }
 * const isiHTML = jsontohtml(isiJson, {
 *   basePath: '/assets/',
 *   applyBasePathTo: ['img:src'],
 *   applyBasePathToAll: false,
 *
 *   fallbackMissingFile: '/assets/notfound.png',
 *   checkFileExists: path => true   // atau async
 * });
 * 
 */
function jsontohtml(jsonItem, options = {}) {
    const {
        removeTags = [],
        removeClasses = [],
        basePath = '',
        applyBasePathTo = [],          
        applyBasePathToAll = false,
        fallbackMissingFile = null,
        checkFileExists = null,
        ignoreHttp = true,            
        forceBasePath = false          
    } = options;

    if (!jsonItem || typeof jsonItem !== 'object' || !jsonItem.type) {
        return document.createDocumentFragment();
    }

    // TEXT NODE
    if (jsonItem.type === 'TextElem') {
        return document.createTextNode(jsonItem.textContent || '');
    }

    // ELEMENT NODE
    if (jsonItem.type === 'Elem') {
        const tag = jsonItem.tagName.toLowerCase();
        const classAttr = jsonItem.attributes?.find(attr => attr[0] === 'class');
        const classes = classAttr ? classAttr[1].split(/\s+/) : [];

        const shouldRemoveTag = removeTags.includes(tag);
        const shouldRemoveClass = classes.some(cls => removeClasses.includes(cls));

        const fragment = document.createDocumentFragment();

        (jsonItem.children || []).filter(Boolean).forEach(child => {
            fragment.appendChild(jsontohtml(child, options));
        });

        if (shouldRemoveTag || shouldRemoveClass) {
            return fragment;
        }

        const el = document.createElement(jsonItem.tagName);

        if (Array.isArray(jsonItem.attributes)) {
            for (let [name, value] of jsonItem.attributes) {

                const attrKey = `${tag}:${name}`;
                const targeted = applyBasePathTo.includes(attrKey);

                let finalValue = value;

                const isURL = /^(https?:\/\/|ftp:\/\/|file:\/\/|blob:|data:)/i.test(value);

                const shouldApply =
                    basePath &&
                    (applyBasePathToAll || targeted || forceBasePath);

                if (shouldApply) {
                    if (forceBasePath) {
                        // Ambil nama file saja
                        const fileName = value.split('/').pop();
                        finalValue = basePath.replace(/\/+$/, '') + '/' + fileName;
                    }
                    else if (!isURL || ignoreHttp) {
                        const fileName = value.split('/').pop();
                        finalValue = basePath.replace(/\/+$/, '') + '/' + fileName;
                    }
                }

                // fallback jika file tidak ada
                if (checkFileExists && fallbackMissingFile) {
                    try {
                        if (!checkFileExists(finalValue)) {
                            finalValue = fallbackMissingFile;
                        }
                    } catch (e) {}
                }

                el.setAttribute(name, finalValue);
            }
        }

        el.appendChild(fragment);
        return el;
    }

    throw new Error(`Unsupported JSON type: ${jsonItem?.type}`);
}

/**
 * Menggabungkan seluruh <p> di dalam container menjadi satu <p> pertama,
 * dengan batas karakter, jumlah kalimat, atau jumlah kata.
 *
 * @param {HTMLElement} container 
 *   Elemen container yang berisi beberapa elemen <p>.
 *
 * @param {Object} [options={}]
 *   Opsi pengaturan pemotongan isi.
 *
 * @param {number|null} [options.maxChars=null]
 *   Batas maksimum jumlah karakter yang boleh digabungkan.
 *   Jika limit tercapai, sisa teks dipotong dan diakhiri "...".
 *
 * @param {number|null} [options.maxSentences=null]
 *   Batas maksimum jumlah kalimat. Kalimat dihitung berdasarkan
 *   tanda akhir seperti . ! atau ?. Jika batas tercapai, sisa
 *   teks digantikan dengan potongan + "...".
 *
 * @param {number|null} [options.maxWords=null]
 *   Batas maksimum jumlah kata yang boleh digabung. Kata dihitung
 *   menggunakan pemisah whitespace. Jika menyentuh limit, sisanya
 *   ditambahkan sebagai potongan + "...".
 *
 * @returns {void}
 *   Tidak mengembalikan nilai. Fungsi ini memodifikasi DOM secara langsung.
 */
function gabungkanPTag(container, options = {}) {
    const { maxChars = null, maxSentences = null, maxWords = null } = options;
    const paragraphs = container.querySelectorAll('p');
  
    if (paragraphs.length < 2) return;
  
    const firstP = paragraphs[0];
    let textCollected = '';
  
    let sentenceCount = 0;
    let wordCount = 0;
  
    for (let i = 1; i < paragraphs.length; i++) {
      const p = paragraphs[i];
  
      // Temp container untuk ambil content
      const tempContainer = document.createElement('div');
      while (p.firstChild) {
        tempContainer.appendChild(p.firstChild);
      }
  
      const rawText = tempContainer.textContent;
  
      // ====== Batas karakter ======
      if (maxChars && (textCollected.length + rawText.length) > maxChars) {
        const sisa = maxChars - textCollected.length;
        const potong = rawText.slice(0, sisa);
  
        const span = document.createElement('span');
        span.textContent = potong + '...';
        firstP.appendChild(span);
        break;
      }
  
      // ====== Batas kalimat ======
      const sentenceMatches = rawText.match(/[^.!?]+[.!?]+/g) || [rawText];
      if (maxSentences && (sentenceCount + sentenceMatches.length) > maxSentences) {
        const sisaKalimat = maxSentences - sentenceCount;
        const kalimatTerpakai = sentenceMatches.slice(0, sisaKalimat).join('').trim();
  
        const span = document.createElement('span');
        span.textContent = kalimatTerpakai + '...';
        firstP.appendChild(span);
        break;
      }
  
      // ====== Batas kata ======
      const wordMatches = rawText.trim().split(/\s+/);
      if (maxWords && (wordCount + wordMatches.length) > maxWords) {
        const sisaKata = maxWords - wordCount;
        const kataTerpakai = wordMatches.slice(0, sisaKata).join(' ');
  
        const span = document.createElement('span');
        span.textContent = kataTerpakai + '...';
        firstP.appendChild(span);
        break;
      }
  
      // Jika semua masih dalam batas
      textCollected += rawText;
      sentenceCount += sentenceMatches.length;
      wordCount += wordMatches.length;
  
      while (tempContainer.firstChild) {
        firstP.appendChild(tempContainer.firstChild);
      }
  
      p.remove(); // hapus p setelah dipindahkan
    }
}

/**
 * Menggabungkan semua <p> di dalam container menjadi satu <p> pertama,
 * dengan batasan opsional seperti jumlah karakter, kalimat, atau kata.
 *
 * @param {HTMLElement} container 
 *        Elemen container yang berisi banyak <p>.
 *
 * @param {Object} [options]
 * @param {number|null} [options.maxChars=null]
 *        Maksimal jumlah karakter yang boleh digabung.
 *
 * @param {number|null} [options.maxSentences=null]
 *        Maksimal jumlah kalimat yang boleh digabung.
 *
 * @param {number|null} [options.maxWords=null]
 *        Maksimal jumlah kata yang boleh digabung.
 *
 * @returns {void}
 *        Tidak mengembalikan nilai, langsung memodifikasi DOM.
 */
function splitContentToPages(container, maxWords) {
  const paragraphs = Array.from(container.querySelectorAll('p'));
  const pages = [];

  let currentPageParagraphs = [];
  let currentWordCount = 0;

  paragraphs.forEach(p => {
    const wordCountInP = p.textContent.trim().split(/\s+/).length;

    if (currentWordCount + wordCountInP <= maxWords) {
      currentPageParagraphs.push(p.cloneNode(true));
      currentWordCount += wordCountInP;
    } else {
      // Buat container baru untuk halaman
      const pageContainer = document.createElement('div');

      // Tambahkan paragraf yang sudah terkumpul
      currentPageParagraphs.forEach(par => pageContainer.appendChild(par));

      // Gabungkan paragraf dalam container itu supaya rapi
      gabungkanPTag(pageContainer, { maxWords });

      pages.push(pageContainer);

      // Reset untuk halaman berikutnya
      currentPageParagraphs = [p.cloneNode(true)];
      currentWordCount = wordCountInP;
    }
  });

  // Halaman terakhir
  if (currentPageParagraphs.length > 0) {
    const pageContainer = document.createElement('div');
    currentPageParagraphs.forEach(par => pageContainer.appendChild(par));
    gabungkanPTag(pageContainer, { maxWords });
    pages.push(pageContainer);
  }

  return pages;
}

/**
 * Mengekstrak informasi <img> dari hasil konversi JSON-HTML.
 *
 * @param {Object} jsonItem
 *   Objek JSON hasil export editor yang berisi struktur elemen HTML.
 *
 * @param {Object} [options={}]
 *   Opsi konfigurasi ekstraksi.
 *
 * @param {string} [options.basePath=null]
 *   Base path yang akan dipakai untuk output `filename`.
 *   Jika diisi → hasil `filename` selalu menjadi: basePath + "/" + filename
 *   Contoh: "/uploads" + "/foto.png" → "/uploads/foto.png".
 *
 * @param {string|null} [options.fallback=null]
 *   File fallback jika tidak ditemukan tag <img> sama sekali.
 *   Hanya berlaku bila hasil ekstraksi kosong.
 *
 * @param {'filename' | 'url' | 'img' | 'all'} [options.output='filename']
 *   Mode output:
 *     - `filename` → hanya nama file (atau basePath + filename)
 *     - `url`      → URL utuh dari atribut src
 *     - `img`      → tag <img> utuh
 *     - `all`      → objek lengkap { filename, url, decoded, img }
 *
 * @returns {Array<string|Object>}
 *   Hasil ekstraksi sesuai mode output.
 *   Jika tidak ada gambar dan fallback tersedia → array berisi fallback.
 *
 * @example
 * extractImagesFromJSON_HTML(json, {
 *   basePath: '/uploads/',
 *   fallback: '/uploads/notfound.png',
 *   output: 'filename'
 * });
 */
function extractImagesFromJSON_HTML(jsonItem, options = {}) {
    const temp = document.createElement('div');
    temp.appendChild(jsontohtml(jsonItem));
    const html = temp.innerHTML;

    const regex = /<img[^>]+src=["']([^"']+)["']/gi;

    const results = [];
    const basePath = options.basePath || null;   // basePath hanya dipakai kalau ada
    const fallback = options.fallback || null;
    const output = options.output || 'filename';

    let match;
    while ((match = regex.exec(html)) !== null) {
        const src = match[1];
        const decoded = decodeURIComponent(src);
        const filename = decoded.split('/').pop();

        switch (output) {
            case 'filename':
                // Jika basePath ada → prepend
                results.push(
                    basePath ? basePath.replace(/\/$/, '') + '/' + filename : filename
                );
                break;

            case 'url':
                results.push(src);
                break;

            case 'img':
                results.push(match[0]);
                break;

            case 'all':
                results.push({
                    filename,
                    url: src,
                    decoded,
                    img: match[0]
                });
                break;
        }
    }

    // ============================
    // Fallback
    // ============================
    if (results.length === 0 && fallback) {
        if (output === 'filename') {
            const fileOnly = fallback.split('/').pop();

            // basePath hanya dipakai kalau *diisi*
            return [
                basePath
                    ? basePath.replace(/\/$/, '') + '/' + fileOnly
                    : fileOnly
            ];
        }

        if (output === 'url') {
            return [fallback];
        }

        if (output === 'img') {
            return [`<img src="${fallback}">`];
        }

        if (output === 'all') {
            const filename = fallback.split('/').pop();
            return [{
                filename,
                url: fallback,
                decoded: fallback,
                img: `<img src="${fallback}">`
            }];
        }
    }

    return results;
}


