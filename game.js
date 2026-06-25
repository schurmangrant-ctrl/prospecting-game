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

// Larger map layout to fit a full screen look nicely
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
        this.pX = 4; this.pY = 2; // Start center
        this.rawDirt = 0; this.cash = 0;
        this.shovelTier = 1; this.panTier = 1;
        this.currentArea = "Shady Creek";
        this.inventory = {};
        this.inShop = false;

        window.addEventListener('keydown', (e) => this.handleInput(e));
        this.updateUI();
    }

    logMessage(text, type = "system") {
        const logBox = document.getElementById("activity-log");
        const entry = document.createElement("div");
        entry.className = `log-entry ${type}`;
        entry.innerText = text;
        logBox.appendChild(entry);
        // Automatically scroll to bottom of logs
        logBox.scrollTop = logBox.scrollHeight;
    }

    updateUI() {
        const area = AREAS[this.currentArea];
        document.getElementById("game-viewport").className = area.class;
        document.getElementById("current-area").innerText = this.currentArea.toUpperCase();
        document.getElementById("stat-cash").innerText = `$${this.cash}`;
        document.getElementById("stat-dirt").innerText = `${this.rawDirt}/${SHOVELS[this.shovelTier].capacity}`;
        document.getElementById("stat-shovel").innerText = SHOVELS[this.shovelTier].name;
        document.getElementById("stat-pan").innerText = PANS[this.panTier].name;

        // Render Map Screen Matrix
        let mapHTML = "";
        for (let r = 0; r < MAP_GRID.length; r++) {
            for (let c = 0; c < MAP_GRID[r].length; c++) {
                if (r === this.pY && c === this.pX) mapHTML += "🤠";
                else if (MAP_GRID[r][c] === 1) mapHTML += "▧";
                else if (MAP_GRID[r][c] === 2) mapHTML += "<span style='color:#2196F3'>~</span>";
                else if (MAP_GRID[r][c] === 3) mapHTML += "<span style='color:#E040FB'>⌂</span>";
                else mapHTML += "<span style='color:#222'>·</span>";
            }
            mapHTML += "<br>";
        }
        document.getElementById("map-grid-display").innerHTML = mapHTML;

        // Dynamic Footer Prompt Text
        let currentTile = MAP_GRID[this.pY][this.pX];
        let prompt = "Use W/A/S/D to move around the landscape.";
        if (currentTile === 1) prompt = "<span style='background:#FFEB3B; color:#000; padding:3px 8px;'>Press [E] to shovel up material</span>";
        else if (currentTile === 2) prompt = "<span style='background:#00BCD4; color:#000; padding:3px 8px;'>Press [P] to pan current dirt</span>";
        else if (currentTile === 3) prompt = "<span style='background:#E040FB; color:#000; padding:3px 8px;'>Press [S] to talk to shopkeep</span>";
        document.getElementById("action-prompt").innerHTML = prompt;

        // Update sidebar items status
        let invText = Object.entries(this.inventory).map(([k, v]) => `${k} (x${v})`).join(", ");
        document.getElementById("inventory-display").innerText = invText ? `Minerals: ${invText}` : "Minerals: None";
    }

    handleInput(e) {
        if (this.inShop) return;
        let key = e.key.toLowerCase();

        if (key === 'w' && this.pY > 0) this.pY--;
        else if (key === 's' && this.pY < MAP_GRID.length - 1) this.pY++;
        else if (key === 'a' && this.pX > 0) this.pX--;
        else if (key === 'd' && this.pX < MAP_GRID[0].length - 1) this.pX++;
        else if (key === 'e' && MAP_GRID[this.pY][this.pX] === 1) this.dig();
        else if (key === 'p' && MAP_GRID[this.pY][this.pX] === 2) this.pan();
        else if (key === 's' && MAP_GRID[this.pY][this.pX] === 3) this.openShop();

        this.updateUI();
    }

    dig() {
        let max = SHOVELS[this.shovelTier].capacity;
        if (this.shovelTier < AREAS[this.currentArea].tier) {
            this.logMessage("Your shovel bounced off! The soil is too hard here.", "error");
            return;
        }
        if (this.rawDirt >= max) {
            this.logMessage("Your bag is entirely full of dirt! Head to the water.", "error");
            return;
        }
        let added = SHOVELS[this.shovelTier].efficiency;
        this.rawDirt = Math.min(max, this.rawDirt + added);
        this.logMessage(`+ Scooped up ${added} chunks of dirt.`, "dig");
    }

    pan() {
        if (this.rawDirt <= 0) {
            this.logMessage("You don't have any raw materials to wash!", "error");
            return;
        }
        let counts = this.rawDirt;
        this.rawDirt = 0;
        let foundSomething = false;

        this.logMessage("Swishing gravel in the running water...", "system");

        for (let i = 0; i < counts; i++) {
            let roll = Math.random();
            let luck = PANS[this.panTier].luck;
            let cumulative = 0;
            for (let [item, value, chance] of AREAS[this.currentArea].loot) {
                cumulative += chance;
                if (roll - luck <= cumulative) {
                    this.inventory[item] = (this.inventory[item] || 0) + 1;
                    this.logMessage(`✨ Found ${item}! (+$${value} value)`, "find");
                    foundSomething = true;
                    break;
                }
            }
        }
        if (!foundSomething) {
            this.logMessage("Nothing but river silt washed away...", "fail");
        }
    }

    openShop() {
        this.inShop = true;
        document.getElementById("shop-overlay").classList.remove("hidden");
        document.getElementById("shop-cash").innerText = `$${this.cash}`;
        document.getElementById("btn-upgrade-shovel").innerText = this.shovelTier < 3 ? `2. Upgrade Shovel ($${this.shovelTier * 150})` : "Shovel Maxed";
        document.getElementById("btn-upgrade-pan").innerText = this.panTier < 3 ? `3. Upgrade Pan ($${this.panTier * 200})` : "Pan Maxed";
    }

    closeShop() {
        this.inShop = false;
        document.getElementById("shop-overlay").classList.add("hidden");
        document.getElementById("travel-menu").classList.add("hidden");
    }

    sellMinerals() {
        let total = 0;
        for (let [item, qty] of Object.entries(this.inventory)) {
            total += PRICES[item] * qty;
        }
        this.inventory = {};
        this.cash += total;
        document.getElementById("shop-cash").innerText = `$${this.cash}`;
        this.logMessage(`Sold shipment of items for $${total}!`, "system");
    }

    upgradeShovel() {
        let cost = this.shovelTier * 150;
        if (this.shovelTier < 3 && this.cash >= cost) {
            this.cash -= cost; this.shovelTier++;
            this.logMessage(`Upgraded tool to: ${SHOVELS[this.shovelTier].name}`, "system");
            this.openShop();
        } else {
            this.logMessage("Cannot upgrade shovel. Check funds or level limit.", "error");
        }
    }

    upgradePan() {
        let cost = this.panTier * 200;
        if (this.panTier < 3 && this.cash >= cost) {
            this.cash -= cost; this.panTier++;
            this.logMessage(`Upgraded tool to: ${PANS[this.panTier].name}`, "system");
            this.openShop();
        } else {
            this.logMessage("Cannot upgrade panning equipment.", "error");
        }
    }

    showTravelMenu() { document.getElementById("travel-menu").classList.remove("hidden"); }

    travelTo(areaName) {
        if (this.shovelTier >= AREAS[areaName].tier) {
            this.currentArea = areaName;
            this.logMessage(`Arrived at new grid: Welcome to ${areaName}!`);
            this.closeShop();
            this.updateUI();
        } else {
            this.logMessage("Your shovel tool cannot break ground in that biome!", "error");
        }
    }
}

const game = new ProspectorGame();
