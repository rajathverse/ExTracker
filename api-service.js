// ===================================
// API Service Layer - Replace localStorage with AWS Backend
// ===================================

const API = {
    // ===================================
    // Expense Management
    // ===================================
    
    async getExpenses(monthKey = null) {
        try {
            let endpoint = '/expenses';
            if (monthKey) {
                endpoint += `?monthKey=${encodeURIComponent(monthKey)}`;
            }
            
            const response = await callAPI(endpoint, 'GET');
            
            // Transform API response to match app structure
            // API returns: { success: true, expenses: [...] }
            // App expects: { "Nov-25": [...], "Dec-25": [...] }
            
            if (response.success && response.expenses) {
                // Group expenses by monthKey
                const expensesByMonth = {};
                response.expenses.forEach(expense => {
                    const key = expense.monthKey || this.getMonthKeyFromDate(expense.createdAt);
                    if (!expensesByMonth[key]) {
                        expensesByMonth[key] = [];
                    }
                    
                    // Transform to match app's expected format
                    expensesByMonth[key].push({
                        id: expense.expenseId,
                        category: expense.category,
                        where: expense.where,
                        amount: expense.amount,
                        dueDate: expense.dueDate,
                        isPaid: expense.isPaid || false,
                        paidAmount: expense.paidAmount || 0,
                        paidAt: expense.paidAt || null,
                        commitment: expense.commitment || 'Personal',
                        isRecurring: expense.isRecurring || false,
                        emiPaid: expense.emiPaid || 0,
                        emiTotal: expense.emiTotal || 0,
                        status: expense.isPaid ? 'paid' : 'pending'
                    });
                });
                
                return expensesByMonth;
            }
            
            return {};
        } catch (error) {
            console.error('❌ Failed to load expenses:', error);
            // Return empty object to prevent app crash
            return {};
        }
    },
    
    async addExpense(expense, monthKey) {
        try {
            const apiExpense = {
                monthKey: monthKey,
                category: expense.category,
                where: expense.where,
                amount: parseFloat(expense.amount),
                dueDate: expense.dueDate,
                isPaid: expense.isPaid || false,
                paidAmount: parseFloat(expense.paidAmount || 0),
                commitment: expense.commitment || 'Personal',
                isRecurring: expense.isRecurring || false,
                emiPaid: parseInt(expense.emiPaid || 0),
                emiTotal: parseInt(expense.emiTotal || 0)
            };
            
            const response = await callAPI('/expenses', 'POST', apiExpense);
            
            if (response.success && response.expense) {
                // Return expense with app's expected format
                return {
                    id: response.expense.expenseId,
                    ...expense
                };
            }
            
            throw new Error('Failed to add expense');
        } catch (error) {
            console.error('❌ Failed to add expense:', error);
            throw error;
        }
    },
    
    async updateExpense(expenseId, updates, monthKey) {
        try {
            const apiUpdates = {
                monthKey: monthKey,
                ...updates,
                amount: updates.amount ? parseFloat(updates.amount) : undefined,
                paidAmount: updates.paidAmount !== undefined ? parseFloat(updates.paidAmount) : undefined,
                emiPaid: updates.emiPaid !== undefined ? parseInt(updates.emiPaid) : undefined,
                emiTotal: updates.emiTotal !== undefined ? parseInt(updates.emiTotal) : undefined
            };
            
            // Remove undefined values
            Object.keys(apiUpdates).forEach(key => {
                if (apiUpdates[key] === undefined) {
                    delete apiUpdates[key];
                }
            });
            
            const response = await callAPI(`/expenses/${expenseId}`, 'PUT', apiUpdates);
            
            if (response.success) {
                return true;
            }
            
            throw new Error('Failed to update expense');
        } catch (error) {
            console.error('❌ Failed to update expense:', error);
            throw error;
        }
    },
    
    async deleteExpense(expenseId) {
        try {
            const response = await callAPI(`/expenses/${expenseId}`, 'DELETE');
            
            if (response.success) {
                return true;
            }
            
            throw new Error('Failed to delete expense');
        } catch (error) {
            console.error('❌ Failed to delete expense:', error);
            throw error;
        }
    },
    
    // ===================================
    // Credit Card Management
    // ===================================
    
    async getCreditCards() {
        try {
            const response = await callAPI('/creditcards', 'GET');
            
            if (response.success && response.creditCards) {
                // Transform to match app format
                return response.creditCards.map(card => ({
                    id: card.cardId,
                    name: card.name,
                    limit: parseFloat(card.limit),
                    outstanding: parseFloat(card.outstanding || 0)
                }));
            }
            
            return [];
        } catch (error) {
            console.error('❌ Failed to load credit cards:', error);
            return [];
        }
    },
    
    async addCreditCard(card) {
        try {
            const apiCard = {
                name: card.name,
                limit: parseFloat(card.limit),
                outstanding: parseFloat(card.outstanding || 0)
            };
            
            const response = await callAPI('/creditcards', 'POST', apiCard);
            
            if (response.success && response.creditCard) {
                return {
                    id: response.creditCard.cardId,
                    name: response.creditCard.name,
                    limit: parseFloat(response.creditCard.limit),
                    outstanding: parseFloat(response.creditCard.outstanding || 0)
                };
            }
            
            throw new Error('Failed to add credit card');
        } catch (error) {
            console.error('❌ Failed to add credit card:', error);
            throw error;
        }
    },
    
    async updateCreditCard(cardId, updates) {
        try {
            const apiUpdates = {
                ...updates,
                limit: updates.limit !== undefined ? parseFloat(updates.limit) : undefined,
                outstanding: updates.outstanding !== undefined ? parseFloat(updates.outstanding) : undefined
            };
            
            // Remove undefined values
            Object.keys(apiUpdates).forEach(key => {
                if (apiUpdates[key] === undefined) {
                    delete apiUpdates[key];
                }
            });
            
            const response = await callAPI(`/creditcards/${cardId}`, 'PUT', apiUpdates);
            
            if (response.success) {
                return true;
            }
            
            throw new Error('Failed to update credit card');
        } catch (error) {
            console.error('❌ Failed to update credit card:', error);
            throw error;
        }
    },
    
    async deleteCreditCard(cardId) {
        try {
            const response = await callAPI(`/creditcards/${cardId}`, 'DELETE');
            
            if (response.success) {
                return true;
            }
            
            throw new Error('Failed to delete credit card');
        } catch (error) {
            console.error('❌ Failed to delete credit card:', error);
            throw error;
        }
    },
    
    // ===================================
    // Helper Functions
    // ===================================
    
    getMonthKeyFromDate(dateString) {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]}-${date.getFullYear().toString().slice(-2)}`;
    }
};

// Note: Investments are not yet implemented in backend, they will continue using localStorage
// You can add investment API endpoints later if needed
