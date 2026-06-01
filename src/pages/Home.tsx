import { Link } from "react-router-dom"
import { Clock, MapPin, CheckCircle2, ChevronRight } from "lucide-react"

export default function Home() {
  return (
    <div className="space-y-6">
      <header className="pt-4 pb-2">
        <h1 className="text-2xl font-bold text-slate-900">Today's Route</h1>
        <p className="text-slate-500 font-medium">Tuesday, May 25</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold text-slate-500 mb-1">Completed</div>
          <div className="text-3xl font-bold text-slate-900">3/8</div>
        </div>
        <div className="bg-primary rounded-3xl p-5 text-primary-foreground shadow-sm">
          <div className="text-sm font-semibold text-primary-foreground/80 mb-1">Time on Site</div>
          <div className="text-3xl font-bold">4h 12m</div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-slate-900 mt-8 mb-4">Upcoming Jobs</h2>
      
      <div className="space-y-4">
        {/* Job Card 1 (In Progress) */}
        <div className="bg-white rounded-3xl border-2 border-primary overflow-hidden shadow-sm">
          <div className="bg-primary/5 px-5 py-3 flex justify-between items-center border-b border-primary/20">
            <span className="inline-flex items-center gap-1.5 text-primary-dark font-semibold text-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              In Progress
            </span>
            <span className="text-primary-dark font-semibold text-sm">Started 9:30 AM</span>
          </div>
          <div className="p-5">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Downtown Office Park</h3>
            <p className="text-slate-500 mb-4">Routine Hygiene & Maintenance</p>
            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-3 rounded-2xl mb-5">
              <MapPin size={18} className="text-slate-400" />
              <span className="text-sm font-medium">100 Queen St, Level 4</span>
            </div>
            <Link to="/visit/123" className="block w-full bg-primary hover:bg-primary-dark text-primary-foreground text-center font-bold py-4 rounded-2xl transition-colors">
              Continue Job
            </Link>
          </div>
        </div>

        {/* Job Card 2 */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-slate-900">GreenScape Cafe</h3>
            <span className="text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full text-sm">11:00 AM</span>
          </div>
          <p className="text-slate-500 text-sm mb-4">Equipment check & filter swap</p>
          <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-colors">
            Start Route
          </button>
        </div>
      </div>
      
      {/* Completed */}
      <h2 className="text-lg font-bold text-slate-900 mt-8 mb-4">Completed</h2>
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between opacity-75">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={24} className="text-emerald-500" />
          <div>
            <h3 className="font-bold text-slate-900">Retail Store</h3>
            <span className="text-xs text-slate-500">Finished at 8:45 AM</span>
          </div>
        </div>
        <ChevronRight className="text-slate-300" />
      </div>

    </div>
  )
}
