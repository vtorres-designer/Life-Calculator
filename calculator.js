// ============================================
// Life Calculator Pro - Multi-Scenario Financial Planner
// ============================================

// Global state
let scenarios = [];
let nextScenarioId = 0;
let activeScenarioId = 0;

// DOM Elements
let scenarioTabsContainer = null;
let scenarioContentContainer = null;
let comparisonTableBody = null;

// ============================================
// Initialization
// ============================================

function init() {
    scenarioTabsContainer = document.querySelector('.scenario-tabs');
    scenarioContentContainer = document.getElementById('scenarioContentContainer');
    comparisonTableBody = document.getElementById('comparisonTableBody');
    
    // Create default scenario
    addScenario('Current');
    
    // Load saved state if exists
    loadState();
    
    // Update comparison table
    updateComparisonTable();
}

// Run on page load
window.onload = init;

// ============================================
// Scenario Management
// ============================================

function addScenario(name = 'New Scenario') {
    const id = nextScenarioId++;
    const scenario = {
        id: id,
        name: name,
        transportMode: 'car',
        foodMode: 'everyplate',
        data: {}
    };
    
    scenarios.push(scenario);
    
    // Create tab
    createScenarioTab(id, name);
    
    // Create content
    createScenarioContent(id, name);
    
    // Switch to new scenario
    switchScenarioTab(id);
    
    // Save state
    saveState();
    
    return id;
}

function createScenarioTab(id, name) {
    const tab = document.createElement('button');
    tab.className = 'scenario-tab';
    tab.dataset.scenarioId = id;
    tab.innerHTML = `
        <span class="tab-icon">📊</span>
        <span class="tab-name">${name}</span>
        <span class="tab-close" onclick="event.stopPropagation(); deleteScenario(${id})">×</span>
    `;
    tab.onclick = () => switchScenarioTab(id);
    
    // Insert before the add button
    const addBtn = tab.closest('.scenario-tabs-container') || scenarioTabsContainer.parentElement;
    if (addBtn && addBtn.querySelector('.add-scenario-btn')) {
        addBtn.insertBefore(tab, addBtn.querySelector('.add-scenario-btn'));
    } else {
        scenarioTabsContainer.appendChild(tab);
    }
}

function createScenarioContent(id, name) {
    const content = document.createElement('div');
    content.className = 'scenario-content';
    content.dataset.scenarioId = id;
    
    content.innerHTML = `
    <div class="scenario-header">
        <input type="text" class="scenario-name-input" value="${name}" 
               onchange="renameScenario(${id}, this.value)" placeholder="Scenario Name">
        <div class="scenario-actions">
            <button onclick="duplicateScenario(${id})" class="btn-icon" title="Duplicate">📋</button>
            <button onclick="deleteScenario(${id})" class="btn-icon" title="Delete">🗑️</button>
        </div>
    </div>

    <!-- Summary Cards -->
    <div class="scenario-summary">
        <div class="summary-card">
            <h3>Monthly Net</h3>
            <div class="summary-value" id="scenario-${id}-net">$0</div>
            <div class="summary-label">After all expenses</div>
        </div>
        <div class="summary-card">
            <h3>Annual Surplus</h3>
            <div class="summary-value" id="scenario-${id}-annual">$0</div>
            <div class="summary-label">Projected yearly</div>
        </div>
        <div class="summary-card">
            <h3>4-Year Projection</h3>
            <div class="summary-value" id="scenario-${id}-4year">$0</div>
            <div class="summary-label" id="scenario-${id}-4year-label">Net position</div>
        </div>
        <div class="summary-card">
            <h3>Time to $12K</h3>
            <div class="summary-value" id="scenario-${id}-time">0 months</div>
            <div class="summary-label">Savings goal</div>
        </div>
    </div>

    <!-- Input Sections -->
    <div class="input-sections">
        <!-- Income -->
        <div class="section">
            <h2>💵 Income</h2>
            <div class="input-grid">
                <div class="input-group">
                    <label>Primary Job ($/hr)</label>
                    <input type="number" class="job1Rate" value="22.50" step="0.01" onchange="calculateScenario(${id})">
                </div>
                <div class="input-group">
                    <label>Primary Hours/Week</label>
                    <input type="number" class="job1Hours" value="24" onchange="calculateScenario(${id})">
                </div>
                <div class="input-group">
                    <label>Secondary Job ($/hr)</label>
                    <input type="number" class="job2Rate" value="18.00" step="0.01" onchange="calculateScenario(${id})">
                </div>
                <div class="input-group">
                    <label>Secondary Hours/Week</label>
                    <input type="number" class="job2Hours" value="8" onchange="calculateScenario(${id})">
                </div>
                <div class="input-group full-width">
                    <label>Other Income ($/mo)</label>
                    <input type="number" class="otherIncome" value="0" onchange="calculateScenario(${id})">
                </div>
            </div>
            <div class="result-card inline">
                <h3>Monthly Take-Home</h3>
                <div class="result-value" id="scenario-${id}-income">$0</div>
            </div>
        </div>

        <!-- Housing -->
        <div class="section">
            <h2>🏠 Housing</h2>
            <div class="input-grid">
                <div class="input-group full-width">
                    <label>Rent ($/mo)</label>
                    <select class="rent" onchange="updateRent(${id});calculateScenario(${id})">
                        <option value="765">CoLab - $765</option>
                        <option value="965">CoLab +$200</option>
                        <option value="1285">CoLab 2BR</option>
                        <option value="0">Custom</option>
                    </select>
                </div>
                <div class="input-group full-width" id="scenario-${id}-customRentGroup" style="display:none">
                    <label>Custom Rent ($)</label>
                    <input type="number" class="customRent" value="765" onchange="calculateScenario(${id})">
                </div>
                <div class="input-group">
                    <label>Utilities ($)</label>
                    <input type="number" class="utilities" value="100" onchange="calculateScenario(${id})">
                </div>
                <div class="input-group">
                    <label>Internet ($)</label>
                    <input type="number" class="internet" value="80" onchange="calculateScenario(${id})">
                </div>
                <div class="input-group">
                    <label>Data Center Electricity ($)</label>
                    <input type="number" class="electricity" value="200" onchange="calculateScenario(${id})">
                </div>
            </div>
        </div>

        <!-- Transportation -->
        <div class="section">
            <h2>🚗 Transportation</h2>
            <div class="toggle-group">
                <button class="toggle-btn active" data-mode="car" onclick="setTransport(${id}, 'car');event.stopPropagation()">Car</button>
                <button class="toggle-btn" data-mode="bike" onclick="setTransport(${id}, 'bike');event.stopPropagation()">Bike</button>
                <button class="toggle-btn" data-mode="rent" onclick="setTransport(${id}, 'rent');event.stopPropagation()">Rent Out</button>
                <button class="toggle-btn" data-mode="none" onclick="setTransport(${id}, 'none');event.stopPropagation()">None</button>
            </div>
            
            <div class="transport-fields" id="scenario-${id}-carFields">
                <div class="input-grid">
                    <div class="input-group"><label>Insurance ($)</label><input type="number" class="insurance" value="260" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Gas ($)</label><input type="number" class="gas" value="210" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Maintenance ($)</label><input type="number" class="maintenance" value="20" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Tires ($)</label><input type="number" class="tires" value="16.67" step="0.01" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Parking ($)</label><input type="number" class="parking" value="200" onchange="calculateScenario(${id})"></div>
                </div>
            </div>
            
            <div class="transport-fields hidden" id="scenario-${id}-bikeFields">
                <div class="input-grid">
                    <div class="input-group"><label>Bike Cost ($)</label><input type="number" class="bikeCost" value="1500" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Bike Insurance ($)</label><input type="number" class="bikeInsurance" value="40" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Bike Maintenance ($)</label><input type="number" class="bikeMaintenance" value="20" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Bike Lifespan (months)</label><input type="number" class="bikeLifespan" value="60" onchange="calculateScenario(${id})"></div>
                </div>
            </div>
            
            <div class="transport-fields hidden" id="scenario-${id}-rentFields">
                <div class="input-grid">
                    <div class="input-group"><label>Rental Income ($)</label><input type="number" class="rentalIncome" value="400" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Rental Insurance ($)</label><input type="number" class="rentalInsurance" value="50" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Rental Maintenance ($)</label><input type="number" class="rentalMaintenance" value="50" onchange="calculateScenario(${id})"></div>
                </div>
            </div>
            
            <div class="transport-fields hidden" id="scenario-${id}-noneFields">
                <div class="input-grid">
                    <div class="input-group"><label>Rideshare ($)</label><input type="number" class="rideShare" value="200" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Public Transit ($)</label><input type="number" class="publicTransit" value="50" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Delivery Fees ($)</label><input type="number" class="deliveryFees" value="30" onchange="calculateScenario(${id})"></div>
                </div>
            </div>
            
            <div class="result-card inline">
                <h3>Transport Cost</h3>
                <div class="result-value" id="scenario-${id}-transport">$0</div>
            </div>
        </div>

        <!-- Food -->
        <div class="section">
            <h2>🍽️ Food</h2>
            <div class="toggle-group">
                <button class="toggle-btn active" data-mode="everyplate" onclick="setFood(${id}, 'everyplate');event.stopPropagation()">EveryPlate</button>
                <button class="toggle-btn" data-mode="groceries" onclick="setFood(${id}, 'groceries');event.stopPropagation()">Groceries</button>
                <button class="toggle-btn" data-mode="delivery" onclick="setFood(${id}, 'delivery');event.stopPropagation()">Delivery</button>
            </div>
            
            <div class="food-fields" id="scenario-${id}-everyplateFields">
                <div class="input-grid">
                    <div class="input-group"><label>EveryPlate ($)</label><input type="number" class="everyplateCost" value="560" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Delivery Fee ($)</label><input type="number" class="everyplateDelivery" value="11" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>GrubHub ($)</label><input type="number" class="grubhub" value="100" onchange="calculateScenario(${id})"></div>
                </div>
            </div>
            
            <div class="food-fields hidden" id="scenario-${id}-groceriesFields">
                <div class="input-grid">
                    <div class="input-group full-width"><label>Grocery Budget ($)</label><input type="number" class="groceryBudget" value="400" onchange="calculateScenario(${id})"></div>
                </div>
            </div>
            
            <div class="food-fields hidden" id="scenario-${id}-deliveryFields">
                <div class="input-grid">
                    <div class="input-group"><label>Delivery Budget ($)</label><input type="number" class="deliveryBudget" value="600" onchange="calculateScenario(${id})"></div>
                    <div class="input-group"><label>Walmart+ ($)</label><input type="number" class="walmartPlus" value="12.95" step="0.01" onchange="calculateScenario(${id})"></div>
                </div>
            </div>
            
            <div class="input-grid">
                <div class="input-group"><label><input type="checkbox" class="useSnap" checked onchange="calculateScenario(${id})"> Use SNAP</label></div>
                <div class="input-group"><label>SNAP Benefit ($)</label><input type="number" class="snapBenefit" value="306" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label><input type="checkbox" class="useFoodBank" onchange="calculateScenario(${id})"> Use Food Bank</label></div>
            </div>
            
            <div class="result-card inline">
                <h3>Food Cost</h3>
                <div class="result-value" id="scenario-${id}-food">$0</div>
            </div>
        </div>

        <!-- Technology -->
        <div class="section">
            <h2>💻 Technology</h2>
            <div class="input-grid">
                <div class="input-group"><label>Mac Studio ($)</label><input type="number" class="macStudio" value="400" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>Claude Pro ($)</label><input type="number" class="claudePro" value="20" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>Phone ($)</label><input type="number" class="phone" value="9" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>Starlink ($)</label><input type="number" class="starlink" value="0" onchange="calculateScenario(${id})"></div>
            </div>
            <div class="result-card inline">
                <h3>Tech Cost</h3>
                <div class="result-value" id="scenario-${id}-tech">$0</div>
            </div>
        </div>

        <!-- Education -->
        <div class="section">
            <h2>🎓 Education</h2>
            <div class="input-grid">
                <div class="input-group full-width">
                    <label>School</label>
                    <select class="school" onchange="updateSchool(${id});calculateScenario(${id})">
                        <option value="current">Current School</option>
                        <option value="msu">MSU</option>
                        <option value="none">None</option>
                    </select>
                </div>
                <div class="input-group full-width">
                    <label>Enrollment</label>
                    <select class="enrollment" onchange="calculateScenario(${id})">
                        <option value="full">Full-Time</option>
                        <option value="part">Part-Time</option>
                        <option value="none">None</option>
                    </select>
                </div>
                <div class="input-group"><label>Annual Tuition ($)</label><input type="number" class="tuition" value="11550" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>Books & Supplies ($/yr)</label><input type="number" class="books" value="1200" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>FAFSA Grant ($/yr)</label><input type="number" class="fafsaGrant" value="7395" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>COF Stipend ($/yr)</label><input type="number" class="cofStipend" value="0" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>FAFSA Loan ($/yr)</label><input type="number" class="fafsaLoan" value="0" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>Loan Interest (%)</label><input type="number" class="loanInterest" value="4.5" step="0.01" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>Years in School</label><input type="number" class="schoolYears" value="4" onchange="calculateScenario(${id})"></div>
            </div>
            <div class="result-card inline">
                <h3>Education Cost</h3>
                <div class="result-value" id="scenario-${id}-education">$0</div>
            </div>
        </div>

        <!-- Other Expenses -->
        <div class="section">
            <h2>💳 Other Expenses</h2>
            <div class="input-grid">
                <div class="input-group"><label>Health Insurance ($)</label><input type="number" class="healthInsurance" value="0" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>Medical ($)</label><input type="number" class="medical" value="50" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>Entertainment ($)</label><input type="number" class="entertainment" value="100" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>Clothing ($)</label><input type="number" class="clothing" value="50" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>Miscellaneous ($)</label><input type="number" class="miscellaneous" value="100" onchange="calculateScenario(${id})"></div>
            </div>
            <div class="result-card inline">
                <h3>Other Cost</h3>
                <div class="result-value" id="scenario-${id}-other">$0</div>
            </div>
        </div>

        <!-- Benefits -->
        <div class="section">
            <h2>🏥 Benefits</h2>
            <div class="input-grid">
                <div class="input-group"><label><input type="checkbox" class="medicaid" checked onchange="calculateScenario(${id})"> Medicaid</label></div>
                <div class="input-group"><label>Medicaid Savings ($)</label><input type="number" class="medicaidSavings" value="200" onchange="calculateScenario(${id})"></div>
                <div class="input-group"><label>Other Benefits ($)</label><input type="number" class="otherBenefits" value="0" onchange="calculateScenario(${id})"></div>
            </div>
            <div class="result-card inline">
                <h3>Total Benefits</h3>
                <div class="result-value" id="scenario-${id}-benefits">$0</div>
            </div>
        </div>

        <!-- Savings Goals -->
        <div class="section">
            <h2>🎯 Savings Goals</h2>
            <div class="input-grid">
                <div class="input-group"><label>Current Savings ($)</label><input type="number" class="currentSavings" value="0" onchange="calculateScenario(${id})"></div>
            </div>
        </div>

        <!-- 4-Year Projection -->
        <div class="section">
            <h2>📈 4-Year Financial Projection</h2>
            <div class="projection-chart" id="scenario-${id}-projection">
                <div class="projection-grid">
                    <div class="projection-header">
                        <div>Year</div>
                        <div>Savings</div>
                        <div>Debt</div>
                        <div>Net Worth</div>
                    </div>
                    <div class="projection-row">
                        <div>Year 1</div>
                        <div id="scenario-${id}-savings-y1">$0</div>
                        <div id="scenario-${id}-debt-y1">$0</div>
                        <div id="scenario-${id}-networth-y1">$0</div>
                    </div>
                    <div class="projection-row">
                        <div>Year 2</div>
                        <div id="scenario-${id}-savings-y2">$0</div>
                        <div id="scenario-${id}-debt-y2">$0</div>
                        <div id="scenario-${id}-networth-y2">$0</div>
                    </div>
                    <div class="projection-row">
                        <div>Year 3</div>
                        <div id="scenario-${id}-savings-y3">$0</div>
                        <div id="scenario-${id}-debt-y3">$0</div>
                        <div id="scenario-${id}-networth-y3">$0</div>
                    </div>
                    <div class="projection-row">
                        <div>Year 4</div>
                        <div id="scenario-${id}-savings-y4">$0</div>
                        <div id="scenario-${id}-debt-y4">$0</div>
                        <div id="scenario-${id}-networth-y4">$0</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Spend Analyzer -->
        <div class="section">
            <h2>💸 Spend Analyzer</h2>
            <div class="spend-analyzer" id="scenario-${id}-spend">
                <div class="spend-breakdown" id="scenario-${id}-spend-breakdown">
                    <div class="spend-item">
                        <div class="spend-label">Housing</div>
                        <div class="spend-bar-container"><div class="spend-bar" id="scenario-${id}-spend-housing-bar" style="width: 0%"></div></div>
                        <div class="spend-percent" id="scenario-${id}-spend-housing-pct">0%</div>
                        <div class="spend-amount" id="scenario-${id}-spend-housing-amt">$0</div>
                    </div>
                    <div class="spend-item">
                        <div class="spend-label">Transportation</div>
                        <div class="spend-bar-container"><div class="spend-bar" id="scenario-${id}-spend-transport-bar" style="width: 0%"></div></div>
                        <div class="spend-percent" id="scenario-${id}-spend-transport-pct">0%</div>
                        <div class="spend-amount" id="scenario-${id}-spend-transport-amt">$0</div>
                    </div>
                    <div class="spend-item">
                        <div class="spend-label">Food</div>
                        <div class="spend-bar-container"><div class="spend-bar" id="scenario-${id}-spend-food-bar" style="width: 0%"></div></div>
                        <div class="spend-percent" id="scenario-${id}-spend-food-pct">0%</div>
                        <div class="spend-amount" id="scenario-${id}-spend-food-amt">$0</div>
                    </div>
                    <div class="spend-item">
                        <div class="spend-label">Technology</div>
                        <div class="spend-bar-container"><div class="spend-bar" id="scenario-${id}-spend-tech-bar" style="width: 0%"></div></div>
                        <div class="spend-percent" id="scenario-${id}-spend-tech-pct">0%</div>
                        <div class="spend-amount" id="scenario-${id}-spend-tech-amt">$0</div>
                    </div>
                    <div class="spend-item">
                        <div class="spend-label">Education</div>
                        <div class="spend-bar-container"><div class="spend-bar" id="scenario-${id}-spend-education-bar" style="width: 0%"></div></div>
                        <div class="spend-percent" id="scenario-${id}-spend-education-pct">0%</div>
                        <div class="spend-amount" id="scenario-${id}-spend-education-amt">$0</div>
                    </div>
                    <div class="spend-item">
                        <div class="spend-label">Other</div>
                        <div class="spend-bar-container"><div class="spend-bar" id="scenario-${id}-spend-other-bar" style="width: 0%"></div></div>
                        <div class="spend-percent" id="scenario-${id}-spend-other-pct">0%</div>
                        <div class="spend-amount" id="scenario-${id}-spend-other-amt">$0</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    scenarioContentContainer.appendChild(content);
    
    // Initialize form fields
    initializeScenarioForm(id);
}

function initializeScenarioForm(id) {
    const scenario = getScenario(id);
    
    // Set transport mode
    setTransport(id, scenario.transportMode || 'car', true);
    
    // Set food mode
    setFood(id, scenario.foodMode || 'everyplate', true);
    
    // Update rent field visibility
    updateRent(id);
    
    // Calculate initial values
    calculateScenario(id);
}

function switchScenarioTab(id) {
    activeScenarioId = id;
    
    // Update tab styles
    document.querySelectorAll('.scenario-tab').forEach(tab => {
        tab.classList.remove('active');
        if (parseInt(tab.dataset.scenarioId) === id) {
            tab.classList.add('active');
        }
    });
    
    // Update content visibility
    document.querySelectorAll('.scenario-content').forEach(content => {
        content.classList.remove('active');
        if (parseInt(content.dataset.scenarioId) === id) {
            content.classList.add('active');
        }
    });
    
    saveState();
}

function renameScenario(id, newName) {
    const scenario = getScenario(id);
    scenario.name = newName;
    
    // Update tab
    const tab = document.querySelector(`.scenario-tab[data-scenario-id="${id}"] .tab-name`);
    if (tab) {
        tab.textContent = newName;
    }
    
    saveState();
    updateComparisonTable();
}

function duplicateScenario(id) {
    const original = getScenario(id);
    const newId = nextScenarioId++;
    
    const scenario = {
        id: newId,
        name: original.name + ' (Copy)',
        transportMode: original.transportMode,
        foodMode: original.foodMode,
        data: JSON.parse(JSON.stringify(original.data))
    };
    
    scenarios.push(scenario);
    
    // Create tab
    createScenarioTab(newId, scenario.name);
    
    // Create content
    createScenarioContent(newId, scenario.name);
    
    // Copy all form values
    copyScenarioFormValues(id, newId);
    
    // Switch to new scenario
    switchScenarioTab(newId);
    
    saveState();
}

function copyScenarioFormValues(fromId, toId) {
    const fromContent = document.querySelector(`.scenario-content[data-scenario-id="${fromId}"]`);
    const toContent = document.querySelector(`.scenario-content[data-scenario-id="${toId}"]`);
    
    if (fromContent && toContent) {
        const inputs = fromContent.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            const className = input.className;
            const toInput = toContent.querySelector(`.${className}`);
            if (toInput) {
                if (input.type === 'checkbox') {
                    toInput.checked = input.checked;
                } else {
                    toInput.value = input.value;
                }
            }
        });
        
        calculateScenario(toId);
    }
}

function deleteScenario(id) {
    if (scenarios.length <= 1) {
        alert('You must have at least one scenario');
        return;
    }
    
    scenarios = scenarios.filter(s => s.id !== id);
    
    const tab = document.querySelector(`.scenario-tab[data-scenario-id="${id}"]`);
    if (tab) tab.remove();
    
    const content = document.querySelector(`.scenario-content[data-scenario-id="${id}"]`);
    if (content) content.remove();
    
    if (activeScenarioId === id) {
        switchScenarioTab(scenarios[0].id);
    }
    
    saveState();
    updateComparisonTable();
}

function getScenario(id) {
    return scenarios.find(s => s.id === id);
}

// ============================================
// Form Handlers
// ============================================

function updateRent(id) {
    const content = document.querySelector(`.scenario-content[data-scenario-id="${id}"]`);
    if (!content) return;
    
    const rentSelect = content.querySelector('.rent');
    const customGroup = content.querySelector(`#scenario-${id}-customRentGroup`);
    
    if (rentSelect.value === '0') {
        customGroup.style.display = 'block';
    } else {
        customGroup.style.display = 'none';
    }
    
    calculateScenario(id);
}

function setTransport(id, mode, silent = false) {
    const scenario = getScenario(id);
    scenario.transportMode = mode;
    
    const content = document.querySelector(`.scenario-content[data-scenario-id="${id}"]`);
    if (!content) return;
    
    // Find the transportation section
    const transportSection = Array.from(content.querySelectorAll('.section')).find(s => 
        s.querySelector('h2') && s.querySelector('h2').textContent.includes('🚗')
    );
    
    if (transportSection) {
        transportSection.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = transportSection.querySelector(`button.toggle-btn[data-mode="${mode}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
    
    // Show/hide fields
    content.querySelectorAll(`.transport-fields`).forEach(field => {
        field.classList.add('hidden');
    });
    
    const fieldToShow = content.querySelector(`#scenario-${id}-${mode}Fields`);
    if (fieldToShow) {
        fieldToShow.classList.remove('hidden');
    }
    
    if (!silent) {
        calculateScenario(id);
        saveState();
    }
}

function setFood(id, mode, silent = false) {
    const scenario = getScenario(id);
    scenario.foodMode = mode;
    
    const content = document.querySelector(`.scenario-content[data-scenario-id="${id}"]`);
    if (!content) return;
    
    // Find the food section
    const foodSection = Array.from(content.querySelectorAll('.section')).find(s => 
        s.querySelector('h2') && s.querySelector('h2').textContent.includes('🍽️')
    );
    
    if (foodSection) {
        foodSection.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = foodSection.querySelector(`button.toggle-btn[data-mode="${mode}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
    
    // Show/hide fields
    content.querySelectorAll(`.food-fields`).forEach(field => {
        field.classList.add('hidden');
    });
    
    const fieldToShow = content.querySelector(`#scenario-${id}-${mode}Fields`);
    if (fieldToShow) {
        fieldToShow.classList.remove('hidden');
    }
    
    if (!silent) {
        calculateScenario(id);
        saveState();
    }
}

function updateSchool(id) {
    const content = document.querySelector(`.scenario-content[data-scenario-id="${id}"]`);
    if (!content) return;
    
    const school = content.querySelector('.school').value;
    const tuitionInput = content.querySelector('.tuition');
    const grantInput = content.querySelector('.fafsaGrant');
    
    if (school === 'msu') {
        tuitionInput.value = 9150;
        grantInput.value = 7395;
    } else if (school === 'current') {
        tuitionInput.value = 11550;
        grantInput.value = 7395;
    } else {
        tuitionInput.value = 0;
        grantInput.value = 0;
    }
    
    calculateScenario(id);
}

// ============================================
// Calculation Engine
// ============================================

function getValue(content, className) {
    const el = content.querySelector(`.${className}`);
    if (!el) return 0;
    return parseFloat(el.value) || 0;
}

function getChecked(content, className) {
    const el = content.querySelector(`.${className}`);
    return el ? el.checked : false;
}

function formatCurrency(amount) {
    if (!amount || amount === 0) return '$0';
    const rounded = Math.round(amount * 100) / 100;
    return '$' + rounded.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function calculateScenario(id) {
    const content = document.querySelector(`.scenario-content[data-scenario-id="${id}"]`);
    if (!content) return null;
    
    const scenario = getScenario(id);
    const globalTaxRate = parseFloat(document.getElementById('globalTaxRate').value) || 0;
    const dataCenterCost = parseFloat(document.getElementById('globalDataCenterCost').value) || 12000;
    const emergencyFund = parseFloat(document.getElementById('globalEmergencyFund').value) || 12000;
    
    // Calculate income
    const job1Rate = getValue(content, 'job1Rate');
    const job1Hours = getValue(content, 'job1Hours');
    const job2Rate = getValue(content, 'job2Rate');
    const job2Hours = getValue(content, 'job2Hours');
    const otherIncome = getValue(content, 'otherIncome');
    
    const weeklyEarnings = job1Rate * job1Hours + job2Rate * job2Hours;
    const monthlyGross = weeklyEarnings * 4.345;
    const totalGross = monthlyGross + otherIncome;
    const taxAmount = totalGross * (globalTaxRate / 100);
    const netIncome = totalGross - taxAmount;
    
    updateElement(content, `scenario-${id}-income`, formatCurrency(netIncome));
    
    // Calculate housing
    const rentSelect = content.querySelector('.rent');
    let rent = 0;
    if (rentSelect.value === '0') {
        rent = getValue(content, 'customRent');
    } else {
        rent = parseFloat(rentSelect.value) || 0;
    }
    const utilities = getValue(content, 'utilities');
    const internet = getValue(content, 'internet');
    const electricity = getValue(content, 'electricity');
    const housingTotal = rent + utilities + internet + electricity;
    
    // Calculate transportation
    let transportTotal = 0;
    const transportMode = scenario.transportMode || 'car';
    
    if (transportMode === 'car') {
        transportTotal = getValue(content, 'insurance') + getValue(content, 'gas') + 
                        getValue(content, 'maintenance') + getValue(content, 'tires') + 
                        getValue(content, 'parking');
    } else if (transportMode === 'bike') {
        const bikeCost = getValue(content, 'bikeCost');
        const lifespan = getValue(content, 'bikeLifespan') || 1;
        transportTotal = bikeCost / lifespan + getValue(content, 'bikeInsurance') + 
                        getValue(content, 'bikeMaintenance');
    } else if (transportMode === 'rent') {
        transportTotal = getValue(content, 'rentalInsurance') + getValue(content, 'rentalMaintenance') - 
                        getValue(content, 'rentalIncome');
    } else if (transportMode === 'none') {
        transportTotal = getValue(content, 'rideShare') + getValue(content, 'publicTransit') + 
                        getValue(content, 'deliveryFees');
    }
    
    updateElement(content, `scenario-${id}-transport`, formatCurrency(transportTotal));
    
    // Calculate food
    let foodTotal = 0;
    const foodMode = scenario.foodMode || 'everyplate';
    const useSnap = getChecked(content, 'useSnap');
    const snapBenefit = getValue(content, 'snapBenefit');
    const useFoodBank = getChecked(content, 'useFoodBank');
    const foodBankSavings = useFoodBank ? 150 : 0;
    
    if (foodMode === 'everyplate') {
        foodTotal = getValue(content, 'everyplateCost') + getValue(content, 'everyplateDelivery') + 
                   getValue(content, 'grubhub');
    } else if (foodMode === 'groceries') {
        foodTotal = getValue(content, 'groceryBudget');
    } else if (foodMode === 'delivery') {
        foodTotal = getValue(content, 'deliveryBudget') + getValue(content, 'walmartPlus');
    }
    
    if (useSnap) foodTotal -= snapBenefit;
    foodTotal -= foodBankSavings;
    foodTotal = Math.max(foodTotal, 0);
    
    updateElement(content, `scenario-${id}-food`, formatCurrency(foodTotal));
    
    // Calculate technology
    const techTotal = getValue(content, 'macStudio') + getValue(content, 'claudePro') + 
                     getValue(content, 'phone') + getValue(content, 'starlink');
    updateElement(content, `scenario-${id}-tech`, formatCurrency(techTotal));
    
    // Calculate education
    const tuition = getValue(content, 'tuition');
    const books = getValue(content, 'books');
    const grant = getValue(content, 'fafsaGrant');
    const stipend = getValue(content, 'cofStipend');
    const loan = getValue(content, 'fafsaLoan');
    const loanInterest = getValue(content, 'loanInterest');
    const schoolYears = getValue(content, 'schoolYears') || 4;
    
    const totalCost = tuition + books;
    const totalFunding = grant + stipend + loan;
    const eduMonthly = (totalCost - totalFunding) / 12;
    
    updateElement(content, `scenario-${id}-education`, formatCurrency(eduMonthly));
    
    // Calculate other
    const otherTotal = getValue(content, 'healthInsurance') + getValue(content, 'medical') + 
                      getValue(content, 'entertainment') + getValue(content, 'clothing') + 
                      getValue(content, 'miscellaneous');
    updateElement(content, `scenario-${id}-other`, formatCurrency(otherTotal));
    
    // Calculate benefits
    let benefitsTotal = 0;
    if (getChecked(content, 'medicaid')) {
        benefitsTotal += getValue(content, 'medicaidSavings');
    }
    benefitsTotal += getValue(content, 'otherBenefits');
    if (useSnap) benefitsTotal += snapBenefit;
    
    updateElement(content, `scenario-${id}-benefits`, formatCurrency(benefitsTotal));
    
    // Calculate total expenses
    const totalExpenses = housingTotal + transportTotal + foodTotal + techTotal + eduMonthly + otherTotal;
    
    // Calculate surplus
    const surplus = netIncome - totalExpenses;
    const annualSurplus = surplus * 12;
    
    // Update summary cards
    updateElement(content, `scenario-${id}-net`, formatCurrency(surplus));
    updateElement(content, `scenario-${id}-annual`, formatCurrency(annualSurplus));
    
    const netEl = content.querySelector(`#scenario-${id}-net`);
    if (netEl) {
        netEl.className = surplus >= 0 ? 'summary-value positive' : 'summary-value negative';
    }
    
    // Calculate 4-year projection
    calculate4YearProjection(id, content, surplus, annualSurplus, loan, loanInterest, schoolYears, dataCenterCost, emergencyFund);
    
    // Calculate spend analyzer
    calculateSpendAnalyzer(id, content, housingTotal, transportTotal, foodTotal, techTotal, eduMonthly, otherTotal, totalExpenses);
    
    // Calculate time to save
    const currentSavings = getValue(content, 'currentSavings');
    const totalGoal = dataCenterCost + emergencyFund;
    const remaining = totalGoal - currentSavings;
    
    let monthsToSave = 0;
    if (surplus > 0 && remaining > 0) {
        monthsToSave = Math.ceil(remaining / surplus);
    } else if (surplus <= 0) {
        monthsToSave = Infinity;
    }
    
    updateElement(content, `scenario-${id}-time`, monthsToSave === Infinity ? 'Never' : monthsToSave + ' months');
    
    const fourYearLabel = content.querySelector(`#scenario-${id}-4year-label`);
    if (fourYearLabel) {
        fourYearLabel.textContent = surplus >= 0 ? 'Net position' : 'Debt accumulated';
    }
    
    // Store results in scenario
    scenario.data = {
        netIncome: netIncome,
        totalExpenses: totalExpenses,
        surplus: surplus,
        annualSurplus: annualSurplus,
        housing: housingTotal,
        transport: transportTotal,
        food: foodTotal,
        tech: techTotal,
        education: eduMonthly,
        other: otherTotal,
        biggestExpense: getBiggestExpense(housingTotal, transportTotal, foodTotal, techTotal, eduMonthly, otherTotal)
    };
    
    updateComparisonTable();
    
    return scenario.data;
}

function getBiggestExpense(housing, transport, food, tech, education, other) {
    const expenses = {
        'Housing': housing,
        'Transportation': transport,
        'Food': food,
        'Technology': tech,
        'Education': education,
        'Other': other
    };
    
    return Object.entries(expenses).reduce((max, [key, value]) => 
        value > max.value ? { key, value } : max,
        { key: 'Housing', value: 0 }
    ).key;
}

function calculate4YearProjection(id, content, monthlySurplus, annualSurplus, loan, loanInterest, schoolYears, dataCenterCost, emergencyFund) {
    const currentSavings = getValue(content, 'currentSavings');
    
    let savings = currentSavings;
    let debt = 0;
    let totalLoanDebt = 0;
    
    if (loan > 0 && schoolYears > 0) {
        totalLoanDebt = loan * schoolYears * (1 + loanInterest / 100);
    }
    
    if (monthlySurplus < 0) {
        debt = Math.abs(monthlySurplus) * 48;
    }
    
    for (let year = 1; year <= 4; year++) {
        const yearSavings = savings + (monthlySurplus * 12);
        const yearDebt = debt;
        const netWorth = yearSavings - yearDebt - totalLoanDebt;
        
        updateElement(content, `scenario-${id}-savings-y${year}`, formatCurrency(yearSavings));
        updateElement(content, `scenario-${id}-debt-y${year}`, formatCurrency(yearDebt));
        updateElement(content, `scenario-${id}-networth-y${year}`, formatCurrency(netWorth));
        
        savings = yearSavings;
    }
    
    const fourYearNet = currentSavings + (monthlySurplus * 48) - totalLoanDebt;
    updateElement(content, `scenario-${id}-4year`, formatCurrency(fourYearNet));
    
    const fourYearEl = content.querySelector(`#scenario-${id}-4year`);
    if (fourYearEl) {
        fourYearEl.className = fourYearNet >= 0 ? 'summary-value positive' : 'summary-value negative';
    }
}

function calculateSpendAnalyzer(id, content, housing, transport, food, tech, education, other, total) {
    if (total === 0) {
        ['housing', 'transport', 'food', 'tech', 'education', 'other'].forEach(category => {
            updateElement(content, `scenario-${id}-spend-${category}-pct`, '0%');
            updateElement(content, `scenario-${id}-spend-${category}-amt`, '$0');
            const bar = content.querySelector(`#scenario-${id}-spend-${category}-bar`);
            if (bar) bar.style.width = '0%';
        });
        return;
    }
    
    const categories = [
        { name: 'housing', value: housing },
        { name: 'transport', value: transport },
        { name: 'food', value: food },
        { name: 'tech', value: tech },
        { name: 'education', value: education },
        { name: 'other', value: other }
    ];
    
    categories.forEach(cat => {
        const pct = (cat.value / total) * 100;
        const bar = content.querySelector(`#scenario-${id}-spend-${cat.name}-bar`);
        
        updateElement(content, `scenario-${id}-spend-${cat.name}-pct`, pct.toFixed(1) + '%');
        updateElement(content, `scenario-${id}-spend-${cat.name}-amt`, formatCurrency(cat.value));
        
        if (bar) {
            bar.style.width = pct + '%';
        }
    });
}

function updateElement(content, id, value) {
    const el = content.querySelector(`#${id}`);
    if (el) {
        el.textContent = value;
    }
}

// ============================================
// Comparison Table
// ============================================

function updateComparisonTable() {
    if (!comparisonTableBody) return;
    
    comparisonTableBody.innerHTML = '';
    
    scenarios.forEach(scenario => {
        const data = scenario.data || {};
        const surplus = data.surplus || 0;
        const annualSurplus = data.annualSurplus || 0;
        const netIncome = data.netIncome || 0;
        const fourYear = netIncome * 48 + (surplus * 48);
        const biggest = data.biggestExpense || 'N/A';
        const savingsRate = netIncome > 0 ? ((surplus / netIncome) * 100).toFixed(1) + '%' : '0%';
        const timeTo12k = surplus > 0 ? Math.ceil(12000 / surplus) + ' months' : 'Never';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${scenario.name}</td>
            <td class="${surplus >= 0 ? 'positive' : 'negative'}">${formatCurrency(surplus)}</td>
            <td class="${annualSurplus >= 0 ? 'positive' : 'negative'}">${formatCurrency(annualSurplus)}</td>
            <td class="${fourYear >= 0 ? 'positive' : 'negative'}">${formatCurrency(fourYear)}</td>
            <td>${biggest}</td>
            <td>${savingsRate}</td>
            <td>${timeTo12k}</td>
        `;
        
        comparisonTableBody.appendChild(row);
    });
}

// ============================================
// State Management
// ============================================

function saveState() {
    const state = {
        scenarios: scenarios.map(s => ({
            id: s.id,
            name: s.name,
            transportMode: s.transportMode,
            foodMode: s.foodMode,
            data: s.data
        })),
        nextScenarioId: nextScenarioId,
        activeScenarioId: activeScenarioId,
        globalSettings: {
            taxRate: document.getElementById('globalTaxRate').value,
            dataCenterCost: document.getElementById('globalDataCenterCost').value,
            emergencyFund: document.getElementById('globalEmergencyFund').value
        }
    };
    
    localStorage.setItem('lifeCalculatorState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('lifeCalculatorState');
    if (!saved) return;
    
    try {
        const state = JSON.parse(saved);
        
        scenarios = state.scenarios || [];
        nextScenarioId = state.nextScenarioId || 1;
        activeScenarioId = state.activeScenarioId || 0;
        
        if (state.globalSettings) {
            document.getElementById('globalTaxRate').value = state.globalSettings.taxRate || 16.78;
            document.getElementById('globalDataCenterCost').value = state.globalSettings.dataCenterCost || 12000;
            document.getElementById('globalEmergencyFund').value = state.globalSettings.emergencyFund || 12000;
        }
        
        // Recreate tabs and content
        scenarioTabsContainer.innerHTML = '';
        scenarioContentContainer.innerHTML = '';
        
        scenarios.forEach(scenario => {
            createScenarioTab(scenario.id, scenario.name);
            createScenarioContent(scenario.id, scenario.name);
            
            const scen = getScenario(scenario.id);
            scen.transportMode = scenario.transportMode || 'car';
            scen.foodMode = scenario.foodMode || 'everyplate';
            scen.data = scenario.data || {};
            
            initializeScenarioForm(scenario.id);
        });
        
        if (scenarios.length > 0) {
            switchScenarioTab(activeScenarioId);
        }
        
        updateComparisonTable();
        
    } catch (e) {
        console.error('Error loading state:', e);
    }
}

function updateAllScenarios() {
    scenarios.forEach(scenario => {
        calculateScenario(scenario.id);
    });
}

// ============================================
// Auto-save
// ============================================

document.addEventListener('input', () => {
    saveState();
});

window.onbeforeunload = () => {
    saveState();
};
