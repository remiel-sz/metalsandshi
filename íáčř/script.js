// Constants
const GRAINS_PER_OZT = 480;
const SILVER_TO_COPPER = 114; // 1 grain of silver = 114 grains of copper
const GOLD_TO_SILVER = 99.74; // 1 grain of gold = 99.74 grains of silver
const GRAMS_PER_OZT = 31.1034768;
const GRAINS_PER_GRAM = 15.4323583529;
const GRAMS_PER_GRAIN = 0.06479891;

// API Configuration
const API_KEY = '0595368853da1a33793a9a80ccb8c069';
const API_BASE_URL = 'https://api.metalpriceapi.com/v1';
const METALS_TO_FETCH = ['XAU', 'XAG', 'XCU']; // Gold, Silver, Copper symbols

// Metal prices in USD per troy ounce (default values until API fetch completes)
let PRICES = {
    Gold: 3290.30,
    Silver: 33.08,
    Copper: 0.30
};

let lastUpdateDate = null;
let isMetric = false;

// Initialize all DOM elements and event listeners when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const usdInput = document.getElementById('usdAmount');
    const metalInput = document.getElementById('metalAmount');
    const metalTypeSelect = document.getElementById('metalType');
    const unitTypeSelect = document.getElementById('unitType');
    const unitToggleBtn = document.getElementById('unitToggle');
    const goldResult = document.querySelector('#goldResult .metal-amount');
    const silverResult = document.querySelector('#silverResult .metal-amount');
    const copperResult = document.querySelector('#copperResult .metal-amount');

    // Fetch latest metal prices
    async function fetchMetalPrices() {
        try {
            // Get current date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];
            
            // Only fetch once per day
            if (lastUpdateDate === today) {
                return;
            }

            // Fetch prices for each metal
            const response = await fetch(`${API_BASE_URL}/latest?api_key=${API_KEY}&base=USD&currencies=${METALS_TO_FETCH.join(',')}`);
            const data = await response.json();

            if (data.rates) {
                // API returns direct prices in USD per troy ounce
                PRICES.Gold = data.rates.XAU;  // Price of 1 troy oz gold
                PRICES.Silver = data.rates.XAG; // Price of 1 troy oz silver
                PRICES.Copper = data.rates.XCU; // Price of 1 troy oz copper
                
                // Store update date
                lastUpdateDate = today;
                
                // Update display with new prices
                if (document.activeElement !== metalInput) {
                    convertFromUSD();
                } else {
                    convertFromMetal();
                }

                console.log('Updated metal prices:', PRICES);
            }
        } catch (error) {
            console.error('Error fetching metal prices:', error);
            // Retry after 1 minute on error
            setTimeout(fetchMetalPrices, 60 * 1000);
        }
    }

    // Convert USD to metal amount in troy ounces
    function getMetalAmountFromUSD(usdAmount, metalPrice) {
        return usdAmount / metalPrice;
    }

    // Convert metal amount to USD
    function getUSDFromMetal(amount, metal, unit) {
        // First convert to troy ounces
        let ozt = amount;
        switch (unit) {
            case 'gr':
                ozt = amount / GRAINS_PER_OZT;
                break;
            case 'g':
                ozt = amount / GRAMS_PER_OZT;
                break;
            case 'kg':
                ozt = (amount * 1000) / GRAMS_PER_OZT;
                break;
        }
        return ozt * PRICES[metal];
    }

    // Format amount based on unit system
    function formatAmount(amount) {
        if (isMetric) {
            // Convert to grams
            const grams = amount * GRAMS_PER_OZT;
            if (grams >= 1000) {
                return `${(grams / 1000).toFixed(3)}kg`;
            }
            return `${grams.toFixed(1)}g`;
        }
        const grains = amount * GRAINS_PER_OZT;
        if (grains >= GRAINS_PER_OZT) {
            const ozt = Math.floor(amount);
            const remainingGrains = Math.round((amount - ozt) * GRAINS_PER_OZT);
            if (remainingGrains > 0) {
                return `${ozt}ozt ${remainingGrains}gr`;
            }
            return `${ozt}ozt`;
        }
        return `${Math.round(grains)}gr`;
    }

    // Update display
    function updateDisplay(usdAmount) {
        // Calculate equivalent amounts in each metal
        const goldOzt = getMetalAmountFromUSD(usdAmount, PRICES.Gold);
        const silverOzt = getMetalAmountFromUSD(usdAmount, PRICES.Silver);
        const copperOzt = getMetalAmountFromUSD(usdAmount, PRICES.Copper);

        // Display results
        goldResult.textContent = goldOzt > 0 ? formatAmount(goldOzt) : '-';
        silverResult.textContent = silverOzt > 0 ? formatAmount(silverOzt) : '-';
        copperResult.textContent = copperOzt > 0 ? formatAmount(copperOzt) : '-';
    }

    // Convert from USD input
    function convertFromUSD() {
        const usdAmount = parseFloat(usdInput.value) || 0;
        if (usdAmount < 0) return;
        updateDisplay(usdAmount);
    }

    // Convert from metal input
    function convertFromMetal() {
        const amount = parseFloat(metalInput.value) || 0;
        if (amount < 0) return;

        const metal = metalTypeSelect.value;
        const unit = unitTypeSelect.value;
        
        const usdValue = getUSDFromMetal(amount, metal, unit);
        usdInput.value = usdValue.toFixed(2);
        updateDisplay(usdValue);
    }

    // Toggle unit system
    function toggleUnitSystem() {
        isMetric = !isMetric;
        unitToggleBtn.classList.toggle('metric');
        convertFromUSD(); // Refresh display with new units
    }

    // Event listeners
    usdInput.addEventListener('input', () => {
        if (document.activeElement === usdInput) {
            convertFromUSD();
        }
    });

    metalInput.addEventListener('input', () => {
        if (document.activeElement === metalInput) {
            convertFromMetal();
        }
    });

    metalTypeSelect.addEventListener('change', convertFromMetal);
    unitTypeSelect.addEventListener('change', convertFromMetal);
    unitToggleBtn.addEventListener('click', toggleUnitSystem);

    // Check for updates daily
    setInterval(() => {
        const now = new Date();
        // Check at midnight each day
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            fetchMetalPrices();
        }
    }, 60 * 1000); // Check every minute

    // Start fetching metal prices
    fetchMetalPrices();

    // Initial conversion with default values
    convertFromUSD();
}); 