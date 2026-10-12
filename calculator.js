// Global state
let currentScenario = 'custom';
let transportMode = 'car';
let foodMode = 'everyplate';

// Initialize
function init() {
    updateRent();
    setTransport('car');
    setFood('everyplate');
    calculateAll();
}

// Call init when page loads
window.onload = init;

function getValue(id) {
    const el = document.getElementById(id);
    return parseFloat(el.value) || 0;
}

function getChecked(id) {
    return document.getElementById(id).checked;
}

function formatCurrency(amount) {
    if (!amount) return '$0';
    const rounded = Math.round(amount * 100) / 100;
    return '$' + rounded.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function updateRent() {
    const rentSelect = document.getElementById('rent');
    const customGroup = document.getElementById('customRentGroup');
    
    if (rentSelect.value === '0') {
        customGroup.style.display = 'block';
    } else {
        customGroup.style.display = 'none';
    }
}

function setTransport(mode) {
    transportMode = mode;
    
    // Update buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        if (btn.onclick.toString().includes('setTransport')) {
            btn.classList.remove('active');
        }
    });
    event.target.classList.add('active');
    
    // Hide all
    document.getElementById('carFields').style.display = 'none';
    document.getElementById('bikeFields').style.display = 'none';
    document.getElementById('rentFields').style.display = 'none';
    document.getElementById('noneFields').style.display = 'none';
    
    // Show selected
    if (mode === 'car') {
        document.getElementById('carFields').style.display = 'block';
    } else if (mode === 'bike') {
        document.getElementById('bikeFields').style.display = 'block';
    } else if (mode === 'rent') {
        document.getElementById('rentFields').style.display = 'block';
    } else if (mode === 'none') {
        document.getElementById('noneFields').style.display = 'block';
    }
    
    calculateAll();
}

function setFood(mode) {
    foodMode = mode;
    
    // Update buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        if (btn.onclick.toString().includes('setFood')) {
            btn.classList.remove('active');
        }
    });
    event.target.classList.add('active');
    
    // Hide all
    document.getElementById('everyplateFields').style.display = 'none';
    document.getElementById('groceriesFields').style.display = 'none';
    document.getElementById('deliveryFields').style.display = 'none';
    
    // Show selected
    if (mode === 'everyplate') {
        document.getElementById('everyplateFields').style.display = 'block';
    } else if (mode === 'groceries') {
        document.getElementById('groceriesFields').style.display = 'block';
    } else if (mode === 'delivery') {
        document.getElementById('deliveryFields').style.display = 'block';
    }
    
    calculateAll();
}

function updateSchool() {
    const school = document.getElementById('school').value;
    if (school === 'msu') {
        document.getElementById('tuition').value = 9150;
        document.getElementById('fafsaGrant').value = 7395;
    } else if (school === 'current') {
        document.getElementById('tuition').value = 11550;
        document.getElementById('fafsaGrant').value = 7395;
    } else {
        document.getElementById('tuition').value = 0;
        document.getElementById('fafsaGrant').value = 0;
    }
}

function calculateIncome() {
    const job1Rate = getValue('job1Rate');
    const job1Hours = getValue('job1Hours');
    const job2Rate = getValue('job2Rate');
    const job2Hours = getValue('job2Hours');
    const otherIncome = getValue('otherIncome');
    const taxRate = getValue('taxRate');
    
    const weeklyEarnings = job1Rate * job1Hours + job2Rate * job2Hours;
    const monthlyGross = weeklyEarnings * 4.345; // 52 weeks / 12 months
    const totalGross = monthlyGross + otherIncome;
    const taxAmount = totalGross * (taxRate / 100);
    const netIncome = totalGross - taxAmount;
    
    document.getElementById('incomeResult').textContent = formatCurrency(netIncome);
    
    return { gross: totalGross, net: netIncome, tax: taxAmount };
}

function calculateTransportation() {
    let cost = 0;
    
    if (transportMode === 'car') {
        cost = getValue('insurance') + getValue('gas') + getValue('maintenance') + 
               getValue('tires') + getValue('parking');
    } else if (transportMode === 'bike') {
        const bikeCost = getValue('bikeCost');
        const lifespan = getValue('bikeLifespan') || 1;
        cost = bikeCost / lifespan + getValue('bikeInsurance') + getValue('bikeMaintenance');
    } else if (transportMode === 'rent') {
        cost = getValue('rentalInsurance') + getValue('rentalMaintenance') - getValue('rentalIncome');
    } else if (transportMode === 'none') {
        cost = getValue('rideShare') + getValue('publicTransit') + getValue('deliveryFees');
    }
    
    document.getElementById('transportResult').textContent = formatCurrency(cost);
    return cost;
}

function calculateFood() {
    let cost = 0;
    const useSnap = getChecked('useSnap');
    const snapBenefit = getValue('snapBenefit');
    const useFoodBank = getChecked('useFoodBank');
    const foodBankSavings = useFoodBank ? 150 : 0;
    
    if (foodMode === 'everyplate') {
        cost = getValue('everyplateCost') + getValue('everyplateDelivery') + getValue('grubhub');
    } else if (foodMode === 'groceries') {
        cost = getValue('groceryBudget');
    } else if (foodMode === 'delivery') {
        cost = getValue('deliveryBudget') + getValue('walmartPlus');
    }
    
    if (useSnap) {
        cost -= snapBenefit;
    }
    cost -= foodBankSavings;
    cost = Math.max(cost, 0);
    
    document.getElementById('foodResult').textContent = formatCurrency(cost);
    return cost;
}

function calculateTechnology() {
    const cost = getValue('macStudio') + getValue('claudePro') + getValue('phone') + 
                getValue('starlink') + getValue('otherTech');
    document.getElementById('techResult').textContent = formatCurrency(cost);
    return cost;
}

function calculateHousing() {
    const rentSelect = document.getElementById('rent');
    let rent = 0;
    if (rentSelect.value === '0') {
        rent = getValue('customRent');
    } else {
        rent = parseFloat(rentSelect.value) || 0;
    }
    
    return rent + getValue('utilities') + getValue('internet') + getValue('electricity');
}

function calculateEducation() {
    const tuition = getValue('tuition');
    const books = getValue('books');
    const grant = getValue('fafsaGrant');
    const stipend = getValue('cofStipend');
    const loan = getValue('fafsaLoan');
    
    const totalCost = tuition + books;
    const totalFunding = grant + stipend + loan;
    const monthly = (totalCost - totalFunding) / 12;
    
    document.getElementById('educationResult').textContent = formatCurrency(monthly);
    return monthly;
}

function calculateOther() {
    const cost = getValue('healthInsurance') + getValue('medical') + getValue('entertainment') + 
                getValue('clothing') + getValue('miscellaneous');
    document.getElementById('otherResult').textContent = formatCurrency(cost);
    return cost;
}

function calculateBenefits() {
    let total = 0;
    if (getChecked('useSnap')) {
        total += getValue('snapBenefit');
    }
    if (getChecked('medicaid')) {
        total += getValue('medicaidSavings');
    }
    total += getValue('otherBenefits');
    
    document.getElementById('benefitsResult').textContent = formatCurrency(total);
    return total;
}

function calculateTotalExpenses() {
    return calculateHousing() + calculateTransportation() + calculateFood() + 
           calculateTechnology() + calculateEducation() + calculateOther();
}

function calculateSavings() {
    const income = calculateIncome().net;
    const expenses = calculateTotalExpenses();
    const surplus = income - expenses;
    
    const dataCenterCost = getValue('dataCenterCost');
    const emergencyFund = getValue('emergencyFund');
    const currentSavings = getValue('currentSavings');
    const totalGoal = dataCenterCost + emergencyFund;
    const remaining = totalGoal - currentSavings;
    
    let months = 0;
    if (surplus > 0 && remaining > 0) {
        months = Math.ceil(remaining / surplus);
    } else if (surplus <= 0) {
        months = Infinity;
    }
    
    document.getElementById('timeToSave').textContent = months === Infinity ? 'Never' : months + ' months';
    document.getElementById('savingsRate').textContent = formatCurrency(surplus);
    
    return { surplus: surplus, months: months };
}

function calculateAll() {
    const income = calculateIncome();
    const expenses = calculateTotalExpenses();
    const surplus = income.net - expenses;
    const savings = calculateSavings();
    const benefits = calculateBenefits();
    
    // Update summary
    document.getElementById('netIncome').textContent = formatCurrency(income.net);
    document.getElementById('totalExpenses').textContent = formatCurrency(expenses);
    
    if (surplus >= 0) {
        document.getElementById('surplus').textContent = formatCurrency(surplus);
        document.getElementById('surplus').className = 'result-value positive';
    } else {
        document.getElementById('surplus').textContent = formatCurrency(surplus);
        document.getElementById('surplus').className = 'result-value negative';
    }
    
    document.getElementById('annualSurplus').textContent = formatCurrency(surplus * 12);
    
    const savingsRate = income.net > 0 ? (surplus / income.net) * 100 : 0;
    document.getElementById('savingsRatePct').textContent = savingsRate.toFixed(1) + '%';
    
    // Debt projection
    let debt = 0;
    if (surplus < 0) {
        debt = Math.abs(surplus) * 48;
    }
    
    const loan = getValue('fafsaLoan');
    const interest = getValue('loanInterest');
    const years = getValue('schoolYears') || 4;
    
    if (loan > 0) {
        debt += loan * years * (1 + interest / 100);
    }
    
    document.getElementById('debt4Year').textContent = formatCurrency(debt);
    
    // Generate insights
    generateInsights(income, expenses, surplus, savings);
}

function generateInsights(income, expenses, surplus, savings) {
    let html = '';
    
    // Transportation
    const transportCost = calculateTransportation();
    if (transportMode === 'car') {
        html += `<div class="insight-item">
            <h4>Transportation</h4>
            <p>Your car costs ${formatCurrency(transportCost*12)} per year. 
            Selling it could free up significant funds. Consider if alternatives 
            would cost less.</p>
        </div>`;
    }
    
    // Food
    const foodCost = calculateFood();
    const useSnap = getChecked('useSnap');
    html += `<div class="insight-item">
        <h4>Food</h4>
        <p>Your food cost is ${formatCurrency(foodCost)} per month. 
        ${useSnap ? 'SNAP benefits help reduce this cost.' : 'You might qualify for SNAP benefits.'}
        ${getChecked('useFoodBank') ? 'Food bank saves ~$150/month.' : ''}</p>
    </div>`;
    
    // Savings
    if (savings.months === Infinity) {
        html += `<div class="insight-item">
            <h4>Warning!</h4>
            <p>You have a monthly deficit of ${formatCurrency(-savings.surplus)}. 
            You cannot reach your $12K goal at this rate. Consider cutting expenses 
            or increasing income.</p>
        </div>`;
    } else if (savings.months > 0) {
        html += `<div class="insight-item">
            <h4>Savings Goal</h4>
            <p>At your current rate, you'll reach your $12K goal in ${savings.months} months. 
            To reach it faster, save an additional ${formatCurrency(12000/savings.months - savings.surplus)}/month.</p>
        </div>`;
    }
    
    // Benefits
    if (income.gross < 2660) {
        html += `<div class="insight-item">
            <h4>Benefits</h4>
            <p>Your income (${formatCurrency(income.gross)}) qualifies you for SNAP. 
            Remember: SNAP decreases by $0.30 for every $1.00 income increase.</p>
        </div>`;
    }
    
    document.getElementById('insights').innerHTML = html;
}

function switchScenario(scenario) {
    currentScenario = scenario;
    
    document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (scenario === 'current') {
        document.getElementById('job1Hours').value = 24;
        document.getElementById('job2Hours').value = 8;
        document.getElementById('rent').value = '765';
        updateRent();
        setTransport('car');
        setFood('everyplate');
        document.getElementById('useSnap').checked = true;
        document.getElementById('useFoodBank').checked = false;
        document.getElementById('enrollment').value = 'part';
    } else if (scenario === 'no-car') {
        document.getElementById('job1Hours').value = 24;
        document.getElementById('job2Hours').value = 8;
        document.getElementById('rent').value = '765';
        updateRent();
        setTransport('none');
        setFood('delivery');
        document.getElementById('useSnap').checked = true;
        document.getElementById('useFoodBank').checked = true;
        document.getElementById('enrollment').value = 'part';
    } else if (scenario === 'bike') {
        document.getElementById('job1Hours').value = 24;
        document.getElementById('job2Hours').value = 8;
        document.getElementById('rent').value = '765';
        updateRent();
        setTransport('bike');
        setFood('groceries');
        document.getElementById('useSnap').checked = true;
        document.getElementById('useFoodBank').checked = true;
        document.getElementById('enrollment').value = 'part';
    } else if (scenario === 'school') {
        document.getElementById('job1Hours').value = 0;
        document.getElementById('job2Hours').value = 0;
        document.getElementById('rent').value = '765';
        updateRent();
        setTransport('car');
        setFood('everyplate');
        document.getElementById('useSnap').checked = true;
        document.getElementById('useFoodBank').checked = false;
        document.getElementById('enrollment').value = 'full';
        document.getElementById('school').value = 'msu';
        updateSchool();
    } else if (scenario === 'work') {
        document.getElementById('job1Hours').value = 40;
        document.getElementById('job2Hours').value = 0;
        document.getElementById('rent').value = '765';
        updateRent();
        setTransport('car');
        setFood('everyplate');
        document.getElementById('useSnap').checked = false;
        document.getElementById('useFoodBank').checked = false;
        document.getElementById('enrollment').value = 'none';
    } else if (scenario === 'save') {
        document.getElementById('job1Hours').value = 32;
        document.getElementById('job2Hours').value = 16;
        document.getElementById('rent').value = '765';
        updateRent();
        setTransport('car');
        setFood('groceries');
        document.getElementById('useSnap').checked = true;
        document.getElementById('useFoodBank').checked = true;
        document.getElementById('enrollment').value = 'none';
    }
    
    calculateAll();
}

function saveState() {
    return {
        job1Hours: document.getElementById('job1Hours').value,
        job2Hours: document.getElementById('job2Hours').value,
        rent: document.getElementById('rent').value,
        customRent: document.getElementById('customRent').value,
        transport: transportMode,
        food: foodMode,
        useSnap: document.getElementById('useSnap').checked,
        useFoodBank: document.getElementById('useFoodBank').checked,
        enrollment: document.getElementById('enrollment').value,
        school: document.getElementById('school').value
    };
}

function restoreState(state) {
    document.getElementById('job1Hours').value = state.job1Hours;
    document.getElementById('job2Hours').value = state.job2Hours;
    document.getElementById('rent').value = state.rent;
    document.getElementById('customRent').value = state.customRent;
    transportMode = state.transport;
    foodMode = state.food;
    document.getElementById('useSnap').checked = state.useSnap;
    document.getElementById('useFoodBank').checked = state.useFoodBank;
    document.getElementById('enrollment').value = state.enrollment;
    document.getElementById('school').value = state.school;
    
    updateRent();
    
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // This is a simplified version - in a real app, you'd need to track which button is active
}

function calculateAllScenarios() {
    const currentState = saveState();
    
    calculateAll();
    document.getElementById('compCurrent').textContent = document.getElementById('surplus').textContent;
    
    switchScenario('no-car');
    document.getElementById('compNoCar').textContent = document.getElementById('surplus').textContent;
    
    switchScenario('bike');
    document.getElementById('compBike').textContent = document.getElementById('surplus').textContent;
    
    switchScenario('work');
    document.getElementById('compWork').textContent = document.getElementById('surplus').textContent;
    
    switchScenario('school');
    document.getElementById('compSchool').textContent = document.getElementById('surplus').textContent;
    
    restoreState(currentState);
    calculateAll();
}
