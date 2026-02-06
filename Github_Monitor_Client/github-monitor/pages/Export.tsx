import React, { useEffect, useState, useRef } from 'react';
import { Card, Button } from '../components/ui';
import { api } from '../services/api';
import { API_BASE_URL } from '../constants';
import { Download, FileSpreadsheet, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../services/languageContext';

export const Export: React.FC = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
    const [activeSheet, setActiveSheet] = useState<string>('');
    const [sheetData, setSheetData] = useState<any[]>([]);
    const [blob, setBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Ref to track active sheet for silent updates without closure staleness
    const activeSheetRef = useRef<string>('');

    useEffect(() => {
        activeSheetRef.current = activeSheet;
    }, [activeSheet]);

    useEffect(() => {
        fetchExportData();

        // SSE Setup for Real-time Updates
        const token = localStorage.getItem('token');
        if (!token) return;

        const eventSource = new EventSource(`${API_BASE_URL}/events/stream?token=${token}`);

        const handleUpdate = () => fetchExportData(true);

        eventSource.addEventListener('event-update', handleUpdate);
        eventSource.addEventListener('repository-update', handleUpdate);
        eventSource.addEventListener('alert-update', handleUpdate);

        eventSource.onerror = (error) => {
            // console.error('SSE Error:', error); // Optional logging
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const fetchExportData = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const dataBlob = await api.dashboard.export();
            setBlob(dataBlob);

            const arrayBuffer = await dataBlob.arrayBuffer();
            const wb = XLSX.read(arrayBuffer);
            
            setWorkbook(wb);
            
            // Preserve currently active sheet if it exists in new workbook
            const currentSheet = activeSheetRef.current;
            if (currentSheet && wb.SheetNames.includes(currentSheet)) {
                selectSheet(wb, currentSheet);
            } else if (wb.SheetNames.length > 0) {
                selectSheet(wb, wb.SheetNames[0]);
            }
            
            if (!isSilent) setLoading(false);
        } catch (err) {
            console.error(err);
            if (!isSilent) {
                setError(t('preview_error'));
                setLoading(false);
            }
        }
    };

    const selectSheet = (wb: XLSX.WorkBook, sheetName: string) => {
        setActiveSheet(sheetName);
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        setSheetData(data);
    };

    const handleDownload = () => {
        if (!blob) return;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `github_monitor_dashboard_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <Loader className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-txt-sec">{t('generating_report')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => fetchExportData(false)}>{t('retry')}</Button>
            </div>
        );
    }

    const getSheetLabel = (sheetName: string) => {
        const mapping: Record<string, string> = {
            'Overview': 'sheet_overview',
            'Repositories': 'sheet_repositories',
            'Recent Events': 'sheet_events',
            'Alerts': 'sheet_alerts'
        };
        const key = mapping[sheetName];
        return key ? t(key as any) : sheetName;
    };

    // Helper to determine row background class based on content
    const getRowClass = (row: any[], index: number, sheetName: string) => {
        if (index === 0) return "bg-[#1e3a8a] text-white font-bold";

        // Logic for "Recent Events" sheet
        if (sheetName === 'Recent Events' && row.length > 1) {
            const eventType = String(row[1]).toUpperCase();
            switch (eventType) {
                case 'PUSH': return 'bg-blue-50 hover:bg-blue-100 transition-colors';
                case 'PULL_REQUEST': return 'bg-purple-50 hover:bg-purple-100 transition-colors';
                case 'ISSUE': return 'bg-orange-50 hover:bg-orange-100 transition-colors';
                case 'RELEASE': return 'bg-green-50 hover:bg-green-100 transition-colors';
                default: return 'hover:bg-blue-50/50 transition-colors';
            }
        }

        // Logic for "Alerts" sheet
        if (sheetName === 'Alerts' && row.length > 6) {
            // Status is column 6 (Index 6) based on: ID, Severity, Rule, User, Branch, Message, Status
            const status = String(row[6]).toUpperCase();
            switch (status) {
                case 'OPEN': return 'bg-red-50 hover:bg-red-100 transition-colors';
                case 'RESOLVED': return 'bg-green-50 hover:bg-green-100 transition-colors';
                default: return 'hover:bg-blue-50/50 transition-colors';
            }
        }

        return "hover:bg-blue-50/50 transition-colors";
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center">
                <div>
                    <h2 className="text-2xl font-bold text-txt-main flex items-center gap-2">
                        <FileSpreadsheet className="text-green-500" />
                        {t('export_title')}
                    </h2>
                    <p className="text-sm text-txt-sec">{t('export_desc')}</p>
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden p-0">
                {/* Sheet Tabs */}
                <div className="flex justify-between items-center bg-surface-hover overflow-x-auto pr-2">
                    <div className="flex">
                        {workbook?.SheetNames.map(sheet => (
                            <button
                                key={sheet}
                                onClick={() => workbook && selectSheet(workbook, sheet)}
                                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                                    activeSheet === sheet
                                        ? 'border-primary text-primary bg-surface'
                                        : 'border-transparent text-txt-sec hover:text-txt-main hover:bg-surface/50'
                                }`}
                            >
                                {getSheetLabel(sheet)}
                            </button>
                        ))}
                    </div>
                    <Button onClick={handleDownload} className="flex items-center gap-2" size="sm" variant="ghost">
                        <Download size={14} />
                        {t('download_xlsx')}
                    </Button>
                </div>

                {/* Spreadsheet View */}
                <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-[#161b22] transition-colors">
                    <div className="inline-block min-w-full align-middle shadow-sm rounded-lg overflow-hidden">
                        <table className="min-w-full border-collapse text-sm bg-white text-gray-900">
                            <tbody>
                                {sheetData.map((row, rowIndex) => (
                                    <tr key={rowIndex} className={getRowClass(row, rowIndex, activeSheet)}>
                                        {row.map((cell: any, cellIndex: number) => (
                                            <td 
                                                key={cellIndex} 
                                                className={`border border-gray-300 px-4 py-3 whitespace-nowrap ${
                                                    rowIndex === 0 
                                                        ? 'border-blue-800 text-center' 
                                                        : 'text-gray-700'
                                                }`}
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {sheetData.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 bg-white">
                                <FileSpreadsheet className="w-12 h-12 text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">{t('empty_sheet')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
