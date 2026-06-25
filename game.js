const AREAS = {
    "Shady Creek": { tier: 1, class: "area-shady", loot: [["Pyrite Flakes", 5, 0.6], ["Clear Quartz", 12, 0.3], ["Gold Specks", 25, 0.1]] },
    "Crimson Canyons": { tier: 2, class: "area-crimson", loot: [["Bismuth Crystal", 40, 0.5], ["Fire Opal", 75, 0.35], ["Solid Nugget", 150, 0.15]] },
    "Glacial Chasm": { tier: 3, class: "area-glacial", loot: [["Cobalt Cluster", 200, 0.5], ["Star Sapphire", 450, 0.4], ["Void Shard", 1000, 0.1]] }
};

const SHOVELS = {
    1: { name: "Rusty Shovel", capacity: 5, efficiency: 1 },
    2: { name: "Iron Shovel", capacity: 8, efficiency: 2 },
    3: { name: "Titanium Shovel", capacity: 12, efficiency: 3 }
};

const PANS = {
    1: { name: "Wooden Pan", luck: 0.0 },
    2: { name: "Steel Pan", luck: 0.05 },
    3: { name: "Pro Mesh Pan", luck: 0.10 }
};

const PRICES = {
    "Pyrite Flakes": 5, "Clear Quartz": 12, "Gold Specks": 25,
    "Bismuth Crystal": 40, "Fire Opal": 75, "Solid Nugget": 150,
    "Cobalt Cluster": 200, "Star Sapphire": 450, "Void Shard": 1000
};

// Crafting Recipes definition using collected minerals
const CRAFTING_RECIPES = [
    { id: "cargo_pocket", name: "Extended Cargo Satchel", desc: "Adds +5 dirt carrying limit permanently", mats: { "Clear Quartz": 3 }, done: false, action: (g) => { g.cargoBonus += 5; } },
    { id: "luck_charm", name: "Pyrite Good Luck Charm", desc: "Passively grants +5% bonus prospecting luck", mats: { "Pyrite Flakes": 5, "Clear Quartz": 1 }, done: false, action: (g) => { g.craftingLuck += 0.05; } }
];

const MAP_GRID = [
    [1, 1, 1, 0, 0, 0, 0, 2, 2, 2],
    [1, 1, 1, 0, 0, 0, 0, 0, 2, 2],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 2],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [0, 0, 0, 0, 3, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 3, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

class ProspectorGame {
    constructor() {
        this.pX = 4; this.pY = 3;
        this.rawDirt = 0; this.cash = 0;
        this.shovelTier = 1; this.panTier = 1;
        this.cargoBonus = 0; this.craftingLuck = 0;
        this.currentArea = "Shady Creek";
        this.inventory = {};
        this.inShop = false;
        this.activeTab = "shop";

        window.addEventListener('keydown', (e) => this.handleInput(e));
        this.updateOutfit(); 
        this.updateUI();
    }

    logMessage(text, type = "system") {
        const logBox = document.getElementById("activity-log");
        const entry = document.createElement("div");
        entry.className = `log-entry ${type}`;
        entry.innerText = text;
        logBox.appendChild(entry);
        logBox.scrollTop = logBox.scrollHeight;
    }

    // 🌟 POPPING ELEMENT CREATOR FUNCTION 🌟
    popMineralText(text) {
        const container = document.getElementById("floating-text-container");
        const el = document.createElement("div");
        el.className = "floating-mineral";
        
        // Calculate exact center pixel based on grid alignment coordinates
        let posX = (this.pX * 62) + 31; // 60px size + 2px gaps
        let posY = (this.pY * 62) + 15;
        
        el.style.left = `${posX}px`;
        el.style.top = `${posY}px`;
        el.innerText = text;
        
        container.appendChild(el);
        // Automatically strip node out of browser frame once fading finishes
        setTimeout(() => el.remove(), 1200);
    }

    updateOutfit() {
        this.shirtColor = document.getElementById("color-shirt").value;
        this.hatEmoji = document.getElementById("select-hat").value;
        this.updateUI();
    }

    updateUI() {
        const area = AREAS[this.currentArea];
        document.getElementById("game-viewport").className = area.class;
        document.getElementById("current-area").innerText = this.currentArea.toUpperCase();
        document.getElementById("stat-cash").innerText = `$${this.cash}`;
        
        let maxDirt = SHOVELS[this.shovelTier].capacity + this.cargoBonus;
        document.getElementById("stat-dirt").innerText = `${this.rawDirt}/${maxDirt}`;
        document.getElementById("stat-shovel").innerText = SHOVELS[this.shovelTier].name;
        document.getElementById("stat-pan").innerText = PANS[this.panTier].name;

        // Render Stardew-aligned block matrix html frame
        const gridDisplay = document.getElementById("map-grid-display");
        gridDisplay.innerHTML = "";

        for (let r = 0; r < MAP_GRID.length; r++) {
            for (let c = 0; c < MAP_GRID[r].length; c++) {
                const tileEl = document.createElement("div");
                let typeClass = "tile-empty";
                let tileContent = "";

                if (MAP_GRID[r][c] === 1) typeClass = "tile-dig";
                else if (MAP_GRID[r][c] === 2) typeClass = "tile-water";
                else if (MAP_GRID[r][c] === 3) { typeClass = "tile-shop"; tileContent = "⌂"; }

                tileEl.className = `tile ${typeClass}`;
                
                // Clicking grid tiles moves character or interacts directly
                tileEl.onclick = () => this.handleTileClick(c, r);

                // Insert Avatar block node directly onto current indices
                if (r === this.pY && c === this.pX) {
                    const avatar = document.createElement("div");
                    avatar.className = "player-avatar";
                    avatar.innerHTML = `
                        <div class="player-hat">${this.hatEmoji}</div>
                        <div class="player-body" style="background:${this.shirtColor}">🤠</div>
                    `;
                    tileEl.appendChild(avatar);
                } else if (tileContent) {
                    tileEl.innerText = tileContent;
                }

                gridDisplay.appendChild(tileEl);
            }
        }

        // Action Prompts Control
        let currentTile = MAP_GRID[this.pY][this.pX];
        let prompt = "Click any block to move. Stand on features and press [E] to interact.";
        if (currentTile === 1) prompt = "<span style='color:#000;'>[E] Shovel Material</span>";
        else if (currentTile === 2) prompt = "<span style='color:#000;'>[E] Pan Dirt Bed</span>";
        else if (currentTile === 3) prompt = "<span style='color:#000;'>[E] Enter Cabin Store</span>";
        document.getElementById("action-prompt").innerHTML = prompt;

        let invText = Object.entries(this.inventory).map(([k, v]) => `${k} (x${v})`).join(", ");
        document.getElementById("inventory-display").innerText = invText ? `Inventory: ${invText}` : "Inventory: Empty";
    }

    handleTileClick(targetX, targetY) {
        if (this.inShop) return;
        // If clicking directly where standing, trigger interaction rule
        if (targetX === this.pX && targetY === this.pY) {
            this.triggerContextAction();
            return;
        }
        // Basic stepping loop tracking
        this.pX = targetX;
        this.pY = targetY;
        this.updateUI();
    }

    handleInput(e) {
        let key = e.key.toLowerCase();
        if (key === 'e') {
            this.triggerContextAction();
            e.preventDefault();
            return;
        }

        if (this.inShop) return;
        if (key === 'w' && this.pY > 0) this.pY--;
        else if (key === 's' && this.pY < MAP_GRID.length - 1) this.pY++;
        else if (key === 'a' && this.pX > 0) this.pX--;
        else if (key === 'd' && this.pX < MAP_GRID[0].length - 1) this.pX++;

        this.updateUI();
    }

    triggerContextAction() {
        if (this.inShop) {
            this.closeShop();
            return;
        }
        let currentTile = MAP_GRID[this.pY][this.pX];
        if (currentTile === 1) this.dig();
        else if (currentTile === 2) this.pan();
        else if (currentTile === 3) this.openShop();
    }

    dig() {
        let max = SHOVELS[this.shovelTier].capacity + this.cargoBonus;
        if (this.shovelTier < AREAS[this.currentArea].tier) {
            this.logMessage("Your shovel is too weak for this biome's clay!", "error");
            return;
        }
        if (this.rawDirt >= max) {
            this.logMessage("Satchel full! Head over to running water.", "error");
            return;
        }
        let added = SHOVELS[this.shovelTier].efficiency;
        this.rawDirt = Math.min(max, this.rawDirt + added);
        this.popMineralText(`+${added} Dirt`);
        this.updateUI();
    }

    pan() {
        if (this.rawDirt <= 0) {
            this.logMessage("No sand inside your bags to clean!", "error");
            return;
        }
        let counts = this.rawDirt;
        this.rawDirt = 0;
        let delay = 0;

        for (let i = 0; i < counts; i++) {
            let roll = Math.random();
            let luck = PANS[this.panTier].luck + this.craftingLuck;
            let cumulative = 0;
            
            for (let [item, value, chance] of AREAS[this.currentArea].loot) {
                cumulative += chance;
                if (roll - luck <= cumulative) {
                    this.inventory[item] = (this.inventory[item] || 0) + 1;
                    this.logMessage(`✨ Panned: ${item}!`, "find");
                    
                    // Stagger popping logs above player head smoothly
                    setTimeout(() => {
                        this.popMineralText(`✨ ${item}`);
                    }, delay);
                    delay += 250;
                    break;
                }
            }
        }
        if (delay === 0) {
            this.popMineralText("❌ Silt");
            this.logMessage("Nothing but river sediment slipped out.", "system");
        }
        this.updateUI();
    }

    openShop() {
        this.inShop = true;
        document.getElementById("shop-overlay").classList.remove("hidden");
        document.getElementById("shop-cash").innerText = `$${this.cash}`;
        document.getElementById("btn-upgrade-shovel").innerText = this.shovelTier < 3 ? `Upgrade Shovel ($${this.shovelTier * 150})` : "Shovel at Max Level";
        document.getElementById("btn-upgrade-pan").innerText = this.panTier < 3 ? `Upgrade Pan ($${this.panTier * 200})` : "Pan at Max Level";
        this.renderCraftingTab();
    }

    closeShop() {
        this.inShop = false;
        document.getElementById("shop-overlay").classList.add("hidden");
    }

    switchTab(tabName) {
        this.activeTab = tabName;
        document.getElementById("tab-btn-shop").className = tabName === "shop" ? "active" : "";
        document.getElementById("tab-btn-craft").className = tabName === "craft" ? "active" : "";
        
        if (tabName === "shop") {
            document.getElementById("tab-content-shop").classList.remove("hidden");
            document.getElementById("tab-content-craft").classList.add("hidden");
        } else {
            document.getElementById("tab-content-shop").classList.add("hidden");
            document.getElementById("tab-content-craft").classList.remove("hidden");
            this.renderCraftingTab();
        }
    }

    renderCraftingTab() {
        const container = document.getElementById("crafting-list");
        container.innerHTML = "";

        CRAFTING_RECIPES.forEach((recipe) => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "craft-item";

            let matLines = [];
            let fullyAffordable = true;
            for (let [matName, neededQty] of Object.entries(recipe.mats)) {
                let currentOwned = this.inventory[matName] || 0;
                matLines.push(`${matName}: ${currentOwned}/${neededQty}`);
                if (currentOwned < neededQty) fullyAffordable = false;
            }

            itemDiv.innerHTML = `
                <div class="craft-details">
                    <strong>${recipe.name}</strong>
                    <span>${recipe.desc}</span>
                    <span class="craft-mats">Needs: ${matLines.join(" | ")}</span>
                </div>
                <button ${(!fullyAffordable || recipe.done) ? "disabled" : ""} onclick="game.craftItem('${recipe.id}')">
                    ${recipe.done ? "Crafted" : "Craft"}
                </button>
            `;
            container.appendChild(itemDiv);
        });
    }

    craftItem(id) {
        let recipe = CRAFTING_RECIPES.find(r => r.id === id);
        if (!recipe || recipe.done) return;

        // Deduct materials ingredients array
        for (let [matName, neededQty] of Object.entries(recipe.mats)) {
            this.inventory[matName] -= neededQty;
        }

        recipe.done = true;
        recipe.action(this);
        this.logMessage(`🔨 Successfully crafted: ${recipe.name}!`, "system");
        this.renderCraftingTab();
        this.updateUI();
    }

    sellMinerals() {
        let total = 0;
        for (let [item, qty] of Object.entries(this.inventory)) {
            total += PRICES[item] * qty;
        }
        this.inventory = {};
        this.cash += total;
        document.getElementById("shop-cash").innerText = `$${this.cash}`;
        this.logMessage(`Sold raw collection bags for $${total}!`, "system");
        this.renderCraftingTab();
        this.updateUI();
    }

    upgradeShovel() {
        let cost = this.shovelTier * 150;
        if (this.shovelTier < 3 && this.cash >= cost) {
            this.cash -= cost; this.shovelTier++;
            this.logMessage(`Purchased: ${SHOVELS[this.shovelTier].name}`, "system");
            this.openShop();
            this.updateUI();
        }
    }

    upgradePan() {
        let cost = this.panTier * 200;
        if (this.panTier < 3 && this.cash >= cost) {
            this.cash -= cost; this.panTier++;
            this.logMessage(`Purchased: ${PANS[this.panTier].name}`, "system");
            this.openShop();
            this.updateUI();
        }
    }

    travelTo(areaName) {
        if (this.shovelTier >= AREAS[areaName].tier) {
            this.currentArea = areaName;
            this.logMessage(`Hitchhiked into: Welcome to ${areaName}!`);
            this.closeShop();
            this.updateUI();
        } else {
            this.logMessage("Your current tools aren't sharp enough for that territory!", "error");
        }
    }
}

const game = new ProspectorGame();
