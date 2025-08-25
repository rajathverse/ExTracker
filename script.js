class ExTracker {
    constructor() {
        this.data = {
            emis: JSON.parse(localStorage.getItem('emis')) || [],
            creditCards: JSON.parse(localStorage.getItem('creditCards')) || [],
            monthlyBills: JSON.parse(localStorage.getItem('monthlyBills')) || [],
            dailyExpenses: JSON.parse(localStorage.getItem('dailyExpenses')) || []
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderDashboard();
        this.renderAllSections();
        this.updateStats();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Form submissions
        document.getElementById('emiForm').addEventListener('submit', (e) => this.handleEMISubmit(e));
        document.getElementById('creditCardForm').addEventListener('submit', (e) => this.handleCreditCardSubmit(e));
        document.getElementById('monthlyBillForm').addEventListener('submit', (e) => this.handleMonthlyBillSubmit(e));
        document.getElementById('dailyExpenseForm').addEventListener('submit', (e) => this.handleDailyExpenseSubmit(e));
        document.getElementById('quickExpenseForm').addEventListener('submit', (e) => this.handleQuickExpenseSubmit(e));

        // Modal close on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
    }

    handleEMISubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const emi = {
            id: Date.now(),
            name: formData.get('name') || e.target.children[0].value,
            amount: parseFloat(formData.get('amount') || e.target.children[1].value),
            dueDate: formData.get('dueDate') || e.target.children[2].value,
            remainingMonths: parseInt(formData.get('remainingMonths') || e.target.children[3].value),
            paid: false
        };

        this.data.emis.push(emi);
        this.saveData('emis');
        this.renderEMIs();
        this.updateStats();
        e.target.reset();
        closeModal('emiModal');
    }

    handleCreditCardSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const creditCard = {
            id: Date.now(),
            name: formData.get('name') || e.target.children[0].value,
            amount: parseFloat(formData.get('amount') || e.target.children[1].value),
            dueDate: formData.get('dueDate') || e.target.children[2].value,
            paid: false
        };

        this.data.creditCards.push(creditCard);
        this.saveData('creditCards');
        this.renderCreditCards();
        this.updateStats();
        e.target.reset();
        closeModal('creditCardModal');
    }

    handleMonthlyBillSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const monthlyBill = {
            id: Date.now(),
            name: formData.get('name') || e.target.children[0].value,
            amount: parseFloat(formData.get('amount') || e.target.children[1].value),
            dueDate: formData.get('dueDate') || e.target.children[2].value,
            category: formData.get('category') || e.target.children[3].value,
            paid: false
        };

        this.data.monthlyBills.push(monthlyBill);
        this.saveData('monthlyBills');
        this.renderMonthlyBills();
        this.updateStats();
        e.target.reset();
        closeModal('monthlyBillModal');
    }

    handleDailyExpenseSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const dailyExpense = {
            id: Date.now(),
            description: formData.get('description') || e.target.children[0].value,
            amount: parseFloat(formData.get('amount') || e.target.children[1].value),
            category: formData.get('category') || e.target.children[2].value,
            date: new Date().toISOString().split('T')[0]
        };

        this.data.dailyExpenses.unshift(dailyExpense);
        this.saveData('dailyExpenses');
        this.renderDailyExpenses();
        this.updateStats();
        e.target.reset();
        closeModal('dailyExpenseModal');
    }

    handleQuickExpenseSubmit(e) {
        e.preventDefault();
        const inputs = e.target.querySelectorAll('input, select');
        const dailyExpense = {
            id: Date.now(),
            description: inputs[0].value,
            amount: parseFloat(inputs[1].value),
            category: inputs[2].value,
            date: new Date().toISOString().split('T')[0]
        };

        this.data.dailyExpenses.unshift(dailyExpense);
        this.saveData('dailyExpenses');
        this.renderDailyExpenses();
        this.updateStats();
        e.target.reset();
        
        // Show success animation
        const btn = e.target.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = '✓ Added!';
        btn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }

    renderDashboard() {
        this.renderChart();
        this.renderUpcomingPayments();
    }

    renderChart() {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        
        const categories = ['EMIs', 'Credit Cards', 'Monthly Bills', 'Daily Expenses'];
        const amounts = [
            this.data.emis.reduce((sum, emi) => sum + emi.amount, 0),
            this.data.creditCards.reduce((sum, cc) => sum + cc.amount, 0),
            this.data.monthlyBills.reduce((sum, bill) => sum + bill.amount, 0),
            this.data.dailyExpenses
                .filter(exp => new Date(exp.date).getMonth() === new Date().getMonth())
                .reduce((sum, exp) => sum + exp.amount, 0)
        ];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(76, 175, 80, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#e0e0e0' }
                    }
                }
            }
        });
    }

    renderUpcomingPayments() {
        const container = document.getElementById('upcomingPayments');
        const upcoming = [...this.data.emis, ...this.data.creditCards, ...this.data.monthlyBills]
            .filter(item => !item.paid)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);

        container.innerHTML = upcoming.map(item => `
            <div class="payment-item" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div>
                    <div style="font-weight: 600; color: #e0e0e0;">${item.name}</div>
                    <div style="font-size: 0.85rem; color: #a0a0a0;">${this.formatDate(item.dueDate)}</div>
                </div>
                <div style="font-weight: 700; color: #667eea;">₹${item.amount.toLocaleString()}</div>
            </div>
        `).join('');
    }

    renderAllSections() {
        this.renderEMIs();
        this.renderCreditCards();
        this.renderMonthlyBills();
        this.renderDailyExpenses();
    }

    renderEMIs() {
        const container = document.getElementById('emiCards');
        container.innerHTML = this.data.emis.map(emi => this.createPaymentCard(emi, 'emi')).join('');
    }

    renderCreditCards() {
        const container = document.getElementById('creditCardCards');
        container.innerHTML = this.data.creditCards.map(cc => this.createPaymentCard(cc, 'creditCard')).join('');
    }

    renderMonthlyBills() {
        const container = document.getElementById('monthlyBillCards');
        container.innerHTML = this.data.monthlyBills.map(bill => this.createPaymentCard(bill, 'monthlyBill')).join('');
    }

    renderDailyExpenses() {
        const container = document.getElementById('dailyExpenseList');
        
        // Update summary cards
        const today = new Date().toISOString().split('T')[0];
        const thisWeek = this.getWeekRange();
        const thisMonth = new Date().getMonth();

        const todayExpenses = this.data.dailyExpenses
            .filter(exp => exp.date === today)
            .reduce((sum, exp) => sum + exp.amount, 0);

        const weekExpenses = this.data.dailyExpenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate >= thisWeek.start && expDate <= thisWeek.end;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);

        const monthExpenses = this.data.dailyExpenses
            .filter(exp => new Date(exp.date).getMonth() === thisMonth)
            .reduce((sum, exp) => sum + exp.amount, 0);

        document.getElementById('todayExpenses').textContent = `₹${todayExpenses.toLocaleString()}`;
        document.getElementById('weekExpenses').textContent = `₹${weekExpenses.toLocaleString()}`;
        document.getElementById('monthExpenses').textContent = `₹${monthExpenses.toLocaleString()}`;

        // Render expense list
        container.innerHTML = this.data.dailyExpenses.slice(0, 20).map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-category">${this.getCategoryIcon(expense.category)} ${expense.category}</div>
                    <div style="font-size: 0.8rem; color: #a0a0a0;">${this.formatDate(expense.date)}</div>
                </div>
                <div class="expense-amount">₹${expense.amount.toLocaleString()}</div>
                <button onclick="tracker.deleteExpense(${expense.id})" style="background: rgba(244, 67, 54, 0.2); border: none; border-radius: 8px; padding: 8px 12px; color: #F44336; cursor: pointer; margin-left: 15px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    createPaymentCard(item, type) {
        const status = this.getPaymentStatus(item.dueDate, item.paid);
        const statusClass = `status-${status.toLowerCase()}`;
        
        return `
            <div class="payment-card">
                <div class="payment-header">
                    <div class="payment-name">${item.name}</div>
                    <div class="payment-amount">₹${item.amount.toLocaleString()}</div>
                </div>
                <div class="payment-details">
                    <div class="payment-date">Due: ${this.formatDate(item.dueDate)}</div>
                    <div class="payment-status ${statusClass}">${status}</div>
                </div>
                ${item.remainingMonths ? `<div style="color: #a0a0a0; font-size: 0.9rem;">Remaining: ${item.remainingMonths} months</div>` : ''}
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button onclick="tracker.togglePayment(${item.id}, '${type}')" 
                            style="flex: 1; background: ${item.paid ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)'}; 
                                   border: none; border-radius: 8px; padding: 10px; 
                                   color: ${item.paid ? '#F44336' : '#4CAF50'}; cursor: pointer;">
                        ${item.paid ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                    <button onclick="tracker.deleteItem(${item.id}, '${type}')" 
                            style="background: rgba(244, 67, 54, 0.2); border: none; border-radius: 8px; 
                                   padding: 10px 15px; color: #F44336; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    togglePayment(id, type) {
        const collection = type === 'emi' ? 'emis' : type === 'creditCard' ? 'creditCards' : 'monthlyBills';
        const item = this.data[collection].find(item => item.id === id);
        if (item) {
            item.paid = !item.paid;
            this.saveData(collection);
            this.renderAllSections();
            this.updateStats();
        }
    }

    deleteItem(id, type) {
        if (confirm('Are you sure you want to delete this item?')) {
            const collection = type === 'emi' ? 'emis' : type === 'creditCard' ? 'creditCards' : 'monthlyBills';
            this.data[collection] = this.data[collection].filter(item => item.id !== id);
            this.saveData(collection);
            this.renderAllSections();
            this.updateStats();
        }
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.data.dailyExpenses = this.data.dailyExpenses.filter(exp => exp.id !== id);
            this.saveData('dailyExpenses');
            this.renderDailyExpenses();
            this.updateStats();
        }
    }

    updateStats() {
        const totalExpenses = [
            ...this.data.emis.filter(item => !item.paid),
            ...this.data.creditCards.filter(item => !item.paid),
            ...this.data.monthlyBills.filter(item => !item.paid)
        ].reduce((sum, item) => sum + item.amount, 0) + 
        this.data.dailyExpenses
            .filter(exp => new Date(exp.date).getMonth() === new Date().getMonth())
            .reduce((sum, exp) => sum + exp.amount, 0);

        const pendingPayments = [
            ...this.data.emis.filter(item => !item.paid),
            ...this.data.creditCards.filter(item => !item.paid),
            ...this.data.monthlyBills.filter(item => !item.paid)
        ].length;

        document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toLocaleString()}`;
        document.getElementById('pendingPayments').textContent = pendingPayments;
    }

    getPaymentStatus(dueDate, paid) {
        if (paid) return 'Paid';
        
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'Overdue';
        if (diffDays <= 3) return 'Due Soon';
        return 'Pending';
    }

    getCategoryIcon(category) {
        const icons = {
            food: '🍽️',
            grocery: '🛒',
            transport: '🚗',
            shopping: '🛍️',
            entertainment: '🎬',
            utilities: '⚡',
            subscription: '📱',
            rent: '🏠',
            other: '📋'
        };
        return icons[category] || '📋';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    getWeekRange() {
        const today = new Date();
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        return { start: firstDay, end: lastDay };
    }

    saveData(key) {
        localStorage.setItem(key, JSON.stringify(this.data[key]));
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Initialize the app
const tracker = new ExTracker();

// Add some demo data if storage is empty
if (tracker.data.emis.length === 0) {
    tracker.data.emis = [
        { id: 1, name: 'Home Loan', amount: 25000, dueDate: '2024-01-15', remainingMonths: 180, paid: false },
        { id: 2, name: 'Car Loan', amount: 15000, dueDate: '2024-01-20', remainingMonths: 36, paid: true }
    ];
    tracker.data.creditCards = [
        { id: 1, name: 'HDFC Credit Card', amount: 8500, dueDate: '2024-01-10', paid: false },
        { id: 2, name: 'SBI Credit Card', amount: 12000, dueDate: '2024-01-25', paid: false }
    ];
    tracker.data.monthlyBills = [
        { id: 1, name: 'Electricity Bill', amount: 3200, dueDate: '2024-01-05', category: 'utilities', paid: true },
        { id: 2, name: 'Netflix Subscription', amount: 799, dueDate: '2024-01-12', category: 'subscription', paid: false }
    ];
    tracker.data.dailyExpenses = [
        { id: 1, description: 'Grocery Shopping', amount: 2500, category: 'grocery', date: '2024-01-02' },
        { id: 2, description: 'Fuel', amount: 1200, category: 'transport', date: '2024-01-02' },
        { id: 3, description: 'Restaurant', amount: 850, category: 'food', date: '2024-01-01' }
    ];
    
    // Save demo data
    Object.keys(tracker.data).forEach(key => tracker.saveData(key));
    tracker.renderAllSections();
    tracker.updateStats();
}
