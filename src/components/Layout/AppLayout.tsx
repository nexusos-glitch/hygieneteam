import { Link } from "react-router-dom"
import { Home, Calendar, Users, Settings } from "lucide-react"

export default function AppLayout({children}: any) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <main className="w-full max-w-3xl mx-auto p-4 sm:p-6">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          <Link to="/home" className="flex flex-col items-center p-2 text-primary">
            <Home size={24} />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </Link>
          <Link to="/schedule" className="flex flex-col items-center p-2 text-slate-400 hover:text-slate-600">
            <Calendar size={24} />
            <span className="text-[10px] mt-1 font-medium">Schedule</span>
          </Link>
          <Link to="/clients" className="flex flex-col items-center p-2 text-slate-400 hover:text-slate-600">
            <Users size={24} />
            <span className="text-[10px] mt-1 font-medium">Clients</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center p-2 text-slate-400 hover:text-slate-600">
            <Settings size={24} />
            <span className="text-[10px] mt-1 font-medium">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
