// Expense Tracker App - Data Management & UI Logic

class ExpenseTracker {
    constructor() {
        this.currentMonth = new Date(2025, 10, 1); // Nov-25
        this.expenses = this.loadExpenses();
        this.creditCards = this.loadCreditCards();
        this.investments = this.loadInvestments();
        this.currentFilter = 'all';
        this.editingExpenseId = null;
        this.editingCardId = null;
        this.editingInvestmentId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeWithSampleData();
        this.initializeCreditCardData();
        this.initializeInvestmentData();
        this.restoreActiveTab();
        // Render immediately with localStorage data (instant!)
        this.render();
    }

    async initializeApp() {
        // Called after authentication to sync with DynamoDB
        await this.loadExpensesFromAPI();
        await this.loadCreditCardsFromAPI();
        // loadExpensesFromAPI already calls render() with fresh data
    }

    setupEventListeners() {
        // Tab navigation for commitment tabs
        document.querySelectorAll('.commitment-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.dataset.tab;
                
                // Switch tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(targetTab + 'Tab').classList.add('active');
                
                // Save active tab to localStorage
                localStorage.setItem('activeTab', targetTab);
            });
        });

        // Month navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));

        // Add expense button
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.openModal());

        // Add EMI button
        document.getElementById('addEmiBtn').addEventListener('click', () => this.openModalForLoan());

        // Add Credit Card button
        document.getElementById('addCardBtn').addEventListener('click', () => this.openCreditCardModal());

        // Add Investment button
        document.getElementById('addInvestmentBtn').addEventListener('click', () => this.openInvestmentModal());

        // Add Recurring Expense button
        document.getElementById('addRecurringBtn').addEventListener('click', () => this.openRecurringExpenseModal());

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.handleSubmit(e));

        // Credit Card Modal controls
        document.getElementById('closeCardModal').addEventListener('click', () => this.closeCreditCardModal());
        document.getElementById('cancelCardBtn').addEventListener('click', () => this.closeCreditCardModal());
        document.getElementById('creditCardForm').addEventListener('submit', (e) => this.handleCardSubmit(e));

        // Investment Modal controls
        document.getElementById('closeInvestmentModal').addEventListener('click', () => this.closeInvestmentModal());
        document.getElementById('cancelInvestmentBtn').addEventListener('click', () => this.closeInvestmentModal());
        document.getElementById('investmentForm').addEventListener('submit', (e) => this.handleInvestmentSubmit(e));

        // Recurring Expense Modal controls
        document.getElementById('closeRecurringExpenseModal').addEventListener('click', () => this.closeRecurringExpenseModal());
        document.getElementById('cancelRecurringBtn').addEventListener('click', () => this.closeRecurringExpenseModal());
        document.getElementById('recurringExpenseForm').addEventListener('submit', (e) => this.handleRecurringExpenseSubmit(e));
        
        // Recurring category change - show/hide "Other" name field
        document.getElementById('recurringCategory').addEventListener('change', (e) => {
            const otherNameGroup = document.getElementById('recurringOtherNameGroup');
            const otherNameInput = document.getElementById('recurringOtherName');
            if (e.target.value === 'Other') {
                otherNameGroup.style.display = 'block';
                otherNameInput.setAttribute('required', 'required');
            } else {
                otherNameGroup.style.display = 'none';
                otherNameInput.removeAttribute('required');
                otherNameInput.value = '';
            }
        });

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleFilterChange(e));
        });

        // Click outside modal to close
        document.getElementById('expenseModal').addEventListener('click', (e) => {
            if (e.target.id === 'expenseModal') this.closeModal();
        });

        // Click outside credit card modal to close
        document.getElementById('creditCardModal').addEventListener('click', (e) => {
            if (e.target.id === 'creditCardModal') this.closeCreditCardModal();
        });

        // Click outside investment modal to close
        document.getElementById('investmentModal').addEventListener('click', (e) => {
            if (e.target.id === 'investmentModal') this.closeInvestmentModal();
        });

        // Click outside recurring expense modal to close
        document.getElementById('recurringExpenseModal').addEventListener('click', (e) => {
            if (e.target.id === 'recurringExpenseModal') this.closeRecurringExpenseModal();
        });

        // Delete modal controls
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.confirmDelete());
        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') this.closeDeleteModal();
        });

        // Recurring checkbox toggle EMI fields
        document.getElementById('isRecurring').addEventListener('change', (e) => {
            const emiRow = document.getElementById('emiDetailsRow');
            emiRow.style.display = e.target.checked ? 'grid' : 'none';
        });
    }

    // Data Management
    loadExpenses() {
        // HYBRID: Load from localStorage immediately for instant UI
        const saved = localStorage.getItem('expenses');
        return saved ? JSON.parse(saved) : {};
    }

    async loadExpensesFromAPI() {
        try {
            const apiExpenses = await API.getExpenses();
            this.expenses = apiExpenses;
            
            // Save to localStorage for instant load next time
            localStorage.setItem('expenses', JSON.stringify(apiExpenses));
            
            // Render with fresh data
            this.render();
        } catch (error) {
            console.error('Failed to load expenses from API:', error);
        }
    }

    saveExpenses() {
        // Save to localStorage for instant load on refresh
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    getMonthKey() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[this.currentMonth.getMonth()]}-${this.currentMonth.getFullYear().toString().slice(-2)}`;
    }

    getCurrentExpenses() {
        const monthKey = this.getMonthKey();
        if (!this.expenses[monthKey]) {
            this.expenses[monthKey] = [];
        }
        return this.expenses[monthKey];
    }

    getExpenseById(id) {
        const monthKey = this.getMonthKey();
        const expenses = this.expenses[monthKey] || [];
        return expenses.find(exp => exp.id === id);
    }

    initializeWithSampleData() {
        // Start with empty data - user will add their own expenses
        const monthKey = this.getMonthKey();
        if (!this.expenses[monthKey]) {
            this.expenses[monthKey] = [];
            this.saveExpenses();
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async addExpense(expense) {
        const monthKey = this.getMonthKey();
        if (!this.expenses[monthKey]) {
            this.expenses[monthKey] = [];
        }
        
        try {
            const addedExpense = await API.addExpense(expense, monthKey);
            addedExpense.status = addedExpense.isPaid ? 'paid' : 'pending';
            this.expenses[monthKey].push(addedExpense);
            this.saveExpenses(); // Save to localStorage
            this.render();
        } catch (error) {
            console.error('Failed to add expense:', error);
            alert('Failed to add expense. Please try again.');
            throw error;
        }
    }

    async updateExpense(id, updatedExpense) {
        const monthKey = this.getMonthKey();
        const index = this.expenses[monthKey].findIndex(exp => exp.id === id);
        if (index !== -1) {
            try {
                await API.updateExpense(id, updatedExpense, monthKey);
                this.expenses[monthKey][index] = { ...this.expenses[monthKey][index], ...updatedExpense };
                this.saveExpenses(); // Save to localStorage
                this.render();
            } catch (error) {
                console.error('Failed to update expense:', error);
                alert('Failed to update expense. Please try again.');
                throw error;
            }
        }
    }

    async deleteExpense(id, deleteFromFutureMonths = false) {
        const monthKey = this.getMonthKey();
        const expense = this.expenses[monthKey]?.find(exp => exp.id === id);
        
        try {
            await API.deleteExpense(id);
            
            // Delete from current month in local cache
            this.expenses[monthKey] = this.expenses[monthKey].filter(exp => exp.id !== id);
            
            // If it's a recurring expense and user wants to delete from future months
            if (deleteFromFutureMonths && expense && expense.isRecurring) {
                this.deleteFromAllFutureMonths(expense);
            }
            
            this.saveExpenses(); // Save to localStorage
            this.render();
        } catch (error) {
            console.error('Failed to delete expense:', error);
            alert('Failed to delete expense. Please try again.');
            throw error;
        }
        
        this.saveExpenses();
    }

    deleteFromAllFutureMonths(expenseToDelete) {
        const currentMonth = new Date(this.currentMonth);
        const currentYear = currentMonth.getFullYear();
        const currentMonthNum = currentMonth.getMonth();
        
        // Check all months in localStorage
        Object.keys(this.expenses).forEach(monthKey => {
            // Parse the month key (e.g., "Dec-25")
            const [monthStr, yearStr] = monthKey.split('-');
            const monthDate = new Date(`${monthStr} 20${yearStr}`);
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            
            // Only process future months
            if (year > currentYear || (year === currentYear && month > currentMonthNum)) {
                // Remove matching recurring expenses from future months
                // Match by category, where, amount (identifying characteristics)
                this.expenses[monthKey] = this.expenses[monthKey].filter(exp => {
                    // Keep the expense if it doesn't match the one being deleted
                    return !(
                        exp.isRecurring &&
                        exp.category === expenseToDelete.category &&
                        exp.where === expenseToDelete.where &&
                        exp.amount === expenseToDelete.amount
                    );
                });
            }
        });
    }

    async togglePaidStatus(id) {
        const monthKey = this.getMonthKey();
        const expense = this.expenses[monthKey].find(exp => exp.id === id);
        if (expense) {
            // Prevent double-click
            if (expense._updating) return;
            expense._updating = true;
            
            const newStatus = expense.status === 'paid' ? 'pending' : 'paid';
            const paidAt = newStatus === 'paid' ? new Date().toISOString() : null;
            
            const updates = {
                isPaid: newStatus === 'paid',
                paidAmount: newStatus === 'paid' ? expense.amount : 0,
                paidAt: paidAt
            };
            
            // Update local expense object
            expense.status = newStatus;
            expense.isPaid = newStatus === 'paid';
            expense.paidAmount = newStatus === 'paid' ? expense.amount : 0;
            expense.paidAt = paidAt;
            
            try {
                await this.updateExpense(id, updates);
                this.saveExpenses(); // Save to localStorage
            } catch (error) {
                // Error already shown
            } finally {
                delete expense._updating;
            }
        }
    }

    // UI Methods
    changeMonth(direction) {
        // Only copy recurring expenses when moving forward to next month
        if (direction === 1) {
            this.copyRecurringExpensesToNextMonth();
        }
        
        this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
        this.render();
    }

    copyRecurringExpensesToNextMonth() {
        const currentMonthKey = this.getMonthKey();
        const nextMonth = new Date(this.currentMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthKey = `${nextMonth.toLocaleString('en-US', { month: 'short' })}-${nextMonth.getFullYear().toString().slice(-2)}`;
        
        // Get current month's expenses
        const currentExpenses = this.expenses[currentMonthKey] || [];
        
        // Check if next month already has expenses (don't duplicate)
        if (!this.expenses[nextMonthKey]) {
            this.expenses[nextMonthKey] = [];
        }
        
        // If next month already has recurring expenses, don't copy again
        const nextMonthHasRecurring = this.expenses[nextMonthKey].some(exp => exp.isRecurring);
        if (nextMonthHasRecurring) {
            return; // Already copied, don't duplicate
        }
        
        // Filter recurring expenses from current month
        const recurringExpenses = currentExpenses.filter(exp => exp.isRecurring);
        
        // Copy each recurring expense to next month
        recurringExpenses.forEach(expense => {
            const newExpense = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                category: expense.category,
                where: expense.where,
                amount: expense.amount,
                dueDate: expense.dueDate,
                isRecurring: true,
                status: 'pending', // Reset to unpaid
                paidAt: null
            };
            
            // For Loan EMIs - increment emiPaid
            if (expense.category === 'LOAN' && expense.emiTotal) {
                const newEmiPaid = (expense.emiPaid || 0) + 1;
                const emiTotal = expense.emiTotal || 0;
                
                // Only copy if not fully paid
                if (newEmiPaid <= emiTotal) {
                    newExpense.emiPaid = newEmiPaid;
                    newExpense.emiTotal = emiTotal;
                    this.expenses[nextMonthKey].push(newExpense);
                }
                // If fully paid, don't copy to next month
            }
            // For Investment SIPs - increment emiPaid (months paid)
            else if (expense.category === 'INVESTMENT' && expense.emiTotal !== undefined) {
                const newMonthsPaid = (expense.emiPaid || 0) + 1;
                const totalMonths = expense.emiTotal || 0;
                
                // Copy if unlimited (totalMonths = 0) or not reached limit
                if (totalMonths === 0 || newMonthsPaid <= totalMonths) {
                    newExpense.emiPaid = newMonthsPaid;
                    newExpense.emiTotal = totalMonths;
                    this.expenses[nextMonthKey].push(newExpense);
                }
                // If reached total months, don't copy to next month
            }
            // For regular recurring expenses (rent, OTT, etc.)
            else if (!expense.emiTotal) {
                this.expenses[nextMonthKey].push(newExpense);
            }
        });
        
        // Save updated expenses
        this.saveExpenses();
    }

    restoreActiveTab() {
        const savedTab = localStorage.getItem('activeTab');
        if (savedTab && savedTab !== 'expenses') {
            // Remove active class from all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Activate saved tab content
            const tabContent = document.getElementById(savedTab + 'Tab');
            
            if (tabContent) {
                tabContent.classList.add('active');
            }
        } else {
            // Make sure expenses tab is active by default
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            const expensesTab = document.getElementById('expensesTab');
            if (expensesTab) {
                expensesTab.classList.add('active');
            }
        }
    }

    handleFilterChange(e) {
        document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.render();
    }

    openModal(expense = null) {
        const modal = document.getElementById('expenseModal');
        const form = document.getElementById('expenseForm');
        const title = document.getElementById('modalTitle');
        const emiRow = document.getElementById('emiDetailsRow');
        const recurringGroup = document.getElementById('isRecurring').parentElement.parentElement;
        const categoryGroup = document.getElementById('categoryGroup');
        const categoryInput = document.getElementById('category');
        const bankNameGroup = document.getElementById('bankNameGroup');
        const bankNameInput = document.getElementById('bankName');

        // Show category field for regular expenses and restore required attribute
        categoryGroup.style.display = 'block';
        categoryInput.setAttribute('required', 'required');
        recurringGroup.style.display = 'none';
        emiRow.style.display = 'none';
        
        // Hide bank name field for regular expenses
        bankNameGroup.style.display = 'none';
        bankNameInput.removeAttribute('required');

        if (expense) {
            // Edit mode
            this.editingExpenseId = expense.id;
            title.textContent = 'Edit Expense';
            
            // If editing a LOAN, hide category (it's fixed as LOAN)
            if (expense.category === 'LOAN') {
                categoryGroup.style.display = 'none';
                categoryInput.removeAttribute('required');
                recurringGroup.style.display = 'flex';
                emiRow.style.display = 'grid';
                
                // Show bank name field for loans
                bankNameGroup.style.display = 'block';
                bankNameInput.setAttribute('required', 'required');
                bankNameInput.value = expense.where || '';
            }
            
            categoryInput.value = expense.category;
            document.getElementById('amount').value = expense.amount || '';
            document.getElementById('dueDate').value = expense.dueDate || '';
            document.getElementById('isRecurring').checked = expense.isRecurring || false;
            document.getElementById('emiPaid').value = expense.emiPaid || 0;
            document.getElementById('emiTotal').value = expense.emiTotal || 60;
        } else {
            // Add mode
            this.editingExpenseId = null;
            title.textContent = 'Add Expense';
            form.reset();
        }

        modal.classList.add('show');
    }

    openModalForLoan() {
        const modal = document.getElementById('expenseModal');
        const form = document.getElementById('expenseForm');
        const title = document.getElementById('modalTitle');
        const emiRow = document.getElementById('emiDetailsRow');
        const recurringGroup = document.getElementById('isRecurring').parentElement.parentElement;
        const categoryGroup = document.getElementById('categoryGroup');
        const categoryInput = document.getElementById('category');
        const bankNameGroup = document.getElementById('bankNameGroup');
        const bankNameInput = document.getElementById('bankName');

        // Pre-fill for loan
        this.editingExpenseId = null;
        title.textContent = 'Add New Loan EMI';
        form.reset();
        
        // Hide category field and remove required attribute (it's always LOAN)
        categoryGroup.style.display = 'none';
        categoryInput.removeAttribute('required');
        
        // Show bank name field and make it required
        bankNameGroup.style.display = 'block';
        bankNameInput.setAttribute('required', 'required');
        
        // Set category to LOAN (hidden but form still needs it)
        categoryInput.value = 'LOAN';
        document.getElementById('isRecurring').checked = true;
        recurringGroup.style.display = 'flex';
        emiRow.style.display = 'grid';
        
        // Set default EMI total
        document.getElementById('emiTotal').value = 60;
        document.getElementById('emiPaid').value = 0;

        modal.classList.add('show');
    }

    closeModal() {
        const modal = document.getElementById('expenseModal');
        modal.classList.remove('show');
        this.editingExpenseId = null;
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Prevent double submission
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const category = document.getElementById('category').value;
        const bankName = document.getElementById('bankName').value;
        const expenseData = {
            category: category,
            where: bankName || category, // Use bank name for loans, category for others
            amount: parseFloat(document.getElementById('amount').value) || 0,
            dueDate: document.getElementById('dueDate').value,
            isRecurring: document.getElementById('isRecurring').checked,
            emiPaid: parseInt(document.getElementById('emiPaid').value) || 0,
            emiTotal: parseInt(document.getElementById('emiTotal').value) || 0
        };

        try {
            if (this.editingExpenseId) {
                await this.updateExpense(this.editingExpenseId, expenseData);
            } else {
                await this.addExpense(expenseData);
            }
            this.closeModal();
        } catch (error) {
            // Error already shown in add/update functions
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = this.editingExpenseId ? 'Update' : 'Add Expense';
        }
    }

    calculateTotals() {
        const expenses = this.getCurrentExpenses();
        // Calculate totals from ALL expenses, not filtered ones
        const total = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const paid = expenses.filter(exp => exp.status === 'paid').reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const remaining = total - paid;

        return { total, paid, remaining };
    }

    filterExpenses(expenses) {
        if (this.currentFilter === 'all') return expenses;
        if (this.currentFilter === 'paid') return expenses.filter(exp => exp.status === 'paid');
        if (this.currentFilter === 'pending') return expenses.filter(exp => exp.status === 'pending');
        return expenses;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        // Check if it's a day of month (number) or old date format
        const dayOfMonth = parseInt(dateString);
        if (!isNaN(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31) {
            // It's a day of month
            const suffix = this.getDaySuffix(dayOfMonth);
            return `${dayOfMonth}${suffix} of every month`;
        }
        // Old date format - convert to display
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    }

    getDaySuffix(day) {
        if (day >= 11 && day <= 13) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    formatPaidDateTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}`;
    }

    render() {
        this.renderMonth();
        this.renderSummary();
        this.renderEMITracker();
        this.renderCreditCards();
        this.renderRecurringExpenses();
        this.renderInvestments();
        this.renderExpenses();
    }

    renderMonth() {
        const monthElement = document.getElementById('currentMonth');
        monthElement.textContent = this.getMonthKey();
    }

    renderSummary() {
        const { total, paid, remaining } = this.calculateTotals();
        document.getElementById('totalExpenses').textContent = this.formatCurrency(total);
        document.getElementById('totalPaid').textContent = this.formatCurrency(paid);
        document.getElementById('totalRemaining').textContent = this.formatCurrency(remaining);
    }

    renderEMITracker() {
        const expenses = this.getCurrentExpenses();
        const loanExpenses = expenses.filter(exp => 
            exp.category === 'LOAN' && 
            exp.isRecurring && 
            exp.emiTotal > 0
        );

        const trackerSection = document.getElementById('emiTrackerSection');
        const trackerBody = document.getElementById('emiTrackerBody');

        if (!trackerSection || !trackerBody) {
            console.error('My Loan EMI\'s elements not found');
            return;
        }

        trackerSection.classList.remove('hidden');

        if (loanExpenses.length === 0) {
            trackerBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <div style="color: var(--gray-500); font-size: 1.125rem;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style="margin: 0 auto 1rem; display: block; opacity: 0.5;">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
                            </svg>
                            <h3 style="margin-bottom: 0.5rem; color: var(--gray-700);">No Active Loan EMIs</h3>
                            <p style="margin-bottom: 1.5rem;">You don't have any loan EMIs to track yet.</p>
                            <p style="font-size: 0.875rem; color: var(--gray-500);">Click the "Add Loan EMI" button above to start tracking your loans.</p>
                        </div>
                    </td>
                </tr>
            `;
            // Also render mobile cards
            this.renderEMIMobileCards(loanExpenses);
            return;
        }
        
        let totalEmiAmount = 0;
        let totalRemaining = 0;
        
        const rows = loanExpenses.map(exp => {
            const emiPaid = exp.emiPaid || 0;
            const emiTotal = exp.emiTotal || 60;
            const emiLeft = emiTotal - emiPaid;
            const totalRemainingAmount = exp.amount * emiLeft;
            totalEmiAmount += exp.amount;
            totalRemaining += totalRemainingAmount;
            const progress = emiTotal > 0 ? (emiPaid / emiTotal) * 100 : 0;

            return `
                <tr data-emi-id="${exp.id}">
                    <td class="emi-particulars">${exp.where}</td>
                    <td class="emi-amount">${this.formatCurrency(exp.amount)}</td>
                    <td>
                        <div class="emi-progress">
                            <span>${emiPaid}</span>
                            <div class="emi-progress-bar">
                                <div class="emi-progress-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>${emiTotal}</td>
                    <td>${emiLeft}</td>
                    <td class="emi-total-remaining">${this.formatCurrency(totalRemainingAmount)}</td>
                    <td class="emi-actions">
                        <button class="btn-emi-edit" data-action="edit-emi" title="Edit EMI">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-emi-delete" data-action="delete-emi" title="Delete EMI">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        const totalRow = `
            <tr class="total-row">
                <td class="emi-particulars">Total</td>
                <td class="emi-amount">${this.formatCurrency(totalEmiAmount)}</td>
                <td></td>
                <td></td>
                <td></td>
                <td class="emi-total-remaining">${this.formatCurrency(totalRemaining)}</td>
                <td></td>
            </tr>
        `;

        trackerBody.innerHTML = rows + totalRow;
        this.attachEMITrackerListeners();
        
        // Also render mobile cards
        this.renderEMIMobileCards(loanExpenses);
    }

    renderEMIMobileCards(expenses) {
        let container = document.querySelector('.emi-tracker-table .mobile-card-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'mobile-card-container';
            document.querySelector('.emi-tracker-table').appendChild(container);
        }

        if (expenses.length === 0) {
            container.innerHTML = '';
            return;
        }

        let totalEmiAmount = 0;
        let totalRemaining = 0;

        const cards = expenses.map(exp => {
            const emiPaid = exp.emiPaid || 0;
            const emiTotal = exp.emiTotal || 60;
            const emiLeft = emiTotal - emiPaid;
            const totalRemainingAmount = exp.amount * emiLeft;
            totalEmiAmount += exp.amount;
            totalRemaining += totalRemainingAmount;
            const progress = emiTotal > 0 ? (emiPaid / emiTotal) * 100 : 0;

            return `
                <div class="mobile-data-card">
                    <div class="mobile-card-header">
                        <div class="mobile-card-title">${exp.where}</div>
                        <div class="mobile-card-amount">${this.formatCurrency(exp.amount)}</div>
                    </div>
                    <div class="mobile-card-body">
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">EMI Paid</span>
                            <span class="mobile-card-value">${emiPaid}</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Total EMIs</span>
                            <span class="mobile-card-value">${emiTotal}</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">EMIs Left</span>
                            <span class="mobile-card-value">${emiLeft}</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Progress</span>
                            <span class="mobile-card-value">${Math.round(progress)}%</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Total Remaining</span>
                            <span class="mobile-card-value">${this.formatCurrency(totalRemainingAmount)}</span>
                        </div>
                    </div>
                    <div class="mobile-card-actions">
                        <button class="btn btn-secondary" onclick="app.openModal(app.getExpenseById('${exp.id}'))">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.showDeleteConfirmationForExpense('${exp.id}', '${exp.where}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = cards;
    }

    attachEMITrackerListeners() {
        document.querySelectorAll('[data-emi-id]').forEach(row => {
            const id = row.dataset.emiId;
            const monthKey = this.getMonthKey();
            const expense = this.expenses[monthKey].find(exp => exp.id === id);

            const editBtn = row.querySelector('[data-action="edit-emi"]');
            if (editBtn && expense) {
                editBtn.addEventListener('click', () => {
                    this.openModal(expense);
                });
            }

            const deleteBtn = row.querySelector('[data-action="delete-emi"]');
            if (deleteBtn && expense) {
                deleteBtn.addEventListener('click', () => {
                    this.openDeleteModal(
                        `Are you sure you want to delete "${expense.where}" EMI?`,
                        (deleteFromFuture) => {
                            this.deleteExpense(id, deleteFromFuture);
                            this.render();
                        },
                        true // EMIs are always recurring
                    );
                });
            }
        });
    }

    renderExpenses() {
        const container = document.getElementById('expensesContainer');
        const expenses = this.getCurrentExpenses();
        const filtered = this.filterExpenses(expenses);

        // Group by TYPE instead of category
        const grouped = {
            'LOAN': [],           // EMI loans
            'INVESTMENT': [],     // SIP Investments
            'RECURRING': [],      // Recurring bills
            'ONE_TIME': []        // One-time expenses
        };
        
        filtered.forEach(expense => {
            if (expense.category === 'LOAN') {
                grouped['LOAN'].push(expense);
            } else if (expense.category === 'INVESTMENT') {
                grouped['INVESTMENT'].push(expense);
            } else if (expense.isRecurring && !expense.emiTotal) {
                // Recurring bills (not EMI/SIP)
                grouped['RECURRING'].push(expense);
            } else {
                // One-time expenses
                grouped['ONE_TIME'].push(expense);
            }
        });

        // Render
        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                    </svg>
                    <h3>No expenses found</h3>
                    <p>Add your first expense to get started</p>
                </div>
            `;
            return;
        }

        // Define the order and display names
        const groupOrder = [
            { key: 'LOAN', label: 'Loan EMIs' },
            { key: 'INVESTMENT', label: 'SIP Investments' },
            { key: 'RECURRING', label: 'Recurring Bills' },
            { key: 'ONE_TIME', label: 'One-Time Expenses' }
        ];

        groupOrder.forEach(({ key, label }) => {
            const categoryExpenses = grouped[key];
            
            // Skip if no expenses in this group
            if (categoryExpenses.length === 0) return;
            
            const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

            const section = document.createElement('div');
            section.className = 'category-section';
            section.innerHTML = `
                <div class="category-header">
                    <div class="category-title">
                        ${label}
                        <span class="category-badge">${categoryExpenses.length}</span>
                    </div>
                    <div class="category-total">${this.formatCurrency(categoryTotal)}</div>
                </div>
                <div class="expense-list">
                    ${categoryExpenses.map(expense => this.renderExpenseItem(expense)).join('')}
                </div>
            `;
            container.appendChild(section);
        });

        // Re-attach event listeners
        this.attachExpenseListeners();
    }

    renderExpenseItem(expense) {
        const showEMIBadge = expense.isRecurring && expense.category === 'LOAN';
        const showInvestmentBadge = expense.isRecurring && expense.category === 'INVESTMENT';
        const showRecurringBadge = expense.isRecurring && expense.category !== 'LOAN' && expense.category !== 'INVESTMENT' && !expense.emiTotal;
        const paidInfo = expense.status === 'paid' && expense.paidAt 
            ? `<div class="paid-timestamp">Paid: ${this.formatPaidDateTime(expense.paidAt)}</div>`
            : '';
        
        return `
            <div class="expense-item ${expense.status === 'paid' ? 'paid' : ''}" data-id="${expense.id}">
                <div class="expense-info">
                    <div class="expense-where">
                        ${expense.where}
                        ${showEMIBadge ? '<span class="recurring-badge">EMI</span>' : ''}
                        ${showInvestmentBadge ? '<span class="recurring-badge investment-badge">SIP</span>' : ''}
                        ${showRecurringBadge ? '<span class="recurring-badge recurring-expense-badge">RECURRING</span>' : ''}
                    </div>
                    ${paidInfo}
                </div>
                <div class="expense-amount">${expense.amount ? this.formatCurrency(expense.amount) : '-'}</div>
                <div class="expense-date">${this.formatDate(expense.dueDate)}</div>
                <div class="expense-actions">
                    <button class="btn-paid ${expense.status === 'paid' ? 'paid-btn' : ''}" data-action="toggle-paid">
                        ${expense.status === 'paid' ? 'Paid ✓' : 'Mark Paid'}
                    </button>
                    <button class="btn-icon" data-action="edit">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-delete" data-action="delete">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    attachExpenseListeners() {
        document.querySelectorAll('.expense-item').forEach(item => {
            const id = item.dataset.id;
            const monthKey = this.getMonthKey();
            const expense = this.expenses[monthKey]?.find(exp => exp.id === id);
            
            if (!expense) {
                console.error('Expense not found for id:', id);
                return;
            }

            const toggleBtn = item.querySelector('[data-action="toggle-paid"]');
            const editBtn = item.querySelector('[data-action="edit"]');
            const deleteBtn = item.querySelector('[data-action="delete"]');
            
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    this.togglePaidStatus(id);
                });
            }

            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    // Determine which modal to open based on expense type
                    if (expense.category === 'LOAN') {
                        // Open loan EMI modal
                        this.openModal(expense);
                    } else if (expense.category === 'INVESTMENT') {
                        // Open investment modal
                        this.openInvestmentModal(expense);
                    } else if (expense.isRecurring && !expense.emiTotal) {
                        // Open recurring expense modal
                        this.openRecurringExpenseModal(expense);
                    } else {
                        // Open regular expense modal
                        this.openModal(expense);
                    }
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    this.openDeleteModal(
                        `Are you sure you want to delete "${expense.where}"?`,
                        (deleteFromFuture) => {
                            this.deleteExpense(id, deleteFromFuture);
                            this.render();
                        },
                        expense.isRecurring // Pass true if it's a recurring expense
                    );
                });
            }
        });
    }

    // Credit Card Management
    loadCreditCards() {
        // Return empty array initially - will be loaded asynchronously
        return [];
    }

    async loadCreditCardsFromAPI() {
        try {
            this.creditCards = await API.getCreditCards();
            this.renderCreditCards();
        } catch (error) {
            console.error('Failed to load credit cards from API:', error);
        }
    }

    saveCreditCards() {
        // No longer needed - API calls are made individually
        // Kept for backwards compatibility
    }

    initializeCreditCardData() {
        // Start with empty data - user will add their own credit cards
        if (!this.creditCards) {
            this.creditCards = [];
        }
    }

    async addCreditCard(card) {
        try {
            const addedCard = await API.addCreditCard(card);
            this.creditCards.push(addedCard);
            this.renderCreditCards();
        } catch (error) {
            console.error('Failed to add credit card:', error);
            alert('Failed to add credit card. Please try again.');
            throw error;
        }
    }

    async updateCreditCard(id, updatedCard) {
        const index = this.creditCards.findIndex(card => card.id === id);
        if (index !== -1) {
            try {
                await API.updateCreditCard(id, updatedCard);
                this.creditCards[index] = { ...this.creditCards[index], ...updatedCard };
                this.renderCreditCards();
            } catch (error) {
                console.error('Failed to update credit card:', error);
                alert('Failed to update credit card. Please try again.');
                throw error;
            }
        }
    }

    async deleteCreditCard(id) {
        try {
            await API.deleteCreditCard(id);
            this.creditCards = this.creditCards.filter(card => card.id !== id);
            this.renderCreditCards();
        } catch (error) {
            console.error('Failed to delete credit card:', error);
            alert('Failed to delete credit card. Please try again.');
            throw error;
        }
    }

    openCreditCardModal(card = null) {
        const modal = document.getElementById('creditCardModal');
        const form = document.getElementById('creditCardForm');
        const title = document.getElementById('cardModalTitle');

        if (card) {
            // Edit mode
            this.editingCardId = card.id;
            title.textContent = 'Edit Credit Card';
            document.getElementById('cardName').value = card.name;
            document.getElementById('cardLimit').value = card.limit;
            document.getElementById('cardOutstanding').value = card.outstanding;
        } else {
            // Add mode
            this.editingCardId = null;
            title.textContent = 'Add Credit Card';
            form.reset();
        }

        modal.classList.add('show');
    }

    closeCreditCardModal() {
        const modal = document.getElementById('creditCardModal');
        modal.classList.remove('show');
        this.editingCardId = null;
    }

    // Investment Management
    loadInvestments() {
        // Investments are now stored as expenses with category 'INVESTMENT'
        // This method is kept for backwards compatibility but not used
        const data = localStorage.getItem('investmentData');
        return data ? JSON.parse(data) : [];
    }

    saveInvestments() {
        // No longer needed - investments saved as expenses
        // Kept for backwards compatibility
    }

    initializeInvestmentData() {
        // Start with empty data - user will add their own investments
    }

    openInvestmentModal(expense = null) {
        const modal = document.getElementById('investmentModal');
        const form = document.getElementById('investmentForm');
        const title = document.getElementById('investmentModalTitle');

        if (expense) {
            // Edit mode
            this.editingExpenseId = expense.id;
            title.textContent = 'Edit Investment';
            document.getElementById('investmentName').value = expense.where;
            document.getElementById('investmentAmount').value = expense.amount;
            document.getElementById('investmentDueDate').value = expense.dueDate || '';
            document.getElementById('monthsPaid').value = expense.emiPaid || 0;
            document.getElementById('totalMonths').value = expense.emiTotal || 0;
        } else {
            // Add mode
            this.editingExpenseId = null;
            title.textContent = 'Add Investment';
            form.reset();
        }

        modal.classList.add('show');
    }

    closeInvestmentModal() {
        const modal = document.getElementById('investmentModal');
        modal.classList.remove('show');
        this.editingExpenseId = null;
    }

    handleInvestmentSubmit(e) {
        e.preventDefault();

        const expenseData = {
            category: 'INVESTMENT',
            where: document.getElementById('investmentName').value,
            amount: parseFloat(document.getElementById('investmentAmount').value) || 0,
            dueDate: document.getElementById('investmentDueDate').value,
            isRecurring: true,
            emiPaid: parseInt(document.getElementById('monthsPaid').value) || 0,
            emiTotal: parseInt(document.getElementById('totalMonths').value) || 0
        };

        if (this.editingExpenseId) {
            this.updateExpense(this.editingExpenseId, expenseData);
        } else {
            this.addExpense(expenseData);
        }

        this.closeInvestmentModal();
        this.render();
    }

    // Recurring Expense Management (uses expense system, stored as isRecurring: true)
    openRecurringExpenseModal(expense = null) {
        const modal = document.getElementById('recurringExpenseModal');
        const form = document.getElementById('recurringExpenseForm');
        const title = document.getElementById('recurringExpenseModalTitle');
        const otherNameGroup = document.getElementById('recurringOtherNameGroup');
        const otherNameInput = document.getElementById('recurringOtherName');

        if (expense) {
            // Edit mode
            this.editingExpenseId = expense.id;
            title.textContent = 'Edit Recurring Expense';
            document.getElementById('recurringCategory').value = expense.category;
            document.getElementById('recurringAmount').value = expense.amount;
            document.getElementById('recurringDueDate').value = expense.dueDate || '';
            
            // If category is "Other", show and populate the custom name field
            if (expense.category === 'Other') {
                otherNameGroup.style.display = 'block';
                otherNameInput.setAttribute('required', 'required');
                otherNameInput.value = expense.where || '';
            } else {
                otherNameGroup.style.display = 'none';
                otherNameInput.removeAttribute('required');
                otherNameInput.value = '';
            }
        } else {
            // Add mode
            this.editingExpenseId = null;
            title.textContent = 'Add Recurring Expense';
            form.reset();
            otherNameGroup.style.display = 'none';
            otherNameInput.removeAttribute('required');
        }

        modal.classList.add('show');
    }

    closeRecurringExpenseModal() {
        const modal = document.getElementById('recurringExpenseModal');
        modal.classList.remove('show');
        this.editingExpenseId = null;
    }

    async handleRecurringExpenseSubmit(e) {
        e.preventDefault();

        const category = document.getElementById('recurringCategory').value;
        const otherName = document.getElementById('recurringOtherName').value;
        
        // Use custom name if "Other" is selected, otherwise use category
        const displayName = category === 'Other' && otherName ? otherName : category;
        
        const expenseData = {
            category: category,
            where: displayName, // Use custom name or category
            amount: parseFloat(document.getElementById('recurringAmount').value) || 0,
            dueDate: document.getElementById('recurringDueDate').value,
            isRecurring: true,
            status: 'pending' // Will be set when adding/updating
        };

        try {
            if (this.editingExpenseId) {
                await this.updateExpense(this.editingExpenseId, expenseData);
            } else {
                await this.addExpense(expenseData);
            }
            this.closeRecurringExpenseModal();
            this.render();
        } catch (error) {
            console.error('Error saving recurring expense:', error);
        }
    }

    renderRecurringExpenses() {
        const tbody = document.getElementById('recurringExpensesBody');

        if (!tbody) {
            console.error('Recurring expense elements not found');
            return;
        }

        // Get recurring expenses from monthly expenses (not LOAN or INVESTMENT, and no emiTotal)
        const monthKey = this.getMonthKey();
        const expenses = this.expenses[monthKey] || [];
        const recurringExpenses = expenses.filter(exp => 
            exp.isRecurring && 
            exp.category !== 'INVESTMENT' && 
            exp.category !== 'LOAN' &&
            !exp.emiTotal // Not an EMI/SIP
        );

        if (recurringExpenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 3rem;">
                        <div style="color: var(--gray-500); font-size: 1.125rem;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style="margin: 0 auto 1rem; display: block; opacity: 0.5;">
                                <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" fill="currentColor"/>
                            </svg>
                            <h3 style="margin-bottom: 0.5rem; color: var(--gray-700);">No Recurring Expenses</h3>
                            <p style="margin-bottom: 1.5rem;">You haven't added any recurring expenses yet.</p>
                            <p style="font-size: 0.875rem; color: var(--gray-500);">Click the "Add Recurring Expense" button above to start tracking your monthly bills.</p>
                        </div>
                    </td>
                </tr>
            `;
            
            // Also render mobile cards
            this.renderRecurringMobileCards(recurringExpenses);
            return;
        }

        const rows = recurringExpenses.map(expense => {
            const dueDateText = this.formatDate(expense.dueDate);
            
            return `
                <tr>
                    <td class="recurring-category">
                        <div class="category-badge" style="background: var(--emerald-100); color: var(--emerald-700);">
                            ${expense.category}
                        </div>
                    </td>
                    <td class="recurring-amount">${this.formatCurrency(expense.amount)}</td>
                    <td class="recurring-due-date">${dueDateText}</td>
                    <td class="recurring-actions">
                        <div class="action-buttons">
                            <button class="btn-icon edit" onclick="app.openRecurringExpenseModal(app.getExpenseById('${expense.id}'))" title="Edit">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/>
                                </svg>
                            </button>
                            <button class="btn-icon delete" onclick="app.showDeleteConfirmationForExpense('${expense.id}', '${expense.where}')" title="Delete">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                    <path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" fill="currentColor"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
        
        // Also render mobile cards
        this.renderRecurringMobileCards(recurringExpenses);
    }

    renderRecurringMobileCards(expenses) {
        // Find or create mobile card container
        let container = document.querySelector('.recurring-expenses-table .mobile-card-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'mobile-card-container';
            document.querySelector('.recurring-expenses-table').appendChild(container);
        }

        if (expenses.length === 0) {
            container.innerHTML = '';
            return;
        }

        const cards = expenses.map(expense => {
            const dueDateText = this.formatDate(expense.dueDate);
            
            return `
                <div class="mobile-data-card">
                    <div class="mobile-card-header">
                        <div class="mobile-card-title">${expense.category}</div>
                        <div class="mobile-card-amount">${this.formatCurrency(expense.amount)}</div>
                    </div>
                    <div class="mobile-card-body">
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Due Date</span>
                            <span class="mobile-card-value">${dueDateText}</span>
                        </div>
                    </div>
                    <div class="mobile-card-actions">
                        <button class="btn btn-secondary" onclick="app.openRecurringExpenseModal(app.getExpenseById('${expense.id}'))">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/>
                            </svg>
                            Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.showDeleteConfirmationForExpense('${expense.id}', '${expense.where}')">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                <path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" fill="currentColor"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = cards;
    }

    showDeleteConfirmationForExpense(id, name) {
        const monthKey = this.getMonthKey();
        const expense = this.expenses[monthKey]?.find(exp => exp.id === id);
        
        this.openDeleteModal(
            `Are you sure you want to delete "${name}"?`,
            (deleteFromFuture) => {
                this.deleteExpense(id, deleteFromFuture);
                this.render();
            },
            expense?.isRecurring || false // Pass true if it's recurring
        );
    }

    renderInvestments() {
        const section = document.getElementById('investmentsSection');
        const tbody = document.getElementById('investmentsBody');

        if (!section || !tbody) {
            console.error('Investment elements not found');
            return;
        }

        // Get investments from monthly expenses with category 'INVESTMENT'
        const monthKey = this.getMonthKey();
        const expenses = this.expenses[monthKey] || [];
        const investmentExpenses = expenses.filter(exp => 
            exp.category === 'INVESTMENT' && exp.isRecurring && exp.emiTotal >= 0
        );

        if (investmentExpenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <div style="color: var(--gray-500); font-size: 1.125rem;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style="margin: 0 auto 1rem; display: block; opacity: 0.5;">
                                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="currentColor"/>
                            </svg>
                            <h3 style="margin-bottom: 0.5rem; color: var(--gray-700);">No Active Investments</h3>
                            <p style="margin-bottom: 1.5rem;">You don't have any recurring investments to track yet.</p>
                            <p style="font-size: 0.875rem; color: var(--gray-500);">Click the "Add Investment" button above to start tracking your SIPs.</p>
                        </div>
                    </td>
                </tr>
            `;
            // Also render mobile cards
            this.renderInvestmentMobileCards(investmentExpenses);
            return;
        }

        let totalMonthlyAmount = 0;
        let totalInvested = 0;

        const rows = investmentExpenses.map(inv => {
            const monthsPaid = inv.emiPaid || 0;
            const totalMonths = inv.emiTotal || 0;
            const monthsLeft = totalMonths > 0 ? Math.max(0, totalMonths - monthsPaid) : '∞';
            const totalInvestedAmount = inv.amount * monthsPaid;
            const progressPercent = totalMonths > 0 ? Math.min(100, (monthsPaid / totalMonths) * 100) : 0;

            totalMonthlyAmount += inv.amount;
            totalInvested += totalInvestedAmount;

            return `
                <tr data-investment-id="${inv.id}">
                    <td class="investment-name">${inv.where}</td>
                    <td class="investment-amount">${this.formatCurrency(inv.amount)}</td>
                    <td>
                        <div class="emi-progress">
                            <span>${monthsPaid}</span>
                            <div class="emi-progress-bar">
                                <div class="emi-progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>${totalMonths > 0 ? totalMonths : '∞'}</td>
                    <td>${monthsLeft}</td>
                    <td class="investment-total">${this.formatCurrency(totalInvestedAmount)}</td>
                    <td class="investment-actions">
                        <button class="btn-investment-edit" data-action="edit-investment" title="Edit Investment">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-investment-delete" data-action="delete-investment" title="Delete Investment">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        const totalRow = `
            <tr class="total-row">
                <td class="investment-name">Total</td>
                <td class="investment-amount">${this.formatCurrency(totalMonthlyAmount)}</td>
                <td></td>
                <td></td>
                <td></td>
                <td class="investment-total">${this.formatCurrency(totalInvested)}</td>
                <td></td>
            </tr>
        `;

        tbody.innerHTML = rows + totalRow;
        this.attachInvestmentListeners();
        
        // Also render mobile cards
        this.renderInvestmentMobileCards(investmentExpenses);
    }

    renderInvestmentMobileCards(expenses) {
        let container = document.querySelector('.investments-table .mobile-card-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'mobile-card-container';
            document.querySelector('.investments-table').appendChild(container);
        }

        if (expenses.length === 0) {
            container.innerHTML = '';
            return;
        }

        const cards = expenses.map(inv => {
            const monthsPaid = inv.emiPaid || 0;
            const totalMonths = inv.emiTotal || 0;
            const monthsLeft = totalMonths > 0 ? Math.max(0, totalMonths - monthsPaid) : '∞';
            const totalInvestedAmount = inv.amount * monthsPaid;
            const progressPercent = totalMonths > 0 ? Math.min(100, (monthsPaid / totalMonths) * 100) : 0;

            return `
                <div class="mobile-data-card">
                    <div class="mobile-card-header">
                        <div class="mobile-card-title">${inv.where}</div>
                        <div class="mobile-card-amount">${this.formatCurrency(inv.amount)}</div>
                    </div>
                    <div class="mobile-card-body">
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Months Paid</span>
                            <span class="mobile-card-value">${monthsPaid}</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Total Months</span>
                            <span class="mobile-card-value">${totalMonths > 0 ? totalMonths : '∞'}</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Months Left</span>
                            <span class="mobile-card-value">${monthsLeft}</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Progress</span>
                            <span class="mobile-card-value">${Math.round(progressPercent)}%</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Total Invested</span>
                            <span class="mobile-card-value">${this.formatCurrency(totalInvestedAmount)}</span>
                        </div>
                    </div>
                    <div class="mobile-card-actions">
                        <button class="btn btn-secondary" onclick="app.openInvestmentModal(app.getExpenseById('${inv.id}'))">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.showDeleteConfirmationForExpense('${inv.id}', '${inv.where}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = cards;
    }

    attachInvestmentListeners() {
        document.querySelectorAll('[data-investment-id]').forEach(row => {
            const id = row.dataset.investmentId;
            const monthKey = this.getMonthKey();
            const expense = this.expenses[monthKey].find(exp => exp.id === id);

            const editBtn = row.querySelector('[data-action="edit-investment"]');
            if (editBtn && expense) {
                editBtn.addEventListener('click', () => {
                    this.openInvestmentModal(expense);
                });
            }

            const deleteBtn = row.querySelector('[data-action="delete-investment"]');
            if (deleteBtn && expense) {
                deleteBtn.addEventListener('click', () => {
                    this.openDeleteModal(
                        `Are you sure you want to delete "${expense.where}" investment?`,
                        (deleteFromFuture) => {
                            this.deleteExpense(id, deleteFromFuture);
                            this.render();
                        },
                        true // Investments are always recurring
                    );
                });
            }
        });
    }

    // Delete Modal Methods
    openDeleteModal(message, onConfirm, isRecurring = false) {
        this.pendingDelete = onConfirm;
        this.isRecurringDelete = isRecurring;
        document.getElementById('deleteMessage').textContent = message;
        
        // Show/hide the "delete from future months" option
        const deleteOptionsGroup = document.getElementById('deleteOptionsGroup');
        if (isRecurring) {
            deleteOptionsGroup.style.display = 'block';
            document.getElementById('deleteFromAllFutureMonths').checked = true; // Default to checked
        } else {
            deleteOptionsGroup.style.display = 'none';
        }
        
        document.getElementById('deleteModal').classList.add('show');
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('show');
        this.pendingDelete = null;
        this.isRecurringDelete = false;
    }

    confirmDelete() {
        if (this.pendingDelete) {
            // Check if user wants to delete from future months (only for recurring expenses)
            const deleteFromFuture = this.isRecurringDelete && 
                document.getElementById('deleteFromAllFutureMonths').checked;
            
            this.pendingDelete(deleteFromFuture);
            this.pendingDelete = null;
            this.isRecurringDelete = false;
        }
        this.closeDeleteModal();
    }

    async handleCardSubmit(e) {
        e.preventDefault();

        const cardData = {
            name: document.getElementById('cardName').value,
            limit: parseFloat(document.getElementById('cardLimit').value) || 0,
            outstanding: parseFloat(document.getElementById('cardOutstanding').value) || 0
        };

        try {
            if (this.editingCardId) {
                await this.updateCreditCard(this.editingCardId, cardData);
            } else {
                await this.addCreditCard(cardData);
            }
            this.closeCreditCardModal();
        } catch (error) {
            // Error already shown in add/update functions
        }
    }

    renderCreditCards() {
        const section = document.getElementById('creditCardSection');
        const tbody = document.getElementById('creditCardBody');

        if (!section || !tbody) {
            console.error('Credit Card elements not found');
            return;
        }

        section.classList.remove('hidden');

        if (this.creditCards.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem;">
                        <div style="color: var(--gray-500); font-size: 1.125rem;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style="margin: 0 auto 1rem; display: block; opacity: 0.5;">
                                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="currentColor"/>
                            </svg>
                            <h3 style="margin-bottom: 0.5rem; color: var(--gray-700);">No Credit Cards Added</h3>
                            <p style="margin-bottom: 1.5rem;">You haven't added any credit cards yet.</p>
                            <p style="font-size: 0.875rem; color: var(--gray-500);">Click the "Add Credit Card" button above to start tracking your cards.</p>
                        </div>
                    </td>
                </tr>
            `;
            // Also render mobile cards
            this.renderCreditCardMobileCards(this.creditCards);
            return;
        }

        let totalLimit = 0;
        let totalOutstanding = 0;
        let totalBalance = 0;

        const rows = this.creditCards.map(card => {
            const balance = card.limit - card.outstanding;
            const usagePercent = card.limit > 0 ? (card.outstanding / card.limit) * 100 : 0;
            
            totalLimit += card.limit;
            totalOutstanding += card.outstanding;
            totalBalance += balance;

            let usageClass = '';
            if (usagePercent > 70) usageClass = 'high';
            else if (usagePercent > 40) usageClass = 'medium';

            return `
                <tr data-card-id="${card.id}">
                    <td class="credit-card-name">${card.name}</td>
                    <td class="credit-card-limit">${this.formatCurrency(card.limit)}</td>
                    <td class="credit-card-outstanding">${this.formatCurrency(card.outstanding)}</td>
                    <td class="credit-card-balance">${this.formatCurrency(balance)}</td>
                    <td>
                        <div class="credit-card-usage">
                            <div class="usage-bar">
                                <div class="usage-fill ${usageClass}" style="width: ${usagePercent}%"></div>
                            </div>
                            <span class="usage-percentage">${usagePercent.toFixed(2)}%</span>
                        </div>
                    </td>
                    <td class="credit-card-actions">
                        <button class="btn-card-edit" data-action="edit-card" title="Edit Card">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-card-delete" data-action="delete-card" title="Delete Card">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        const totalUsagePercent = totalLimit > 0 ? (totalOutstanding / totalLimit) * 100 : 0;

        const totalRow = `
            <tr class="total-row-card">
                <td class="credit-card-name">Total</td>
                <td class="credit-card-limit">${this.formatCurrency(totalLimit)}</td>
                <td class="credit-card-outstanding">${this.formatCurrency(totalOutstanding)}</td>
                <td class="credit-card-balance">${this.formatCurrency(totalBalance)}</td>
                <td>
                    <div class="credit-card-usage">
                        <div class="usage-bar">
                            <div class="usage-fill" style="width: ${totalUsagePercent}%"></div>
                        </div>
                        <span class="usage-percentage">${totalUsagePercent.toFixed(2)}%</span>
                    </div>
                </td>
                <td></td>
            </tr>
        `;

        tbody.innerHTML = rows + totalRow;
        this.attachCreditCardListeners();
        
        // Also render mobile cards
        this.renderCreditCardMobileCards(this.creditCards);
    }

    renderCreditCardMobileCards(cards) {
        let container = document.querySelector('.credit-card-table .mobile-card-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'mobile-card-container';
            document.querySelector('.credit-card-table').appendChild(container);
        }

        if (cards.length === 0) {
            container.innerHTML = '';
            return;
        }

        const cardElements = cards.map(card => {
            const balance = card.limit - card.outstanding;
            const usagePercent = card.limit > 0 ? (card.outstanding / card.limit) * 100 : 0;

            return `
                <div class="mobile-data-card">
                    <div class="mobile-card-header">
                        <div class="mobile-card-title">${card.name}</div>
                        <div class="mobile-card-amount">${this.formatCurrency(card.limit)}</div>
                    </div>
                    <div class="mobile-card-body">
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Outstanding</span>
                            <span class="mobile-card-value">${this.formatCurrency(card.outstanding)}</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Available Balance</span>
                            <span class="mobile-card-value">${this.formatCurrency(balance)}</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Usage</span>
                            <span class="mobile-card-value">${usagePercent.toFixed(2)}%</span>
                        </div>
                    </div>
                    <div class="mobile-card-actions">
                        <button class="btn btn-secondary" onclick="app.openCreditCardModal(app.creditCards.find(c => c.id === '${card.id}'))">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteCreditCard('${card.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = cardElements;
    }

    attachCreditCardListeners() {
        document.querySelectorAll('[data-card-id]').forEach(row => {
            const id = row.dataset.cardId;
            const card = this.creditCards.find(c => c.id === id);

            const editBtn = row.querySelector('[data-action="edit-card"]');
            if (editBtn && card) {
                editBtn.addEventListener('click', () => {
                    this.openCreditCardModal(card);
                });
            }

            const deleteBtn = row.querySelector('[data-action="delete-card"]');
            if (deleteBtn && card) {
                deleteBtn.addEventListener('click', () => {
                    this.openDeleteModal(
                        `Are you sure you want to delete "${card.name}" credit card?`,
                        () => {
                            this.deleteCreditCard(id);
                            this.render();
                        }
                    );
                });
            }
        });
    }
}

// Initialize the app
let tracker; // Global variable for auth.js to access
let app; // Global variable for inline onclick handlers

document.addEventListener('DOMContentLoaded', () => {
    tracker = new ExpenseTracker();
    app = tracker; // Make it accessible as 'app' for inline handlers
    window.app = tracker; // Also expose globally on window object
    
    // Setup all commitment dropdowns
    for (let i = 1; i <= 5; i++) {
        const commitmentToggle = document.getElementById(`commitmentToggle${i === 1 ? '' : i}`);
        const commitmentGroup = document.getElementById(`commitmentGroup${i === 1 ? '' : i}`);
        
        if (commitmentToggle && commitmentGroup) {
            // Start collapsed
            commitmentGroup.classList.add('collapsed');
            commitmentToggle.classList.add('collapsed');
            
            commitmentToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                commitmentToggle.classList.toggle('collapsed');
                commitmentGroup.classList.toggle('collapsed');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!commitmentToggle.contains(e.target) && !commitmentGroup.contains(e.target)) {
                    commitmentGroup.classList.add('collapsed');
                    commitmentToggle.classList.add('collapsed');
                }
            });
        }
    }
    
    // Handle commitment tab clicks
    const commitmentTabs = document.querySelectorAll('.commitment-tab');
    commitmentTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Close all dropdowns
            document.querySelectorAll('.commitment-group').forEach(group => {
                group.classList.add('collapsed');
            });
            document.querySelectorAll('.btn-commitments').forEach(btn => {
                btn.classList.add('collapsed');
            });
        });
    });
    
    // Handle back to home buttons
    const backButtons = document.querySelectorAll('.btn-back-home');
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Switch tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(targetTab + 'Tab').classList.add('active');
            
            // Save active tab to localStorage
            localStorage.setItem('activeTab', targetTab);
        });
    });
});
