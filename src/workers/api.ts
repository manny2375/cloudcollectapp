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

      // For all other routes, serve the React SPA
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💼</text></svg>" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>CloudCollect</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
              
              :root {
                --primary-50: 240 249 255;
                --primary-100: 224 242 254;
                --primary-200: 186 230 253;
                --primary-300: 125 211 252;
                --primary-400: 56 189 248;
                --primary-500: 14 165 233;
                --primary-600: 2 132 199;
                --primary-700: 3 105 161;
                --primary-800: 7 89 133;
                --primary-900: 12 74 110;
                --primary-950: 8 47 73;
                
                --accent-50: 236 254 255;
                --accent-100: 207 250 254;
                --accent-200: 165 243 252;
                --accent-300: 103 232 249;
                --accent-400: 34 211 238;
                --accent-500: 6 182 212;
                --accent-600: 8 145 178;
                --accent-700: 14 116 144;
                --accent-800: 21 94 117;
                --accent-900: 22 78 99;
                --accent-950: 8 51 68;
                
                --success-50: 240 253 244;
                --success-100: 220 252 231;
                --success-200: 187 247 208;
                --success-300: 134 239 172;
                --success-400: 74 222 128;
                --success-500: 34 197 94;
                --success-600: 22 163 74;
                --success-700: 21 128 61;
                --success-800: 22 101 52;
                --success-900: 20 83 45;
                --success-950: 5 46 22;
                
                --warning-50: 255 251 235;
                --warning-100: 254 243 199;
                --warning-200: 253 230 138;
                --warning-300: 252 211 77;
                --warning-400: 251 191 36;
                --warning-500: 245 158 11;
                --warning-600: 217 119 6;
                --warning-700: 180 83 9;
                --warning-800: 146 64 14;
                --warning-900: 120 53 15;
                --warning-950: 69 26 3;
                
                --error-50: 254 242 242;
                --error-100: 254 226 226;
                --error-200: 254 202 202;
                --error-300: 252 165 165;
                --error-400: 248 113 113;
                --error-500: 239 68 68;
                --error-600: 220 38 38;
                --error-700: 185 28 28;
                --error-800: 153 27 27;
                --error-900: 127 29 29;
                --error-950: 69 10 10;
                
                --neutral-50: 250 250 250;
                --neutral-100: 245 245 245;
                --neutral-200: 229 229 229;
                --neutral-300: 212 212 212;
                --neutral-400: 163 163 163;
                --neutral-500: 115 115 115;
                --neutral-600: 82 82 82;
                --neutral-700: 64 64 64;
                --neutral-800: 38 38 38;
                --neutral-900: 23 23 23;
                --neutral-950: 10 10 10;
              }
              
              * {
                border-color: rgb(var(--neutral-200));
              }
              
              body {
                margin: 0;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                color: rgb(var(--neutral-900));
                background: rgb(var(--neutral-50));
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
              }
              
              .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, rgb(var(--primary-50)), rgb(var(--accent-50)));
                position: relative;
                overflow: hidden;
              }
              
              .loading::before {
                content: '';
                position: absolute;
                top: -40%;
                right: -40%;
                width: 80%;
                height: 80%;
                background: radial-gradient(circle, rgba(var(--primary-200), 0.3), transparent);
                border-radius: 50%;
                filter: blur(60px);
              }
              
              .loading::after {
                content: '';
                position: absolute;
                bottom: -40%;
                left: -40%;
                width: 80%;
                height: 80%;
                background: radial-gradient(circle, rgba(var(--accent-200), 0.3), transparent);
                border-radius: 50%;
                filter: blur(60px);
              }
              
              .loading-content {
                text-align: center;
                z-index: 10;
                position: relative;
              }
              
              .logo {
                width: 64px;
                height: 64px;
                margin: 0 auto 24px;
                background: linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--accent-500)));
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 24px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                animation: pulse 2s infinite;
              }
              
              .title {
                font-size: 32px;
                font-weight: bold;
                background: linear-gradient(135deg, rgb(var(--primary-600)), rgb(var(--accent-500)));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 8px;
              }
              
              .subtitle {
                color: rgb(var(--neutral-600));
                margin-bottom: 32px;
              }
              
              .spinner {
                width: 32px;
                height: 32px;
                border: 3px solid rgb(var(--neutral-200));
                border-top: 3px solid rgb(var(--primary-600));
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto;
              }
              
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              
              @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
              
              .error-message {
                color: rgb(var(--error-600));
                background: rgb(var(--error-50));
                border: 1px solid rgb(var(--error-200));
                padding: 16px;
                border-radius: 8px;
                margin-top: 24px;
                max-width: 400px;
              }
            </style>
          </head>
          <body>
            <div id="root">
              <div class="loading">
                <div class="loading-content">
                  <div class="logo">CC</div>
                  <h1 class="title">CloudCollect</h1>
                  <p class="subtitle">Professional Debt Management Platform</p>
                  <div class="spinner"></div>
                  <p style="margin-top: 16px; color: rgb(var(--neutral-500)); font-size: 14px;">
                    Loading application...
                  </p>
                </div>
              </div>
            </div>
            
            <script type="module">
              // React and ReactDOM from CDN
              import React from 'https://esm.sh/react@18.2.0';
              import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
              import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams, Outlet, useLocation } from 'https://esm.sh/react-router-dom@6.22.0';
              
              // Lucide React icons
              import { 
                Building, Mail, Lock, Eye, EyeOff, ArrowRight, Home, Users, FileText, 
                BarChart2, Settings, FileUp, Shield, ChevronLeft, ChevronRight, CreditCard, 
                Activity, Bell, User, ChevronDown, Search, Moon, Sun, LogOut, DollarSign, 
                TrendingUp, AlertCircle, Target, Clock, CheckCircle, Phone, MapPin, 
                Calendar, Plus, Edit, Download, MessageSquare, Filter, Trash2, X
              } from 'https://esm.sh/lucide-react@0.330.0';
              
              // Create React app inline
              const { useState, useEffect, useRef, Suspense, lazy, StrictMode } = React;
              
              // Utility functions
              const formatCurrency = (value) => {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(value);
              };
              
              const formatDate = (date) => {
                if (!date) return 'N/A';
                return new Date(date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
              };
              
              const formatPhoneNumber = (phone) => {
                const cleaned = phone.replace(/\\D/g, '');
                if (cleaned.length === 10) {
                  return \`(\${cleaned.slice(0, 3)}) \${cleaned.slice(3, 6)}-\${cleaned.slice(6)}\`;
                }
                return phone;
              };
              
              // API Client
              class APIClient {
                constructor(baseUrl = '/api') {
                  this.baseUrl = baseUrl;
                }
                
                async request(endpoint, options = {}) {
                  const url = \`\${this.baseUrl}\${endpoint}\`;
                  const response = await fetch(url, {
                    headers: {
                      'Content-Type': 'application/json',
                      ...options.headers,
                    },
                    ...options,
                  });
                  
                  if (!response.ok) {
                    throw new Error(\`API request failed: \${response.statusText}\`);
                  }
                  
                  return response.json();
                }
                
                async getDebtors(limit = 50, offset = 0) {
                  return this.request(\`/debtors?limit=\${limit}&offset=\${offset}\`);
                }
                
                async getDebtor(id) {
                  return this.request(\`/debtors/\${id}\`);
                }
                
                async searchDebtors(term) {
                  return this.request(\`/debtors/search?q=\${encodeURIComponent(term)}\`);
                }
                
                async getDashboardStats() {
                  return this.request('/dashboard/stats');
                }
              }
              
              const apiClient = new APIClient();
              
              // Login Page Component
              const LoginPage = () => {
                const navigate = useNavigate();
                const [companyCode, setCompanyCode] = useState('');
                const [email, setEmail] = useState('');
                const [password, setPassword] = useState('');
                const [showPassword, setShowPassword] = useState(false);
                const [error, setError] = useState('');
                const [isLoading, setIsLoading] = useState(false);
                
                const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
                if (isAuthenticated) {
                  return React.createElement(Navigate, { to: "/dashboard", replace: true });
                }
                
                const validateCompanyCode = (code) => /^\\d{4}$/.test(code);
                
                const handleCompanyCodeChange = (e) => {
                  const value = e.target.value.replace(/\\D/g, '').slice(0, 4);
                  setCompanyCode(value);
                };
                
                const handleSubmit = async (e) => {
                  e.preventDefault();
                  setError('');
                  setIsLoading(true);
                  
                  try {
                    if (!validateCompanyCode(companyCode)) {
                      throw new Error('Company code must be exactly 4 digits');
                    }
                    
                    if (!email.trim() || !password.trim()) {
                      throw new Error('Email and password are required');
                    }
                    
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
                      localStorage.setItem('company', JSON.stringify({
                        id: 'company-1234',
                        code: companyCode,
                        name: 'Demo Company',
                        email: 'contact@democompany.com'
                      }));
                      
                      navigate('/dashboard');
                    } else {
                      throw new Error('Invalid company code, email, or password');
                    }
                  } catch (err) {
                    setError(err.message || 'Authentication failed. Please try again.');
                  } finally {
                    setIsLoading(false);
                  }
                };
                
                return React.createElement('div', {
                  className: 'min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden'
                }, [
                  React.createElement('div', {
                    key: 'bg1',
                    className: 'absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-200/30 to-cyan-200/30 blur-3xl'
                  }),
                  React.createElement('div', {
                    key: 'bg2',
                    className: 'absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-200/30 to-blue-200/30 blur-3xl'
                  }),
                  React.createElement('div', {
                    key: 'content',
                    className: 'w-full max-w-md relative z-10'
                  }, [
                    React.createElement('div', {
                      key: 'header',
                      className: 'text-center mb-10'
                    }, [
                      React.createElement('div', {
                        key: 'logo-container',
                        className: 'flex justify-center mb-6'
                      }, React.createElement('div', {
                        className: 'w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl'
                      }, React.createElement('span', {
                        className: 'text-white font-bold text-2xl'
                      }, 'CC'))),
                      React.createElement('h1', {
                        key: 'title',
                        className: 'text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2'
                      }, 'CloudCollect'),
                      React.createElement('p', {
                        key: 'subtitle',
                        className: 'text-gray-600'
                      }, 'Professional Debt Management Platform'),
                      React.createElement('p', {
                        key: 'subtitle2',
                        className: 'text-sm text-gray-500 mt-2'
                      }, 'Multi-tenant secure access')
                    ]),
                    React.createElement('div', {
                      key: 'form-container',
                      className: 'bg-white rounded-xl shadow-lg p-8'
                    }, [
                      React.createElement('div', {
                        key: 'form-header',
                        className: 'mb-6'
                      }, [
                        React.createElement('h2', {
                          className: 'text-2xl font-bold text-gray-900 mb-2'
                        }, 'Welcome back'),
                        React.createElement('p', {
                          className: 'text-gray-600'
                        }, 'Sign in to your company account')
                      ]),
                      React.createElement('form', {
                        key: 'form',
                        onSubmit: handleSubmit,
                        className: 'space-y-6'
                      }, [
                        React.createElement('div', {
                          key: 'company-code'
                        }, [
                          React.createElement('label', {
                            htmlFor: 'company-code',
                            className: 'block text-sm font-medium text-gray-700 mb-2'
                          }, ['Company Code ', React.createElement('span', { className: 'text-red-500' }, '*')]),
                          React.createElement('div', {
                            className: 'relative'
                          }, [
                            React.createElement('input', {
                              id: 'company-code',
                              type: 'text',
                              value: companyCode,
                              onChange: handleCompanyCodeChange,
                              className: \`block w-full pl-10 pr-3 py-2 border rounded-lg shadow-sm text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500 \${companyCode && !validateCompanyCode(companyCode) ? 'border-red-300' : 'border-gray-300'}\`,
                              placeholder: '0000',
                              maxLength: 4,
                              required: true,
                              autoComplete: 'organization'
                            }),
                            React.createElement(Building, {
                              className: 'absolute left-3 top-2.5 h-5 w-5 text-gray-400'
                            })
                          ]),
                          React.createElement('div', {
                            className: 'mt-1 flex items-center justify-between'
                          }, [
                            React.createElement('p', {
                              className: 'text-xs text-gray-500'
                            }, 'Your unique 4-digit company identifier'),
                            companyCode && React.createElement('div', {
                              className: 'flex items-center space-x-1'
                            }, [
                              React.createElement('div', {
                                className: \`w-2 h-2 rounded-full \${validateCompanyCode(companyCode) ? 'bg-green-500' : 'bg-red-500'}\`
                              }),
                              React.createElement('span', {
                                className: \`text-xs \${validateCompanyCode(companyCode) ? 'text-green-600' : 'text-red-600'}\`
                              }, \`\${companyCode.length}/4\`)
                            ])
                          ])
                        ]),
                        React.createElement('div', {
                          key: 'email'
                        }, [
                          React.createElement('label', {
                            htmlFor: 'email',
                            className: 'block text-sm font-medium text-gray-700 mb-2'
                          }, ['Email Address ', React.createElement('span', { className: 'text-red-500' }, '*')]),
                          React.createElement('div', {
                            className: 'relative'
                          }, [
                            React.createElement('input', {
                              id: 'email',
                              type: 'email',
                              value: email,
                              onChange: (e) => setEmail(e.target.value.trim()),
                              className: 'block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                              placeholder: 'Enter your email',
                              required: true,
                              autoComplete: 'email'
                            }),
                            React.createElement(Mail, {
                              className: 'absolute left-3 top-2.5 h-5 w-5 text-gray-400'
                            })
                          ])
                        ]),
                        React.createElement('div', {
                          key: 'password'
                        }, [
                          React.createElement('label', {
                            htmlFor: 'password',
                            className: 'block text-sm font-medium text-gray-700 mb-2'
                          }, ['Password ', React.createElement('span', { className: 'text-red-500' }, '*')]),
                          React.createElement('div', {
                            className: 'relative'
                          }, [
                            React.createElement('input', {
                              id: 'password',
                              type: showPassword ? 'text' : 'password',
                              value: password,
                              onChange: (e) => setPassword(e.target.value),
                              className: 'block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                              placeholder: 'Enter your password',
                              required: true,
                              autoComplete: 'current-password'
                            }),
                            React.createElement(Lock, {
                              className: 'absolute left-3 top-2.5 h-5 w-5 text-gray-400'
                            }),
                            React.createElement('button', {
                              type: 'button',
                              onClick: () => setShowPassword(!showPassword),
                              className: 'absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors'
                            }, showPassword ? React.createElement(EyeOff, { className: 'h-5 w-5' }) : React.createElement(Eye, { className: 'h-5 w-5' }))
                          ])
                        ]),
                        error && React.createElement('div', {
                          key: 'error',
                          className: 'bg-red-50 border border-red-200 rounded-lg p-4'
                        }, React.createElement('p', {
                          className: 'text-sm font-medium text-red-800'
                        }, error)),
                        React.createElement('button', {
                          key: 'submit',
                          type: 'submit',
                          disabled: isLoading || !validateCompanyCode(companyCode),
                          className: 'w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                        }, isLoading ? [
                          React.createElement('svg', {
                            key: 'spinner',
                            className: 'animate-spin -ml-1 mr-3 h-5 w-5 text-white',
                            xmlns: 'http://www.w3.org/2000/svg',
                            fill: 'none',
                            viewBox: '0 0 24 24'
                          }, [
                            React.createElement('circle', {
                              className: 'opacity-25',
                              cx: '12',
                              cy: '12',
                              r: '10',
                              stroke: 'currentColor',
                              strokeWidth: '4'
                            }),
                            React.createElement('path', {
                              className: 'opacity-75',
                              fill: 'currentColor',
                              d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            })
                          ]),
                          'Signing in...'
                        ] : [
                          \`Sign in to Company \${companyCode || '****'}\`,
                          React.createElement(ArrowRight, {
                            key: 'arrow',
                            className: 'ml-2 h-4 w-4'
                          })
                        ]),
                        React.createElement('div', {
                          key: 'demo',
                          className: 'bg-gray-50 rounded-lg p-4 border border-gray-200'
                        }, [
                          React.createElement('h4', {
                            className: 'text-sm font-medium text-gray-900 mb-2'
                          }, 'Demo Credentials'),
                          React.createElement('div', {
                            className: 'text-xs text-gray-600 space-y-1'
                          }, [
                            React.createElement('p', {}, [
                              React.createElement('strong', {}, 'Company Code: '),
                              React.createElement('span', { className: 'font-mono' }, '1234')
                            ]),
                            React.createElement('p', {}, [
                              React.createElement('strong', {}, 'Email: '),
                              'admin@example.com'
                            ]),
                            React.createElement('p', {}, [
                              React.createElement('strong', {}, 'Password: '),
                              'password'
                            ])
                          ])
                        ])
                      ])
                    ])
                  ])
                ]);
              };
              
              // Dashboard Page Component
              const DashboardPage = () => {
                const [stats, setStats] = useState(null);
                const [loading, setLoading] = useState(true);
                
                useEffect(() => {
                  const fetchStats = async () => {
                    try {
                      const data = await apiClient.getDashboardStats();
                      setStats(data);
                    } catch (error) {
                      console.error('Failed to fetch stats:', error);
                      // Use mock data if API fails
                      setStats({
                        totalAccounts: 243,
                        activeAccounts: 186,
                        totalDebt: 1250000,
                        collectedDebt: 456000,
                        successRate: 74
                      });
                    } finally {
                      setLoading(false);
                    }
                  };
                  
                  fetchStats();
                }, []);
                
                if (loading) {
                  return React.createElement('div', {
                    className: 'min-h-screen flex items-center justify-center'
                  }, React.createElement('div', {
                    className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
                  }));
                }
                
                return React.createElement('div', {
                  className: 'space-y-8'
                }, [
                  React.createElement('div', {
                    key: 'header',
                    className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between'
                  }, [
                    React.createElement('div', {}, [
                      React.createElement('h1', {
                        className: 'text-3xl font-bold text-gray-900'
                      }, 'Dashboard'),
                      React.createElement('p', {
                        className: 'mt-2 text-gray-600'
                      }, "Welcome back! Here's what's happening with your collections.")
                    ]),
                    React.createElement('div', {
                      className: 'mt-4 sm:mt-0 flex items-center space-x-3'
                    }, [
                      React.createElement('div', {
                        className: 'flex items-center space-x-2 text-sm text-gray-500'
                      }, [
                        React.createElement('div', {
                          className: 'w-2 h-2 bg-green-500 rounded-full animate-pulse'
                        }),
                        React.createElement('span', {}, 'Live data')
                      ]),
                      React.createElement('button', {
                        className: 'inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
                      }, [
                        React.createElement(Activity, {
                          className: 'w-4 h-4 mr-2'
                        }),
                        'View Activity'
                      ])
                    ])
                  ]),
                  stats && React.createElement('div', {
                    key: 'stats',
                    className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
                  }, [
                    React.createElement('div', {
                      key: 'total-accounts',
                      className: 'relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 p-6 shadow-sm hover:shadow-md transition-all duration-200'
                    }, [
                      React.createElement('div', {
                        className: 'absolute inset-0 opacity-5'
                      }, [
                        React.createElement('div', {
                          className: 'absolute -right-4 -top-4 w-24 h-24 rounded-full bg-current'
                        }),
                        React.createElement('div', {
                          className: 'absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-current'
                        })
                      ]),
                      React.createElement('div', {
                        className: 'relative'
                      }, [
                        React.createElement('div', {
                          className: 'flex items-center justify-between'
                        }, [
                          React.createElement('div', {
                            className: 'flex-1'
                          }, [
                            React.createElement('p', {
                              className: 'text-sm font-medium text-gray-600 mb-1'
                            }, 'Total Accounts'),
                            React.createElement('p', {
                              className: 'text-3xl font-bold text-blue-700 mb-2'
                            }, stats.totalAccounts.toLocaleString()),
                            React.createElement('div', {
                              className: 'flex items-center space-x-1'
                            }, [
                              React.createElement(TrendingUp, {
                                className: 'w-4 h-4 text-green-500'
                              }),
                              React.createElement('span', {
                                className: 'text-sm font-medium text-green-600'
                              }, '+12%'),
                              React.createElement('span', {
                                className: 'text-sm text-gray-500'
                              }, 'vs last month')
                            ])
                          ]),
                          React.createElement('div', {
                            className: 'bg-blue-500 p-3 rounded-xl shadow-lg'
                          }, React.createElement(Users, {
                            className: 'w-6 h-6 text-white'
                          }))
                        ])
                      ])
                    ]),
                    React.createElement('div', {
                      key: 'total-debt',
                      className: 'relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 p-6 shadow-sm hover:shadow-md transition-all duration-200'
                    }, [
                      React.createElement('div', {
                        className: 'absolute inset-0 opacity-5'
                      }, [
                        React.createElement('div', {
                          className: 'absolute -right-4 -top-4 w-24 h-24 rounded-full bg-current'
                        }),
                        React.createElement('div', {
                          className: 'absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-current'
                        })
                      ]),
                      React.createElement('div', {
                        className: 'relative'
                      }, [
                        React.createElement('div', {
                          className: 'flex items-center justify-between'
                        }, [
                          React.createElement('div', {
                            className: 'flex-1'
                          }, [
                            React.createElement('p', {
                              className: 'text-sm font-medium text-gray-600 mb-1'
                            }, 'Outstanding Debt'),
                            React.createElement('p', {
                              className: 'text-3xl font-bold text-red-700 mb-2'
                            }, formatCurrency(stats.totalDebt)),
                            React.createElement('div', {
                              className: 'flex items-center space-x-1'
                            }, [
                              React.createElement(TrendingUp, {
                                className: 'w-4 h-4 text-green-500'
                              }),
                              React.createElement('span', {
                                className: 'text-sm font-medium text-green-600'
                              }, '+8%'),
                              React.createElement('span', {
                                className: 'text-sm text-gray-500'
                              }, 'vs last month')
                            ])
                          ]),
                          React.createElement('div', {
                            className: 'bg-red-500 p-3 rounded-xl shadow-lg'
                          }, React.createElement(DollarSign, {
                            className: 'w-6 h-6 text-white'
                          }))
                        ])
                      ])
                    ]),
                    React.createElement('div', {
                      key: 'collected',
                      className: 'relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 p-6 shadow-sm hover:shadow-md transition-all duration-200'
                    }, [
                      React.createElement('div', {
                        className: 'absolute inset-0 opacity-5'
                      }, [
                        React.createElement('div', {
                          className: 'absolute -right-4 -top-4 w-24 h-24 rounded-full bg-current'
                        }),
                        React.createElement('div', {
                          className: 'absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-current'
                        })
                      ]),
                      React.createElement('div', {
                        className: 'relative'
                      }, [
                        React.createElement('div', {
                          className: 'flex items-center justify-between'
                        }, [
                          React.createElement('div', {
                            className: 'flex-1'
                          }, [
                            React.createElement('p', {
                              className: 'text-sm font-medium text-gray-600 mb-1'
                            }, 'Collected This Month'),
                            React.createElement('p', {
                              className: 'text-3xl font-bold text-green-700 mb-2'
                            }, formatCurrency(stats.collectedDebt)),
                            React.createElement('div', {
                              className: 'flex items-center space-x-1'
                            }, [
                              React.createElement(TrendingUp, {
                                className: 'w-4 h-4 text-green-500'
                              }),
                              React.createElement('span', {
                                className: 'text-sm font-medium text-green-600'
                              }, '+23%'),
                              React.createElement('span', {
                                className: 'text-sm text-gray-500'
                              }, 'vs last month')
                            ])
                          ]),
                          React.createElement('div', {
                            className: 'bg-green-500 p-3 rounded-xl shadow-lg'
                          }, React.createElement(TrendingUp, {
                            className: 'w-6 h-6 text-white'
                          }))
                        ])
                      ])
                    ]),
                    React.createElement('div', {
                      key: 'success-rate',
                      className: 'relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 p-6 shadow-sm hover:shadow-md transition-all duration-200'
                    }, [
                      React.createElement('div', {
                        className: 'absolute inset-0 opacity-5'
                      }, [
                        React.createElement('div', {
                          className: 'absolute -right-4 -top-4 w-24 h-24 rounded-full bg-current'
                        }),
                        React.createElement('div', {
                          className: 'absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-current'
                        })
                      ]),
                      React.createElement('div', {
                        className: 'relative'
                      }, [
                        React.createElement('div', {
                          className: 'flex items-center justify-between'
                        }, [
                          React.createElement('div', {
                            className: 'flex-1'
                          }, [
                            React.createElement('p', {
                              className: 'text-sm font-medium text-gray-600 mb-1'
                            }, 'Success Rate'),
                            React.createElement('p', {
                              className: 'text-3xl font-bold text-purple-700 mb-2'
                            }, \`\${stats.successRate}%\`),
                            React.createElement('div', {
                              className: 'flex items-center space-x-1'
                            }, [
                              React.createElement(TrendingUp, {
                                className: 'w-4 h-4 text-green-500'
                              }),
                              React.createElement('span', {
                                className: 'text-sm font-medium text-green-600'
                              }, '+5%'),
                              React.createElement('span', {
                                className: 'text-sm text-gray-500'
                              }, 'vs last month')
                            ])
                          ]),
                          React.createElement('div', {
                            className: 'bg-purple-500 p-3 rounded-xl shadow-lg'
                          }, React.createElement(Target, {
                            className: 'w-6 h-6 text-white'
                          }))
                        ])
                      ])
                    ])
                  ]),
                  React.createElement('div', {
                    key: 'content',
                    className: 'grid grid-cols-1 lg:grid-cols-3 gap-6'
                  }, [
                    React.createElement('div', {
                      key: 'main',
                      className: 'lg:col-span-2'
                    }, React.createElement('div', {
                      className: 'bg-white rounded-lg shadow-sm'
                    }, [
                      React.createElement('div', {
                        className: 'px-6 py-4 border-b border-gray-200'
                      }, React.createElement('h3', {
                        className: 'text-lg font-medium text-gray-900'
                      }, 'Recent Activity')),
                      React.createElement('div', {
                        className: 'p-6'
                      }, React.createElement('p', {
                        className: 'text-gray-500 text-center py-8'
                      }, 'Recent account activity will appear here'))
                    ])),
                    React.createElement('div', {
                      key: 'sidebar',
                      className: 'space-y-6'
                    }, [
                      React.createElement('div', {
                        className: 'bg-white rounded-lg shadow-sm p-6'
                      }, [
                        React.createElement('div', {
                          className: 'flex items-center justify-between mb-4'
                        }, [
                          React.createElement('h3', {
                            className: 'text-lg font-semibold text-gray-900'
                          }, 'Collection Progress'),
                          React.createElement('div', {
                            className: 'flex items-center space-x-2'
                          }, [
                            React.createElement('div', {
                              className: 'w-2 h-2 bg-green-500 rounded-full'
                            }),
                            React.createElement('span', {
                              className: 'text-sm text-gray-500'
                            }, 'On track')
                          ])
                        ]),
                        React.createElement('div', {
                          className: 'space-y-4'
                        }, [
                          React.createElement('div', {}, [
                            React.createElement('div', {
                              className: 'flex justify-between text-sm mb-2'
                            }, [
                              React.createElement('span', {
                                className: 'font-medium text-gray-700'
                              }, 'Monthly Goal'),
                              React.createElement('span', {
                                className: 'text-gray-600'
                              }, \`\${formatCurrency(stats.collectedDebt)} / \${formatCurrency(100000)}\`)
                            ]),
                            React.createElement('div', {
                              className: 'w-full bg-gray-200 rounded-full h-3'
                            }, React.createElement('div', {
                              className: 'bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500',
                              style: { width: \`\${Math.min((stats.collectedDebt / 100000) * 100, 100)}%\` }
                            })),
                            React.createElement('p', {
                              className: 'text-xs text-gray-500 mt-1'
                            }, \`\${Math.round((stats.collectedDebt / 100000) * 100)}% of monthly goal\`)
                          ]),
                          React.createElement('div', {
                            className: 'grid grid-cols-2 gap-4 pt-4 border-t border-gray-100'
                          }, [
                            React.createElement('div', {
                              className: 'text-center'
                            }, [
                              React.createElement('div', {
                                className: 'flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mx-auto mb-2'
                              }, React.createElement(CheckCircle, {
                                className: 'w-5 h-5 text-green-600'
                              })),
                              React.createElement('p', {
                                className: 'text-2xl font-bold text-green-600'
                              }, \`\${stats.successRate}%\`),
                              React.createElement('p', {
                                className: 'text-xs text-gray-500'
                              }, 'Success Rate')
                            ]),
                            React.createElement('div', {
                              className: 'text-center'
                            }, [
                              React.createElement('div', {
                                className: 'flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-2'
                              }, React.createElement(Clock, {
                                className: 'w-5 h-5 text-blue-600'
                              })),
                              React.createElement('p', {
                                className: 'text-2xl font-bold text-blue-600'
                              }, '4.2'),
                              React.createElement('p', {
                                className: 'text-xs text-gray-500'
                              }, 'Avg Days')
                            ])
                          ])
                        ])
                      ]),
                      React.createElement('div', {
                        className: 'bg-white rounded-lg shadow-sm p-6'
                      }, [
                        React.createElement('h3', {
                          className: 'text-lg font-semibold text-gray-900 mb-4'
                        }, "Today's Activity"),
                        React.createElement('div', {
                          className: 'space-y-4'
                        }, [
                          React.createElement('div', {
                            className: 'flex items-center justify-between p-3 bg-blue-50 rounded-lg'
                          }, [
                            React.createElement('div', {
                              className: 'flex items-center space-x-3'
                            }, [
                              React.createElement('div', {
                                className: 'w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center'
                              }, React.createElement(Users, {
                                className: 'w-4 h-4 text-white'
                              })),
                              React.createElement('div', {}, [
                                React.createElement('p', {
                                  className: 'text-sm font-medium text-gray-900'
                                }, 'New Accounts'),
                                React.createElement('p', {
                                  className: 'text-xs text-gray-500'
                                }, 'Added today')
                              ])
                            ]),
                            React.createElement('span', {
                              className: 'text-lg font-bold text-blue-600'
                            }, '12')
                          ]),
                          React.createElement('div', {
                            className: 'flex items-center justify-between p-3 bg-green-50 rounded-lg'
                          }, [
                            React.createElement('div', {
                              className: 'flex items-center space-x-3'
                            }, [
                              React.createElement('div', {
                                className: 'w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center'
                              }, React.createElement(DollarSign, {
                                className: 'w-4 h-4 text-white'
                              })),
                              React.createElement('div', {}, [
                                React.createElement('p', {
                                  className: 'text-sm font-medium text-gray-900'
                                }, 'Payments'),
                                React.createElement('p', {
                                  className: 'text-xs text-gray-500'
                                }, 'Processed today')
                              ])
                            ]),
                            React.createElement('span', {
                              className: 'text-lg font-bold text-green-600'
                            }, '8')
                          ]),
                          React.createElement('div', {
                            className: 'flex items-center justify-between p-3 bg-yellow-50 rounded-lg'
                          }, [
                            React.createElement('div', {
                              className: 'flex items-center space-x-3'
                            }, [
                              React.createElement('div', {
                                className: 'w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center'
                              }, React.createElement(AlertCircle, {
                                className: 'w-4 h-4 text-white'
                              })),
                              React.createElement('div', {}, [
                                React.createElement('p', {
                                  className: 'text-sm font-medium text-gray-900'
                                }, 'Follow-ups'),
                                React.createElement('p', {
                                  className: 'text-xs text-gray-500'
                                }, 'Due today')
                              ])
                            ]),
                            React.createElement('span', {
                              className: 'text-lg font-bold text-yellow-600'
                            }, '15')
                          ])
                        ])
                      ])
                    ])
                  ])
                ]);
              };
              
              // Accounts Page Component
              const AccountsPage = () => {
                const [accounts, setAccounts] = useState([]);
                const [loading, setLoading] = useState(true);
                const [searchTerm, setSearchTerm] = useState('');
                const [filterStatus, setFilterStatus] = useState('all');
                
                useEffect(() => {
                  const fetchAccounts = async () => {
                    try {
                      const data = await apiClient.getDebtors();
                      setAccounts(data);
                    } catch (error) {
                      console.error('Failed to fetch accounts:', error);
                      // Use mock data if API fails
                      setAccounts([
                        {
                          id: 'debtor-1',
                          first_name: 'John',
                          last_name: 'Doe',
                          account_number: 'ACC-12345',
                          original_balance: 5000,
                          current_balance: 3500,
                          status: 'active',
                          last_payment_date: '2024-01-15',
                          last_payment_amount: 500
                        },
                        {
                          id: 'debtor-2',
                          first_name: 'Jane',
                          last_name: 'Smith',
                          account_number: 'ACC-12346',
                          original_balance: 7500,
                          current_balance: 6000,
                          status: 'active',
                          last_payment_date: '2024-01-20',
                          last_payment_amount: 750
                        },
                        {
                          id: 'debtor-3',
                          first_name: 'Bob',
                          last_name: 'Johnson',
                          account_number: 'ACC-12347',
                          original_balance: 3000,
                          current_balance: 0,
                          status: 'paid',
                          last_payment_date: '2024-01-25',
                          last_payment_amount: 3000
                        }
                      ]);
                    } finally {
                      setLoading(false);
                    }
                  };
                  
                  fetchAccounts();
                }, []);
                
                const filteredAccounts = accounts.filter(account => {
                  const searchFields = [
                    \`\${account.first_name} \${account.last_name}\`.toLowerCase(),
                    account.account_number.toLowerCase(),
                    account.account_number.replace(/[^0-9]/g, ''),
                  ];
                  
                  const searchTerms = searchTerm.toLowerCase().trim().split(/\\s+/);
                  
                  const matchesSearch = searchTerm === '' || searchTerms.every(term => {
                    const normalizedTerm = term.replace(/[^a-zA-Z0-9]/g, '');
                    return searchFields.some(field => 
                      field.includes(normalizedTerm) || 
                      (field === account.account_number.toLowerCase() && field.includes(term))
                    );
                  });
                  
                  const matchesStatus = filterStatus === 'all' || account.status === filterStatus;
                  
                  return matchesSearch && matchesStatus;
                });
                
                return React.createElement('div', {}, [
                  React.createElement('div', {
                    key: 'header',
                    className: 'mb-6'
                  }, [
                    React.createElement('h1', {
                      className: 'text-2xl font-bold text-gray-900'
                    }, 'Accounts'),
                    React.createElement('p', {
                      className: 'mt-1 text-sm text-gray-500'
                    }, 'Manage and view all debtor accounts')
                  ]),
                  React.createElement('div', {
                    key: 'table',
                    className: 'bg-white rounded-lg shadow-sm overflow-hidden'
                  }, [
                    React.createElement('div', {
                      className: 'px-6 py-4 border-b border-gray-200'
                    }, React.createElement('div', {
                      className: 'flex flex-col md:flex-row justify-between md:items-center space-y-3 md:space-y-0'
                    }, [
                      React.createElement('h2', {
                        className: 'text-lg font-medium text-gray-900'
                      }, 'Accounts'),
                      React.createElement('div', {
                        className: 'flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3'
                      }, [
                        React.createElement('div', {
                          className: 'relative'
                        }, [
                          React.createElement('input', {
                            type: 'text',
                            placeholder: 'Search by name or account #...',
                            value: searchTerm,
                            onChange: (e) => setSearchTerm(e.target.value),
                            className: 'block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
                          }),
                          React.createElement(Search, {
                            className: 'absolute left-3 top-2.5 h-5 w-5 text-gray-400'
                          })
                        ]),
                        React.createElement('div', {
                          className: 'relative'
                        }, [
                          React.createElement('select', {
                            value: filterStatus,
                            onChange: (e) => setFilterStatus(e.target.value),
                            className: 'block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 appearance-none'
                          }, [
                            React.createElement('option', { value: 'all' }, 'All Statuses'),
                            React.createElement('option', { value: 'active' }, 'Active'),
                            React.createElement('option', { value: 'paid' }, 'Paid'),
                            React.createElement('option', { value: 'inactive' }, 'Inactive'),
                            React.createElement('option', { value: 'disputed' }, 'Disputed')
                          ]),
                          React.createElement(Filter, {
                            className: 'absolute left-3 top-2.5 h-5 w-5 text-gray-400'
                          }),
                          React.createElement(ChevronDown, {
                            className: 'absolute right-3 top-2.5 h-5 w-5 text-gray-400'
                          })
                        ])
                      ])
                    ])),
                    React.createElement('div', {
                      className: 'overflow-x-auto'
                    }, React.createElement('table', {
                      className: 'min-w-full divide-y divide-gray-200'
                    }, [
                      React.createElement('thead', {
                        className: 'bg-gray-50'
                      }, React.createElement('tr', {}, [
                        React.createElement('th', {
                          scope: 'col',
                          className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        }, 'Name'),
                        React.createElement('th', {
                          scope: 'col',
                          className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        }, 'Account #'),
                        React.createElement('th', {
                          scope: 'col',
                          className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        }, 'Original Balance'),
                        React.createElement('th', {
                          scope: 'col',
                          className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        }, 'Current Balance'),
                        React.createElement('th', {
                          scope: 'col',
                          className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        }, 'Status'),
                        React.createElement('th', {
                          scope: 'col',
                          className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        }, 'Last Payment')
                      ])),
                      React.createElement('tbody', {
                        className: 'bg-white divide-y divide-gray-200'
                      }, loading ? [
                        ...Array(5).fill(0).map((_, index) => 
                          React.createElement('tr', { key: index }, 
                            React.createElement('td', {
                              colSpan: 6,
                              className: 'px-6 py-4 whitespace-nowrap'
                            }, React.createElement('div', {
                              className: 'h-4 bg-gray-200 rounded animate-pulse'
                            }))
                          )
                        )
                      ] : filteredAccounts.length > 0 ? filteredAccounts.map(account => 
                        React.createElement('tr', {
                          key: account.id,
                          className: 'hover:bg-gray-50 transition-colors'
                        }, [
                          React.createElement('td', {
                            className: 'px-6 py-4 whitespace-nowrap'
                          }, React.createElement(Link, {
                            to: \`/dashboard/accounts/\${account.id}\`,
                            className: 'text-blue-600 hover:text-blue-900 font-medium transition-colors'
                          }, \`\${account.first_name} \${account.last_name}\`)),
                          React.createElement('td', {
                            className: 'px-6 py-4 whitespace-nowrap text-gray-500'
                          }, account.account_number),
                          React.createElement('td', {
                            className: 'px-6 py-4 whitespace-nowrap text-gray-500'
                          }, formatCurrency(account.original_balance)),
                          React.createElement('td', {
                            className: 'px-6 py-4 whitespace-nowrap text-gray-900 font-medium'
                          }, formatCurrency(account.current_balance)),
                          React.createElement('td', {
                            className: 'px-6 py-4 whitespace-nowrap'
                          }, React.createElement('span', {
                            className: \`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${
                              account.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                              account.status === 'paid' ? 'bg-green-100 text-green-800' : 
                              account.status === 'disputed' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'
                            }\`
                          }, account.status.charAt(0).toUpperCase() + account.status.slice(1))),
                          React.createElement('td', {
                            className: 'px-6 py-4 whitespace-nowrap text-gray-500'
                          }, account.last_payment_date ? React.createElement('div', {}, [
                            React.createElement('div', {}, new Date(account.last_payment_date).toLocaleDateString()),
                            account.last_payment_amount && React.createElement('div', {
                              className: 'text-xs text-gray-400'
                            }, formatCurrency(account.last_payment_amount))
                          ]) : React.createElement('span', {
                            className: 'text-gray-400'
                          }, 'No payments'))
                        ])
                      ) : [
                        React.createElement('tr', { key: 'no-results' }, 
                          React.createElement('td', {
                            colSpan: 6,
                            className: 'px-6 py-4 text-center text-gray-500'
                          }, 'No accounts found matching your search criteria')
                        )
                      ])
                    ])),
                    React.createElement('div', {
                      className: 'px-6 py-4 border-t border-gray-200 flex items-center justify-between'
                    }, [
                      React.createElement('div', {
                        className: 'text-sm text-gray-500'
                      }, \`Showing \${filteredAccounts.length} of \${accounts.length} accounts\`),
                      React.createElement('div', {
                        className: 'flex space-x-2'
                      }, React.createElement(Link, {
                        to: '/dashboard/import',
                        className: 'inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
                      }, 'Import Accounts'))
                    ])
                  ])
                ]);
              };
              
              // Layout Components
              const Header = ({ username }) => {
                const [isProfileOpen, setIsProfileOpen] = useState(false);
                const [isDarkMode, setIsDarkMode] = useState(false);
                const [notifications] = useState(3);
                
                const toggleDarkMode = () => {
                  setIsDarkMode(!isDarkMode);
                  document.documentElement.classList.toggle('dark');
                };
                
                return React.createElement('header', {
                  className: 'bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm'
                }, React.createElement('div', {
                  className: 'px-4 sm:px-6 lg:px-8'
                }, React.createElement('div', {
                  className: 'flex items-center justify-between h-16'
                }, [
                  React.createElement('div', {
                    key: 'logo',
                    className: 'flex items-center'
                  }, React.createElement(Link, {
                    to: '/dashboard',
                    className: 'flex items-center space-x-3 group'
                  }, [
                    React.createElement('div', {
                      className: 'w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200'
                    }, React.createElement('span', {
                      className: 'text-white font-bold text-sm'
                    }, 'CC')),
                    React.createElement('div', {
                      className: 'hidden sm:block'
                    }, [
                      React.createElement('h1', {
                        className: 'text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent'
                      }, 'CloudCollect'),
                      React.createElement('p', {
                        className: 'text-xs text-gray-500 -mt-1'
                      }, 'Debt Management')
                    ])
                  ])),
                  React.createElement('div', {
                    key: 'search',
                    className: 'flex-1 max-w-2xl mx-8 hidden md:block'
                  }, React.createElement('div', {
                    className: 'relative'
                  }, [
                    React.createElement('input', {
                      type: 'text',
                      placeholder: 'Search by name, account #, phone, or SSN...',
                      className: 'block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500'
                    }),
                    React.createElement(Search, {
                      className: 'absolute left-3 top-2.5 h-5 w-5 text-gray-400'
                    })
                  ])),
                  React.createElement('div', {
                    key: 'actions',
                    className: 'flex items-center space-x-3'
                  }, [
                    React.createElement('button', {
                      className: 'md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
                    }, React.createElement(Search, {
                      className: 'h-5 w-5'
                    })),
                    React.createElement('button', {
                      onClick: toggleDarkMode,
                      className: 'p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
                    }, isDarkMode ? React.createElement(Sun, { className: 'h-5 w-5' }) : React.createElement(Moon, { className: 'h-5 w-5' })),
                    React.createElement('div', {
                      className: 'relative'
                    }, [
                      React.createElement('button', {
                        className: 'p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
                      }, React.createElement(Bell, {
                        className: 'h-5 w-5'
                      })),
                      notifications > 0 && React.createElement('span', {
                        className: 'absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse'
                      }, notifications)
                    ]),
                    React.createElement('div', {
                      className: 'relative'
                    }, [
                      React.createElement('button', {
                        onClick: () => setIsProfileOpen(!isProfileOpen),
                        className: 'flex items-center space-x-3 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
                      }, [
                        React.createElement('div', {
                          className: 'w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium text-sm shadow-md'
                        }, username.slice(0, 1).toUpperCase()),
                        React.createElement('div', {
                          className: 'hidden sm:block text-left'
                        }, [
                          React.createElement('p', {
                            className: 'text-sm font-medium text-gray-900'
                          }, username),
                          React.createElement('p', {
                            className: 'text-xs text-gray-500'
                          }, 'Administrator')
                        ]),
                        React.createElement(ChevronDown, {
                          className: \`h-4 w-4 text-gray-500 transition-transform \${isProfileOpen ? 'rotate-180' : ''}\`
                        })
                      ]),
                      isProfileOpen && React.createElement('div', {
                        className: 'absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50'
                      }, [
                        React.createElement('div', {
                          className: 'px-4 py-3 border-b border-gray-100'
                        }, [
                          React.createElement('p', {
                            className: 'text-sm font-medium text-gray-900'
                          }, username),
                          React.createElement('p', {
                            className: 'text-xs text-gray-500'
                          }, 'admin@example.com')
                        ]),
                        React.createElement('div', {
                          className: 'py-1'
                        }, [
                          React.createElement(Link, {
                            to: '/dashboard/settings',
                            className: 'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors',
                            onClick: () => setIsProfileOpen(false)
                          }, [
                            React.createElement(Settings, {
                              className: 'h-4 w-4 mr-3 text-gray-500'
                            }),
                            'Settings'
                          ]),
                          React.createElement(Link, {
                            to: '/dashboard/users',
                            className: 'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors',
                            onClick: () => setIsProfileOpen(false)
                          }, [
                            React.createElement(User, {
                              className: 'h-4 w-4 mr-3 text-gray-500'
                            }),
                            'Profile'
                          ])
                        ]),
                        React.createElement('div', {
                          className: 'border-t border-gray-100 py-1'
                        }, React.createElement('button', {
                          onClick: () => {
                            localStorage.removeItem('isAuthenticated');
                            localStorage.removeItem('user');
                            window.location.href = '/';
                          },
                          className: 'flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
                        }, [
                          React.createElement(LogOut, {
                            className: 'h-4 w-4 mr-3'
                          }),
                          'Sign out'
                        ]))
                      ])
                    ])
                  ])
                ])));
              };
              
              const Sidebar = () => {
                const [collapsed, setCollapsed] = useState(false);
                const location = useLocation();
                
                const toggleSidebar = () => {
                  setCollapsed(!collapsed);
                };
                
                const navItems = [
                  { 
                    name: 'Dashboard', 
                    path: '/dashboard', 
                    icon: Home,
                    description: 'Overview & analytics'
                  },
                  { 
                    name: 'Accounts', 
                    path: '/dashboard/accounts', 
                    icon: Users,
                    description: 'Manage debtors'
                  },
                  { 
                    name: 'Payments', 
                    path: '/dashboard/payments', 
                    icon: CreditCard,
                    description: 'Process payments'
                  },
                  { 
                    name: 'Documents', 
                    path: '/dashboard/documents', 
                    icon: FileText,
                    description: 'File management'
                  },
                  { 
                    name: 'Import', 
                    path: '/dashboard/import', 
                    icon: FileUp,
                    description: 'Bulk import data'
                  },
                  { 
                    name: 'Reports', 
                    path: '/dashboard/reports', 
                    icon: BarChart2,
                    description: 'Analytics & reports'
                  },
                  { 
                    name: 'Activity', 
                    path: '/dashboard/activity', 
                    icon: Activity,
                    description: 'System activity'
                  },
                ];
                
                const adminItems = [
                  { 
                    name: 'Users', 
                    path: '/dashboard/users', 
                    icon: Users,
                    description: 'User management'
                  },
                  { 
                    name: 'Roles', 
                    path: '/dashboard/roles', 
                    icon: Shield,
                    description: 'Role permissions'
                  },
                  { 
                    name: 'Settings', 
                    path: '/dashboard/settings', 
                    icon: Settings,
                    description: 'System settings'
                  },
                ];
                
                return React.createElement('aside', {
                  className: \`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out h-screen sticky top-0 shadow-sm \${
                    collapsed ? 'w-16' : 'w-72'
                  }\`
                }, React.createElement('div', {
                  className: 'flex flex-col h-full'
                }, [
                  React.createElement('div', {
                    key: 'header',
                    className: 'p-4 border-b border-gray-100 flex items-center justify-between'
                  }, [
                    !collapsed && React.createElement('div', {
                      className: 'flex items-center space-x-3'
                    }, [
                      React.createElement('div', {
                        className: 'w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md'
                      }, React.createElement('span', {
                        className: 'text-white font-bold text-sm'
                      }, 'CC')),
                      React.createElement('div', {}, [
                        React.createElement('h2', {
                          className: 'font-bold text-gray-900'
                        }, 'CloudCollect'),
                        React.createElement('p', {
                          className: 'text-xs text-gray-500'
                        }, 'v2.0')
                      ])
                    ]),
                    React.createElement('button', {
                      className: 'p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700',
                      onClick: toggleSidebar
                    }, collapsed ? React.createElement(ChevronRight, { size: 18 }) : React.createElement(ChevronLeft, { size: 18 }))
                  ]),
                  React.createElement('nav', {
                    key: 'nav',
                    className: 'flex-1 pt-4 pb-4 overflow-y-auto'
                  }, React.createElement('div', {
                    className: 'px-3'
                  }, [
                    !collapsed && React.createElement('div', {
                      className: 'mb-4'
                    }, React.createElement('h3', {
                      className: 'px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'
                    }, 'Main')),
                    React.createElement('ul', {
                      className: 'space-y-1'
                    }, navItems.map((item) => {
                      const isActive = location.pathname === item.path || 
                        (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                      
                      return React.createElement('li', { key: item.path }, 
                        React.createElement(Link, {
                          to: item.path,
                          className: \`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 \${
                            isActive 
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }\`,
                          title: collapsed ? item.name : ''
                        }, [
                          React.createElement(item.icon, {
                            className: \`flex-shrink-0 w-5 h-5 \${
                              isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                            }\`
                          }),
                          !collapsed && React.createElement('div', {
                            className: 'ml-3 flex-1'
                          }, [
                            React.createElement('div', {
                              className: 'flex items-center justify-between'
                            }, React.createElement('span', {}, item.name)),
                            React.createElement('p', {
                              className: 'text-xs text-gray-500 mt-0.5'
                            }, item.description)
                          ])
                        ])
                      );
                    })),
                    React.createElement('div', {
                      className: 'mt-8'
                    }, [
                      !collapsed && React.createElement('div', {
                        className: 'mb-4'
                      }, React.createElement('h3', {
                        className: 'px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'
                      }, 'Administration')),
                      React.createElement('ul', {
                        className: 'space-y-1'
                      }, adminItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        
                        return React.createElement('li', { key: item.path }, 
                          React.createElement(Link, {
                            to: item.path,
                            className: \`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 \${
                              isActive 
                                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }\`,
                            title: collapsed ? item.name : ''
                          }, [
                            React.createElement(item.icon, {
                              className: \`flex-shrink-0 w-5 h-5 \${
                                isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                              }\`
                            }),
                            !collapsed && React.createElement('div', {
                              className: 'ml-3 flex-1'
                            }, [
                              React.createElement('div', {
                                className: 'flex items-center justify-between'
                              }, React.createElement('span', {}, item.name)),
                              React.createElement('p', {
                                className: 'text-xs text-gray-500 mt-0.5'
                              }, item.description)
                            ])
                          ])
                        );
                      }))
                    ])
                  ])),
                  React.createElement('div', {
                    key: 'footer',
                    className: 'p-4 border-t border-gray-100'
                  }, !collapsed ? React.createElement('div', {
                    className: 'bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3'
                  }, React.createElement('div', {
                    className: 'flex items-center space-x-3'
                  }, [
                    React.createElement('div', {
                      className: 'w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center'
                    }, React.createElement('span', {
                      className: 'text-white text-xs font-bold'
                    }, '✓')),
                    React.createElement('div', {
                      className: 'flex-1 min-w-0'
                    }, [
                      React.createElement('p', {
                        className: 'text-sm font-medium text-gray-900'
                      }, 'System Status'),
                      React.createElement('p', {
                        className: 'text-xs text-gray-600'
                      }, 'All systems operational')
                    ])
                  ])) : React.createElement('div', {
                    className: 'flex justify-center'
                  }, React.createElement('div', {
                    className: 'w-8 h-8 rounded-full bg-green-100 flex items-center justify-center'
                  }, React.createElement('div', {
                    className: 'w-2 h-2 bg-green-500 rounded-full animate-pulse'
                  }))))
                ]));
              };
              
              const Layout = () => {
                return React.createElement('div', {
                  className: 'flex h-screen bg-gray-50'
                }, [
                  React.createElement(Sidebar, { key: 'sidebar' }),
                  React.createElement('div', {
                    key: 'main',
                    className: 'flex flex-col flex-1 overflow-hidden'
                  }, [
                    React.createElement(Header, {
                      key: 'header',
                      username: 'Admin'
                    }),
                    React.createElement('main', {
                      key: 'content',
                      className: 'flex-1 overflow-y-auto p-4 md:p-6'
                    }, React.createElement(Outlet, {}))
                  ])
                ]);
              };
              
              // Protected Route wrapper
              const ProtectedRoute = ({ children }) => {
                const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
                
                if (!isAuthenticated) {
                  localStorage.removeItem('isAuthenticated');
                  localStorage.removeItem('user');
                  return React.createElement(Navigate, { to: "/", replace: true });
                }
                
                return children;
              };
              
              // Main App Component
              const App = () => {
                const path = window.location.pathname;
                if (path === '/') {
                  localStorage.removeItem('isAuthenticated');
                  localStorage.removeItem('user');
                }
                
                return React.createElement(BrowserRouter, {}, 
                  React.createElement(Routes, {}, [
                    React.createElement(Route, {
                      key: 'login',
                      path: "/",
                      element: React.createElement(LoginPage, {})
                    }),
                    React.createElement(Route, {
                      key: 'dashboard',
                      path: "/dashboard",
                      element: React.createElement(ProtectedRoute, {}, 
                        React.createElement(Layout, {})
                      )
                    }, [
                      React.createElement(Route, {
                        key: 'dashboard-index',
                        index: true,
                        element: React.createElement(DashboardPage, {})
                      }),
                      React.createElement(Route, {
                        key: 'accounts',
                        path: "accounts",
                        element: React.createElement(AccountsPage, {})
                      }),
                      React.createElement(Route, {
                        key: 'account-detail',
                        path: "accounts/:id",
                        element: React.createElement('div', {
                          className: 'p-8 text-center'
                        }, [
                          React.createElement('h2', {
                            className: 'text-2xl font-bold text-gray-900 mb-4'
                          }, 'Account Detail'),
                          React.createElement('p', {
                            className: 'text-gray-600'
                          }, 'Account detail page will be implemented here.')
                        ])
                      }),
                      React.createElement(Route, {
                        key: 'documents',
                        path: "documents",
                        element: React.createElement('div', {
                          className: 'p-8 text-center'
                        }, [
                          React.createElement('h2', {
                            className: 'text-2xl font-bold text-gray-900 mb-4'
                          }, 'Documents'),
                          React.createElement('p', {
                            className: 'text-gray-600'
                          }, 'Document management will be implemented here.')
                        ])
                      }),
                      React.createElement(Route, {
                        key: 'import',
                        path: "import",
                        element: React.createElement('div', {
                          className: 'p-8 text-center'
                        }, [
                          React.createElement('h2', {
                            className: 'text-2xl font-bold text-gray-900 mb-4'
                          }, 'Import'),
                          React.createElement('p', {
                            className: 'text-gray-600'
                          }, 'Import functionality will be implemented here.')
                        ])
                      }),
                      React.createElement(Route, {
                        key: 'reports',
                        path: "reports",
                        element: React.createElement('div', {
                          className: 'p-8 text-center'
                        }, [
                          React.createElement('h2', {
                            className: 'text-2xl font-bold text-gray-900 mb-4'
                          }, 'Reports'),
                          React.createElement('p', {
                            className: 'text-gray-600'
                          }, 'Reports and analytics will be implemented here.')
                        ])
                      }),
                      React.createElement(Route, {
                        key: 'settings',
                        path: "settings",
                        element: React.createElement('div', {
                          className: 'p-8 text-center'
                        }, [
                          React.createElement('h2', {
                            className: 'text-2xl font-bold text-gray-900 mb-4'
                          }, 'Settings'),
                          React.createElement('p', {
                            className: 'text-gray-600'
                          }, 'Settings page will be implemented here.')
                        ])
                      }),
                      React.createElement(Route, {
                        key: 'users',
                        path: "users",
                        element: React.createElement('div', {
                          className: 'p-8 text-center'
                        }, [
                          React.createElement('h2', {
                            className: 'text-2xl font-bold text-gray-900 mb-4'
                          }, 'Users'),
                          React.createElement('p', {
                            className: 'text-gray-600'
                          }, 'User management will be implemented here.')
                        ])
                      }),
                      React.createElement(Route, {
                        key: 'roles',
                        path: "roles",
                        element: React.createElement('div', {
                          className: 'p-8 text-center'
                        }, [
                          React.createElement('h2', {
                            className: 'text-2xl font-bold text-gray-900 mb-4'
                          }, 'Roles'),
                          React.createElement('p', {
                            className: 'text-gray-600'
                          }, 'Role management will be implemented here.')
                        ])
                      })
                    ]),
                    React.createElement(Route, {
                      key: 'fallback',
                      path: "*",
                      element: React.createElement(Navigate, { to: "/", replace: true })
                    })
                  ])
                );
              };
              
              // Render the app
              const root = ReactDOM.createRoot(document.getElementById('root'));
              root.render(React.createElement(StrictMode, {}, React.createElement(App, {})));
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
