import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    className?: string;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
}

export function Table<T extends { id: number | string }>({ columns, data, onRowClick }: TableProps<T>) {
    return (
        <div style={styles.container} className="shadow-none border border-border-highlight rounded-lg overflow-hidden">
            <table className="table-enhanced">
                <thead>
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} className={col.className}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} style={{ padding: 0 }}>
                                <div className="empty-state">
                                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div className="empty-state-title">No transactions yet</div>
                                    <div className="empty-state-description">
                                        Add your first transaction to get started tracking your finances
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((row) => (
                            <tr
                                key={row.id}
                                className={`group ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={() => onRowClick && onRowClick(row)}
                            >
                                {columns.map((col, idx) => (
                                    <td key={idx} className={col.className}>
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(row)
                                            : (row[col.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

const styles = {
    container: {
        width: '100%',
        overflowX: 'auto' as const,
        borderRadius: 'var(--radius-lg)',
    }
};
