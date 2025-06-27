import { DatabaseService, initializeDatabase, Env } from '../lib/database';
import { CloudflareDebtorAPI } from '../api/debtors';

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
            <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
            <script crossorigin src="https://unpkg.com/react-router-dom@6/dist/umd/react-router-dom.production.min.js"></script>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { 
                margin: 0; 
                font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                background: #f9fafb;
              }
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
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 0.5rem;
                font-weight: 500;
                transition: all 0.2s;
                outline: none;
                border: none;
                cursor: pointer;
              }
              .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
              .btn-primary {
                background: #2563eb;
                color: white;
                padding: 0.5rem 1rem;
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
              }
              .btn-primary:hover:not(:disabled) {
                background: #1d4ed8;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              .btn-secondary {
                background: white;
                color: #374151;
                border: 1px solid #d1d5db;
                padding: 0.5rem 1rem;
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
              }
              .btn-secondary:hover:not(:disabled) {
                background: #f9fafb;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              .input {
                display: block;
                width: 100%;
                border-radius: 0.5rem;
                border: 1px solid #d1d5db;
                background: white;
                padding: 0.5rem 0.75rem;
                font-size: 0.875rem;
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                transition: all 0.2s;
                outline: none;
              }
              .input:focus {
                border-color: #2563eb;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
              }
              .input::placeholder {
                color: #6b7280;
              }
              .card {
                background: white;
                border-radius: 0.75rem;
                border: 1px solid #e5e7eb;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                transition: all 0.2s;
              }
              .card:hover {
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              .badge {
                display: inline-flex;
                align-items: center;
                border-radius: 9999px;
                padding: 0.25rem 0.625rem;
                font-size: 0.75rem;
                font-weight: 500;
              }
              .badge-primary { background: #dbeafe; color: #1e40af; }
              .badge-success { background: #dcfce7; color: #166534; }
              .badge-warning { background: #fef3c7; color: #92400e; }
              .badge-error { background: #fee2e2; color: #991b1b; }
              .badge-neutral { background: #f3f4f6; color: #374151; }
              
              .text-gradient {
                background: linear-gradient(135deg, #2563eb, #06b6d4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
              }
              
              .hover-lift {
                transition: transform 0.2s;
              }
              .hover-lift:hover {
                transform: translateY(-1px);
              }
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
              // Wait for React to load
              window.addEventListener('load', function() {
                if (typeof React === 'undefined' || typeof ReactDOM === 'undefined' || typeof ReactRouterDOM === 'undefined') {
                  console.error('React libraries not loaded');
                  return;
                }
                
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
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      
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
                          h('div', { className: 'w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl hover-lift' },
                            h('span', { className: 'text-white font-bold text-2xl' }, 'CC')
                          )
                        ),
                        h('h1', { className: 'text-4xl font-bold text-gradient mb-2' }, 'CloudCollect'),
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
                            h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
                              'Company Code ', h('span', { className: 'text-red-500' }, '*')
                            ),
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
                            h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
                              'Email Address ', h('span', { className: 'text-red-500' }, '*')
                            ),
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
                            h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
                              'Password ', h('span', { className: 'text-red-500' }, '*')
                            ),
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
                            h('div', { className: 'flex' },
                              h('div', { className: 'flex-shrink-0' },
                                h('span', { className: 'text-red-400 text-xl' }, '⚠️')
                              ),
                              h('div', { className: 'ml-3' },
                                h('p', { className: 'text-sm font-medium text-red-800' }, error)
                              )
                            )
                          ),
                          h('button', {
                            type: 'submit',
                            disabled: isLoading || companyCode.length !== 4,
                            className: 'btn btn-primary w-full text-lg py-3'
                          }, 
                            isLoading ? 
                              h('div', { className: 'flex items-center' },
                                h('div', { className: 'spinner mr-2', style: { width: '16px', height: '16px', borderWidth: '2px' } }),
                                'Signing in...'
                              ) :
                              \`Sign in to Company \${companyCode || '****'}\`
                          ),
                          h('div', { className: 'bg-gray-50 rounded-lg p-4 border border-gray-200' },
                            h('h4', { className: 'text-sm font-medium text-gray-900 mb-2' }, 'Demo Credentials'),
                            h('div', { className: 'text-xs text-gray-600 space-y-1' },
                              h('p', null, h('strong', null, 'Company Code: '), h('span', { className: 'font-mono bg-gray-200 px-1 rounded' }, '1234')),
                              h('p', null, h('strong', null, 'Email: '), 'admin@example.com'),
                              h('p', null, h('strong', null, 'Password: '), 'password')
                            )
                          )
                        )
                      ),
                      h('div', { className: 'text-center mt-8' },
                        h('p', { className: 'text-xs text-gray-500' }, '© 2025 CloudCollect. All rights reserved.'),
                        h('p', { className: 'text-xs text-gray-400 mt-1' }, 'Secure multi-tenant debt management platform')
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
                      ),
                      h('div', { className: 'mt-4 sm:mt-0 flex items-center space-x-3' },
                        h('div', { className: 'flex items-center space-x-2 text-sm text-gray-500' },
                          h('div', { className: 'w-2 h-2 bg-green-500 rounded-full animate-pulse' }),
                          h('span', null, 'Live data')
                        )
                      )
                    ),
                    h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' },
                      h('div', { className: 'card p-6 hover-lift' },
                        h('div', { className: 'flex items-center justify-between' },
                          h('div', null,
                            h('p', { className: 'text-sm text-gray-600' }, 'Total Accounts'),
                            h('p', { className: 'text-2xl font-bold text-gray-900' }, stats.totalAccounts.toLocaleString()),
                            h('div', { className: 'flex items-center mt-1' },
                              h('span', { className: 'text-green-600 text-sm' }, '↗️ +12%'),
                              h('span', { className: 'text-gray-500 text-xs ml-1' }, 'vs last month')
                            )
                          ),
                          h('div', { className: 'w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center' },
                            h('span', { className: 'text-blue-600 text-xl' }, '👥')
                          )
                        )
                      ),
                      h('div', { className: 'card p-6 hover-lift' },
                        h('div', { className: 'flex items-center justify-between' },
                          h('div', null,
                            h('p', { className: 'text-sm text-gray-600' }, 'Outstanding Debt'),
                            h('p', { className: 'text-2xl font-bold text-gray-900' }, \`$\${stats.totalDebt.toLocaleString()}\`),
                            h('div', { className: 'flex items-center mt-1' },
                              h('span', { className: 'text-red-600 text-sm' }, '↗️ +8%'),
                              h('span', { className: 'text-gray-500 text-xs ml-1' }, 'vs last month')
                            )
                          ),
                          h('div', { className: 'w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center' },
                            h('span', { className: 'text-red-600 text-xl' }, '💰')
                          )
                        )
                      ),
                      h('div', { className: 'card p-6 hover-lift' },
                        h('div', { className: 'flex items-center justify-between' },
                          h('div', null,
                            h('p', { className: 'text-sm text-gray-600' }, 'Collected This Month'),
                            h('p', { className: 'text-2xl font-bold text-gray-900' }, \`$\${stats.collectedDebt.toLocaleString()}\`),
                            h('div', { className: 'flex items-center mt-1' },
                              h('span', { className: 'text-green-600 text-sm' }, '↗️ +23%'),
                              h('span', { className: 'text-gray-500 text-xs ml-1' }, 'vs last month')
                            )
                          ),
                          h('div', { className: 'w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center' },
                            h('span', { className: 'text-green-600 text-xl' }, '📈')
                          )
                        )
                      ),
                      h('div', { className: 'card p-6 hover-lift' },
                        h('div', { className: 'flex items-center justify-between' },
                          h('div', null,
                            h('p', { className: 'text-sm text-gray-600' }, 'Success Rate'),
                            h('p', { className: 'text-2xl font-bold text-gray-900' }, \`\${stats.successRate}%\`),
                            h('div', { className: 'flex items-center mt-1' },
                              h('span', { className: 'text-green-600 text-sm' }, '↗️ +5%'),
                              h('span', { className: 'text-gray-500 text-xs ml-1' }, 'vs last month')
                            )
                          ),
                          h('div', { className: 'w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center' },
                            h('span', { className: 'text-purple-600 text-xl' }, '🎯')
                          )
                        )
                      )
                    ),
                    h('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
                      h('div', { className: 'lg:col-span-2' },
                        h('div', { className: 'card p-6' },
                          h('h3', { className: 'text-lg font-medium text-gray-900 mb-4' }, 'Recent Activity'),
                          h('div', { className: 'space-y-4' },
                            h('div', { className: 'flex items-center space-x-3 p-3 bg-blue-50 rounded-lg' },
                              h('div', { className: 'w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center' },
                                h('span', { className: 'text-white text-sm' }, '👤')
                              ),
                              h('div', { className: 'flex-1' },
                                h('p', { className: 'text-sm font-medium text-gray-900' }, 'New account added: John Doe'),
                                h('p', { className: 'text-xs text-gray-500' }, '2 hours ago')
                              )
                            ),
                            h('div', { className: 'flex items-center space-x-3 p-3 bg-green-50 rounded-lg' },
                              h('div', { className: 'w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center' },
                                h('span', { className: 'text-white text-sm' }, '💳')
                              ),
                              h('div', { className: 'flex-1' },
                                h('p', { className: 'text-sm font-medium text-gray-900' }, 'Payment received: $750.00'),
                                h('p', { className: 'text-xs text-gray-500' }, '4 hours ago')
                              )
                            ),
                            h('div', { className: 'flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg' },
                              h('div', { className: 'w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center' },
                                h('span', { className: 'text-white text-sm' }, '📄')
                              ),
                              h('div', { className: 'flex-1' },
                                h('p', { className: 'text-sm font-medium text-gray-900' }, 'Demand letter sent to Jane Smith'),
                                h('p', { className: 'text-xs text-gray-500' }, '6 hours ago')
                              )
                            )
                          )
                        )
                      ),
                      h('div', { className: 'space-y-6' },
                        h('div', { className: 'card p-6' },
                          h('div', { className: 'flex items-center justify-between mb-4' },
                            h('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Collection Progress'),
                            h('div', { className: 'flex items-center space-x-2' },
                              h('div', { className: 'w-2 h-2 bg-green-500 rounded-full' }),
                              h('span', { className: 'text-sm text-gray-500' }, 'On track')
                            )
                          ),
                          h('div', { className: 'space-y-4' },
                            h('div', null,
                              h('div', { className: 'flex justify-between text-sm mb-2' },
                                h('span', { className: 'font-medium text-gray-700' }, 'Monthly Goal'),
                                h('span', { className: 'text-gray-600' }, \`$\${stats.collectedDebt.toLocaleString()} / $100,000\`)
                              ),
                              h('div', { className: 'w-full bg-gray-200 rounded-full h-3' },
                                h('div', { 
                                  className: 'bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500',
                                  style: { width: \`\${Math.min((stats.collectedDebt / 100000) * 100, 100)}%\` }
                                })
                              ),
                              h('p', { className: 'text-xs text-gray-500 mt-1' }, 
                                \`\${Math.round((stats.collectedDebt / 100000) * 100)}% of monthly goal\`
                              )
                            )
                          )
                        ),
                        h('div', { className: 'card p-6' },
                          h('h3', { className: 'text-lg font-semibold text-gray-900 mb-4' }, "Today's Activity"),
                          h('div', { className: 'space-y-4' },
                            h('div', { className: 'flex items-center justify-between p-3 bg-blue-50 rounded-lg' },
                              h('div', { className: 'flex items-center space-x-3' },
                                h('div', { className: 'w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center' },
                                  h('span', { className: 'text-white text-sm' }, '👥')
                                ),
                                h('div', null,
                                  h('p', { className: 'text-sm font-medium text-gray-900' }, 'New Accounts'),
                                  h('p', { className: 'text-xs text-gray-500' }, 'Added today')
                                )
                              ),
                              h('span', { className: 'text-lg font-bold text-blue-600' }, '12')
                            ),
                            h('div', { className: 'flex items-center justify-between p-3 bg-green-50 rounded-lg' },
                              h('div', { className: 'flex items-center space-x-3' },
                                h('div', { className: 'w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center' },
                                  h('span', { className: 'text-white text-sm' }, '💳')
                                ),
                                h('div', null,
                                  h('p', { className: 'text-sm font-medium text-gray-900' }, 'Payments'),
                                  h('p', { className: 'text-xs text-gray-500' }, 'Processed today')
                                )
                              ),
                              h('span', { className: 'text-lg font-bold text-green-600' }, '8')
                            )
                          )
                        )
                      )
                    )
                  );
                }

                // Accounts Page Component
                function AccountsPage() {
                  const [accounts] = useState([
                    { id: '1', name: 'John Doe', accountNumber: 'ACC-12345', originalBalance: 5000, balance: 3500, status: 'active', lastPayment: '2024-01-15', lastPaymentAmount: 500 },
                    { id: '2', name: 'Jane Smith', accountNumber: 'ACC-12346', originalBalance: 7500, balance: 6000, status: 'active', lastPayment: '2024-01-20', lastPaymentAmount: 750 },
                    { id: '3', name: 'Bob Johnson', accountNumber: 'ACC-12347', originalBalance: 3000, balance: 0, status: 'paid', lastPayment: '2024-01-25', lastPaymentAmount: 3000 },
                    { id: '4', name: 'Sarah Wilson', accountNumber: 'ACC-12348', originalBalance: 4500, balance: 3200, status: 'active', lastPayment: '2024-01-28', lastPaymentAmount: 300 },
                    { id: '5', name: 'Michael Brown', accountNumber: 'ACC-12349', originalBalance: 6200, balance: 4800, status: 'active', lastPayment: '2024-01-30', lastPaymentAmount: 400 }
                  ]);

                  const [searchTerm, setSearchTerm] = useState('');
                  const [filterStatus, setFilterStatus] = useState('all');

                  const filteredAccounts = accounts.filter(account => {
                    const matchesSearch = searchTerm === '' || 
                      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      account.accountNumber.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    const matchesStatus = filterStatus === 'all' || account.status === filterStatus;
                    
                    return matchesSearch && matchesStatus;
                  });

                  return h('div', null,
                    h('div', { className: 'mb-6' },
                      h('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Accounts'),
                      h('p', { className: 'mt-1 text-sm text-gray-500' }, 'Manage and view all debtor accounts')
                    ),
                    h('div', { className: 'card overflow-hidden' },
                      h('div', { className: 'px-6 py-4 border-b border-gray-200' },
                        h('div', { className: 'flex flex-col md:flex-row justify-between md:items-center space-y-3 md:space-y-0' },
                          h('h2', { className: 'text-lg font-medium text-gray-900' }, 'All Accounts'),
                          h('div', { className: 'flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3' },
                            h('div', { className: 'relative' },
                              h('input', {
                                type: 'text',
                                placeholder: 'Search by name or account #...',
                                value: searchTerm,
                                onChange: (e) => setSearchTerm(e.target.value),
                                className: 'input pl-10'
                              }),
                              h('span', { className: 'absolute left-3 top-2.5 text-gray-400' }, '🔍')
                            ),
                            h('div', { className: 'relative' },
                              h('select', {
                                value: filterStatus,
                                onChange: (e) => setFilterStatus(e.target.value),
                                className: 'input appearance-none pl-10 pr-10'
                              },
                                h('option', { value: 'all' }, 'All Statuses'),
                                h('option', { value: 'active' }, 'Active'),
                                h('option', { value: 'paid' }, 'Paid'),
                                h('option', { value: 'inactive' }, 'Inactive'),
                                h('option', { value: 'disputed' }, 'Disputed')
                              ),
                              h('span', { className: 'absolute left-3 top-2.5 text-gray-400' }, '📋')
                            )
                          )
                        )
                      ),
                      h('div', { className: 'overflow-x-auto' },
                        h('table', { className: 'min-w-full divide-y divide-gray-200' },
                          h('thead', { className: 'bg-gray-50' },
                            h('tr', null,
                              h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Name'),
                              h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Account #'),
                              h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Original Balance'),
                              h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Current Balance'),
                              h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Status'),
                              h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Last Payment')
                            )
                          ),
                          h('tbody', { className: 'bg-white divide-y divide-gray-200' },
                            filteredAccounts.length > 0 ? 
                              filteredAccounts.map(account =>
                                h('tr', { key: account.id, className: 'hover:bg-gray-50 transition-colors' },
                                  h('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                    h(Link, { 
                                      to: \`/dashboard/accounts/\${account.id}\`, 
                                      className: 'text-blue-600 hover:text-blue-900 font-medium transition-colors'
                                    }, account.name)
                                  ),
                                  h('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, account.accountNumber),
                                  h('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' }, \`$\${account.originalBalance.toLocaleString()}\`),
                                  h('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-900 font-medium' }, \`$\${account.balance.toLocaleString()}\`),
                                  h('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                    h('span', { 
                                      className: \`badge \${
                                        account.status === 'active' ? 'badge-primary' : 
                                        account.status === 'paid' ? 'badge-success' : 
                                        account.status === 'disputed' ? 'badge-warning' : 
                                        'badge-neutral'
                                      }\`
                                    }, account.status.charAt(0).toUpperCase() + account.status.slice(1))
                                  ),
                                  h('td', { className: 'px-6 py-4 whitespace-nowrap text-gray-500' },
                                    account.lastPayment ? 
                                      h('div', null,
                                        h('div', null, new Date(account.lastPayment).toLocaleDateString()),
                                        account.lastPaymentAmount && h('div', { className: 'text-xs text-gray-400' }, \`$\${account.lastPaymentAmount.toLocaleString()}\`)
                                      ) :
                                      h('span', { className: 'text-gray-400' }, 'No payments')
                                  )
                                )
                              ) :
                              h('tr', null,
                                h('td', { colSpan: 6, className: 'px-6 py-4 text-center text-gray-500' },
                                  'No accounts found matching your search criteria'
                                )
                              )
                          )
                        )
                      ),
                      h('div', { className: 'px-6 py-4 border-t border-gray-200 flex items-center justify-between' },
                        h('div', { className: 'text-sm text-gray-500' },
                          \`Showing \${filteredAccounts.length} of \${accounts.length} accounts\`
                        ),
                        h('div', { className: 'flex space-x-2' },
                          h('button', { className: 'btn btn-primary btn-sm' }, '+ Add Account')
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
                    address: '123 Main St',
                    city: 'Chicago',
                    state: 'IL',
                    zip: '60601',
                    phone: '(555) 123-4567',
                    creditor: 'First Financial',
                    lastPayment: '2024-01-15',
                    lastPaymentAmount: 500
                  };

                  const [activeTab, setActiveTab] = useState('overview');

                  const tabs = [
                    { id: 'overview', label: 'Overview', icon: '📋' },
                    { id: 'payments', label: 'Payments', icon: '💳' },
                    { id: 'notes', label: 'Notes', icon: '📝' },
                    { id: 'documents', label: 'Documents', icon: '📄' },
                    { id: 'actions', label: 'Actions', icon: '✅' }
                  ];

                  return h('div', { className: 'space-y-6' },
                    h('div', { className: 'flex items-center justify-between' },
                      h('div', { className: 'flex items-center space-x-4' },
                        h(Link, { 
                          to: '/dashboard/accounts', 
                          className: 'p-2 hover:bg-gray-100 rounded-lg transition-colors'
                        },
                          h('span', { className: 'text-gray-600' }, '← Back')
                        ),
                        h('div', null,
                          h('h1', { className: 'text-2xl font-bold text-gray-900' }, account.name),
                          h('p', { className: 'text-gray-500' }, \`Account #\${account.accountNumber}\`)
                        )
                      ),
                      h('div', { className: 'flex items-center space-x-3' },
                        h('button', { className: 'btn btn-secondary btn-sm' }, '📄 Generate Letter'),
                        h('button', { className: 'btn btn-primary btn-sm' }, '✏️ Edit Account')
                      )
                    ),
                    h('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-6' },
                      h('div', { className: 'card p-6' },
                        h('div', { className: 'flex items-center justify-between' },
                          h('div', null,
                            h('p', { className: 'text-sm text-gray-600' }, 'Current Balance'),
                            h('p', { className: 'text-2xl font-bold text-gray-900' }, \`$\${account.balance.toLocaleString()}\`)
                          ),
                          h('div', { className: 'w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center' },
                            h('span', { className: 'text-red-600 text-xl' }, '💰')
                          )
                        )
                      ),
                      h('div', { className: 'card p-6' },
                        h('div', { className: 'flex items-center justify-between' },
                          h('div', null,
                            h('p', { className: 'text-sm text-gray-600' }, 'Original Balance'),
                            h('p', { className: 'text-2xl font-bold text-gray-900' }, \`$\${account.originalBalance.toLocaleString()}\`)
                          ),
                          h('div', { className: 'w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center' },
                            h('span', { className: 'text-gray-600 text-xl' }, '💰')
                          )
                        )
                      ),
                      h('div', { className: 'card p-6' },
                        h('div', { className: 'flex items-center justify-between' },
                          h('div', null,
                            h('p', { className: 'text-sm text-gray-600' }, 'Status'),
                            h('span', { className: 'badge badge-primary' }, account.status.charAt(0).toUpperCase() + account.status.slice(1))
                          ),
                          h('div', { className: 'w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center' },
                            h('span', { className: 'text-blue-600 text-xl' }, '✅')
                          )
                        )
                      ),
                      h('div', { className: 'card p-6' },
                        h('div', { className: 'flex items-center justify-between' },
                          h('div', null,
                            h('p', { className: 'text-sm text-gray-600' }, 'Last Payment'),
                            h('p', { className: 'text-sm font-medium text-gray-900' }, 
                              account.lastPayment ? new Date(account.lastPayment).toLocaleDateString() : 'No payments'
                            ),
                            account.lastPaymentAmount && h('p', { className: 'text-xs text-gray-500' }, \`$\${account.lastPaymentAmount.toLocaleString()}\`)
                          ),
                          h('div', { className: 'w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center' },
                            h('span', { className: 'text-green-600 text-xl' }, '📅')
                          )
                        )
                      )
                    ),
                    h('div', { className: 'card p-6' },
                      h('h3', { className: 'text-lg font-medium text-gray-900 mb-4' }, 'Contact Information'),
                      h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
                        h('div', { className: 'flex items-start space-x-3' },
                          h('span', { className: 'text-gray-400 mt-0.5' }, '📍'),
                          h('div', null,
                            h('p', { className: 'text-sm font-medium text-gray-900' }, 'Address'),
                            h('p', { className: 'text-sm text-gray-600' }, 
                              \`\${account.address}\\n\${account.city}, \${account.state} \${account.zip}\`
                            )
                          )
                        ),
                        h('div', { className: 'flex items-start space-x-3' },
                          h('span', { className: 'text-gray-400 mt-0.5' }, '📧'),
                          h('div', null,
                            h('p', { className: 'text-sm font-medium text-gray-900' }, 'Email'),
                            h('p', { className: 'text-sm text-gray-600' }, account.email)
                          )
                        ),
                        h('div', { className: 'flex items-start space-x-3' },
                          h('span', { className: 'text-gray-400 mt-0.5' }, '📞'),
                          h('div', null,
                            h('p', { className: 'text-sm font-medium text-gray-900' }, 'Phone'),
                            h('p', { className: 'text-sm text-gray-600' }, account.phone)
                          )
                        )
                      )
                    ),
                    h('div', { className: 'card' },
                      h('div', { className: 'border-b border-gray-200' },
                        h('nav', { className: 'flex space-x-8 px-6' },
                          tabs.map(tab =>
                            h('button', {
                              key: tab.id,
                              onClick: () => setActiveTab(tab.id),
                              className: \`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors \${
                                activeTab === tab.id
                                  ? 'border-blue-500 text-blue-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }\`
                            },
                              h('span', null, tab.icon),
                              h('span', null, tab.label)
                            )
                          )
                        )
                      ),
                      h('div', { className: 'p-6' },
                        activeTab === 'overview' && h('div', { className: 'space-y-6' },
                          h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
                            h('div', null,
                              h('h4', { className: 'font-medium text-gray-900 mb-3' }, 'Account Details'),
                              h('dl', { className: 'space-y-2' },
                                h('div', { className: 'flex justify-between' },
                                  h('dt', { className: 'text-sm text-gray-600' }, 'Creditor'),
                                  h('dd', { className: 'text-sm font-medium text-gray-900' }, account.creditor)
                                ),
                                h('div', { className: 'flex justify-between' },
                                  h('dt', { className: 'text-sm text-gray-600' }, 'Account Type'),
                                  h('dd', { className: 'text-sm font-medium text-gray-900' }, 'Credit Card')
                                ),
                                h('div', { className: 'flex justify-between' },
                                  h('dt', { className: 'text-sm text-gray-600' }, 'Date Loaded'),
                                  h('dd', { className: 'text-sm font-medium text-gray-900' }, '2024-01-01')
                                )
                              )
                            ),
                            h('div', null,
                              h('h4', { className: 'font-medium text-gray-900 mb-3' }, 'Collection Summary'),
                              h('dl', { className: 'space-y-2' },
                                h('div', { className: 'flex justify-between' },
                                  h('dt', { className: 'text-sm text-gray-600' }, 'Total Collected'),
                                  h('dd', { className: 'text-sm font-medium text-gray-900' }, \`$\${(account.originalBalance - account.balance).toLocaleString()}\`)
                                ),
                                h('div', { className: 'flex justify-between' },
                                  h('dt', { className: 'text-sm text-gray-600' }, 'Collection Rate'),
                                  h('dd', { className: 'text-sm font-medium text-gray-900' }, \`\${Math.round(((account.originalBalance - account.balance) / account.originalBalance) * 100)}%\`)
                                ),
                                h('div', { className: 'flex justify-between' },
                                  h('dt', { className: 'text-sm text-gray-600' }, 'Days Since Contact'),
                                  h('dd', { className: 'text-sm font-medium text-gray-900' }, '12 days')
                                )
                              )
                            )
                          )
                        ),
                        activeTab === 'payments' && h('div', { className: 'space-y-4' },
                          h('div', { className: 'flex justify-between items-center' },
                            h('h4', { className: 'font-medium text-gray-900' }, 'Payment History'),
                            h('button', { className: 'btn btn-primary btn-sm' }, '+ Record Payment')
                          ),
                          h('div', { className: 'text-center py-8' },
                            h('span', { className: 'text-4xl mb-4 block' }, '💳'),
                            h('h3', { className: 'text-sm font-medium text-gray-900 mb-2' }, 'Payment history will appear here'),
                            h('p', { className: 'text-sm text-gray-500' }, 'Record payments to track collection progress')
                          )
                        ),
                        activeTab === 'notes' && h('div', { className: 'space-y-4' },
                          h('div', { className: 'flex justify-between items-center' },
                            h('h4', { className: 'font-medium text-gray-900' }, 'Account Notes'),
                            h('button', { className: 'btn btn-primary btn-sm' }, '+ Add Note')
                          ),
                          h('div', { className: 'text-center py-8' },
                            h('span', { className: 'text-4xl mb-4 block' }, '📝'),
                            h('h3', { className: 'text-sm font-medium text-gray-900 mb-2' }, 'No notes yet'),
                            h('p', { className: 'text-sm text-gray-500' }, 'Add notes to track communications and updates')
                          )
                        ),
                        activeTab === 'documents' && h('div', { className: 'space-y-4' },
                          h('div', { className: 'flex justify-between items-center' },
                            h('h4', { className: 'font-medium text-gray-900' }, 'Documents'),
                            h('div', { className: 'flex space-x-2' },
                              h('button', { className: 'btn btn-secondary btn-sm' }, 'Generate Letter'),
                              h('button', { className: 'btn btn-primary btn-sm' }, '+ Upload Document')
                            )
                          ),
                          h('div', { className: 'text-center py-8' },
                            h('span', { className: 'text-4xl mb-4 block' }, '📄'),
                            h('h3', { className: 'text-sm font-medium text-gray-900 mb-2' }, 'No documents'),
                            h('p', { className: 'text-sm text-gray-500' }, 'Upload documents or generate letters for this account')
                          )
                        ),
                        activeTab === 'actions' && h('div', { className: 'space-y-4' },
                          h('div', { className: 'flex justify-between items-center' },
                            h('h4', { className: 'font-medium text-gray-900' }, 'Actions & Tasks'),
                            h('button', { className: 'btn btn-primary btn-sm' }, '+ Add Action')
                          ),
                          h('div', { className: 'text-center py-8' },
                            h('span', { className: 'text-4xl mb-4 block' }, '⏰'),
                            h('h3', { className: 'text-sm font-medium text-gray-900 mb-2' }, 'No actions'),
                            h('p', { className: 'text-sm text-gray-500' }, 'Create actions to track collection activities')
                          )
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
                    { name: 'Import', path: '/dashboard/import', icon: '📤' },
                    { name: 'Reports', path: '/dashboard/reports', icon: '📈' }
                  ];

                  const adminItems = [
                    { name: 'Users', path: '/dashboard/users', icon: '👤' },
                    { name: 'Roles', path: '/dashboard/roles', icon: '🛡️' },
                    { name: 'Settings', path: '/dashboard/settings', icon: '⚙️' }
                  ];

                  return h('aside', { className: 'bg-white border-r border-gray-200 w-72 h-screen sticky top-0 shadow-sm' },
                    h('div', { className: 'flex flex-col h-full' },
                      h('div', { className: 'p-4 border-b border-gray-100 flex items-center justify-between' },
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
                          h('div', { className: 'mb-4' },
                            h('h3', { className: 'px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider' }, 'Main')
                          ),
                          h('ul', { className: 'space-y-1' },
                            navItems.map(item =>
                              h('li', { key: item.path },
                                h(Link, {
                                  to: item.path,
                                  className: \`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 \${
                                    window.location.pathname === item.path || 
                                    (item.path !== '/dashboard' && window.location.pathname.startsWith(item.path))
                                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                  }\`
                                },
                                  h('span', { className: 'mr-3' }, item.icon),
                                  h('div', { className: 'flex-1' },
                                    h('span', null, item.name)
                                  )
                                )
                              )
                            )
                          ),
                          h('div', { className: 'mt-8' },
                            h('div', { className: 'mb-4' },
                              h('h3', { className: 'px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider' }, 'Administration')
                            ),
                            h('ul', { className: 'space-y-1' },
                              adminItems.map(item =>
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
                                    h('div', { className: 'flex-1' },
                                      h('span', null, item.name)
                                    )
                                  )
                                )
                              )
                            )
                          )
                        )
                      ),
                      h('div', { className: 'p-4 border-t border-gray-100' },
                        h('div', { className: 'bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3' },
                          h('div', { className: 'flex items-center space-x-3' },
                            h('div', { className: 'w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center' },
                              h('span', { className: 'text-white text-xs font-bold' }, '✓')
                            ),
                            h('div', { className: 'flex-1 min-w-0' },
                              h('p', { className: 'text-sm font-medium text-gray-900' }, 'System Status'),
                              h('p', { className: 'text-xs text-gray-600' }, 'All systems operational')
                            )
                          )
                        )
                      )
                    )
                  );
                }

                // Header Component
                function Header() {
                  const [isProfileOpen, setIsProfileOpen] = useState(false);

                  const handleLogout = () => {
                    localStorage.removeItem('isAuthenticated');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                  };

                  return h('header', { className: 'bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm' },
                    h('div', { className: 'px-4 sm:px-6 lg:px-8' },
                      h('div', { className: 'flex items-center justify-between h-16' },
                        h('div', { className: 'flex items-center' },
                          h(Link, { to: '/dashboard', className: 'flex items-center space-x-3 group' },
                            h('div', { className: 'w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200' },
                              h('span', { className: 'text-white font-bold text-sm' }, 'CC')
                            ),
                            h('div', { className: 'hidden sm:block' },
                              h('h1', { className: 'text-xl font-bold text-gradient' }, 'CloudCollect'),
                              h('p', { className: 'text-xs text-gray-500 -mt-1' }, 'Debt Management')
                            )
                          )
                        ),
                        h('div', { className: 'flex items-center space-x-3' },
                          h('div', { className: 'relative' },
                            h('button', {
                              onClick: () => setIsProfileOpen(!isProfileOpen),
                              className: 'flex items-center space-x-3 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
                            },
                              h('div', { className: 'w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium text-sm shadow-md' },
                                'A'
                              ),
                              h('div', { className: 'hidden sm:block text-left' },
                                h('p', { className: 'text-sm font-medium text-gray-900' }, 'Admin User'),
                                h('p', { className: 'text-xs text-gray-500' }, 'Administrator')
                              ),
                              h('span', { className: 'text-gray-500' }, '▼')
                            ),
                            isProfileOpen && h('div', { className: 'absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2' },
                              h('div', { className: 'px-4 py-3 border-b border-gray-100' },
                                h('p', { className: 'text-sm font-medium text-gray-900' }, 'Admin User'),
                                h('p', { className: 'text-xs text-gray-500' }, 'admin@example.com')
                              ),
                              h('div', { className: 'py-1' },
                                h(Link, {
                                  to: '/dashboard/settings',
                                  className: 'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors',
                                  onClick: () => setIsProfileOpen(false)
                                },
                                  h('span', { className: 'mr-3' }, '⚙️'),
                                  'Settings'
                                )
                              ),
                              h('div', { className: 'border-t border-gray-100 py-1' },
                                h('button', {
                                  onClick: handleLogout,
                                  className: 'flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
                                },
                                  h('span', { className: 'mr-3' }, '🚪'),
                                  'Sign out'
                                )
                              )
                            )
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
                          h(Route, { path: '/import', element: h('div', { className: 'text-center py-8' }, h('h2', { className: 'text-xl font-bold' }, 'Import Page Coming Soon')) }),
                          h(Route, { path: '/reports', element: h('div', { className: 'text-center py-8' }, h('h2', { className: 'text-xl font-bold' }, 'Reports Page Coming Soon')) }),
                          h(Route, { path: '/users', element: h('div', { className: 'text-center py-8' }, h('h2', { className: 'text-xl font-bold' }, 'Users Page Coming Soon')) }),
                          h(Route, { path: '/roles', element: h('div', { className: 'text-center py-8' }, h('h2', { className: 'text-xl font-bold' }, 'Roles Page Coming Soon')) }),
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
                try {
                  const root = createRoot(document.getElementById('root'));
                  root.render(h(App));
                } catch (error) {
                  console.error('Failed to initialize app:', error);
                  document.getElementById('root').innerHTML = \`
                    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f9fafb;">
                      <div style="text-align: center; padding: 2rem;">
                        <h1 style="color: #1f2937; margin-bottom: 1rem;">CloudCollect</h1>
                        <p style="color: #6b7280;">Application failed to load. Please refresh the page.</p>
                      </div>
                    </div>
                  \`;
                }
              });
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
