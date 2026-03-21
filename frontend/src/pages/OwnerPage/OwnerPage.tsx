'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import './OwnerPage.css';

import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
    fetchAdminOverview,
    fetchAdminActivity,
    fetchAdminChallengeStats,
    fetchAdminTopUsers,
    fetchAdminReportsStats,
    fetchAdminHeatmap,
    fetchAdminDistributions,
} from '@/shared/store/slice/adminSlice';
import { fetchAdminReportsPage } from '@/shared/store/slice/adminManageSlice';

import OwnerHeader from '@/widgets/OwnerHeader/OwnerHeader';
import OverviewTab from '@/features/Overviewtab/Overviewtab';
import ChallengesTab from '@/features/Challengestab/Challengestab';
import UsersTab from '@/features/Userstab/UsersTab';
import ReportsTab from '@/features/Reportstab/Reportstab';

type OwnerTabId = 'overview' | 'challenges' | 'users' | 'reports';

const PIE_COLORS = ['#00e5b0', '#38bdf8', '#c084fc', '#fbbf24', '#fb7185', '#67e8f9', '#86efac', '#fca5a5'];

const today = () => new Date().toISOString().split('T')[0];
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0];

export default function OwnerPage() {
    const dispatch = useAppDispatch();
    const { overview, activity, challengeStats, topUsers, reportsStats, heatmap, distributions, isLoading } =
        useAppSelector(s => s.admin);
    const { reportsPage } = useAppSelector(s => s.adminManage);

    const searchParams = useSearchParams();
    const rawTab = searchParams.get('tab');
    const tab: OwnerTabId = (rawTab === 'challenges' || rawTab === 'users' || rawTab === 'reports') ? rawTab : 'overview';
    const [periodIdx, setPeriodIdx]   = useState(1);
    const [customFrom, setCustomFrom] = useState(daysAgo(30));
    const [customTo, setCustomTo]     = useState(today());
    const [exporting, setExporting]   = useState(false);

    const [activityLines, setActivityLines] = useState<Set<string>>(
        new Set(['submissions', 'successes', 'failures'])
    );

    const allLanguages = useMemo(() => challengeStats?.byLanguage.map((r: any) => r.language) ?? [], [challengeStats]);
    const [selLangs, setSelLangs] = useState<Set<string>>(new Set());
    useEffect(() => { if (allLanguages.length > 0) setSelLangs(new Set(allLanguages)); }, [allLanguages.join(',')]);

    const allTopics = useMemo(() => challengeStats?.byTopic.map((r: any) => r.topic) ?? [], [challengeStats]);
    const [selTopics, setSelTopics] = useState<Set<string>>(new Set());
    useEffect(() => { if (allTopics.length > 0) setSelTopics(new Set(allTopics)); }, [allTopics.join(',')]);

    const [diffRange, setDiffRange]     = useState<[number, number]>([1, 10]);
    const [ratingBucket, setRatingBucket] = useState(50);
    const [expBucket, setExpBucket]       = useState(100);

    const allStatuses = useMemo(() => reportsStats?.byStatus.map((r: any) => r.status) ?? [], [reportsStats]);
    const [selStatuses, setSelStatuses] = useState<Set<string>>(new Set());
    useEffect(() => { if (allStatuses.length > 0) setSelStatuses(new Set(allStatuses)); }, [allStatuses.join(',')]);

    const allReasons = useMemo(() => reportsStats?.byReason.map((r: any) => r.reason) ?? [], [reportsStats]);
    const [selReasons, setSelReasons] = useState<Set<string>>(new Set());
    useEffect(() => { if (allReasons.length > 0) setSelReasons(new Set(allReasons)); }, [allReasons.join(',')]);

    const filteredLanguages  = useMemo(() => (challengeStats?.byLanguage ?? []).filter((r: any) => selLangs.has(r.language)),   [challengeStats, selLangs]);
    const filteredTopics     = useMemo(() => (challengeStats?.byTopic ?? []).filter((r: any) => selTopics.has(r.topic)),         [challengeStats, selTopics]);
    const filteredDifficulty = useMemo(() => (challengeStats?.byDifficulty ?? []).filter((r: any) => r.difficulty >= diffRange[0] && r.difficulty <= diffRange[1]), [challengeStats, diffRange]);
    const filteredByStatus   = useMemo(() => (reportsStats?.byStatus ?? []).filter((r: any) => selStatuses.has(r.status)),       [reportsStats, selStatuses]);
    const filteredByReason   = useMemo(() => (reportsStats?.byReason ?? []).filter((r: any) => selReasons.has(r.reason)),        [reportsStats, selReasons]);

    const langColorMap = useMemo(() => {
        const map: Record<string, string> = {};
        allLanguages.forEach((l: string, i: number) => { map[l] = PIE_COLORS[i % PIE_COLORS.length]; });
        return map;
    }, [allLanguages]);

    const printRef = useRef<HTMLDivElement>(null);

    const getRange = useCallback(() => {
        if (periodIdx === 3) return { from: customFrom, to: customTo };
        return { from: daysAgo([7, 30, 90][periodIdx]), to: today() };
    }, [periodIdx, customFrom, customTo]);

    const loadAll = useCallback(() => {
        const { from, to } = getRange();
        dispatch(fetchAdminOverview());
        dispatch(fetchAdminActivity({ from, to }));
        dispatch(fetchAdminChallengeStats());
        dispatch(fetchAdminTopUsers(50));
        dispatch(fetchAdminReportsStats());
        dispatch(fetchAdminReportsPage());
        dispatch(fetchAdminHeatmap());
        dispatch(fetchAdminDistributions());
    }, [dispatch, getRange]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const pdfHelpers = async () => {
        const { jsPDF } = await import('jspdf');
        const autoTableMod = await import('jspdf-autotable');
        const autoTable = (autoTableMod as any).default ?? autoTableMod;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const M = 14, PW = pdf.internal.pageSize.getWidth(), PH = pdf.internal.pageSize.getHeight();

        let FONT = 'helvetica';
        try {
            const resp = await fetch('/fonts/Roboto-Regular.ttf');
            if (!resp.ok) throw new Error(`Font fetch failed: ${resp.status}`);
            const bytes = new Uint8Array(await resp.arrayBuffer());
            const CHUNK = 8192; let binary = '';
            for (let i = 0; i < bytes.length; i += CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
            pdf.addFileToVFS('Roboto-Regular.ttf', btoa(binary));
            pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            pdf.setFont('Roboto', 'normal');
            FONT = 'Roboto';
        } catch (e) { console.warn('PDF font load failed, using helvetica:', e); }

        const getY = () => (pdf as any).lastAutoTable?.finalY ?? 0;

        const header = (title: string) => {
            pdf.setFont(FONT, 'normal'); pdf.setFontSize(15); pdf.setTextColor(30, 30, 30);
            pdf.text(title, M, 18); pdf.setFontSize(8); pdf.setTextColor(150, 150, 150);
            pdf.text(`Сгенерирован: ${new Date().toLocaleString('ru-RU')}`, M, 24);
            pdf.setDrawColor(220, 220, 220); pdf.line(M, 26, PW - M, 26);
        };

        const sectionTitle = (text: string, y: number) => {
            pdf.setFont(FONT, 'normal'); pdf.setFontSize(10); pdf.setTextColor(60, 60, 60); pdf.text(text, M, y);
        };

        const table = (head: string[], rows: (string | number)[][], startY: number) => {
            autoTable(pdf, {
                startY, margin: { left: M, right: M }, head: [head], body: rows.map(r => r.map(String)),
                headStyles: { fillColor: [0, 229, 176], textColor: 30, fontStyle: 'normal', fontSize: 8, font: FONT },
                alternateRowStyles: { fillColor: [250, 250, 250] },
                styles: { fontSize: 8, cellPadding: 3, overflow: 'ellipsize', font: FONT }, theme: 'grid',
            });
        };

        const needPage = (y: number, need = 40) => { if (y > PH - need) { pdf.addPage(); return 20; } return y; };
        const CW = PW - M * 2;

        const barChart = (items: { label: string; value: number }[], startY: number, color: [number, number, number] = [0, 229, 176]): number => {
            if (!items.length) return startY;
            const data = items.slice(0, 18), CH = 48, axisY = startY + CH - 12, chartH = axisY - startY - 2;
            const max = Math.max(...data.map(d => d.value), 1), barW = CW / data.length;
            pdf.setFillColor(247, 247, 247); pdf.rect(M, startY, CW, CH, 'F');
            pdf.setLineWidth(0.2); pdf.setDrawColor(220, 220, 220);
            pdf.setFontSize(5.5); pdf.setFont(FONT, 'normal'); pdf.setTextColor(160, 160, 160);
            for (let g = 1; g <= 4; g++) {
                const gy = startY + 2 + chartH - (chartH / 4) * g;
                pdf.line(M, gy, M + CW, gy); pdf.text(String(Math.round(max / 4 * g)), M + 1, gy - 0.5);
            }
            pdf.setLineWidth(0.4); pdf.setDrawColor(180, 180, 180);
            pdf.line(M, startY + 2, M, axisY); pdf.line(M, axisY, M + CW, axisY);
            data.forEach((item, i) => {
                const bh = Math.max(0.5, (item.value / max) * chartH), bx = M + i * barW + 1, by = axisY - bh;
                pdf.setFillColor(...color); pdf.rect(bx, by, barW - 2, bh, 'F');
                pdf.setFontSize(5.5); pdf.setTextColor(70, 70, 70);
                if (bh > 5) pdf.text(String(item.value), bx + (barW - 2) / 2, by - 1, { align: 'center' });
                const lbl = item.label.length > 6 ? item.label.slice(0, 5) + '…' : item.label;
                pdf.text(lbl, bx + (barW - 2) / 2, axisY + 4, { align: 'center' });
            });
            return startY + CH + 4;
        };

        type LineSeries = { key: string; label: string; color: [number, number, number] };
        const lineChart = (items: Record<string, any>[], series: LineSeries[], startY: number): number => {
            if (items.length < 2 || !series.length) return startY;
            const CH = 52, axisY = startY + CH - 14, chartH = axisY - startY - 4;
            const chartX = M + 8, chartW = CW - 8;
            const max = Math.max(...series.flatMap(s => items.map(d => Number(d[s.key]) || 0)), 1);
            const step = chartW / (items.length - 1);
            pdf.setFillColor(247, 247, 247); pdf.rect(M, startY, CW, CH, 'F');
            pdf.setLineWidth(0.2); pdf.setDrawColor(220, 220, 220);
            pdf.setFontSize(5.5); pdf.setFont(FONT, 'normal'); pdf.setTextColor(160, 160, 160);
            for (let g = 1; g <= 4; g++) {
                const gy = startY + 4 + chartH - (chartH / 4) * g;
                pdf.line(chartX, gy, chartX + chartW, gy); pdf.text(String(Math.round(max / 4 * g)), M + 1, gy - 0.5);
            }
            pdf.setLineWidth(0.4); pdf.setDrawColor(180, 180, 180);
            pdf.line(chartX, startY + 4, chartX, axisY); pdf.line(chartX, axisY, chartX + chartW, axisY);
            const xStep = Math.ceil(items.length / 8);
            items.forEach((item, i) => {
                if (i % xStep === 0 || i === items.length - 1) {
                    const px = chartX + i * step;
                    pdf.setFontSize(5.5); pdf.setTextColor(140, 140, 140);
                    pdf.text(String(item.label ?? item.date ?? '').slice(5), px, axisY + 4, { align: 'center' });
                }
            });
            series.forEach(s => {
                pdf.setDrawColor(...s.color); pdf.setLineWidth(0.7);
                for (let i = 1; i < items.length; i++) {
                    pdf.line(chartX + (i - 1) * step, axisY - (Number(items[i - 1][s.key]) / max) * chartH,
                             chartX + i * step,       axisY - (Number(items[i][s.key])     / max) * chartH);
                }
            });
            let lx = M;
            series.forEach(s => {
                pdf.setFillColor(...s.color); pdf.rect(lx, axisY + 7, 5, 2.5, 'F');
                pdf.setFontSize(6); pdf.setTextColor(80, 80, 80); pdf.setFont(FONT, 'normal');
                pdf.text(s.label, lx + 6, axisY + 9); lx += 6 + pdf.getTextWidth(s.label) + 5;
            });
            return startY + CH + 12;
        };

        return { pdf, M, PW, PH, getY, header, sectionTitle, table, needPage, barChart, lineChart };
    };

    const buildOverviewSection = (h: any, st: any, tbl: any, np: any, bc: any, lc: any, getY: any) => {
        h('Аналитика — Обзор');
        if (overview) {
            st('Ключевые показатели', 33);
            tbl(['Показатель', 'Значение'], [
                ['Пользователей зарегистрировано', overview.totalUsers],
                ['Задач опубликовано',             overview.totalChallenges],
                ['Всего решений',                  overview.totalSubmissions],
                ['% Успешных решений',             `${overview.successRate}%`],
                ['Средний рейтинг задач',          overview.avgRating.toFixed(2)],
                ['Жалоб ожидают рассмотрения',     overview.pendingReports],
            ], 37);
        }
        let y = getY() + 8;
        if ((activity ?? []).length > 0) {
            y = np(y, 70); st('Активность за период', y);
            y = lc(activity.map((r: any) => ({ label: r.date, submissions: r.submissions, successes: r.successes, failures: r.failures })),
                [{ key: 'submissions', label: 'Всего', color: [103, 232, 249] as [number,number,number] },
                 { key: 'successes', label: 'Успешных', color: [0, 229, 176] as [number,number,number] },
                 { key: 'failures', label: 'Неудачных', color: [251, 113, 133] as [number,number,number] }], y + 5);
            y = np(y + 4, 50); st('Активность по дням (таблица)', y);
            tbl(['Дата', 'Всего', 'Успешных', 'Неудачных'], activity.slice(0, 30).map((r: any) => [r.date, r.submissions, r.successes, r.failures]), y + 5);
        }
    };

    const buildChallengesSection = (h: any, st: any, tbl: any, np: any, bc: any, getY: any) => {
        h('Аналитика — Задачи');
        if (!challengeStats) return;
        st('Решения по языкам программирования', 33);
        tbl(['Язык', 'Решений'], (challengeStats.byLanguage ?? []).map((r: any) => [r.language, r.total]), 37);
        let y = np(getY() + 6, 65); st('График: по языкам', y);
        y = bc((challengeStats.byLanguage ?? []).map((r: any) => ({ label: r.language, value: r.total })), y + 5);
        y = np(y + 4, 55); st('По темам', y);
        tbl(['Тема', 'Задач', 'Решений', 'Успешных'], (challengeStats.byTopic ?? []).map((r: any) => [r.topic, r.total, r.submissions, r.successes]), y + 5);
        y = np(getY() + 6, 65); st('График: по темам (попыток)', y);
        y = bc((challengeStats.byTopic ?? []).map((r: any) => ({ label: r.topic, value: r.submissions })), y + 5, [100, 149, 237] as [number,number,number]);
        y = np(y + 4, 50); st('По сложности', y);
        tbl(['Сложность', 'Задач', 'Решений'], (challengeStats.byDifficulty ?? []).map((r: any) => [r.difficulty, r.total, r.submissions]), y + 5);
        y = np(getY() + 8, 60); st('Самые сложные задачи (топ 10)', y);
        tbl(['Задача', 'Сложность', 'Попыток', 'Успешных', '% Успеха'], (challengeStats.hardest ?? []).map((r: any) => [r.name, r.difficulty, r.attempts, r.successes, `${r.successRate}%`]), y + 5);
    };

    const buildUsersSection = (h: any, st: any, tbl: any, np: any, bc: any, getY: any) => {
        h('Аналитика — Пользователи');
        if ((topUsers ?? []).length > 0) {
            st('Топ пользователей', 33);
            tbl(['#', 'Пользователь', 'Решено', 'Попыток', '% Успеха', 'Рейтинг', 'Опыт'], topUsers.map((u: any) => [u.rank, u.username, u.solved, u.submissions, `${u.successRate}%`, u.rating, u.experience]), 37);
        }
        if (distributions) {
            let y = np(getY() + 6, 65); st('Распределение по рейтингу', y);
            tbl(['Диапазон рейтинга', 'Пользователей'], (distributions.rating ?? []).map((r: any) => [r.label, r.count]), y + 5);
            y = np(getY() + 6, 65); st('График: рейтинг', y);
            y = bc((distributions.rating ?? []).map((r: any) => ({ label: r.label, value: r.count })), y + 5, [192, 132, 252] as [number,number,number]);
            y = np(y + 4, 65); st('Распределение по опыту', y);
            tbl(['Диапазон опыта', 'Пользователей'], (distributions.experience ?? []).map((r: any) => [r.label, r.count]), y + 5);
            y = np(getY() + 6, 65); st('График: опыт', y);
            bc((distributions.experience ?? []).map((r: any) => ({ label: r.label, value: r.count })), y + 5, [251, 191, 36] as [number,number,number]);
        }
    };

    const buildReportsSection = (h: any, st: any, tbl: any, np: any, bc: any, getY: any) => {
        h('Аналитика — Жалобы');
        if (!reportsStats) return;
        st('По статусу', 33);
        tbl(['Статус', 'Количество'], (reportsStats.byStatus ?? []).map((r: any) => [r.status, r.total]), 37);
        let y = np(getY() + 6, 65); st('График: по статусу', y);
        y = bc((reportsStats.byStatus ?? []).map((r: any) => ({ label: r.status, value: r.total })), y + 5, [251, 113, 133] as [number,number,number]);
        y = np(y + 4, 55); st('По причине жалобы', y);
        tbl(['Причина', 'Количество'], (reportsStats.byReason ?? []).map((r: any) => [r.reason, r.total]), y + 5);
        y = np(getY() + 8, 60); st('Последние жалобы', y);
        tbl(['Дата', 'Автор', 'Задача', 'Причина', 'Статус'], (reportsStats.recent ?? []).slice(0, 20).map((r: any) => [new Date(r.createdAt).toLocaleDateString('ru-RU'), r.reporter, r.challenge, r.reason, r.status]), y + 5);
    };

    const addPageNumbers = (pdf: any, PW: number, PH: number) => {
        const total = pdf.getNumberOfPages();
        for (let i = 1; i <= total; i++) {
            pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(180, 180, 180);
            pdf.text(`${i} / ${total}`, PW / 2, PH - 6, { align: 'center' });
        }
    };

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const { pdf, PW, PH, getY, header, sectionTitle, table, needPage, barChart, lineChart } = await pdfHelpers();
            if (tab === 'overview')   buildOverviewSection(header, sectionTitle, table, needPage, barChart, lineChart, getY);
            if (tab === 'challenges') buildChallengesSection(header, sectionTitle, table, needPage, barChart, getY);
            if (tab === 'users')      buildUsersSection(header, sectionTitle, table, needPage, barChart, getY);
            if (tab === 'reports')    buildReportsSection(header, sectionTitle, table, needPage, barChart, getY);
            addPageNumbers(pdf, PW, PH);
            pdf.save(`tab_${tab}_${today()}.pdf`);
        } catch (e: any) {
            console.error('[PDF Export Error]', e);
            alert(`Ошибка при генерации PDF:\n${e?.message ?? e}`);
        } finally { setExporting(false); }
    };

    const handleFullReport = async () => {
        setExporting(true);
        try {
            const { pdf, PW, PH, getY, header, sectionTitle, table, needPage, barChart, lineChart } = await pdfHelpers();
            buildOverviewSection(header, sectionTitle, table, needPage, barChart, lineChart, getY); pdf.addPage();
            buildChallengesSection(header, sectionTitle, table, needPage, barChart, getY); pdf.addPage();
            buildUsersSection(header, sectionTitle, table, needPage, barChart, getY); pdf.addPage();
            buildReportsSection(header, sectionTitle, table, needPage, barChart, getY);
            addPageNumbers(pdf, PW, PH);
            pdf.save(`full_report_${today()}.pdf`);
        } catch (e: any) {
            console.error('[Full Report Error]', e);
            alert(`Ошибка при генерации PDF:\n${e?.message ?? e}`);
        } finally { setExporting(false); }
    };

    return (
        <div className="owner-analytics">
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: #0a0a0a; }
                ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
                input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
                input[type="range"] { accent-color: #FF6B35; }
            `}</style>

            <OwnerHeader
                periodIdx={periodIdx}
                setPeriodIdx={setPeriodIdx}
                customFrom={customFrom}
                setCustomFrom={setCustomFrom}
                customTo={customTo}
                setCustomTo={setCustomTo}
                exporting={exporting}
                onRefresh={loadAll}
                onExportTab={handleExportPDF}
                onExportFull={handleFullReport}
            />

            <div className="owner-analytics__main">

                {isLoading ? (
                    <div className="owner-analytics__loader">
                        <div className="owner-analytics__spinner" />
                        <span className="owner-analytics__loader-text">ЗАГРУЗКА ДАННЫХ...</span>
                    </div>
                ) : (
                    <div ref={printRef} className="owner-analytics__content">
                        {tab === 'overview' && (
                            <OverviewTab
                                overview={overview}
                                activity={activity}
                                activityLines={activityLines}
                                setActivityLines={setActivityLines}
                                heatmap={heatmap}
                            />
                        )}
                        {tab === 'challenges' && (
                            <ChallengesTab
                                challengeStats={challengeStats}
                                allLanguages={allLanguages}
                                allTopics={allTopics}
                                selLangs={selLangs}
                                setSelLangs={setSelLangs}
                                selTopics={selTopics}
                                setSelTopics={setSelTopics}
                                filteredLanguages={filteredLanguages}
                                filteredTopics={filteredTopics}
                                filteredDifficulty={filteredDifficulty}
                                langColorMap={langColorMap}
                                diffRange={diffRange}
                                setDiffRange={setDiffRange}
                            />
                        )}
                        {tab === 'users' && (
                            <UsersTab
                                topUsers={topUsers}
                                distributions={distributions}
                                ratingBucket={ratingBucket}
                                expBucket={expBucket}
                                onBucketChange={(rb, eb) => {
                                    setRatingBucket(rb);
                                    setExpBucket(eb);
                                    dispatch(fetchAdminDistributions({ ratingBucket: rb, expBucket: eb }));
                                }}
                            />
                        )}
                        {tab === 'reports' && (
                            <ReportsTab
                                reportsStats={reportsStats}
                                allStatuses={allStatuses}
                                allReasons={allReasons}
                                selStatuses={selStatuses}
                                setSelStatuses={setSelStatuses}
                                selReasons={selReasons}
                                setSelReasons={setSelReasons}
                                filteredByStatus={filteredByStatus}
                                filteredByReason={filteredByReason}
                                reportsPage={reportsPage}
                                onLoadReports={(filters) => dispatch(fetchAdminReportsPage(filters))}
                                onUpdateReport={() => {}}
                                readOnly
                            />
                        )}
                        <div className="owner-analytics__footer">
                            <span>ОТЧЁТ СГЕНЕРИРОВАН {new Date().toLocaleString('ru-RU').toUpperCase()}</span>
                            <span>OWNER PANEL © {new Date().getFullYear()}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
