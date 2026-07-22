import React, { useState } from 'react';
import { 
  CloudSun, Plane, Building, Calendar, MapPin, 
  Clock, DollarSign, Utensils, AlertTriangle, Briefcase, 
  Check, ChevronDown, ChevronUp, Star 
} from 'lucide-react';

export default function ItineraryViewer({ itinerary }) {
  const [activeDay, setActiveDay] = useState(1);
  const [checkedItems, setCheckedItems] = useState({});

  if (!itinerary) return null;

  const { 
    destination, dates, flight, hotel, weather_summary, 
    daily_itinerary, packing_list 
  } = itinerary;

  const toggleDay = (dayNum) => {
    setActiveDay(activeDay === dayNum ? null : dayNum);
  };

  const togglePackItem = (idx) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weather Card */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Weather Forecast</span>
              <h4 className="text-lg font-bold text-slate-200 mt-1">{weather_summary.temp_range}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{weather_summary.condition}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <CloudSun className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase mb-1">Clothing Advice</span>
            <p className="text-xs text-slate-300 leading-normal">{weather_summary.clothing_advice}</p>
            {weather_summary.warnings && weather_summary.warnings.length > 0 && (
              <div className="mt-3 flex items-start gap-1.5 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-400 leading-normal">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <strong>Weather Alert:</strong> {weather_summary.warnings.join(", ")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommended Flight Card */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Selected Flight</span>
              <h4 className="text-base font-bold text-slate-200 mt-1">{flight.airline}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{flight.flight_number} • {flight.cabin_class}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Plane className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Duration</span>
              <span className="font-medium text-slate-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> {flight.duration} ({flight.stops === 0 ? "Non-stop" : `${flight.stops} stop`})
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Schedule</span>
              <span className="font-medium text-slate-200">{flight.departure_time}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-slate-900">
              <span className="text-slate-400">Flight Ticket</span>
              <span className="font-bold text-emerald-400">${flight.price.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Recommended Hotel Card */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Selected Lodging</span>
              <h4 className="text-base font-bold text-slate-200 mt-1 truncate max-w-[180px]">{hotel.name}</h4>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-slate-400">{hotel.stars} Stars</span>
                <div className="flex text-amber-400">
                  {Array.from({ length: Math.floor(hotel.stars) }).map((_, idx) => (
                    <Star key={idx} className="w-3 h-3 fill-current" />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5">
            <p className="text-[10px] text-slate-400 italic line-clamp-2">"{hotel.reason_for_recommendation}"</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">{hotel.address}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-slate-900">
              <span className="text-slate-400">Hotel Accommodation</span>
              <span className="font-bold text-emerald-400">${hotel.total_price.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">total</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Itinerary Timeline & Packing List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Day-by-Day Timeline */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-violet-400" />
            Daily Itinerary
          </h3>

          <div className="relative pl-6 border-l-2 border-slate-800 space-y-4">
            {daily_itinerary.map((day) => {
              const isExpanded = activeDay === day.day_number;

              return (
                <div key={day.day_number} className="relative">
                  {/* Timeline node */}
                  <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    isExpanded 
                      ? "bg-violet-500 border-violet-400 ring-4 ring-violet-500/20" 
                      : "bg-slate-950 border-slate-800 hover:border-violet-500"
                  }`} />

                  {/* Day Card */}
                  <div className={`glass-panel rounded-xl overflow-hidden transition-all duration-300 ${
                    isExpanded ? "border-slate-700/65" : "border-slate-800/40"
                  }`}>
                    {/* Header trigger */}
                    <button
                      onClick={() => toggleDay(day.day_number)}
                      className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-slate-900/30 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-violet-400">DAY {day.day_number}</span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-400">{day.date}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-200 mt-1">{day.theme}</h4>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    {/* Content */}
                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-slate-800/40 bg-slate-950/20 space-y-4">
                        {/* Daily Lodging */}
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-3">
                          <Building className="w-3.5 h-3.5 text-pink-400" />
                          <span>Lodging: <strong>{day.lodging}</strong></span>
                        </div>

                        {/* Activities */}
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Activities</h5>
                          {day.activities.map((act, idx) => (
                            <div key={idx} className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-1.5">
                              <div className="flex justify-between items-start gap-2">
                                <h6 className="text-xs font-bold text-slate-200">{act.name}</h6>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                                  act.category === "Food" ? "bg-amber-950 text-amber-300 border border-amber-800/30" :
                                  act.category === "Shopping" ? "bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800/30" :
                                  act.category === "Sightseeing" ? "bg-blue-950 text-blue-300 border border-blue-800/30" :
                                  "bg-slate-800 text-slate-300"
                                }`}>
                                  {act.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-normal">{act.description}</p>
                              <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1 border-t border-slate-900/60">
                                <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {act.duration_hours} hrs</span>
                                <span className="font-semibold text-slate-400">Est. Cost: {act.estimated_cost === 0 ? "Free" : `$${act.estimated_cost}`}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Meal recommendations */}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-900">
                          {['Breakfast', 'Lunch', 'Dinner'].map((mealType, idx) => (
                            <div key={mealType} className="p-2 bg-slate-900/30 border border-slate-900 rounded-lg text-center">
                              <span className="text-[9px] font-semibold text-slate-500 block uppercase">{mealType}</span>
                              <span className="text-[10px] font-medium text-slate-300 mt-1 block truncate">
                                {day.meals && day.meals[idx] ? day.meals[idx] : "Local Eatery"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Packing Checklist */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-pink-400" />
            Packing Checklist
          </h3>

          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <p className="text-xs text-slate-400 leading-normal">
              Based on weather alerts and trip activities, our agents compiled this tailored packing list:
            </p>
            <div className="space-y-2 pt-2">
              {packing_list.map((item, idx) => {
                const isChecked = checkedItems[idx] || false;
                return (
                  <button
                    key={idx}
                    onClick={() => togglePackItem(idx)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/40 border border-slate-900 text-left hover:border-slate-800 transition cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                      isChecked 
                        ? "bg-violet-500 border-violet-400 text-white" 
                        : "border-slate-700 bg-slate-950"
                    }`}>
                      {isChecked && <Check className="w-3 h-3" />}
                    </div>
                    <span className={`text-xs ${isChecked ? "text-slate-500 line-through" : "text-slate-300"}`}>
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
