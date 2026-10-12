// ============================================
// Life Calculator Pro - Multi-Scenario Financial Planner
// ============================================

// Global state
let scenarios = [];
let nextScenarioId = 0;
let activeScenarioId = 0;

// DOM Elements
let container = null;
let scenarioTabsContainer = null;
let scenarioContentContainer = null;
let comparisonTableBody = null;

// ============================================
// Initialization
// ============================================

function init() {
    container = document.querySelector('.container');
    scenarioTabsContainer = document.querySelector('.scenario-tabs');
    scenarioContentContainer = document.querySelector('.scenario-content-container');
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
    const addBtn = scenarioTabsContainer.parentElement.querySelector('.add-scenario-btn');
    scenarioTabsContainer.insertBefore(tab, addBtn);
}

function createScenarioContent(id, name) {
    // Get template
    const template = document.getElementById('scenarioTemplate');
    let content = template.innerHTML;
    
    // Replace placeholders
    content = content.replace(/__ID__/g, id);
    content = content.replace(/__NAME__/g, name);
    
    // Create container
    const div = document.createElement('div');
    div.className = 'scenario-content';
    div.dataset.scenarioId = id;
    div.innerHTML = content;
    
    // Add to container
    scenarioContentContainer.appendChild(div);
    
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
    
    // Save state
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
        // Get all inputs from source
        const inputs = fromContent.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            const name = input.className;
            const toInput = toContent.querySelector(`.${name}`);
            if (toInput) {
                if (input.type === 'checkbox') {
                    toInput.checked = input.checked;
                } else {
                    toInput.value = input.value;
                }
            }
        });
        
        // Recalculate
        calculateScenario(toId);
    }
}

function deleteScenario(id) {
    if (scenarios.length <= 1) {
        alert('You must have at least one scenario');
        return;
    }
    
    // Remove from array
    scenarios = scenarios.filter(s => s.id !== id);
    
    // Remove tab
    const tab = document.querySelector(`.scenario-tab[data-scenario-id="${id}"]`);
    if (tab) {
        tab.remove();
    }
    
    // Remove content
    const content = document.querySelector(`.scenario-content[data-scenario-id="${id}"]`);
    if (content) {
        content.remove();
    }
    
    // Switch to first scenario
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
        s.querySelector('h2') && s.querySelector('h2').textContent.includes('Transportation')
    );
    
    if (transportSection) {
        // Update all transport toggle buttons
        transportSection.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Activate the clicked button by matching data-mode
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
        s.querySelector('h2') && s.querySelector('h2').textContent.includes('Food')
    );
    
    if (foodSection) {
        // Update all food toggle buttons
        foodSection.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Activate the clicked button by matching data-mode
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
    
    // Update income display
    const incomeEl = content.querySelector(`#scenario-${id}-income`);
    if (incomeEl) incomeEl.textContent = formatCurrency(netIncome);
    
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
    
    const transportEl = content.querySelector(`#scenario-${id}-transport`);
    if (transportEl) transportEl.textContent = formatCurrency(transportTotal);
    
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
    
    if (useSnap) {
        foodTotal -= snapBenefit;
    }
    foodTotal -= foodBankSavings;
    foodTotal = Math.max(foodTotal, 0);
    
    const foodEl = content.querySelector(`#scenario-${id}-food`);
    if (foodEl) foodEl.textContent = formatCurrency(foodTotal);
    
    // Calculate technology
    const techTotal = getValue(content, 'macStudio') + getValue(content, 'claudePro') + 
                     getValue(content, 'phone') + getValue(content, 'starlink');
    const techEl = content.querySelector(`#scenario-${id}-tech`);
    if (techEl) techEl.textContent = formatCurrency(techTotal);
    
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
    
    const eduEl = content.querySelector(`#scenario-${id}-education`);
    if (eduEl) eduEl.textContent = formatCurrency(eduMonthly);
    
    // Calculate other
    const otherTotal = getValue(content, 'healthInsurance') + getValue(content, 'medical') + 
                      getValue(content, 'entertainment') + getValue(content, 'clothing') + 
                      getValue(content, 'miscellaneous');
    const otherEl = content.querySelector(`#scenario-${id}-other`);
    if (otherEl) otherEl.textContent = formatCurrency(otherTotal);
    
    // Calculate benefits
    let benefitsTotal = 0;
    if (getChecked(content, 'medicaid')) {
        benefitsTotal += getValue(content, 'medicaidSavings');
    }
    benefitsTotal += getValue(content, 'otherBenefits');
    if (useSnap) {
        benefitsTotal += snapBenefit;
    }
    
    const benefitsEl = content.querySelector(`#scenario-${id}-benefits`);
    if (benefitsEl) benefitsEl.textContent = formatCurrency(benefitsTotal);
    
    // Calculate total expenses
    const totalExpenses = housingTotal + transportTotal + foodTotal + techTotal + eduMonthly + otherTotal;
    
    // Calculate surplus
    const surplus = netIncome - totalExpenses;
    const annualSurplus = surplus * 12;
    
    // Update summary cards
    updateElement(content, `scenario-${id}-net`, formatCurrency(surplus));
    updateElement(content, `scenario-${id}-annual`, formatCurrency(annualSurplus));
    
    // Update summary card colors
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
    
    // Update 4-year projection label
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
    
    // Update comparison table
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
    const totalGoal = dataCenterCost + emergencyFund;
    
    let savings = currentSavings;
    let debt = 0;
    let totalLoanDebt = 0;
    
    // Calculate loan debt
    if (loan > 0 && schoolYears > 0) {
        totalLoanDebt = loan * schoolYears * (1 + loanInterest / 100);
    }
    
    // If we have a deficit, we're accumulating debt
    if (monthlySurplus < 0) {
        debt = Math.abs(monthlySurplus) * 48; // 4 years * 12 months
    }
    
    // Calculate year-by-year
    for (let year = 1; year <= 4; year++) {
        const yearSavings = savings + (monthlySurplus * 12);
        const yearDebt = debt;
        const netWorth = yearSavings - yearDebt - totalLoanDebt;
        
        // Update elements
        updateElement(content, `scenario-${id}-savings-y${year}`, formatCurrency(yearSavings));
        updateElement(content, `scenario-${id}-debt-y${year}`, formatCurrency(yearDebt));
        updateElement(content, `scenario-${id}-networth-y${year}`, formatCurrency(netWorth));
        
        savings = yearSavings;
    }
    
    // Update 4-year summary
    const fourYearNet = currentSavings + (monthlySurplus * 48) - totalLoanDebt;
    updateElement(content, `scenario-${id}-4year`, formatCurrency(fourYearNet));
    
    const fourYearEl = content.querySelector(`#scenario-${id}-4year`);
    if (fourYearEl) {
        fourYearEl.className = fourYearNet >= 0 ? 'summary-value positive' : 'summary-value negative';
    }
}

function calculateSpendAnalyzer(id, content, housing, transport, food, tech, education, other, total) {
    if (total === 0) {
        // Set all to 0%
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
    
    // Clear existing rows
    comparisonTableBody.innerHTML = '';
    
    // Add rows for each scenario
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
        
        // Restore scenarios
        scenarios = state.scenarios || [];
        nextScenarioId = state.nextScenarioId || 1;
        activeScenarioId = state.activeScenarioId || 0;
        
        // Restore global settings
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
            
            // Restore scenario-specific state
            const scen = getScenario(scenario.id);
            scen.transportMode = scenario.transportMode || 'car';
            scen.foodMode = scenario.foodMode || 'everyplate';
            scen.data = scenario.data || {};
            
            // Initialize form
            initializeScenarioForm(scenario.id);
        });
        
        // Switch to active scenario
        if (scenarios.length > 0) {
            switchScenarioTab(activeScenarioId);
        }
        
        // Update comparison table
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
// Utility Functions
// ============================================

// Auto-save on any change
document.addEventListener('input', () => {
    saveState();
});

// Save on page unload
window.onbeforeunload = () => {
    saveState();
};
