import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, KanbanSquare, Users, CreditCard, FolderOpen,
} from 'lucide-react';

const NAV = [
  { to: '/',        label: 'Today',    icon: LayoutDashboard },
  { to: '/pipeline',label: 'Pipeline', icon: KanbanSquare   },
  { to: '/clients', label: 'Clients',  icon: Users           },
  { to: '/payments',label: 'Payments', icon: CreditCard      },
  { to: '/files',   label: 'Files',    icon: FolderOpen      },
];

function NavItem({ to, label, icon: Icon }: (typeof NAV)[0]) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop left rail */}
      <aside className="hidden md:flex w-56 flex-col border-r border-gray-200 bg-white px-3 py-6 shrink-0">
        <div className="mb-6 px-3">
          <span className="text-lg font-semibold text-gray-900">Dashboard</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(n => <NavItem key={n.to} {...n} />)}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex md:hidden border-t border-gray-200 bg-white">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-700' : 'text-gray-500'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
