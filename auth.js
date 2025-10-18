// ===================================
// AWS Cognito Authentication
// ===================================

// Initialize AWS SDK
AWS.config.region = AWS_CONFIG.REGION;
const cognito = new AWS.CognitoIdentityServiceProvider({
    region: AWS_CONFIG.REGION
});

// Global auth state
let authToken = null;
let currentUser = null;

// ===================================
// UI Functions
// ===================================

function showAuthPage() {
    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

function showMainApp() {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
}

function showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('verification-form').classList.add('hidden');
    document.getElementById('auth-loading').classList.add('hidden');
}

function showSignupForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('verification-form').classList.add('hidden');
    document.getElementById('auth-loading').classList.add('hidden');
}

function showVerificationForm(identifier) {
    document.getElementById('verify-identifier').value = identifier;
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('verification-form').classList.remove('hidden');
    document.getElementById('auth-loading').classList.add('hidden');
}

function showLoading() {
    document.getElementById('auth-loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('auth-loading').classList.add('hidden');
}

function showMessage(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===================================
// Cognito Authentication Functions
// ===================================

async function signUp(identifier, password, name) {
    try {
        // Determine if identifier is email or phone
        const isPhone = identifier.startsWith('+');
        
        const params = {
            ClientId: AWS_CONFIG.COGNITO.clientId,
            Username: identifier,
            Password: password,
            UserAttributes: [
                { Name: 'name', Value: name }
            ]
        };
        
        // Add email or phone_number attribute
        if (isPhone) {
            params.UserAttributes.push({ Name: 'phone_number', Value: identifier });
        } else {
            params.UserAttributes.push({ Name: 'email', Value: identifier });
        }
        
        const result = await cognito.signUp(params).promise();
        console.log('✅ Signup successful:', result);
        return result;
    } catch (error) {
        console.error('❌ Signup error:', error);
        
        // User-friendly error messages
        let userMessage = 'Failed to create account. Please try again.';
        
        if (error.code === 'InvalidPasswordException') {
            userMessage = 'Password must be at least 8 characters with uppercase, lowercase, and a number.';
        } else if (error.code === 'UsernameExistsException') {
            userMessage = 'An account with this email/phone already exists.';
        } else if (error.code === 'InvalidParameterException') {
            userMessage = 'Please check your input and try again. Phone numbers must include country code (e.g., +919876543210).';
        } else if (error.code === 'LimitExceededException' || error.code === 'TooManyRequestsException') {
            userMessage = 'Too many attempts. Please try again later.';
        }
        
        error.userMessage = userMessage;
        throw error;
    }
}

async function signIn(identifier, password) {
    try {
        const params = {
            ClientId: AWS_CONFIG.COGNITO.clientId,
            AuthFlow: 'USER_PASSWORD_AUTH',
            AuthParameters: {
                USERNAME: identifier,
                PASSWORD: password
            }
        };
        
        console.log('🔐 Attempting login for:', identifier);
        const result = await cognito.initiateAuth(params).promise();
        
        // Use IdToken for API Gateway Cognito User Pool authorizer
        authToken = result.AuthenticationResult.IdToken;
        console.log('✅ Login successful, token received');
        
        // Store token
        localStorage.setItem('extracker-auth-token', authToken);
        
        // Decode token to get user info
        const tokenPayload = JSON.parse(atob(authToken.split('.')[1]));
        currentUser = {
            id: tokenPayload.sub,
            name: tokenPayload.name || identifier,
            email: tokenPayload.email || null,
            phone: tokenPayload.phone_number || null,
            identifier: identifier
        };
        
        localStorage.setItem('extracker-user', JSON.stringify(currentUser));
        
        return result;
    } catch (error) {
        console.error('❌ Login error:', error);
        throw error;
    }
}

function signOut() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('extracker-auth-token');
    localStorage.removeItem('extracker-user');
    console.log('👋 Logged out');
}

async function verifyAccount(identifier, code) {
    try {
        const params = {
            ClientId: AWS_CONFIG.COGNITO.clientId,
            Username: identifier,
            ConfirmationCode: code
        };
        
        await cognito.confirmSignUp(params).promise();
        console.log('✅ Verification successful');
        return true;
    } catch (error) {
        console.error('❌ Verification error:', error);
        
        let userMessage = 'Verification failed. Please try again.';
        
        if (error.code === 'CodeMismatchException') {
            userMessage = 'Invalid verification code. Please check and try again.';
        } else if (error.code === 'ExpiredCodeException') {
            userMessage = 'Verification code has expired. Please request a new one.';
        }
        
        error.userMessage = userMessage;
        throw error;
    }
}

async function resendVerificationCode() {
    const identifier = document.getElementById('verify-identifier').value;
    if (!identifier) {
        showMessage('Email/phone is required.', 'error');
        return;
    }

    try {
        showLoading();
        
        const params = {
            ClientId: AWS_CONFIG.COGNITO.clientId,
            Username: identifier
        };
        
        await cognito.resendConfirmationCode(params).promise();
        showMessage('Verification code sent! Please check your email/phone.', 'success');
    } catch (error) {
        console.error('❌ Resend error:', error);
        showMessage('Failed to resend code. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// ===================================
// Event Handlers
// ===================================

document.getElementById('login-form-element').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showMessage('Please enter email/phone and password.', 'error');
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
        showLoading();
        await signIn(username, password);
        showMessage('Welcome back!', 'success');
        showMainApp();
        
        // Reload data for authenticated user
        if (typeof tracker !== 'undefined' && tracker.initializeApp) {
            await tracker.initializeApp();
        }
    } catch (error) {
        hideLoading();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
        
        let message = 'Login failed. Please try again.';
        if (error.code === 'NotAuthorizedException') {
            message = 'Invalid email/phone or password.';
        } else if (error.code === 'UserNotFoundException') {
            message = 'User not found. Please check your email/phone or sign up.';
        } else if (error.code === 'UserNotConfirmedException') {
            message = 'Please verify your account first.';
            showVerificationForm(username);
            return;
        }
        
        showMessage(message, 'error');
    }
});

document.getElementById('signup-form-element').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;
    
    const name = document.getElementById('signup-name').value.trim();
    const identifier = document.getElementById('signup-identifier').value.trim();
    const password = document.getElementById('signup-password').value;
    
    if (!name || !identifier || !password) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }
    
    // Validate password
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
        showMessage('Password must be at least 8 characters with uppercase, lowercase, and number.', 'error');
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        showLoading();
        await signUp(identifier, password, name);
        hideLoading();
        showMessage('Account created! Please check your email/phone for verification code.', 'success');
        showVerificationForm(identifier);
    } catch (error) {
        hideLoading();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        showMessage(error.userMessage || 'Signup failed. Please try again.', 'error');
    }
});

document.getElementById('verification-form-element').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;
    
    const identifier = document.getElementById('verify-identifier').value;
    const code = document.getElementById('verify-code').value.trim();
    
    if (!code) {
        showMessage('Please enter the verification code.', 'error');
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';
        showLoading();
        await verifyAccount(identifier, code);
        hideLoading();
        showMessage('Account verified successfully! Please login.', 'success');
        showLoginForm();
        
        // Pre-fill login username
        document.getElementById('login-username').value = identifier;
    } catch (error) {
        hideLoading();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Verify';
        showMessage(error.userMessage || 'Verification failed. Please try again.', 'error');
    }
});

function logout() {
    signOut();
    showAuthPage();
    showLoginForm();
    showMessage('Logged out successfully', 'success');
}

// ===================================
// Check Auth Status on Load
// ===================================

async function checkAuthStatus() {
    const token = localStorage.getItem('extracker-auth-token');
    const user = localStorage.getItem('extracker-user');
    
    if (token && user) {
        try {
            authToken = token;
            currentUser = JSON.parse(user);
            
            // Verify token is not expired (basic check)
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const expiryTime = tokenPayload.exp * 1000; // Convert to milliseconds
            
            if (Date.now() < expiryTime) {
                console.log('✅ Valid session found');
                showMainApp();
                
                // Load user data after showing main app (AWAIT the data load)
                if (typeof tracker !== 'undefined' && tracker.initializeApp) {
                    await tracker.initializeApp();
                }
                
                return true;
            } else {
                console.log('❌ Token expired');
                signOut();
            }
        } catch (error) {
            console.error('❌ Invalid stored auth:', error);
            signOut();
        }
    }
    
    showAuthPage();
    showLoginForm();
    return false;
}

// ===================================
// API Helper Function
// ===================================

async function callAPI(endpoint, method = 'GET', data = null) {
    const url = `${AWS_CONFIG.API_BASE_URL}${endpoint}`;
    
    if (!authToken) {
        throw new Error('Not authenticated. Please login.');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': authToken // API Gateway expects just the token, not "Bearer token"
    };
    
    const options = {
        method,
        headers,
        mode: 'cors'
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    console.log(`🌐 API ${method} ${endpoint}`);
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                signOut();
                showAuthPage();
                showLoginForm();
                throw new Error('Session expired. Please login again.');
            }
            
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API request failed with status ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`✅ API ${method} ${endpoint} - Success`);
        return result;
    } catch (error) {
        console.error(`❌ API ${method} ${endpoint} - Error:`, error);
        throw error;
    }
}

// ===================================
// Initialize on Page Load
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 ExTracker Authentication Initialized');
    await checkAuthStatus();
});
