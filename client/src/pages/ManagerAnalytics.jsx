import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Activity, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const ALL_EVENTS_VALUE = '__all_managed_events__';

const ManagerAnalytics = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const selectedEvent = useMemo(
        () => events.find((e) => e._id === selectedEventId) || null,
        [events, selectedEventId]
    );

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const res = await axios.get('/events');
                const rows = Array.isArray(res.data) ? res.data : [];
                setEvents(rows);
                if (rows.length > 0) {
                    setSelectedEventId(rows.length > 1 ? ALL_EVENTS_VALUE : rows[0]._id);
                }
            } catch (error) {
                toast.error('Failed to load events');
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    useEffect(() => {
        if (!selectedEventId) return;

        const loadAnalytics = async () => {
            try {
                setLoadingAnalytics(true);

                if (selectedEventId === ALL_EVENTS_VALUE) {
                    const responses = await Promise.all(
                        events.map((ev) => axios.get(`/ai/comparison/${ev._id}`))
                    );

                    const rows = responses.map((r) => r.data).filter(Boolean);
                    const expected = rows.reduce((sum, r) => sum + Number(r.audience?.expected || 0), 0);
                    const actual = rows.reduce((sum, r) => sum + Number(r.audience?.actual || 0), 0);
                    const planned = rows.reduce((sum, r) => sum + Number(r.budget?.planned || 0), 0);
                    const estimatedSpend = rows.reduce((sum, r) => sum + Number(r.budget?.estimated_spend || 0), 0);

                    const attendanceRate = expected > 0 ? actual / expected : 0;
                    const utilization = planned > 0 ? estimatedSpend / planned : 0;

                    setAnalytics({
                        eventId: ALL_EVENTS_VALUE,
                        eventName: 'All Managed Events',
                        audience: {
                            expected,
                            actual,
                            gap: expected - actual,
                            attendance_rate: attendanceRate
                        },
                        budget: {
                            planned,
                            estimated_spend: estimatedSpend,
                            gap: planned - estimatedSpend,
                            utilization
                        },
                        suggestions: [
                            'This is an aggregate view across all managed events.',
                            attendanceRate >= 0.9
                                ? 'Attendance performance is strong across managed events.'
                                : 'Attendance is below target across managed events; increase pre-event engagement.',
                            utilization > 1
                                ? 'Estimated spend is over planned budget across the portfolio.'
                                : 'Budget usage is within planned range across managed events.'
                        ]
                    });
                    return;
                }

                const res = await axios.get(`/ai/comparison/${selectedEventId}`);
                setAnalytics(res.data || null);
            } catch (error) {
                toast.error(error?.response?.data?.message || 'Failed to load analytics');
                setAnalytics(null);
            } finally {
                setLoadingAnalytics(false);
            }
        };

        loadAnalytics();
    }, [selectedEventId, events]);

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
                <div className="h-14 w-14 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
        );
    }

    if (!user || (user.role !== 'EventManager' && user.role !== 'Admin')) {
        return (
            <div className="min-h-[calc(100vh-120px)] flex items-center justify-center text-white/70 font-black uppercase tracking-widest text-xs">
                Not authorized
            </div>
        );
    }

    return (
        <div className="main-content px-3 pb-24 sm:pb-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                        Event <span className="text-gradient-gold-soft italic font-serif">Analytics</span>
                    </h1>
                    <div className="w-full sm:w-auto min-w-[280px]">
                        <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white focus:outline-none focus:border-primary/30"
                        >
                            {events.length > 1 && <option value={ALL_EVENTS_VALUE}>ALL MANAGED EVENTS</option>}
                            {events.map((ev) => (
                                <option key={ev._id} value={ev._id}>{ev.event_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em]">
                    {events.length <= 1
                        ? 'Only one event is mapped to this manager account right now.'
                        : 'You can switch between single-event view and all-managed-events view.'}
                </p>

                {!selectedEvent ? (
                    <div className="py-20 text-center text-white/60 font-black uppercase tracking-widest text-xs app-card">No events available</div>
                ) : loadingAnalytics ? (
                    <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[2rem] opacity-40">
                        <Activity size={32} className="mb-4 animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Loading analytics</p>
                    </div>
                ) : !analytics ? (
                    <div className="py-20 text-center text-white/60 font-black uppercase tracking-widest text-xs app-card">No analytics data</div>
                ) : (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                <p className="text-[9px] text-white/60 font-black uppercase tracking-[0.3em] mb-2">Attendance Rate</p>
                                <p className="text-3xl font-black text-white leading-none tracking-widest">{((analytics.audience?.attendance_rate || 0) * 100).toFixed(1)}%</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                <p className="text-[9px] text-white/60 font-black uppercase tracking-[0.3em] mb-2">Budget Utilization</p>
                                <p className="text-3xl font-black text-primary leading-none tracking-widest">{((analytics.budget?.utilization || 0) * 100).toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Audience: Actual vs Expected</h4>
                            {(() => {
                                const expected = Number(analytics.audience?.expected || 0);
                                const actual = Number(analytics.audience?.actual || 0);
                                const max = Math.max(expected, actual, 1);
                                const expectedW = (expected / max) * 100;
                                const actualW = (actual / max) * 100;
                                return (
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/70 mb-1"><span>Expected</span><span>{expected}</span></div>
                                            <div className="h-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-blue-400" style={{ width: `${expectedW}%` }} /></div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/70 mb-1"><span>Actual</span><span>{actual}</span></div>
                                            <div className="h-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${actualW}%` }} /></div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Budget: Planned vs Estimated</h4>
                            {(() => {
                                const planned = Number(analytics.budget?.planned || 0);
                                const spend = Number(analytics.budget?.estimated_spend || 0);
                                const max = Math.max(planned, spend, 1);
                                const plannedW = (planned / max) * 100;
                                const spendW = (spend / max) * 100;
                                return (
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/70 mb-1"><span>Planned</span><span>INR {planned.toLocaleString()}</span></div>
                                            <div className="h-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${plannedW}%` }} /></div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/70 mb-1"><span>Estimated</span><span>INR {spend.toLocaleString()}</span></div>
                                            <div className="h-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-rose-400" style={{ width: `${spendW}%` }} /></div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2"><TrendingUp size={14} /> Python Suggestions</h4>
                            {(analytics.suggestions || []).map((s, i) => (
                                <p key={i} className="text-[10px] text-white/80 font-black uppercase tracking-wide">- {s}</p>
                            ))}
                        </div>

                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Volunteer Productivity</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                                    <p className="text-[9px] text-white/60 font-black uppercase tracking-[0.2em]">Tasks Assigned vs Completed</p>
                                    <p className="text-xl font-black text-white mt-2">
                                        {(analytics.volunteer_productivity?.tasks_completed || 0)} / {(analytics.volunteer_productivity?.tasks_assigned || 0)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                                    <p className="text-[9px] text-white/60 font-black uppercase tracking-[0.2em]">Avg Completion Time</p>
                                    <p className="text-xl font-black text-white mt-2">
                                        {(analytics.volunteer_productivity?.avg_completion_minutes || 0).toFixed(1)} min
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] md:col-span-2">
                                    <p className="text-[9px] text-white/60 font-black uppercase tracking-[0.2em] mb-2">Critical Task Closure Rate</p>
                                    <div className="flex justify-between text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">
                                        <span>Critical Closed</span>
                                        <span>{((analytics.volunteer_productivity?.critical_task_closure_rate || 0) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-400"
                                            style={{ width: `${((analytics.volunteer_productivity?.critical_task_closure_rate || 0) * 100).toFixed(1)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Feedback Sentiment Trend Over Time</h4>
                            {(analytics.feedback_sentiment_analytics?.trend_over_time || []).length === 0 ? (
                                <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">No feedback trend data</p>
                            ) : (
                                <div className="space-y-3">
                                    {(analytics.feedback_sentiment_analytics?.trend_over_time || []).map((row) => {
                                        const max = Math.max(row.total || 1, 1);
                                        const p = ((row.positive || 0) / max) * 100;
                                        const n = ((row.neutral || 0) / max) * 100;
                                        const ng = ((row.negative || 0) / max) * 100;
                                        return (
                                            <div key={row.date} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                                                <div className="flex justify-between text-[9px] text-white/70 font-black uppercase tracking-widest mb-2">
                                                    <span>{row.date}</span>
                                                    <span>Total {row.total}</span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div><div className="text-[8px] text-white/50 font-black uppercase mb-1">Positive {row.positive}</div><div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${p}%` }} /></div></div>
                                                    <div><div className="text-[8px] text-white/50 font-black uppercase mb-1">Neutral {row.neutral}</div><div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${n}%` }} /></div></div>
                                                    <div><div className="text-[8px] text-white/50 font-black uppercase mb-1">Negative {row.negative}</div><div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-rose-400" style={{ width: `${ng}%` }} /></div></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagerAnalytics;
