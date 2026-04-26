// Wrap the entire script in an IIFE to encapsulate variables and functions
(function() {    
    const item_editors = document.getElementById("item-editors");
    const A4 = document.getElementById("A4");

    // const options = {
    //     margin: 1,
    //     filename: 'cards.pdf',
    //     // image: { type: 'jpeg', quality: 1.00 },
    //     image: { type: 'png' },
    //     html2canvas: { scale: 5},
    //     jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    // }

    // let file = html2pdf().set(options);

    const converter = new showdown.Converter();
    const FONT_SHRINK_FACTOR = 0.97; // Adjust this multiplier as needed

    const translation = {
	english: {
		print: "Print",
		toggle_preview: "Toggle preview",
		item: "Item",
		item_name: "Name of the item",
		short_description_requirement: "Short description",
		image_requirement: "Image",
		type_requirement: "Type",
		type: "Type",
		item_type: "Type of the item",
		rarity: "Rarity",
		common: "Common",
		uncommon: "Uncommon",
		rare: "Rare",
		epic: "Epic",
		legendary: "Legendary",
		artifact: "Artifact",
		item_details: "Details of the item",
		item_charges: "Item charges:",
		none: "None",
		clear_all_confirm: "Are you sure you want to clear all cards?",
	},
	russian: {
		print: "Печать",
		toggle_preview: "Переключить<br>предпросмотр",
		item: "Предмет",
		item_name: "Имя предмета",
		short_description_requirement: "Короткое описание",
		image_requirement: "Изображение",
		type_requirement: "Тип",
		type: "Тип",
		item_type: "Тип предмета",
		rarity: "Редкость",
		common: "Обычный",
		uncommon: "Необычный",
		rare: "Редкий",
		epic: "Эпический",
		legendary: "Легендарный",
		artifact: "Артефакт",
		item_details: "Подробное описание",
		item_charges: "Заряды предмета:",
		none: "Нет",
		clear_all_confirm: "Вы уверены, что хотите очистить все карты?",
	},
	french: {
		print: "Imprimer",
		toggle_preview: "Basculer<br>l'aperçu",
		item: "Objet",
		item_name: "Nom de l'objet",
		short_description_requirement: "Description courte",
		image_requirement: "Image",
		type_requirement: "Type",
		type: "Type",
		item_type: "Type de l'objet",
		rarity: "Rareté",
		common: "Commun",
		uncommon: "Peu commun",
		rare: "Rare",
		epic: "Épique",
		legendary: "Légendaire",
		artifact: "Artéfact",
		item_details: "Détails de l'objet",
		item_charges: "Charges :",
		none: "Aucune",
		clear_all_confirm: "Êtes-vous sûr de vouloir effacer toutes les cartes ?",
	},
};

    const NUM_ITEMS = 9; // Define a constant for the number of items

    let languageSelect = document.getElementById(`language-select`);
    let currentLanguage = languageSelect.options[languageSelect.selectedIndex].value;

    // Utility function for debouncing (moved up for clarity)
    const debounce = (func, delay) => {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    const DEBOUNCE_DELAY = 150; // Milliseconds for debouncing textFit calls
    const debouncedFitText = debounce(fit_text, DEBOUNCE_DELAY);
	const debouncedSaveState = debounce(saveStateToLocalStorage, DEBOUNCE_DELAY);

    // Helper to get item number from element ID
    function get_item_number(element) {
        let id = element.id;
        let parts = id.split("-");
        let lastPart = parts[parts.length - 1];
        return !isNaN(lastPart) ? parseInt(lastPart, 10) : null;
    }

    // Function to apply text fitting
    function fit_text() {
        const elements = document.getElementsByClassName('card-details');
        textFit(elements,
        {
            // Font sizes are now in mm. 4mm is roughly 15-16px.
            minFontSize: 1, // 1mm minimum font size
            maxFontSize: 3, // 4mm maximum font size
            multiLine: true,
            precise: true,
            applyToSelf: true,
            unit: 'mm' // Specify the unit
        });

        // let to_print = document.getElementById('A4').cloneNode(true)
        // file = file.from(to_print)
    }

    // Re-run textFit before printing to use the correct print layout metrics
    window.addEventListener('beforeprint', () => {
        updateEmptyCards();
        fit_text();
        elements = document.getElementsByClassName('card-details')
        for (const element of elements) {
            const currentSize = parseFloat(element.style.fontSize);
            const unit = String(element.style.fontSize).replace(/[\d.-]/g, '');
            if (!isNaN(currentSize) && unit) {
                element.style.fontSize = (currentSize * FONT_SHRINK_FACTOR) + unit;
            }
        }
    });

    // Re-run textFit after printing to restore the screen layout if needed
    window.addEventListener('afterprint', () => {
        fit_text();
    });

    // Function to update all language-dependent text
    function updateAllText() {
        document.querySelectorAll(".item-name").forEach((element) => {
            element.innerHTML = translation[currentLanguage]["item"];
        });
        document
            .querySelectorAll(".item-name-editor > input")
            .forEach((element) => {
                element.placeholder = translation[currentLanguage]["item_name"];
            });
        document.querySelectorAll(".card-name").forEach((element) => {
            // Only update if it's the default placeholder, otherwise keep user input
            const itemNum = get_item_number(element);
            const itemNameInput = document.getElementById(`item-name-${itemNum}`);
            if (itemNameInput.value === "") {
                element.innerHTML = translation[currentLanguage]["item_name"];
            }
        });
        document
            .querySelectorAll(".item-short-description-editor > label > span")
            .forEach((element) => {
                element.innerHTML =
                    translation[currentLanguage]["short_description_requirement"];
            });
        document
            .querySelectorAll(".item-image-editor > label > span")
            .forEach((element) => {
                element.innerHTML = translation[currentLanguage]["image_requirement"];
            });
        document
            .querySelectorAll(".item-type-editor > label > span")
            .forEach((element) => {
                element.innerHTML = translation[currentLanguage]["type_requirement"];
            });
        document
            .querySelectorAll(".item-type-editor > div > input")
            .forEach((element) => {
                element.placeholder = translation[currentLanguage]["item_type"];
            });
        document.querySelectorAll(".item-type-header").forEach((element) => {
            element.innerHTML = translation[currentLanguage]["type"];
        });
        document.querySelectorAll(".item-type").forEach((element) => {
            // Only update if it's the default placeholder, otherwise keep user input
            const itemNum = get_item_number(element);
            const itemTypeInput = document.getElementById(`item-type-value-${itemNum}`);
            if (itemTypeInput.value === "") {
                element.innerHTML = translation[currentLanguage]["item_type"];
            }
        });
        document.querySelectorAll(".item-details-editor").forEach((element) => {
            element.placeholder = translation[currentLanguage]["item_details"];
        });

        document
            .querySelectorAll(".charges-editor > label > span")
            .forEach((element) => {
                element.innerHTML = translation[currentLanguage]["item_charges"];
            });
        document
            .querySelectorAll(".charges-editor > label > div > input[type='range']")
            .forEach((element) => {
                // Re-call change_charges to update the display value based on new language
                change_charges(element);
            });
        document.querySelectorAll(".item-rarity-editor > label > span").forEach(element => {
            element.innerHTML = translation[currentLanguage]["rarity"];
        });
        document.querySelectorAll(".item-rarity-editor select").forEach(select => {
            // Loop through rarities to update option text
            const rarities = ["common", "uncommon", "rare", "epic", "legendary", "artifact"];
            rarities.forEach(rarity => {
                const option = select.querySelector(`option[value="${rarity}"]`);
                if (option) {
                    option.innerHTML = translation[currentLanguage][rarity];
                }
            });
        });
    }

    // Initial HTML generation: Build strings first, then set innerHTML once
    const itemEditorHtmls = [];
    const A4Htmls = [];

    for (let i = 1; i <= NUM_ITEMS; i++) {
        itemEditorHtmls.push(`
        <details class="item-editor" id="item-editor-${i}" open>
            <summary>
                <div class="item-name-editor">
                    <span style="display:none" class="item-name">${translation[currentLanguage]["item"]}</span>
                    <span style="display:none">${i}:</span>
                    <input id="item-name-${i}" type="text" placeholder="${translation[currentLanguage]["item_name"]}">
                </div>
            </summary>
            <div class="properties">
			
				<div class="item-rarity-editor item-property">
                    <label>
                        <span>${translation[currentLanguage]["rarity"]}</span>
                        <select id="item-rarity-${i}">
                            <option value="common">${translation[currentLanguage]["common"]}</option>
                            <option value="uncommon">${translation[currentLanguage]["uncommon"]}</option>
                            <option value="rare">${translation[currentLanguage]["rare"]}</option>
                            <option value="epic">${translation[currentLanguage]["epic"]}</option>
                            <option value="legendary">${translation[currentLanguage]["legendary"]}</option>
                            <option value="artifact">${translation[currentLanguage]["artifact"]}</option>
                        </select>
                    </label>
                </div>

                <div class="item-short-description-editor">
                    <label>
                        <input id="item-short-description-${i}" class="item-short-description" type="checkbox" checked>
                        <span>${translation[currentLanguage]["short_description_requirement"]}</span>
                    </label>
                </div>

                <div class="item-image-editor item-property">
                    <label>
                        <input id="item-image-requirement-${i}" class="item-image-requirement" type="checkbox" checked>
                        <span>${translation[currentLanguage]["image_requirement"]}</span>
                    </label>
                    <div class="item-image-value-container">
                        <input id="item-image-value-${i}" class="item-image-value" type="file" accept="image/*">
                    </div>
                </div>

                <div class="item-type-editor item-property">
                    <label>
                        <input id="item-type-requirement-${i}" class="item-type-requirement" type="checkbox" checked>
                        <span>${translation[currentLanguage]["type_requirement"]}</span>
                    </label>
                    <div class="item-type-value-container">
                        <input id="item-type-value-${i}" class="item-type-value" type="text" placeholder="${translation[currentLanguage]["item_type"]}">
                    </div>
                </div>

                <div class="details-editor-container">
                    <textarea id="item-details-${i}" class="item-details-editor" placeholder="${translation[currentLanguage]["item_details"]}"></textarea>
                </div>

                <div class="charges-editor">
                    <label>
                        <span>${translation[currentLanguage]["item_charges"]}</span>
                        <div class="slider-and-value">
                            <input type="range" id="item-charges-${i}" min="0" max="12" value="0"/>
                            <span id="item-charges-value-${i}">${translation[currentLanguage]["none"]}</span>
                        </div>
                    </label>
                </div>
            </div>
        </details>
        `);
        A4Htmls.push(`
        <div id="card-${i}" class="card-container">
            <div class="card-outline">
                <div id="card-name-${i}" class="card-name">
                    ${translation[currentLanguage]["item_name"]}
                </div>
                <div id="card-short-description-${i}" class="card-short-description">
                    <div id="card-image-value-${i}" class="image">
                    </div>
                    <div class="characteristics">
                        <div id="card-type-${i}" class="card-type">
                            <div id="card-type-header-${i}" class="item-type-header">
                                ${translation[currentLanguage]["type"]}
                            </div>
                            <div id="card-type-value-${i}" class="item-type">
                                ${translation[currentLanguage]["item_type"]}
                            </div>
                        </div>
                    </div>
                </div>
                <hr>
                <div id="card-details-${i}" class="card-details">
                </div>
            </div>

            <div id="card-charges-container-${i}" class="charges-container">
                <div id="card-charges-${i}" class="charges-circles">
                </div>
            </div>

        </div>
    	`);
    }

    item_editors.innerHTML = itemEditorHtmls.join('');
    item_editors.addEventListener('input', debouncedSaveState);
    item_editors.addEventListener('change', debouncedSaveState);

    A4.innerHTML = `
        <div class="print-page front-page" id="front-page">
            ${A4Htmls.join('')}
        </div>
    `;

    languageSelect.addEventListener('change', (event) => {
        currentLanguage = event.target.options[event.target.selectedIndex].value;
        updateAllText();
        fit_text();
        debouncedSaveState(); // Save state on language change
    });

	const loadInput = document.getElementById('load-input');
    if (loadInput) {
        loadInput.addEventListener('change', handleFileLoad);
    }

	const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.addEventListener('click', saveData);
    }

    const clearButton = document.getElementById('clear-button');
    if (clearButton) {
        clearButton.addEventListener('click', clearAllCards);
    }

	document.getElementById(`toggle-preview-button`).addEventListener('click', toggle_preview);
	function toggle_preview() {
        const main_section = document.getElementById(`main-section`);
        main_section.classList.toggle("no-preview");
    }

	const printButton = document.getElementById('print-button');
    if (printButton) {
        printButton.addEventListener('click', () => window.print());
        // printButton.addEventListener('click', () => file.save());

        // printButton.addEventListener('click', printHTML);

        // printButton.addEventListener('click', () => {
        //     console.log("Print")
        //     const doc = new jspdf.jsPDF({
        //         unit: 'mm',
        //         format: 'a4',
        //         orientation: 'portrait'
        //     });

        //     doc.html(A4, {
        //         callback: function (doc) {
        //             doc.save();
        //         },
        //         // x, y control the top-left corner of the image on the PDF
        //         x: 0,
        //         y: 0,
        //         // width and windowWidth control the scaling.
        //         // width is the width of the image on the PDF page (in jsPDF units, i.e., mm).
        //         // windowWidth is the width of the virtual browser window html2canvas uses to render the element.
        //         width: 210, // A4 width in mm
        //         // windowWidth: A4.scrollWidth, // Use the element's full width in pixels
        //         windowWidth: 210,
        //         html2canvas: {
        //             scale: 1/3, // Higher scale means better resolution
        //             width: 210,
        //             height: 297,
        //             useCORS: true,
        //         }
        //     });
        // })
    }

    // async function printHTML() {

    //     // let worker = await html2pdf().from(element).toPdf().output('blob').then((data) => {
    //     let worker = await file.toPdf().output('blob').then((data) => {
    //         console.log(data)
    //         let fileURL = URL.createObjectURL(data);
    //         window.open(fileURL);
    //     })
    // }

    // Attach event listeners to dynamically created elements
    for (let i = 1; i <= NUM_ITEMS; i++) {
        const itemEditorSummary = document.querySelector(`#item-editor-${i} > summary`);
        const itemNameInput = document.getElementById(`item-name-${i}`);
        const shortDescCheckbox = document.getElementById(`item-short-description-${i}`);
        const imageRequirementCheckbox = document.getElementById(`item-image-requirement-${i}`);
        const imageValueInput = document.getElementById(`item-image-value-${i}`);
        const typeRequirementCheckbox = document.getElementById(`item-type-requirement-${i}`);
        const typeValueInput = document.getElementById(`item-type-value-${i}`);
        const raritySelect = document.getElementById(`item-rarity-${i}`);
        const detailsTextarea = document.getElementById(`item-details-${i}`);
        const chargesRangeInput = document.getElementById(`item-charges-${i}`);

        itemEditorSummary.addEventListener('keyup', prevent_toggling);
        itemNameInput.addEventListener('keyup', (event) => change_name(event.target));
        shortDescCheckbox.addEventListener('change', (event) => toggle_short_description(event.target));
        imageRequirementCheckbox.addEventListener('change', (event) => toggle_image(event.target));
        imageValueInput.addEventListener('change', (event) => change_image(event.target));
        typeRequirementCheckbox.addEventListener('change', (event) => toggle_type(event.target));
        typeValueInput.addEventListener('keyup', (event) => change_type(event.target));
        raritySelect.addEventListener('change', (event) => change_rarity(event.target));
        detailsTextarea.addEventListener('keyup', (event) => change_details(event.target));
        chargesRangeInput.addEventListener('input', (event) => change_charges(event.target));
    }

    function prevent_toggling(event) {
        if (event.keyCode === 32) {
            event.preventDefault();
        }
    }

    function change_name(element) { // Renamed Element to element for consistency
        const item_number = get_item_number(element); // Use const
        const card_name = document.getElementById(`card-name-${item_number}`); // Use const

        if (element.value === "") { // Use strict equality
            card_name.innerHTML = translation[currentLanguage]["item_name"];
        } else {
            card_name.innerHTML = "&#8203;" + element.value;
        }
        fit_text();
    }

	function change_rarity(element) {
        const item_number = get_item_number(element);
        const card_container = document.getElementById(`card-${item_number}`);
        const selectedRarity = element.value;

        const rarityClasses = ['rarity-common', 'rarity-uncommon', 'rarity-rare', 'rarity-epic', 'rarity-legendary', 'rarity-artifact'];

        card_container.classList.remove(...rarityClasses);

        if (selectedRarity && selectedRarity !== 'common') {
            card_container.classList.add(`rarity-${selectedRarity}`);
        }
    }

    function toggle_short_description(element) {
        const item_number = get_item_number(element);
        const card_short_description = document.getElementById(
            `card-short-description-${item_number}`
        );
        if (element.checked) {
            card_short_description.style.display = "grid";
        } else {
            card_short_description.style.display = "none";
        }
        fit_text();
    }

	function toggle_image(element) {
        const item_number = get_item_number(element);
        const card_short_description = document.getElementById(
            `card-short-description-${item_number}`
        );
        if (element.checked) {
            card_short_description.classList.remove("no-image");
        } else {
            card_short_description.classList.add("no-image");
        }
        fit_text();
    }

	function applyImageToCard(item_number, dataUrl) {
        const card_image_value = document.getElementById(`card-image-value-${item_number}`);
        if (dataUrl && dataUrl !== 'none' && dataUrl !== '') {
            card_image_value.style.backgroundImage = dataUrl;
            card_image_value.style.backgroundColor = "white";
        } else {
            card_image_value.style.backgroundImage = '';
            card_image_value.style.backgroundColor = 'gainsboro';
        }
    }

    function change_image(element) {
        const item_number = get_item_number(element);
        // const card_image_value = document.getElementById(
        //     `card-image-value-${item_number}`
        // );
        const file = element.files[0]; // Use const
        const reader = new FileReader(); // Use const
        reader.onloadend = () => {
			applyImageToCard(item_number, `url(${reader.result})`);
        };
        if (file) {
            reader.readAsDataURL(file);
        }
        fit_text();
    }

    function toggle_type(element) {
        const item_number = get_item_number(element);
        const card_type = document.getElementById(`card-type-${item_number}`);
        // card_short_description was not defined in original, but used. Added const.
        const card_short_description = document.getElementById(
            `card-short-description-${item_number}`
        );
        if (element.checked) {
            card_type.style.visibility = "visible";
            card_short_description.classList.remove("no-type");
        } else {
            card_type.style.visibility = "hidden";
            card_short_description.classList.add("no-type");
        }
		fit_text();
    }

    function change_type(element) {
        const item_number = get_item_number(element);
        const card_type_value = document.getElementById(`card-type-value-${item_number}`);

        if (element.value === "") {
            card_type_value.innerHTML = translation[currentLanguage]["item_type"];
        } else {
            card_type_value.innerHTML = "&#8203;" + element.value;
        }
        fit_text();
    }

	function change_details(element) {
        const item_number = get_item_number(element);
        const card_details = document.getElementById(`card-details-${item_number}`);

        const details_editor_value = element.value; // Use const
        const markdown_to_html = converter.makeHtml(details_editor_value); // Use const
        card_details.innerHTML = markdown_to_html;
        fit_text();
    }

    function change_charges(element) {
        const item_number = get_item_number(element);
        const item_charges_display = document.getElementById(
            `item-charges-value-${item_number}`
        );
        const card_charges_container = document.getElementById(
            `card-charges-container-${item_number}`
        );
        const card_charges = document.getElementById(`card-charges-${item_number}`);

        if (element.value === "0") {
            card_charges_container.style.display = "none";
            item_charges_display.innerHTML = translation[currentLanguage]["none"];
        } else {
            card_charges_container.style.display = "flex";
            let circles = ``;
            for (let i = 1; i <= parseInt(element.value); i++) {
                circles += `<div class="charge-circle"></div>`;
            }
            card_charges.innerHTML = circles;
            item_charges_display.innerHTML = element.value;
        }
        fit_text();
    }

    // --- Save/Load Functions ---

    function getAllCardsData() {
        const allCardsData = [];
        for (let i = 1; i <= NUM_ITEMS; i++) {
            const cardData = {
                name: document.getElementById(`item-name-${i}`).value,
                rarity: document.getElementById(`item-rarity-${i}`).value,
                shortDescription: document.getElementById(`item-short-description-${i}`).checked,
                imageRequired: document.getElementById(`item-image-requirement-${i}`).checked,
                imageDataUrl: document.getElementById(`card-image-value-${i}`).style.backgroundImage,
                typeRequired: document.getElementById(`item-type-requirement-${i}`).checked,
                typeValue: document.getElementById(`item-type-value-${i}`).value,
                details: document.getElementById(`item-details-${i}`).value,
                charges: document.getElementById(`item-charges-${i}`).value,
            };
            allCardsData.push(cardData);
        }
        return allCardsData;
    }

    function saveData() {
        const allCardsData = getAllCardsData();
        const jsonString = JSON.stringify(allCardsData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'dnd-cards.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                if (Array.isArray(loadedData) && loadedData.length === NUM_ITEMS) {
                    applyAllData(loadedData);
                } else {
                    alert('Invalid or corrupted card file.');
                }
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                alert('Error reading file. Please ensure it is a valid JSON file.');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input to allow loading the same file again
        fit_text();
    }

    function applyAllData(allCardsData) {
        allCardsData.forEach((cardData, index) => {
            const i = index + 1; // Card numbers are 1-based

            const nameInput = document.getElementById(`item-name-${i}`);
            const raritySelect = document.getElementById(`item-rarity-${i}`);
            const shortDescCheckbox = document.getElementById(`item-short-description-${i}`);
            const imageReqCheckbox = document.getElementById(`item-image-requirement-${i}`);
            const typeReqCheckbox = document.getElementById(`item-type-requirement-${i}`);
            const typeValueInput = document.getElementById(`item-type-value-${i}`);
            const detailsTextarea = document.getElementById(`item-details-${i}`);
            const chargesRange = document.getElementById(`item-charges-${i}`);

            nameInput.value = cardData.name || '';
            raritySelect.value = cardData.rarity || 'common';
            shortDescCheckbox.checked = cardData.shortDescription !== false;
            imageReqCheckbox.checked = cardData.imageRequired !== false;
			applyImageToCard(i, cardData.imageDataUrl);
            typeReqCheckbox.checked = cardData.typeRequired !== false;
            typeValueInput.value = cardData.typeValue || '';
            detailsTextarea.value = cardData.details || '';
            chargesRange.value = cardData.charges || '0';

            // Trigger all update functions to refresh the card previews
            [raritySelect, shortDescCheckbox, imageReqCheckbox, typeReqCheckbox].forEach(el => el.dispatchEvent(new Event('change', { bubbles: true })));
            [nameInput, typeValueInput, detailsTextarea].forEach(el => el.dispatchEvent(new Event('keyup', { bubbles: true })));
			chargesRange.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // alert(translation[currentLanguage]['cards_loaded']);
		fit_text();
    }

    function clearAllCards() {
        if (window.confirm(translation[currentLanguage]['clear_all_confirm'])) {
            // Preserve the language setting while clearing card data.
            const savedStateJSON = localStorage.getItem('dndCardGeneratorState');
            let langToKeep = languageSelect.value; // Default to current selection

            if (savedStateJSON) {
                try {
                    const savedState = JSON.parse(savedStateJSON);
                    if (savedState.language) {
                        langToKeep = savedState.language;
                    }
                } catch (e) { /* Ignore parsing errors, will use default */ }
            }
            const newState = { language: langToKeep }; // Create a new state with only the language
            localStorage.setItem('dndCardGeneratorState', JSON.stringify(newState));
            location.reload();
        }
    }

	// --- Local Storage Functions ---

    function updateEmptyCards() {
        for (let i = 1; i <= NUM_ITEMS; i++) {
            const name = document.getElementById(`item-name-${i}`).value.trim();
            const typeValue = document.getElementById(`item-type-value-${i}`).value.trim();
            const details = document.getElementById(`item-details-${i}`).value.trim();
            const imageDataUrl = document.getElementById(`card-image-value-${i}`).style.backgroundImage;
            const charges = document.getElementById(`item-charges-${i}`).value;
            const hasImage = imageDataUrl && imageDataUrl !== 'none' && imageDataUrl !== '';

            const isEmpty = !name && !typeValue && !details && !hasImage && charges === "0";
            const cardFront = document.getElementById(`card-${i}`);
            if (cardFront) cardFront.classList.toggle('card-empty', isEmpty);
        }
    }

    function saveStateToLocalStorage() {
        updateEmptyCards();
        const state = {
            language: languageSelect.value,
            cards: getAllCardsData(),
        };
        localStorage.setItem('dndCardGeneratorState', JSON.stringify(state));
    }

    function loadStateFromLocalStorage() {
        const savedStateJSON = localStorage.getItem('dndCardGeneratorState');
        if (!savedStateJSON) return;

        try {
            const savedState = JSON.parse(savedStateJSON);
            if (savedState.language) {
                languageSelect.value = savedState.language;
                languageSelect.dispatchEvent(new Event('change'));
            }
            if (savedState.cards && Array.isArray(savedState.cards)) {
                applyAllData(savedState.cards);
            }
        } catch (error) {
            console.error("Error loading state from localStorage:", error);
            localStorage.removeItem('dndCardGeneratorState');
        }
    }

    // Initial calls to set up text and fit text after DOM is ready
    updateAllText();
    loadStateFromLocalStorage();
    updateEmptyCards();
    fit_text();

    window.addEventListener("load", (event) => {
        fit_text();
    });

})(); // End of IIFE
