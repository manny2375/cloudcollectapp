import { DatabaseService, initializeDatabase, Env } from '../lib/database';
import { CloudflareDebtorAPI } from '../api/debtors';

// Import the built assets as text (this would be done at build time)
// For now, we'll serve a working React app directly

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Serve API routes
      if (path.startsWith('/api/')) {
        if (!env.DB) {
          throw new Error('Database binding not found');
        }

        await initializeDatabase(env.DB);
        
        // For now, we'll use a default company ID since we don't have authentication
        const defaultCompanyId = 'company-1234';
        const dbService = new DatabaseService(env.DB, defaultCompanyId);
        const debtorAPI = new CloudflareDebtorAPI(dbService);

        // Route handling
        if (path.startsWith('/api/debtors')) {
          return handleDebtorRoutes(request, debtorAPI, corsHeaders);
        } else if (path.startsWith('/api/payments')) {
          return handlePaymentRoutes(request, dbService, corsHeaders);
        } else if (path.startsWith('/api/dashboard')) {
          return handleDashboardRoutes(request, dbService, corsHeaders);
        }

        return new Response('API endpoint not found', { status: 404, headers: corsHeaders });
      }

      // Serve the React app for all other routes (SPA routing)
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💼</text></svg>" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>CloudCollect</title>
            <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
            <script src="https://unpkg.com/react-router-dom@6/dist/umd/react-router-dom.production.min.js"></script>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 0; font-family: Inter, system-ui, sans-serif; }
              .loading { 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                min-height: 100vh; 
                background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdfa 100%);
              }
              .spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #e5e7eb;
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .btn {
                @apply inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
              }
              .btn-primary {
                @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md px-4 py-2;
              }
              .btn-secondary {
                @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 shadow-sm hover:shadow-md px-4 py-2;
              }
              .input {
                @apply block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
              }
              .card {
                @apply bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200;
              }
              .badge {
                @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium;
              }
              .badge-primary { @apply bg-blue-100 text-blue-800; }
              .badge-success { @apply bg-green-100 text-green-800; }
              .badge-warning { @apply bg-yellow-100 text-yellow-800; }
              .badge-error { @apply bg-red-100 text-red-800; }
              .badge-neutral { @apply bg-gray-100 text-gray-800; }
            </style>
          </head>
          <body>
            <div id="root">
              <div class="loading">
                <div class="flex flex-col items-center">
                  <div class="spinner mb-4"></div>
                  <h1 class="text-2xl font-bold text-gray-900 mb-2">CloudCollect</h1>
                  <p class="text-gray-600">Loading application...</p>
                </div>
              </div>
            </div>
            
            <script>
              const { useState, useEffect, createElement: h } = React;
              const { createRoot } = ReactDOM;
              const { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, useParams } = ReactRouterDOM;

              // Login Page Component
              function LoginPage() {
                const [companyCode, setCompanyCode] = useState('');
                const [email, setEmail] = useState('');
                const [password, setPassword] = useState('');
                const [error, setError] = useState('');
                const [isLoading, setIsLoading] = useState(false);
                const navigate = useNavigate();

                const handleSubmit = async (e) => {
                  e.preventDefault();
                  setError('');
                  setIsLoading(true);

                  try {
                    if (companyCode === '1234' && email === 'admin@example.com' && password === 'password') {
                      localStorage.setItem('isAuthenticated', 'true');
                      localStorage.setItem('user', JSON.stringify({
                        id: 'user-1',
                        name: 'Admin User',
                        email: email,
                        companyId: 'company-1234',
                        companyCode: companyCode,
                        role: 'Administrator'
                      }));
                      navigate('/dashboard');
                    } else {
                      throw new Error('Invalid credentials');
                    }
                  } catch (err) {
                    setError('Invalid company code, email, or password');
                  } finally {
                    setIsLoading(false);
                  }
                };

                return h('div', { className: 'min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col items-center justify-center py-12 px-4' },
                  h('div', { className: 'w-full max-w-md' },
                    h('div', { className: 'text-center mb-10' },
                      h('div', { className: 'flex justify-center mb-6' },
                        h('div', { className: 'w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl' },
                          h('span', { className: 'text-white font-bold text-2xl' }, 'CC')
                        )
                      ),
                      h('h1', { className: 'text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2' }, 'CloudCollect'),
                      h('p', { className: 'text-gray-600' }, 'Professional Debt Management Platform'),
                      h('p', { className: 'text-sm text-gray-500 mt-2' }, 'Multi-tenant secure access')
                    ),
                    h('div', { className: 'card p-8' },
                      h('div', { className: 'mb-6' },
                        h('h2', { className: 'text-2xl font-bold text-gray-900 mb-2' }, 'Welcome back'),
                        h('p', { className: 'text-gray-600' }, 'Sign in to your company account')
                      ),
                      h('form', { onSubmit: handleSubmit, className: 'space-y-6' },
                        h('div', null,
                          h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Company Code *'),
                          h('input', {
                            type: 'text',
                            value: companyCode,
                            onChange: (e) => setCompanyCode(e.target.value.replace(/\\D/g, '').slice(0, 4)),
                            className: 'input text-center text-lg font-mono tracking-widest',
                            placeholder: '0000',
                            maxLength: 4,
                            required: true
                          }),
                          h('p', { className: 'text-xs text-gray-500 mt-1' }, 'Your unique 4-digit company identifier')
                        ),
                        h('div', null,
                          h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Email Address *'),
                          h('input', {
                            type: 'email',
                            value: email,
                            onChange: (e) => setEmail(e.target.value),
                            className: 'input',
                            placeholder: 'Enter your email',
                            required: true
                          })
                        ),
                        h('div', null,
                          h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Password *'),
                          h('input', {
                            type: 'password',
                            value: password,
                            onChange: (e) => setPassword(e.target.value),
                            className: 'input',
                            placeholder: 'Enter your password',
                            required: true
                          })
                        ),
                        error && h('div', { className: 'bg-red-50 border border-red-200 rounded-lg p-4' },
                          h('p', { className: 'text-sm font-medium text-red-800' }, error)
                        ),
                        h('button', {
                          type: 'submit',
                          disabled: isLoading || companyCode.length !== 4,
                          className: 'btn btn-primary w-full text-lg py-3'
                        }, isLoading ? 'Signing in...' : \`Sign in to Company \${companyCode || '****'}\`),
                        h('div', { className: 'bg-gray-50 rounded-lg p-4 border border-gray-200' },
                          h('h4', { className: 'text-sm font-medium text-gray-900 mb-2' }, 'Demo Credentials'),
                          h('div', { className: 'text-xs text-gray-600 space-y-1' },
                            h('p', null, h('strong', null, 'Company Code: '), h('span', { className: 'font-mono' }, '1234')),
                            h('p', null, h('strong', null, 'Email: '), 'admin@example.com'),
                            h('p', null, h('strong', null, 'Password: '), 'password')
                          )
                        )
                      )
                    )
                  )
                );
              }

              // Dashboard Page Component
              function DashboardPage() {
                const [stats, setStats] = useState({
                  totalAccounts: 243,
                  activeAccounts: 186,
                  totalDebt: 1250000,
                  collectedDebt: 456000,
                  successRate: 74
                });

                return h('div', { className: 'space-y-8' },
                  h('div', { className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between' },
                    h('div', null,
                      h('h1', { className: 'text-3xl font-bold text-gray-900' }, 'Dashboard'),
                      h('p', { className: 'mt-2 text-gray-600' }, "Welcome back! Here's what's happening with your collections.")
                    )
                  ),
                  h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' },
                    h('div', { className: 'card p-6' },
                      h('div', { className: 'flex items-center justify-between' },
                        h('div', null,
                          h('p', { className: 'text-sm text-gray-600' }, 'Total Accounts'),
                          h('p', { className: 'text-2xl font-bold text-gray-900' }, stats.totalAccounts.toLocaleString())
                        ),
                        h('div', { className: 'w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center' },
                          h('span', { className: 'text-blue-600 text-xl' }, '👥')
                        )
                      )
                    ),
                    h('div', { className: 'card p-6' },
                      h('div', { className: 'flex items-center justify-between' },
                        h('div', null,
                          h('p', { className: 'text-sm text-gray-600' }, 'Outstanding Debt'),
                          h('p', { className: 'text-2xl font-bold text-gray-900' }, \`$\${stats.totalDebt.toLocaleString()}\`)
                        ),
                        h('div', { className: 'w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center' },
                          h('span', { className: 'text-red-600 text-xl' }, '💰')
                        )
                      )
                    ),
                    h('div', { className: 'card p-6' },
                      h('div', { className: 'flex items-center justify-between' },
                        h('div', null,
                          h('p', { className: 'text-sm text-gray-600' }, 'Collected This Month'),
                          h('p', { className: 'text-2xl font-bold text-gray-900' }, \`$\${stats.collectedDebt.toLocaleString()}\`)
                        ),
                        h('div', { className: 'w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center' },
                          h('span', { className: 'text-green-600 text-xl' }, '📈')
                        )
                      )
                    ),
                    h('div', { className: 'card p-6' },
                      h('div', { className: 'flex items-center justify-between' },
                        h('div', null,
                          h('p', { className: 'text-sm text-gray-600' }, 'Success Rate'),
                          h('p', { className: 'text-2xl font-bold text-gray-900' }, \`\${stats.successRate}%\`)
                        ),
                        h('div', { className: 'w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center' },
                          h('span', { className: 'text-purple-600 text-xl' }, '🎯')
                        )
                      )
                    )
                  ),
                  h('div', { className: 'card p-6' },
                    h('h3', { className: 'text-lg font-medium text-gray-900 mb-4' }, 'Recent Activity'),
                    h('div', { className: 'space-y-4' },
                      h('div', { className: 'flex items-center space-x-3 p-3 bg-blue-50 rounded-lg' },
                        h('div', { className: 'w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center' },
                          h('span', { className: 'text-white text-sm' }, '👤')
                        ),
                        h('div', null,
                          h('p', { className: 'text-sm font-medium text-gray-900' }, 'New account added: John Doe'),
                          h('p', { className: 'text-xs text-gray-500' }, '2 hours ago')
                        )
                      ),
                      h('div', { className: 'flex items-center space-x-3 p-3 bg-green-50 rounded-lg' },
                        h('div', { className: 'w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center' },
                          h('span', { className: 'text-white text-sm' }, '💳')
                        ),
                        h('div', null,
                          h('p', { className: 'text-sm font-medium text-gray-900' }, 'Payment received: $750.00'),
                          h('p', { className: 'text-xs text-gray-500' }, '4 hours ago')
                        )
                      )
                    )
                  )
                );
              }

              // Accounts Page Component
              function AccountsPage() {
                const [accounts] = useState([
                  { id: '1', name: 'John Doe', accountNumber: 'ACC-12345', balance: 3500, status: 'active' },
                  { id: '2', name: 'Jane Smith', accountNumber: 'ACC-12346', balance: 6000, status: 'active' },
                  { id: '3', name: 'Bob Johnson', accountNumber: 'ACC-12347', balance: 0, status: 'paid' }
                ]);

                return h('div', null,
                  h('div', { className: 'mb-6' },
                    h('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Accounts'),
                    h('p', { className: 'mt-1 text-sm text-gray-500' }, 'Manage and view all debtor accounts')
                  ),
                  h('div', { className: 'card' },
                    h('div', { className: 'px-6 py-4 border-b border-gray-200' },
                      h('h2', { className: 'text-lg font-medium text-gray-900' }, 'All Accounts')
                    ),
                    h('div', { className: 'overflow-x-auto' },
                      h('table', { className: 'min-w-full divide-y divide-gray-200' },
                        h('thead', { className: 'bg-gray-50' },
                          h('tr', null,
                            h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Name'),
                            h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Account #'),
                            h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Balance'),
                            h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Status')
                          )
                        ),
                        h('tbody', { className: 'bg-white divide-y divide-gray-200' },
                          ...accounts.map(account =>
                            h('tr', { key: account.id, className: 'hover:bg-gray-50' },
                              h('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                h(Link, { to: \`/dashboard/accounts/\${account.id}\`, className: 'text-blue-600 hover:text-blue-900 font-medium' }, account.name)
                              ),
                              h('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, account.accountNumber),
                              h('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-900 font-medium' }, \`$\${account.balance.toLocaleString()}\`),
                              h('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                h('span', { className: \`badge \${account.status === 'active' ? 'badge-primary' : account.status === 'paid' ? 'badge-success' : 'badge-neutral'}\` },
                                  account.status.charAt(0).toUpperCase() + account.status.slice(1)
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                );
              }

              // Account Detail Page Component
              function AccountDetailPage() {
                const { id } = useParams();
                const account = {
                  id: id,
                  name: 'John Doe',
                  accountNumber: 'ACC-12345',
                  balance: 3500,
                  originalBalance: 5000,
                  status: 'active',
                  email: 'john.doe@example.com',
                  address: '123 Main St, Chicago, IL 60601',
                  phone: '(555) 123-4567'
                };

                return h('div', { className: 'space-y-6' },
                  h('div', { className: 'flex items-center space-x-4' },
                    h(Link, { to: '/dashboard/accounts', className: 'p-2 hover:bg-gray-100 rounded-lg' },
                      h('span', { className: 'text-gray-600' }, '← Back')
                    ),
                    h('div', null,
                      h('h1', { className: 'text-2xl font-bold text-gray-900' }, account.name),
                      h('p', { className: 'text-gray-500' }, \`Account #\${account.accountNumber}\`)
                    )
                  ),
                  h('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
                    h('div', { className: 'card p-6' },
                      h('h3', { className: 'text-lg font-medium text-gray-900 mb-4' }, 'Account Summary'),
                      h('dl', { className: 'space-y-2' },
                        h('div', { className: 'flex justify-between' },
                          h('dt', { className: 'text-sm text-gray-600' }, 'Current Balance'),
                          h('dd', { className: 'text-sm font-medium text-gray-900' }, \`$\${account.balance.toLocaleString()}\`)
                        ),
                        h('div', { className: 'flex justify-between' },
                          h('dt', { className: 'text-sm text-gray-600' }, 'Original Balance'),
                          h('dd', { className: 'text-sm font-medium text-gray-900' }, \`$\${account.originalBalance.toLocaleString()}\`)
                        ),
                        h('div', { className: 'flex justify-between' },
                          h('dt', { className: 'text-sm text-gray-600' }, 'Status'),
                          h('dd', null,
                            h('span', { className: 'badge badge-primary' }, account.status.charAt(0).toUpperCase() + account.status.slice(1))
                          )
                        )
                      )
                    ),
                    h('div', { className: 'card p-6' },
                      h('h3', { className: 'text-lg font-medium text-gray-900 mb-4' }, 'Contact Information'),
                      h('div', { className: 'space-y-3' },
                        h('div', null,
                          h('p', { className: 'text-sm font-medium text-gray-900' }, 'Email'),
                          h('p', { className: 'text-sm text-gray-600' }, account.email)
                        ),
                        h('div', null,
                          h('p', { className: 'text-sm font-medium text-gray-900' }, 'Phone'),
                          h('p', { className: 'text-sm text-gray-600' }, account.phone)
                        ),
                        h('div', null,
                          h('p', { className: 'text-sm font-medium text-gray-900' }, 'Address'),
                          h('p', { className: 'text-sm text-gray-600' }, account.address)
                        )
                      )
                    ),
                    h('div', { className: 'card p-6' },
                      h('h3', { className: 'text-lg font-medium text-gray-900 mb-4' }, 'Quick Actions'),
                      h('div', { className: 'space-y-2' },
                        h('button', { className: 'btn btn-primary w-full' }, 'Record Payment'),
                        h('button', { className: 'btn btn-secondary w-full' }, 'Add Note'),
                        h('button', { className: 'btn btn-secondary w-full' }, 'Generate Letter')
                      )
                    )
                  )
                );
              }

              // Sidebar Component
              function Sidebar() {
                const navItems = [
                  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
                  { name: 'Accounts', path: '/dashboard/accounts', icon: '👥' },
                  { name: 'Payments', path: '/dashboard/payments', icon: '💳' },
                  { name: 'Documents', path: '/dashboard/documents', icon: '📄' },
                  { name: 'Reports', path: '/dashboard/reports', icon: '📈' },
                  { name: 'Settings', path: '/dashboard/settings', icon: '⚙️' }
                ];

                return h('aside', { className: 'bg-white border-r border-gray-200 w-64 h-screen sticky top-0 shadow-sm' },
                  h('div', { className: 'flex flex-col h-full' },
                    h('div', { className: 'p-4 border-b border-gray-100' },
                      h('div', { className: 'flex items-center space-x-3' },
                        h('div', { className: 'w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md' },
                          h('span', { className: 'text-white font-bold text-sm' }, 'CC')
                        ),
                        h('div', null,
                          h('h2', { className: 'font-bold text-gray-900' }, 'CloudCollect'),
                          h('p', { className: 'text-xs text-gray-500' }, 'v2.0')
                        )
                      )
                    ),
                    h('nav', { className: 'flex-1 pt-4 pb-4 overflow-y-auto' },
                      h('div', { className: 'px-3' },
                        h('ul', { className: 'space-y-1' },
                          ...navItems.map(item =>
                            h('li', { key: item.path },
                              h(Link, {
                                to: item.path,
                                className: \`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 \${
                                  window.location.pathname === item.path
                                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }\`
                              },
                                h('span', { className: 'mr-3' }, item.icon),
                                item.name
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                );
              }

              // Header Component
              function Header() {
                const handleLogout = () => {
                  localStorage.removeItem('isAuthenticated');
                  localStorage.removeItem('user');
                  window.location.href = '/';
                };

                return h('header', { className: 'bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm' },
                  h('div', { className: 'px-4 sm:px-6 lg:px-8' },
                    h('div', { className: 'flex items-center justify-between h-16' },
                      h('div', { className: 'flex items-center' },
                        h('h1', { className: 'text-xl font-bold text-gray-900' }, 'CloudCollect')
                      ),
                      h('div', { className: 'flex items-center space-x-4' },
                        h('div', { className: 'flex items-center space-x-3' },
                          h('div', { className: 'w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium text-sm shadow-md' },
                            'A'
                          ),
                          h('div', { className: 'hidden sm:block text-left' },
                            h('p', { className: 'text-sm font-medium text-gray-900' }, 'Admin User'),
                            h('p', { className: 'text-xs text-gray-500' }, 'Administrator')
                          ),
                          h('button', {
                            onClick: handleLogout,
                            className: 'text-sm text-gray-500 hover:text-gray-700'
                          }, 'Sign out')
                        )
                      )
                    )
                  )
                );
              }

              // Layout Component
              function Layout() {
                return h('div', { className: 'flex h-screen bg-gray-50' },
                  h(Sidebar),
                  h('div', { className: 'flex flex-col flex-1 overflow-hidden' },
                    h(Header),
                    h('main', { className: 'flex-1 overflow-y-auto p-4 md:p-6' },
                      h(Routes, null,
                        h(Route, { path: '/', element: h(DashboardPage) }),
                        h(Route, { path: '/accounts', element: h(AccountsPage) }),
                        h(Route, { path: '/accounts/:id', element: h(AccountDetailPage) }),
                        h(Route, { path: '/payments', element: h('div', { className: 'text-center py-8' }, h('h2', { className: 'text-xl font-bold' }, 'Payments Page Coming Soon')) }),
                        h(Route, { path: '/documents', element: h('div', { className: 'text-center py-8' }, h('h2', { className: 'text-xl font-bold' }, 'Documents Page Coming Soon')) }),
                        h(Route, { path: '/reports', element: h('div', { className: 'text-center py-8' }, h('h2', { className: 'text-xl font-bold' }, 'Reports Page Coming Soon')) }),
                        h(Route, { path: '/settings', element: h('div', { className: 'text-center py-8' }, h('h2', { className: 'text-xl font-bold' }, 'Settings Page Coming Soon')) })
                      )
                    )
                  )
                );
              }

              // Protected Route Component
              function ProtectedRoute({ children }) {
                const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
                return isAuthenticated ? children : h(Navigate, { to: '/', replace: true });
              }

              // Main App Component
              function App() {
                const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
                
                return h(BrowserRouter, null,
                  h(Routes, null,
                    h(Route, { path: '/', element: isAuthenticated ? h(Navigate, { to: '/dashboard', replace: true }) : h(LoginPage) }),
                    h(Route, { path: '/dashboard/*', element: h(ProtectedRoute, null, h(Layout)) })
                  )
                );
              }

              // Initialize the app
              const root = createRoot(document.getElementById('root'));
              root.render(h(App));
            </script>
          </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Server Error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  },
};

async function handleDebtorRoutes(
  request: Request, 
  debtorAPI: CloudflareDebtorAPI, 
  corsHeaders: Record<string, string>
) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    if (path === '/api/debtors') {
      if (method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const debtors = await debtorAPI.getAll(limit, offset);
        
        return new Response(JSON.stringify(debtors), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (method === 'POST') {
        const debtor = await request.json();
        const result = await debtorAPI.create(debtor);
        
        return new Response(JSON.stringify(result), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else if (path.startsWith('/api/debtors/search')) {
      const searchTerm = url.searchParams.get('q');
      if (!searchTerm) {
        return new Response(JSON.stringify({ error: 'Search term required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const results = await debtorAPI.search(searchTerm);
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (path.match(/^\/api\/debtors\/[^\/]+$/)) {
      const id = path.split('/').pop()!;
      
      if (method === 'GET') {
        const debtor = await debtorAPI.getById(id);
        if (!debtor) {
          return new Response(JSON.stringify({ error: 'Debtor not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify(debtor), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (method === 'PUT') {
        const updates = await request.json();
        await debtorAPI.update(id, updates);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (method === 'DELETE') {
        await debtorAPI.delete(id);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('Debtor API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handlePaymentRoutes(
  request: Request, 
  dbService: DatabaseService, 
  corsHeaders: Record<string, string>
) {
  const url = new URL(request.url);
  const method = request.method;

  try {
    if (method === 'POST') {
      const payment = await request.json();
      const result = await dbService.createPayment(payment);
      
      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (method === 'GET') {
      const debtorId = url.searchParams.get('debtorId');
      if (!debtorId) {
        return new Response(JSON.stringify({ error: 'Debtor ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const payments = await dbService.getPaymentsByDebtor(debtorId);
      return new Response(JSON.stringify(payments.results || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('Payment API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleDashboardRoutes(
  request: Request, 
  dbService: DatabaseService, 
  corsHeaders: Record<string, string>
) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (path === '/api/dashboard/stats') {
      const stats = await dbService.getDashboardStats();
      return new Response(JSON.stringify(stats), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
