import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Key,
    Users,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Settings,
    BookOpen,
    Sparkles,
    FolderOpen,
    Library,
    Server
} from 'lucide-react';
import { authService } from '../services/authService';
import { API_URL } from '../config/api';

const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const [instance, setInstance] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchInstance = async () => {
            try {
                const response = await fetch(`${API_URL}/api/instances/my`, {
                    headers: {
                        'Authorization': `Bearer ${authService.getToken()}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setInstance(data.data);
                }
            } catch (error) {
                console.error('Error fetching instance:', error);
            }
        };

        fetchInstance();
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    const navigation = [
        { name: 'Tableau de bord', path: '/', icon: LayoutDashboard },
        { name: 'Documentation', path: '/documentation', icon: BookOpen },
        { name: 'Clés API', path: '/api-keys', icon: Key },
        { name: 'Make', path: '/make', icon: Sparkles },
        { name: 'Ressources', path: '/resources', icon: FolderOpen },
        { name: "Bibliothèque", path: '/library', icon: Library }
    ];

    if (user?.role === 'admin') {
        navigation.push({ name: 'Administration', path: '/admin', icon: Users });
    }

    return (
        <div className="min-h-screen bg-[#030709]">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 z-40 h-screen bg-[#132426] border-r border-[#0a1b1e]
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
        lg:translate-x-0
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-[#0a1b1e]">
                        <div className={`flex items-center space-x-3 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                            <span className="text-xl font-bold text-[#05F26C] whitespace-nowrap">N8N Builder</span>
                        </div>
                        {sidebarCollapsed && (
                            <div className="w-8 h-8 bg-[#05F26C] rounded-lg mx-auto" />
                        )}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* User info */}
                    <div className={`px-6 py-4 border-b border-[#0a1b1e] ${sidebarCollapsed ? 'px-3' : 'px-6'}`}>
                        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
                            <div className="w-10 h-10 bg-[#05F26C] rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold text-[#132426]">
                                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            {!sidebarCollapsed && (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#05F26C] truncate">
                                            {user?.name}
                                        </p>
                                        <p className="text-xs text-gray-200 truncate">
                                            {user?.email}
                                        </p>
                                    </div>
                                    {user?.role === 'admin' && (
                                        <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-700/15 rounded-full">
                                            Admin
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <div key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={() => setSidebarOpen(false)}
                                        title={sidebarCollapsed ? item.name : undefined}
                                        className={`
                      flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-colors
                      ${active
                                                ? 'bg-[#05F26C] text-[#132426] shadow-md'
                                                : 'text-white hover:bg-[#05F26C]/25'
                                            }
                    `}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        {!sidebarCollapsed && <span className="font-medium">{item.name}</span>}
                                    </Link>

                                    {/* Show instance submenu only for Dashboard */}
                                    {item.path === '/' && !sidebarCollapsed && instance && (
                                        <div className="ml-8 mt-1 mb-2">
                                            <a
                                                href={instance.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-[#05F26C]/25 rounded-lg transition-colors"
                                            >
                                                <Server className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">n8n-{instance.subdomain}</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Collapse button */}

                    {/* Settings button */}
                    <div className="p-4 flex flex-col">
                        <Link
                            to="/settings"
                            title={sidebarCollapsed ? 'Paramètres' : undefined}
                            className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} w-full px-3 py-2.5 rounded-lg transition-colors ${
                                isActive('/settings')
                                    ? 'bg-[#05F26C] text-[#132426] shadow-md'
                                    : 'text-white hover:bg-[#05F26C]/25'
                            }`}
                        >
                            <Settings className="w-5 h-5 flex-shrink-0" />
                            {!sidebarCollapsed && <span className="font-medium">Paramètres</span>}
                        </Link>
                        <button
                            onClick={handleLogout}
                            title={sidebarCollapsed ? 'Déconnexion' : undefined}
                            className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} w-full px-3 py-2.5 text-red-500 hover:bg-red-500/15 rounded-lg transition-colors`}
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            {!sidebarCollapsed && <span className="font-medium">Déconnexion</span>}
                        </button>
                    </div>

                    <div className="hidden lg:block p-4 border-t border-[#0a1b1e]">
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} w-full px-3 py-2.5 text-white hover:bg-[#05F26C]/25 rounded-lg transition-colors`}
                        >
                            {sidebarCollapsed ? (
                                <ChevronRight className="w-5 h-5" />
                            ) : (
                                <>
                                    <ChevronLeft className="w-5 h-5" />
                                    <span className="font-medium">Réduire</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                {/* Mobile header */}
                <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 lg:hidden">
                    <div className="flex items-center justify-between h-full px-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                        >
                            <Menu className="w-6 h-6 text-gray-700" />
                        </button>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
                            <span className="text-lg font-bold text-gray-900">N8N SaaS</span>
                        </div>
                        <div className="w-10" /> {/* Spacer for centering */}
                    </div>
                </header>

                {/* Page content */}
                <main className="">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
