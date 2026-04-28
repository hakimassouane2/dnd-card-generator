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
		confirm_remove_page: "This page contains cards with data. Remove anyway?",
		card_type: "Card type",
		item_card: "Item",
		spell_card: "Spell",
		spell: "Spell",
		spell_name: "Name of the spell",
		spell_details: "Details of the spell",
		element: "Element",
		element_aucun: "None",
		element_feu: "Fire",
		element_glace: "Ice",
		element_foudre: "Lightning",
		element_vent: "Wind",
		element_radiant: "Radiant",
		element_necrotique: "Necrotic",
		utility: "Utility",
		utility_short: "Util.",
		level: "Tier",
		level_cantrip: "Cantrip",
		tier_label: "Tier",
		casting_time: "Cast time",
		casting_time_short: "Cast",
		casting_time_placeholder: "e.g. 1 action",
		range: "Range",
		range_placeholder: "e.g. Range 12 / Reach 1",
		damage: "Damage",
		damage_placeholder: "e.g. 2d6",
		damage_type: "Damage type",
		damage_type_placeholder: "e.g. fire",
		concentration: "Concentration",
		concentration_short: "Conc.",
		duration: "Duration",
		duration_placeholder: "e.g. 10 min",
		upcast: "At higher tiers",
		upcast_placeholder: "Effect at higher tiers (markdown)",
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
		confirm_remove_page: "Cette page contient des cartes avec des données. Supprimer quand même ?",
		card_type: "Type de carte",
		item_card: "Objet",
		spell_card: "Sort",
		spell: "Sort",
		spell_name: "Nom du sort",
		spell_details: "Détails du sort",
		element: "Élément",
		element_aucun: "Aucun",
		element_feu: "Feu",
		element_glace: "Glace",
		element_foudre: "Foudre",
		element_vent: "Vent",
		element_radiant: "Radiant",
		element_necrotique: "Nécrotique",
		utility: "Utilitaire",
		utility_short: "Util.",
		level: "Niveau",
		level_cantrip: "Tour de magie",
		tier_label: "Rang",
		casting_time: "Temps d'incantation",
		casting_time_short: "Temps",
		casting_time_placeholder: "ex. 1 action",
		range: "Portée",
		range_placeholder: "ex. Portée 12 / Allonge 1",
		damage: "Dégâts",
		damage_placeholder: "ex. 2d6",
		damage_type: "Type de dégâts",
		damage_type_placeholder: "ex. feu",
		concentration: "Concentration",
		concentration_short: "Conc.",
		duration: "Durée",
		duration_placeholder: "ex. 10 min",
		upcast: "Aux rangs supérieurs",
		upcast_placeholder: "Effet aux rangs supérieurs (markdown)",
	},
};

    // The grid is fixed at 3x3 = 9 cards per page. Page count is mutable.
    const CARDS_PER_PAGE = 9;
    let pageCount = 1;
    const getCardCount = () => pageCount * CARDS_PER_PAGE;

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

    // Set true during bulk operations (load, page resize, language refresh) to
    // suppress per-handler fit_text calls. Caller is responsible for one final
    // fit_text() once the bulk work is done.
    let suppressFitText = false;

    // Function to apply text fitting
    function fit_text() {
        if (suppressFitText) return;
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
        const prevSuppress = suppressFitText;
        suppressFitText = true;
        try {
        const t = translation[currentLanguage];
        document.querySelectorAll(".item-name").forEach((element) => {
            element.innerHTML = t["item"];
        });
        document
            .querySelectorAll(".item-name-editor > input")
            .forEach((element) => {
                const itemNum = get_item_number(element);
                const cardType = get_card_type(itemNum);
                element.placeholder = cardType === "spell" ? t["spell_name"] : t["item_name"];
            });
        document.querySelectorAll(".card-name").forEach((element) => {
            // Only update if it's the default placeholder, otherwise keep user input
            const itemNum = get_item_number(element);
            const itemNameInput = document.getElementById(`item-name-${itemNum}`);
            const cardType = get_card_type(itemNum);
            if (itemNameInput.value === "") {
                element.innerHTML = cardType === "spell" ? t["spell_name"] : t["item_name"];
            }
        });
        document
            .querySelectorAll(".item-short-description-editor > label > span")
            .forEach((element) => {
                element.innerHTML = t["short_description_requirement"];
            });
        document
            .querySelectorAll(".item-image-editor > label > span")
            .forEach((element) => {
                element.innerHTML = t["image_requirement"];
            });
        document
            .querySelectorAll(".item-type-editor > label > span")
            .forEach((element) => {
                element.innerHTML = t["type_requirement"];
            });
        document
            .querySelectorAll(".item-type-editor > div > input")
            .forEach((element) => {
                element.placeholder = t["item_type"];
            });
        document.querySelectorAll(".item-type-header").forEach((element) => {
            element.innerHTML = t["type"];
        });
        document.querySelectorAll(".item-type").forEach((element) => {
            // Only update if it's the default placeholder, otherwise keep user input
            const itemNum = get_item_number(element);
            const itemTypeInput = document.getElementById(`item-type-value-${itemNum}`);
            if (itemTypeInput.value === "") {
                element.innerHTML = t["item_type"];
            }
        });
        document.querySelectorAll(".item-details-editor").forEach((element) => {
            const itemNum = get_item_number(element);
            const cardType = get_card_type(itemNum);
            element.placeholder = cardType === "spell" ? t["spell_details"] : t["item_details"];
        });

        document
            .querySelectorAll(".charges-editor > label > span")
            .forEach((element) => {
                element.innerHTML = t["item_charges"];
            });
        document
            .querySelectorAll(".charges-editor > label > div > input[type='range']")
            .forEach((element) => {
                // Re-call change_charges to update the display value based on new language
                change_charges(element);
            });
        document.querySelectorAll(".item-rarity-editor > label > span").forEach(element => {
            element.innerHTML = t["rarity"];
        });
        document.querySelectorAll(".item-rarity-editor select").forEach(select => {
            // Loop through rarities to update option text
            const rarities = ["common", "uncommon", "rare", "epic", "legendary", "artifact"];
            rarities.forEach(rarity => {
                const option = select.querySelector(`option[value="${rarity}"]`);
                if (option) {
                    option.innerHTML = t[rarity];
                }
            });
        });

        // --- Spell-related labels ---
        document.querySelectorAll(".card-type-editor .card-type-label").forEach(el => {
            el.innerHTML = t["card_type"];
        });
        document.querySelectorAll(".card-type-editor select").forEach(select => {
            const opt_item = select.querySelector('option[value="item"]');
            const opt_spell = select.querySelector('option[value="spell"]');
            if (opt_item) opt_item.innerHTML = t["item_card"];
            if (opt_spell) opt_spell.innerHTML = t["spell_card"];
        });

        document.querySelectorAll(".spell-level-editor > label > span").forEach(el => {
            el.innerHTML = t["level"];
        });
        document.querySelectorAll(".spell-level-editor select").forEach(select => {
            const cantrip = select.querySelector('option[value="cantrip"]');
            if (cantrip) cantrip.innerHTML = t["level_cantrip"];
            for (let n = 1; n <= 9; n++) {
                const opt = select.querySelector(`option[value="t${n}"]`);
                if (opt) opt.innerHTML = `${t["tier_label"]} ${n}`;
            }
        });

        document.querySelectorAll(".spell-element-editor > label > span").forEach(el => {
            el.innerHTML = t["element"];
        });
        document.querySelectorAll(".spell-element-editor select").forEach(select => {
            ["aucun", "feu", "glace", "foudre", "vent", "radiant", "necrotique"].forEach(elKey => {
                const opt = select.querySelector(`option[value="${elKey}"]`);
                if (opt) opt.innerHTML = t["element_" + elKey];
            });
        });

        document.querySelectorAll(".spell-utility-editor > label > span").forEach(el => {
            el.innerHTML = t["utility"];
        });
        document.querySelectorAll(".spell-casting-time-editor > label > span").forEach(el => {
            el.innerHTML = t["casting_time"];
        });
        document.querySelectorAll(".spell-casting-time-editor input").forEach(el => {
            el.placeholder = t["casting_time_placeholder"];
        });
        document.querySelectorAll(".spell-range-editor > label > span").forEach(el => {
            el.innerHTML = t["range"];
        });
        document.querySelectorAll(".spell-range-editor input").forEach(el => {
            el.placeholder = t["range_placeholder"];
        });
        document.querySelectorAll(".spell-damage-editor > label > span").forEach(el => {
            el.innerHTML = t["damage"];
        });
        document.querySelectorAll(".spell-damage-editor input").forEach(el => {
            el.placeholder = t["damage_placeholder"];
        });
        document.querySelectorAll(".spell-damage-type-editor > label > span").forEach(el => {
            el.innerHTML = t["damage_type"];
        });
        document.querySelectorAll(".spell-damage-type-editor input").forEach(el => {
            el.placeholder = t["damage_type_placeholder"];
        });
        document.querySelectorAll(".spell-duration-editor > label > span").forEach(el => {
            el.innerHTML = t["duration"];
        });
        document.querySelectorAll(".spell-duration-editor input").forEach(el => {
            el.placeholder = t["duration_placeholder"];
        });
        document.querySelectorAll(".spell-concentration-editor > label > span").forEach(el => {
            el.innerHTML = t["concentration"];
        });
        document.querySelectorAll(".spell-upcast-editor .spell-upcast-label").forEach(el => {
            el.innerHTML = t["upcast"];
        });
        document.querySelectorAll(".spell-upcast-editor textarea").forEach(el => {
            el.placeholder = t["upcast_placeholder"];
        });

        // Re-render spell preview labels and current values for every card
        const numItems = getCardCount();
        for (let i = 1; i <= numItems; i++) {
            refresh_spell_card(i);
        }
        } finally {
            suppressFitText = prevSuppress;
        }
        fit_text();
    }

    // Returns the current card type ("item" | "spell") for a given card index.
    // Defensive: returns "item" if the select is missing (early init).
    function get_card_type(itemNumber) {
        const sel = document.getElementById(`card-type-${itemNumber}`);
        return sel ? sel.value : "item";
    }

    // Initial HTML generation: Build strings first, then set innerHTML once.
    // Wrapped in a function so we can rebuild when pageCount changes.
    function buildAllCards() {
    const itemEditorHtmls = [];
    const A4Htmls = [];

    const numItems = getCardCount();
    for (let i = 1; i <= numItems; i++) {
        itemEditorHtmls.push(`
        <details class="item-editor" id="item-editor-${i}" data-card-type="item" open>
            <summary>
                <div class="item-name-editor">
                    <span style="display:none" class="item-name">${translation[currentLanguage]["item"]}</span>
                    <span style="display:none">${i}:</span>
                    <input id="item-name-${i}" type="text" placeholder="${translation[currentLanguage]["item_name"]}">
                </div>
            </summary>
            <div class="properties">

                <div class="card-type-editor">
                    <label>
                        <span class="card-type-label">${translation[currentLanguage]["card_type"]}</span>
                        <select id="card-type-${i}">
                            <option value="item" selected>${translation[currentLanguage]["item_card"]}</option>
                            <option value="spell">${translation[currentLanguage]["spell_card"]}</option>
                        </select>
                    </label>
                </div>

				<div class="item-rarity-editor item-only">
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

                <div class="spell-level-editor spell-only">
                    <label>
                        <span>${translation[currentLanguage]["level"]}</span>
                        <select id="spell-level-${i}">
                            <option value="cantrip">${translation[currentLanguage]["level_cantrip"]}</option>
                            <option value="t1">${translation[currentLanguage]["tier_label"]} 1</option>
                            <option value="t2">${translation[currentLanguage]["tier_label"]} 2</option>
                            <option value="t3">${translation[currentLanguage]["tier_label"]} 3</option>
                            <option value="t4">${translation[currentLanguage]["tier_label"]} 4</option>
                            <option value="t5">${translation[currentLanguage]["tier_label"]} 5</option>
                            <option value="t6">${translation[currentLanguage]["tier_label"]} 6</option>
                            <option value="t7">${translation[currentLanguage]["tier_label"]} 7</option>
                            <option value="t8">${translation[currentLanguage]["tier_label"]} 8</option>
                            <option value="t9">${translation[currentLanguage]["tier_label"]} 9</option>
                        </select>
                    </label>
                </div>

                <div class="spell-element-editor spell-only">
                    <label>
                        <span>${translation[currentLanguage]["element"]}</span>
                        <select id="spell-element-${i}">
                            <option value="aucun">${translation[currentLanguage]["element_aucun"]}</option>
                            <option value="feu">${translation[currentLanguage]["element_feu"]}</option>
                            <option value="glace">${translation[currentLanguage]["element_glace"]}</option>
                            <option value="foudre">${translation[currentLanguage]["element_foudre"]}</option>
                            <option value="vent">${translation[currentLanguage]["element_vent"]}</option>
                            <option value="radiant">${translation[currentLanguage]["element_radiant"]}</option>
                            <option value="necrotique">${translation[currentLanguage]["element_necrotique"]}</option>
                        </select>
                    </label>
                </div>

                <div class="spell-utility-editor spell-only">
                    <label>
                        <input id="spell-utility-${i}" type="checkbox">
                        <span>${translation[currentLanguage]["utility"]}</span>
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

                <div class="item-type-editor item-property item-only">
                    <label>
                        <input id="item-type-requirement-${i}" class="item-type-requirement" type="checkbox" checked>
                        <span>${translation[currentLanguage]["type_requirement"]}</span>
                    </label>
                    <div class="item-type-value-container">
                        <input id="item-type-value-${i}" class="item-type-value" type="text" placeholder="${translation[currentLanguage]["item_type"]}">
                    </div>
                </div>

                <div class="spell-casting-time-editor item-property spell-only">
                    <label>
                        <span>${translation[currentLanguage]["casting_time"]}</span>
                        <input id="spell-casting-time-${i}" type="text" placeholder="${translation[currentLanguage]["casting_time_placeholder"]}">
                    </label>
                </div>

                <div class="spell-range-editor item-property spell-only">
                    <label>
                        <span>${translation[currentLanguage]["range"]}</span>
                        <input id="spell-range-${i}" type="text" placeholder="${translation[currentLanguage]["range_placeholder"]}">
                    </label>
                </div>

                <div class="spell-damage-editor item-property spell-only">
                    <label>
                        <span>${translation[currentLanguage]["damage"]}</span>
                        <input id="spell-damage-${i}" type="text" placeholder="${translation[currentLanguage]["damage_placeholder"]}">
                    </label>
                </div>

                <div class="spell-damage-type-editor item-property spell-only">
                    <label>
                        <span>${translation[currentLanguage]["damage_type"]}</span>
                        <input id="spell-damage-type-${i}" type="text" placeholder="${translation[currentLanguage]["damage_type_placeholder"]}">
                    </label>
                </div>

                <div class="spell-duration-editor item-property spell-only">
                    <label>
                        <span>${translation[currentLanguage]["duration"]}</span>
                        <input id="spell-duration-${i}" type="text" placeholder="${translation[currentLanguage]["duration_placeholder"]}">
                    </label>
                </div>

                <div class="spell-concentration-editor item-property spell-only">
                    <label>
                        <input id="spell-concentration-${i}" type="checkbox">
                        <span>${translation[currentLanguage]["concentration"]}</span>
                    </label>
                </div>

                <div class="details-editor-container">
                    <textarea id="item-details-${i}" class="item-details-editor" placeholder="${translation[currentLanguage]["item_details"]}"></textarea>
                </div>

                <div class="spell-upcast-editor spell-only">
                    <label>
                        <span class="spell-upcast-label">${translation[currentLanguage]["upcast"]}</span>
                        <textarea id="spell-upcast-${i}" class="spell-upcast" placeholder="${translation[currentLanguage]["upcast_placeholder"]}"></textarea>
                    </label>
                </div>

                <div class="charges-editor item-only">
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
        <div id="card-${i}" class="card-container" data-card-type="item">
            <div class="card-outline">
                <div id="card-name-${i}" class="card-name">
                    ${translation[currentLanguage]["item_name"]}
                </div>

                <div id="card-spell-badges-${i}" class="spell-badges spell-only-card">
                    <span id="card-spell-level-${i}" class="spell-level-badge">${translation[currentLanguage]["level_cantrip"]}</span>
                    <span id="card-spell-element-${i}" class="spell-element-badge element-aucun">${translation[currentLanguage]["element_aucun"]}</span>
                    <span id="card-spell-utility-${i}" class="spell-utility-badge empty">${translation[currentLanguage]["utility"]}</span>
                </div>

                <div id="card-short-description-${i}" class="card-short-description">
                    <div id="card-image-value-${i}" class="image">
                    </div>
                    <div class="characteristics">
                        <div id="card-type-${i}" class="card-type item-only-card">
                            <div id="card-type-header-${i}" class="item-type-header">
                                ${translation[currentLanguage]["type"]}
                            </div>
                            <div id="card-type-value-${i}" class="item-type">
                                ${translation[currentLanguage]["item_type"]}
                            </div>
                        </div>
                        <div id="card-spell-stats-${i}" class="spell-stats spell-only-card">
                            <div id="card-spell-castingtime-${i}" class="spell-stat-line empty" data-stat="castingTime">
                                <strong class="spell-stat-label">${translation[currentLanguage]["casting_time_short"]}:</strong>
                                <span class="spell-stat-value"></span>
                            </div>
                            <div id="card-spell-range-${i}" class="spell-stat-line empty" data-stat="range">
                                <strong class="spell-stat-label">${translation[currentLanguage]["range"]}:</strong>
                                <span class="spell-stat-value"></span>
                            </div>
                            <div id="card-spell-damage-${i}" class="spell-stat-line empty" data-stat="damage">
                                <strong class="spell-stat-label">${translation[currentLanguage]["damage"]}:</strong>
                                <span class="spell-stat-value"></span>
                            </div>
                            <div id="card-spell-duration-${i}" class="spell-stat-line empty" data-stat="duration">
                                <strong class="spell-stat-label">${translation[currentLanguage]["duration"]}:</strong>
                                <span class="spell-stat-value"></span>
                            </div>
                            <div id="card-spell-concentration-${i}" class="spell-conc empty">
                                ★ ${translation[currentLanguage]["concentration"]}
                            </div>
                        </div>
                    </div>
                </div>
                <hr>
                <div id="card-details-${i}" class="card-details">
                </div>
                <div id="card-upcast-${i}" class="card-upcast spell-only-card empty">
                    <strong class="card-upcast-label">${translation[currentLanguage]["upcast"]}:</strong>
                    <span id="card-upcast-value-${i}" class="card-upcast-value"></span>
                </div>
            </div>

            <div id="card-charges-container-${i}" class="charges-container item-only-card">
                <div id="card-charges-${i}" class="charges-circles">
                </div>
            </div>

        </div>
    	`);
    }

    item_editors.innerHTML = itemEditorHtmls.join('');

    // Group cards into pages of CARDS_PER_PAGE for proper A4 print pagination.
    const pageHtmls = [];
    for (let p = 0; p < pageCount; p++) {
        const start = p * CARDS_PER_PAGE;
        const end = start + CARDS_PER_PAGE;
        const pageId = p === 0 ? 'front-page' : `print-page-${p + 1}`;
        const extraClass = p === 0 ? ' front-page' : '';
        pageHtmls.push(`
            <div class="print-page${extraClass}" id="${pageId}">
                ${A4Htmls.slice(start, end).join('')}
            </div>
        `);
    }
    A4.innerHTML = pageHtmls.join('');
    } // end buildAllCards

    buildAllCards();
    item_editors.addEventListener('input', debouncedSaveState);
    item_editors.addEventListener('change', debouncedSaveState);

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

    const pageIncBtn = document.getElementById('page-count-increment');
    if (pageIncBtn) pageIncBtn.addEventListener('click', () => setPageCount(pageCount + 1));
    const pageDecBtn = document.getElementById('page-count-decrement');
    if (pageDecBtn) pageDecBtn.addEventListener('click', () => setPageCount(pageCount - 1));

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

    // Attach event listeners to dynamically created elements.
    // Wrapped in a function so we can re-attach after rebuilding the DOM.
    function attachAllCardListeners() {
    const numItems = getCardCount();
    for (let i = 1; i <= numItems; i++) {
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

        const cardTypeSelect = document.getElementById(`card-type-${i}`);
        const spellLevelSelect = document.getElementById(`spell-level-${i}`);
        const spellElementSelect = document.getElementById(`spell-element-${i}`);
        const spellUtilityCheckbox = document.getElementById(`spell-utility-${i}`);
        const spellCastingTimeInput = document.getElementById(`spell-casting-time-${i}`);
        const spellRangeInput = document.getElementById(`spell-range-${i}`);
        const spellDamageInput = document.getElementById(`spell-damage-${i}`);
        const spellDamageTypeInput = document.getElementById(`spell-damage-type-${i}`);
        const spellDurationInput = document.getElementById(`spell-duration-${i}`);
        const spellConcentrationCheckbox = document.getElementById(`spell-concentration-${i}`);
        const spellUpcastTextarea = document.getElementById(`spell-upcast-${i}`);

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

        cardTypeSelect.addEventListener('change', (event) => change_card_type(event.target));
        spellLevelSelect.addEventListener('change', (event) => change_spell_level(event.target));
        spellElementSelect.addEventListener('change', (event) => change_spell_element(event.target));
        spellUtilityCheckbox.addEventListener('change', (event) => change_spell_utility(event.target));
        spellCastingTimeInput.addEventListener('keyup', (event) => change_spell_stat(event.target, 'castingTime'));
        spellRangeInput.addEventListener('keyup', (event) => change_spell_stat(event.target, 'range'));
        spellDamageInput.addEventListener('keyup', (event) => change_spell_damage_or_type(event.target));
        spellDamageTypeInput.addEventListener('keyup', (event) => change_spell_damage_or_type(event.target));
        spellDurationInput.addEventListener('keyup', (event) => change_spell_stat(event.target, 'duration'));
        spellConcentrationCheckbox.addEventListener('change', (event) => change_spell_concentration(event.target));
        spellUpcastTextarea.addEventListener('keyup', (event) => change_spell_upcast(event.target));
    }
    } // end attachAllCardListeners

    attachAllCardListeners();

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
            // Charges container visibility is also gated by data-card-type via CSS,
            // so this only applies for item cards.
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

    // --- Spell handlers ---

    function change_card_type(element) {
        const item_number = get_item_number(element);
        const editor = document.getElementById(`item-editor-${item_number}`);
        const card = document.getElementById(`card-${item_number}`);
        const value = element.value === "spell" ? "spell" : "item";
        editor.setAttribute('data-card-type', value);
        card.setAttribute('data-card-type', value);

        // Refresh placeholders + dependent labels (name placeholder, details placeholder)
        const itemNameInput = document.getElementById(`item-name-${item_number}`);
        const detailsTextarea = document.getElementById(`item-details-${item_number}`);
        const t = translation[currentLanguage];
        itemNameInput.placeholder = value === "spell" ? t["spell_name"] : t["item_name"];
        detailsTextarea.placeholder = value === "spell" ? t["spell_details"] : t["item_details"];

        // Refresh card-name placeholder if name is empty.
        if (itemNameInput.value === "") {
            const card_name = document.getElementById(`card-name-${item_number}`);
            card_name.innerHTML = value === "spell" ? t["spell_name"] : t["item_name"];
        }
        refresh_spell_card(item_number);
        fit_text();
    }

    function change_spell_level(element) {
        const item_number = get_item_number(element);
        const badge = document.getElementById(`card-spell-level-${item_number}`);
        const value = element.value;
        badge.innerHTML = value === "cantrip"
            ? translation[currentLanguage]["level_cantrip"]
            : `${translation[currentLanguage]["tier_label"]} ${value.substring(1)}`; // t3 -> Rang 3
        fit_text();
    }

    function change_spell_element(element) {
        const item_number = get_item_number(element);
        const badge = document.getElementById(`card-spell-element-${item_number}`);
        const card = document.getElementById(`card-${item_number}`);
        const value = element.value;
        const elementClasses = ['element-aucun', 'element-feu', 'element-glace', 'element-foudre', 'element-vent', 'element-radiant', 'element-necrotique'];
        badge.classList.remove(...elementClasses);
        card.classList.remove(...elementClasses);
        badge.classList.add(`element-${value}`);
        card.classList.add(`element-${value}`);
        badge.innerHTML = translation[currentLanguage]["element_" + value];
        // Damage type often defaults visually to the element name when no override is set.
        change_spell_damage_or_type({ id: `spell-damage-${item_number}` });
        fit_text();
    }

    function change_spell_utility(element) {
        const item_number = get_item_number(element);
        const badge = document.getElementById(`card-spell-utility-${item_number}`);
        if (element.checked) {
            badge.classList.remove('empty');
        } else {
            badge.classList.add('empty');
        }
        fit_text();
    }

    function change_spell_stat(element, statKey) {
        const item_number = get_item_number(element);
        const map = { castingTime: 'castingtime', range: 'range', duration: 'duration' };
        const node = document.getElementById(`card-spell-${map[statKey]}-${item_number}`);
        const valueSpan = node.querySelector('.spell-stat-value');
        const value = element.value.trim();
        valueSpan.textContent = value ? "​" + value : "";
        node.classList.toggle('empty', !value);
        fit_text();
    }

    // Damage and damage-type render together in a single line: "Dégâts: 2d6 feu".
    // If damage type is empty and an element is set, fall back to the element name.
    function change_spell_damage_or_type(element) {
        const item_number = get_item_number(element);
        const damageInput = document.getElementById(`spell-damage-${item_number}`);
        const damageTypeInput = document.getElementById(`spell-damage-type-${item_number}`);
        const elementSelect = document.getElementById(`spell-element-${item_number}`);
        const node = document.getElementById(`card-spell-damage-${item_number}`);
        const valueSpan = node.querySelector('.spell-stat-value');

        const dmg = damageInput.value.trim();
        const explicitType = damageTypeInput.value.trim();
        const elementValue = elementSelect.value;
        const elementName = elementValue && elementValue !== 'aucun'
            ? translation[currentLanguage]["element_" + elementValue].toLowerCase()
            : '';
        const dmgType = explicitType || elementName;

        if (!dmg) {
            valueSpan.textContent = '';
            node.classList.add('empty');
        } else {
            const text = dmgType ? `${dmg} ${dmgType}` : dmg;
            valueSpan.textContent = "​" + text;
            node.classList.remove('empty');
        }
        fit_text();
    }

    function change_spell_concentration(element) {
        const item_number = get_item_number(element);
        const node = document.getElementById(`card-spell-concentration-${item_number}`);
        node.classList.toggle('empty', !element.checked);
        fit_text();
    }

    function change_spell_upcast(element) {
        const item_number = get_item_number(element);
        const node = document.getElementById(`card-upcast-${item_number}`);
        const valueSpan = document.getElementById(`card-upcast-value-${item_number}`);
        const value = element.value;
        if (value.trim() === '') {
            valueSpan.innerHTML = '';
            node.classList.add('empty');
        } else {
            valueSpan.innerHTML = "​" + converter.makeHtml(value);
            node.classList.remove('empty');
        }
        fit_text();
    }

    // Re-renders all spell-side display values (badges + stat lines + upcast)
    // from the current editor values. Used on language change and after card type flip.
    function refresh_spell_card(item_number) {
        const levelSelect = document.getElementById(`spell-level-${item_number}`);
        const elementSelect = document.getElementById(`spell-element-${item_number}`);
        const utilityCheckbox = document.getElementById(`spell-utility-${item_number}`);
        const castingTimeInput = document.getElementById(`spell-casting-time-${item_number}`);
        const rangeInput = document.getElementById(`spell-range-${item_number}`);
        const durationInput = document.getElementById(`spell-duration-${item_number}`);
        const concentrationCheckbox = document.getElementById(`spell-concentration-${item_number}`);
        const upcastTextarea = document.getElementById(`spell-upcast-${item_number}`);

        if (!levelSelect) return; // not yet built

        // Refresh fixed labels inside the spell preview that depend on language.
        const t = translation[currentLanguage];
        const labelMap = {
            castingtime: t["casting_time_short"],
            range: t["range"],
            damage: t["damage"],
            duration: t["duration"],
        };
        Object.entries(labelMap).forEach(([key, label]) => {
            const node = document.getElementById(`card-spell-${key}-${item_number}`);
            if (node) {
                const labelEl = node.querySelector('.spell-stat-label');
                if (labelEl) labelEl.textContent = label + ":";
            }
        });
        const concNode = document.getElementById(`card-spell-concentration-${item_number}`);
        if (concNode) concNode.innerHTML = `★ ${t["concentration"]}`;
        const upcastNode = document.getElementById(`card-upcast-${item_number}`);
        if (upcastNode) {
            const labelEl = upcastNode.querySelector('.card-upcast-label');
            if (labelEl) labelEl.textContent = t["upcast"] + ":";
        }

        change_spell_level(levelSelect);
        change_spell_element(elementSelect);
        change_spell_utility(utilityCheckbox);
        change_spell_stat(castingTimeInput, 'castingTime');
        change_spell_stat(rangeInput, 'range');
        change_spell_stat(durationInput, 'duration');
        change_spell_concentration(concentrationCheckbox);
        change_spell_upcast(upcastTextarea);
    }

    // --- Save/Load Functions ---

    function getAllCardsData() {
        const allCardsData = [];
        const numItems = getCardCount();
        for (let i = 1; i <= numItems; i++) {
            const cardData = {
                cardType: document.getElementById(`card-type-${i}`).value,
                name: document.getElementById(`item-name-${i}`).value,
                rarity: document.getElementById(`item-rarity-${i}`).value,
                shortDescription: document.getElementById(`item-short-description-${i}`).checked,
                imageRequired: document.getElementById(`item-image-requirement-${i}`).checked,
                imageDataUrl: document.getElementById(`card-image-value-${i}`).style.backgroundImage,
                typeRequired: document.getElementById(`item-type-requirement-${i}`).checked,
                typeValue: document.getElementById(`item-type-value-${i}`).value,
                details: document.getElementById(`item-details-${i}`).value,
                charges: document.getElementById(`item-charges-${i}`).value,
                // Spell fields
                spellLevel: document.getElementById(`spell-level-${i}`).value,
                spellElement: document.getElementById(`spell-element-${i}`).value,
                spellUtility: document.getElementById(`spell-utility-${i}`).checked,
                spellCastingTime: document.getElementById(`spell-casting-time-${i}`).value,
                spellRange: document.getElementById(`spell-range-${i}`).value,
                spellDamage: document.getElementById(`spell-damage-${i}`).value,
                spellDamageType: document.getElementById(`spell-damage-type-${i}`).value,
                spellDuration: document.getElementById(`spell-duration-${i}`).value,
                spellConcentration: document.getElementById(`spell-concentration-${i}`).checked,
                spellUpcast: document.getElementById(`spell-upcast-${i}`).value,
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
                if (Array.isArray(loadedData) && loadedData.length > 0) {
                    // Resize the grid to fit the loaded data; round up to whole pages.
                    const neededPages = Math.max(1, Math.ceil(loadedData.length / CARDS_PER_PAGE));
                    if (neededPages !== pageCount) {
                        pageCount = neededPages;
                        buildAllCards();
                        attachAllCardListeners();
                        updatePageCountDisplay();
                    }
                    const padded = loadedData.slice(0, getCardCount());
                    while (padded.length < getCardCount()) padded.push(createEmptyCardData());
                    applyAllData(padded);
                    updateAllText();
                    saveStateToLocalStorage();
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

    function createEmptyCardData() {
        return {
            cardType: 'item',
            name: '',
            rarity: 'common',
            shortDescription: true,
            imageRequired: true,
            imageDataUrl: '',
            typeRequired: true,
            typeValue: '',
            details: '',
            charges: '0',
            spellLevel: 'cantrip',
            spellElement: 'aucun',
            spellUtility: false,
            spellCastingTime: '',
            spellRange: '',
            spellDamage: '',
            spellDamageType: '',
            spellDuration: '',
            spellConcentration: false,
            spellUpcast: '',
        };
    }

    function cardHasContent(c) {
        if (!c) return false;
        const img = c.imageDataUrl;
        const hasImage = img && img !== 'none' && img !== '';
        return !!(c.name || c.details || c.typeValue || hasImage
            || c.spellCastingTime || c.spellRange || c.spellDamage || c.spellDamageType
            || c.spellDuration || c.spellUpcast
            || c.spellConcentration || c.spellUtility
            || (c.charges && c.charges !== '0'));
    }

    // Adjust the number of A4 pages (each = 9 cards). Snapshots data, rebuilds DOM, restores.
    function setPageCount(newPageCount) {
        if (newPageCount < 1 || newPageCount === pageCount) return;

        const currentData = getAllCardsData();
        const oldNumItems = getCardCount();
        const newNumItems = newPageCount * CARDS_PER_PAGE;

        if (newPageCount < pageCount) {
            let dataLoss = false;
            for (let i = newNumItems; i < oldNumItems; i++) {
                if (cardHasContent(currentData[i])) { dataLoss = true; break; }
            }
            if (dataLoss) {
                const msg = translation[currentLanguage]['confirm_remove_page']
                    || 'Removing a page will discard cards on it. Continue?';
                if (!window.confirm(msg)) return;
            }
        }

        pageCount = newPageCount;
        buildAllCards();
        attachAllCardListeners();

        const padded = currentData.slice(0, newNumItems);
        while (padded.length < newNumItems) padded.push(createEmptyCardData());
        applyAllData(padded);

        updateAllText();
        updateEmptyCards();
        updatePageCountDisplay();
        fit_text();
        saveStateToLocalStorage();
    }

    function updatePageCountDisplay() {
        const display = document.getElementById('page-count-display');
        if (display) display.textContent = String(pageCount);
    }

    function applyAllData(allCardsData) {
        const prevSuppress = suppressFitText;
        suppressFitText = true;
        try {
        allCardsData.forEach((cardData, index) => {
            const i = index + 1; // Card numbers are 1-based

            const cardTypeSelect = document.getElementById(`card-type-${i}`);
            const nameInput = document.getElementById(`item-name-${i}`);
            const raritySelect = document.getElementById(`item-rarity-${i}`);
            const shortDescCheckbox = document.getElementById(`item-short-description-${i}`);
            const imageReqCheckbox = document.getElementById(`item-image-requirement-${i}`);
            const typeReqCheckbox = document.getElementById(`item-type-requirement-${i}`);
            const typeValueInput = document.getElementById(`item-type-value-${i}`);
            const detailsTextarea = document.getElementById(`item-details-${i}`);
            const chargesRange = document.getElementById(`item-charges-${i}`);

            const spellLevelSelect = document.getElementById(`spell-level-${i}`);
            const spellElementSelect = document.getElementById(`spell-element-${i}`);
            const spellUtilityCheckbox = document.getElementById(`spell-utility-${i}`);
            const spellCastingTimeInput = document.getElementById(`spell-casting-time-${i}`);
            const spellRangeInput = document.getElementById(`spell-range-${i}`);
            const spellDamageInput = document.getElementById(`spell-damage-${i}`);
            const spellDamageTypeInput = document.getElementById(`spell-damage-type-${i}`);
            const spellDurationInput = document.getElementById(`spell-duration-${i}`);
            const spellConcentrationCheckbox = document.getElementById(`spell-concentration-${i}`);
            const spellUpcastTextarea = document.getElementById(`spell-upcast-${i}`);

            cardTypeSelect.value = cardData.cardType === 'spell' ? 'spell' : 'item';
            nameInput.value = cardData.name || '';
            raritySelect.value = cardData.rarity || 'common';
            shortDescCheckbox.checked = cardData.shortDescription !== false;
            imageReqCheckbox.checked = cardData.imageRequired !== false;
			applyImageToCard(i, cardData.imageDataUrl);
            typeReqCheckbox.checked = cardData.typeRequired !== false;
            typeValueInput.value = cardData.typeValue || '';
            detailsTextarea.value = cardData.details || '';
            chargesRange.value = cardData.charges || '0';

            spellLevelSelect.value = cardData.spellLevel || 'cantrip';
            spellElementSelect.value = cardData.spellElement || 'aucun';
            spellUtilityCheckbox.checked = !!cardData.spellUtility;
            spellCastingTimeInput.value = cardData.spellCastingTime || '';
            spellRangeInput.value = cardData.spellRange || '';
            spellDamageInput.value = cardData.spellDamage || '';
            spellDamageTypeInput.value = cardData.spellDamageType || '';
            spellDurationInput.value = cardData.spellDuration || '';
            spellConcentrationCheckbox.checked = !!cardData.spellConcentration;
            spellUpcastTextarea.value = cardData.spellUpcast || '';

            // Trigger all update functions to refresh the card previews
            [cardTypeSelect, raritySelect, shortDescCheckbox, imageReqCheckbox, typeReqCheckbox,
             spellLevelSelect, spellElementSelect, spellUtilityCheckbox, spellConcentrationCheckbox]
                .forEach(el => el.dispatchEvent(new Event('change', { bubbles: true })));
            [nameInput, typeValueInput, detailsTextarea,
             spellCastingTimeInput, spellRangeInput, spellDamageInput, spellDamageTypeInput,
             spellDurationInput, spellUpcastTextarea]
                .forEach(el => el.dispatchEvent(new Event('keyup', { bubbles: true })));
			chargesRange.dispatchEvent(new Event('input', { bubbles: true }));
        });
        } finally {
            suppressFitText = prevSuppress;
        }
        // alert(translation[currentLanguage]['cards_loaded']);
		fit_text();
    }

    function clearAllCards() {
        if (window.confirm(translation[currentLanguage]['clear_all_confirm'])) {
            // Preserve language and page count while clearing card data.
            const savedStateJSON = localStorage.getItem('dndCardGeneratorState');
            let langToKeep = languageSelect.value;
            let pagesToKeep = pageCount;

            if (savedStateJSON) {
                try {
                    const savedState = JSON.parse(savedStateJSON);
                    if (savedState.language) langToKeep = savedState.language;
                    if (savedState.pageCount) pagesToKeep = savedState.pageCount;
                } catch (e) { /* Ignore parsing errors, will use defaults */ }
            }
            const newState = { language: langToKeep, pageCount: pagesToKeep };
            localStorage.setItem('dndCardGeneratorState', JSON.stringify(newState));
            location.reload();
        }
    }

	// --- Local Storage Functions ---

    function updateEmptyCards() {
        const numItems = getCardCount();
        for (let i = 1; i <= numItems; i++) {
            const cardType = get_card_type(i);
            const name = document.getElementById(`item-name-${i}`).value.trim();
            const details = document.getElementById(`item-details-${i}`).value.trim();
            const imageDataUrl = document.getElementById(`card-image-value-${i}`).style.backgroundImage;
            const hasImage = imageDataUrl && imageDataUrl !== 'none' && imageDataUrl !== '';

            let isEmpty;
            if (cardType === 'spell') {
                const castingTime = document.getElementById(`spell-casting-time-${i}`).value.trim();
                const range = document.getElementById(`spell-range-${i}`).value.trim();
                const damage = document.getElementById(`spell-damage-${i}`).value.trim();
                const damageType = document.getElementById(`spell-damage-type-${i}`).value.trim();
                const duration = document.getElementById(`spell-duration-${i}`).value.trim();
                const upcast = document.getElementById(`spell-upcast-${i}`).value.trim();
                const concentration = document.getElementById(`spell-concentration-${i}`).checked;
                const utility = document.getElementById(`spell-utility-${i}`).checked;
                isEmpty = !name && !details && !hasImage
                    && !castingTime && !range && !damage && !damageType && !duration && !upcast
                    && !concentration && !utility;
            } else {
                const typeValue = document.getElementById(`item-type-value-${i}`).value.trim();
                const charges = document.getElementById(`item-charges-${i}`).value;
                isEmpty = !name && !typeValue && !details && !hasImage && charges === "0";
            }

            const cardFront = document.getElementById(`card-${i}`);
            if (cardFront) cardFront.classList.toggle('card-empty', isEmpty);
        }
    }

    function saveStateToLocalStorage() {
        updateEmptyCards();
        const state = {
            language: languageSelect.value,
            pageCount: pageCount,
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
            // Resize grid before applying card data — derive from explicit pageCount,
            // else round up from cards array length.
            let neededPages = pageCount;
            if (savedState.pageCount && savedState.pageCount >= 1) {
                neededPages = savedState.pageCount;
            } else if (savedState.cards && Array.isArray(savedState.cards)) {
                neededPages = Math.max(1, Math.ceil(savedState.cards.length / CARDS_PER_PAGE));
            }
            if (neededPages !== pageCount) {
                pageCount = neededPages;
                buildAllCards();
                attachAllCardListeners();
                updatePageCountDisplay();
            }
            if (savedState.cards && Array.isArray(savedState.cards)) {
                const padded = savedState.cards.slice(0, getCardCount());
                while (padded.length < getCardCount()) padded.push(createEmptyCardData());
                applyAllData(padded);
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
