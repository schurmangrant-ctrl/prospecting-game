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

const MAP_GRID = [
    [1, 1, 0, 0, 0, 2, 2],
    [1, 1, 0, 0, 0, 0, 2],
    [0, 0, 0, 0, 0, 0, 2],
    [0, 0, 0, 3, 0, 0, 0],
    [0, 0, 0, 3, 0, 0, 0]
];

class ProspectorGame {
    constructor() {
        this.pX = 3; this.pY = 2;
        this.rawDirt = 0; this.cash = 0;
        this.shovelTier = 1; this.panTier = 1;
        this.currentArea = "Shady Creek";
        this.inventory = {};
        this.inShop = false;

        window.addEventListener('keydown', (e) => this.handleInput(e));
        this.updateUI();
    }

    updateUI() {
        const area = AREAS[this.currentArea];
        document.getElementById("game-container").className = area.class;
        document.getElementById("current-area").innerText = this.currentArea.toUpperCase();
        document.getElementById("stat-cash").innerText = `$${this.cash}`;
        document.getElementById("stat-dirt").innerText = `${this.rawDirt}/${SHOVELS[this.shovelTier].capacity}`;
        document.getElementById("stat-shovel").innerText = SHOVELS[this.shovelTier].name;
        document.getElementById("stat-pan").innerText = PANS[this.panTier].name;

        // Render Map Graphics
        let mapHTML = "";
        for (let r = 0; r < MAP_GRID.length; r++) {
            for (let c = 0; c < MAP_GRID[r].length; c++) {
                if (r === this.pY && c === this.pX) mapHTML += "🤠";
                else if (MAP_GRID[r][c] === 1) mapHTML += "▧";
                else if (MAP_GRID[r][c] === 2) mapHTML += "<span style='color:#2196F3'>~</span>";
                else if (MAP_GRID[r][c] === 3) mapHTML += "<span style='color:#E040FB'>⌂</span>";
                else mapHTML += "<span style='color:#333'>·</span>";
            }
            mapHTML += "<br>";
        }
        document.getElementById("map-display").innerHTML = mapHTML;

        // Context Action Displays
        let currentTile = MAP_GRID[this.pY][this.pX];
        let prompt = "Walk to a Dig Site (▧), River (~), or Town (⌂) using W/A/S/D";
        if (currentTile === 1) prompt = "<span style='background:#FFEB3B; color:#000; padding:2px 6px;'>[E] Dig Dirt</span>";
        else if (currentTile === 2) prompt = "<span style='background:#00BCD4; color:#000; padding:2px 6px;'>[P] Pan Minerals</span>";
        else if (currentTile === 3) prompt = "<span style='background:#E040FB; color:#000; padding:2px 6px;'>[S] Open Town Shop</span>";
        document.getElementById("action-prompt").innerHTML = prompt;

        // Show inventory lists
        let invText = Object.entries(this.inventory).map(([k, v]) => `${k} (x${v})`).join(", ");
        document.getElementById("inventory-display").innerText = invText ? `Minerals Held: ${invText}` : "Minerals Held: None";
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
            alert("Your shovel can't break this ground! Upgrade it in town.");
            return;
        }
        if (this.rawDirt >= max) {
            alert("Your dirt bag is full!");
            return;
        }
        this.rawDirt = Math.min(max, this.rawDirt + SHOVELS[this.shovelTier].efficiency);
    }

    pan() {
        if (this.rawDirt <= 0) {
            alert("No material to wash! Dig some up first.");
            return;
        }
        let counts = this.rawDirt;
        this.rawDirt = 0;
        let foundLog = [];

        for (let i = 0; i < counts; i++) {
            let roll = Math.random();
            let luck = PANS[this.panTier].luck;
            let cumulative = 0;
            for (let [item, value, chance] of AREAS[this.currentArea].loot) {
                cumulative += chance;
                if (roll - luck <= cumulative) {
                    this.inventory[item] = (this.inventory[item] || 0) + 1;
                    foundLog.push(item);
                    break;
                }
            }
        }
        alert(foundLog.length ? `Washed out: ${foundLog.join(", ")}` : "Nothing but river sand remains.");
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
        alert(`Merchant paid you $${total}!`);
    }

    upgradeShovel() {
        let cost = this.shovelTier * 150;
        if (this.shovelTier < 3 && this.cash >= cost) {
            this.cash -= cost; this.shovelTier++;
            this.openShop();
        } else alert("Can't complete upgrade.");
    }

    upgradePan() {
        let cost = this.panTier * 200;
        if (this.panTier < 3 && this.cash >= cost) {
            this.cash -= cost; this.panTier++;
            this.openShop();
        } else alert("Can't complete upgrade.");
    }

    showTravelMenu() { document.getElementById("travel-menu").classList.remove("hidden"); }

    travelTo(areaName) {
        if (this.shovelTier >= AREAS[areaName].tier) {
            this.currentArea = areaName;
            this.closeShop();
            this.updateUI();
        } else alert("Your current shovel cannot penetrate that region's soil!");
    }
}

const game = new ProspectorGame();
